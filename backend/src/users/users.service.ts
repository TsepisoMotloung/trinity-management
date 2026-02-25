import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ActionLogService } from '../action-log/action-log.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private actionLogService: ActionLogService,
  ) {}

  private userSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    phone: true,
    role: true,
    isActive: true,
    isApproved: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
  };

  async create(dto: CreateUserDto, currentUserId: string, ipAddress?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role || 'EMPLOYEE',
        isApproved: true, // Admin-created users are auto-approved
      },
      select: this.userSelect,
    });

    await this.actionLogService.log({
      userId: currentUserId,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      details: {
        email: user.email,
        role: user.role,
        createdBy: currentUserId,
      },
      ipAddress,
    });

    return user;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }) {
    const { skip = 0, take = 50, search, role, isActive } = params;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: this.userSelect,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: this.userSelect,
    });
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    currentUserId: string,
    currentUserRole: string,
    ipAddress?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent role change by non-admins
    if (dto.role && currentUserRole !== 'ADMIN') {
      throw new ForbiddenException('Only admins can change user roles');
    }

    // Check email uniqueness if changing email
    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.email && { email: dto.email.toLowerCase() }),
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.role && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.isApproved !== undefined && { isApproved: dto.isApproved }),
      },
      select: this.userSelect,
    });

    await this.actionLogService.log({
      userId: currentUserId,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: id,
      details: {
        changes: dto,
        updatedBy: currentUserId,
      },
      ipAddress,
    });

    return updatedUser;
  }

  async deactivate(id: string, currentUserId: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (id === currentUserId) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: this.userSelect,
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: id },
      data: { isRevoked: true },
    });

    await this.actionLogService.log({
      userId: currentUserId,
      action: 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: id,
      details: { deactivatedBy: currentUserId },
      ipAddress,
    });

    return updatedUser;
  }

  async resetPassword(
    id: string,
    newPassword: string,
    currentUserId: string,
    ipAddress?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: id },
      data: { isRevoked: true },
    });

    await this.actionLogService.log({
      userId: currentUserId,
      action: 'USER_PASSWORD_RESET',
      entityType: 'User',
      entityId: id,
      details: { resetBy: currentUserId },
      ipAddress,
    });

    return { message: 'Password reset successfully' };
  }

  async approveUser(id: string, currentUserId: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isApproved) {
      return { message: 'User is already approved' };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isApproved: true },
      select: this.userSelect,
    });

    await this.actionLogService.log({
      userId: currentUserId,
      action: 'USER_APPROVED',
      entityType: 'User',
      entityId: id,
      details: { approvedBy: currentUserId, email: user.email },
      ipAddress,
    });

    return updatedUser;
  }

  async rejectUser(id: string, currentUserId: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (id === currentUserId) {
      throw new ForbiddenException('Cannot reject your own account');
    }

    // Deactivate and mark as not approved
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isApproved: false, isActive: false },
      select: this.userSelect,
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: id },
      data: { isRevoked: true },
    });

    await this.actionLogService.log({
      userId: currentUserId,
      action: 'USER_REJECTED',
      entityType: 'User',
      entityId: id,
      details: { rejectedBy: currentUserId, email: user.email },
      ipAddress,
    });

    return updatedUser;
  }
}
