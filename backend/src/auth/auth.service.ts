import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { ActionLogService } from '../action-log/action-log.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  TokenResponseDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private actionLogService: ActionLogService,
  ) {}

  async register(
    dto: RegisterDto,
    ipAddress?: string,
  ): Promise<{ message: string }> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user (not approved by default — requires admin approval)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: 'EMPLOYEE',
        isApproved: false,
      },
    });

    // Log action
    await this.actionLogService.log({
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email },
      ipAddress,
    });

    return {
      message:
        'Registration successful. Your account is pending admin approval. You will be able to log in once approved.',
    };
  }

  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      await this.actionLogService.log({
        action: 'LOGIN_FAILED',
        entityType: 'User',
        details: { email: dto.email, reason: 'User not found' },
        ipAddress,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      await this.actionLogService.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        details: { reason: 'Account disabled' },
        ipAddress,
      });
      throw new UnauthorizedException('Your account has been disabled. Please contact an administrator.');
    }

    if (!user.isApproved) {
      await this.actionLogService.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        details: { reason: 'Account not approved' },
        ipAddress,
      });
      throw new UnauthorizedException('Your account is pending admin approval. Please wait for an administrator to approve your registration.');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      await this.actionLogService.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        details: { reason: 'Invalid password' },
        ipAddress,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log successful login
    await this.actionLogService.log({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      details: { userAgent },
      ipAddress,
    });

    return this.generateTokens(
      user.id,
      user.email,
      user.role,
      ipAddress,
      userAgent,
    );
  }

  async refreshToken(
    dto: RefreshTokenDto,
    ipAddress?: string,
  ): Promise<TokenResponseDto> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.isRevoked ||
      storedToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Generate new tokens
    return this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
      ipAddress,
    );
  }

  async logout(
    userId: string,
    refreshToken?: string,
    ipAddress?: string,
  ): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true },
      });
    } else {
      // Revoke all tokens for this user
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }

    await this.actionLogService.log({
      userId,
      action: 'LOGOUT',
      entityType: 'User',
      entityId: userId,
      ipAddress,
    });
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    ipAddress?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all refresh tokens (force re-login on all devices)
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    await this.actionLogService.log({
      userId,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: userId,
      ipAddress,
    });
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
    ipAddress?: string,
  ): Promise<{ message: string; resetToken?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      this.logger.warn(`Password reset requested for unknown email: ${dto.email}`);
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // Invalidate any existing reset tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, isUsed: false },
      data: { isUsed: true },
    });

    // Generate a reset token (valid for 1 hour)
    const resetToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      },
    });

    await this.actionLogService.log({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email },
      ipAddress,
    });

    // In production, send email with reset link instead of returning the token.
    // For development, we return the token directly.
    this.logger.log(`Password reset token generated for ${user.email}: ${resetToken}`);

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
      resetToken, // Remove in production – send via email instead
    };
  }

  async resetPassword(
    dto: ResetPasswordDto,
    ipAddress?: string,
  ): Promise<{ message: string }> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (!resetToken || resetToken.isUsed || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Mark token as used
    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { isUsed: true },
    });

    // Revoke all refresh tokens (force re-login on all devices)
    await this.prisma.refreshToken.updateMany({
      where: { userId: resetToken.userId },
      data: { isRevoked: true },
    });

    await this.actionLogService.log({
      userId: resetToken.userId,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: resetToken.userId,
      details: { email: resetToken.user.email },
      ipAddress,
    });

    return { message: 'Password has been reset successfully. Please log in with your new password.' };
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isApproved: true,
      },
    });

    if (!user || !user.isActive || !user.isApproved) {
      throw new UnauthorizedException('User not found, inactive, or not approved');
    }

    return user;
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    ipAddress?: string,
    deviceInfo?: string,
  ): Promise<TokenResponseDto> {
    const payload: JwtPayload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '15m'),
    });

    const refreshToken = uuidv4();
    const refreshExpiration = this.configService.get(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );
    const expiresAt = new Date();

    // Parse expiration (e.g., '7d' -> 7 days)
    const match = refreshExpiration.match(/^(\d+)([dhms])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      switch (unit) {
        case 'd':
          expiresAt.setDate(expiresAt.getDate() + value);
          break;
        case 'h':
          expiresAt.setHours(expiresAt.getHours() + value);
          break;
        case 'm':
          expiresAt.setMinutes(expiresAt.getMinutes() + value);
          break;
        case 's':
          expiresAt.setSeconds(expiresAt.getSeconds() + value);
          break;
      }
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7); // Default 7 days
    }

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        deviceInfo,
        ipAddress,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }
}
