"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const argon2 = __importStar(require("argon2"));
const prisma_service_1 = require("../prisma/prisma.service");
const action_log_service_1 = require("../action-log/action-log.service");
let UsersService = class UsersService {
    prisma;
    actionLogService;
    constructor(prisma, actionLogService) {
        this.prisma = prisma;
        this.actionLogService = actionLogService;
    }
    userSelect = {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
    };
    async create(dto, currentUserId, ipAddress) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
        }
        const passwordHash = await argon2.hash(dto.password);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: dto.phone,
                role: dto.role || 'EMPLOYEE',
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
    async findAll(params) {
        const { skip = 0, take = 50, search, role, isActive } = params;
        const where = {};
        if (search) {
            where.OR = [
                { email: { contains: search } },
                { firstName: { contains: search } },
                { lastName: { contains: search } },
            ];
        }
        if (role)
            where.role = role;
        if (isActive !== undefined)
            where.isActive = isActive;
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
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: this.userSelect,
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: this.userSelect,
        });
    }
    async update(id, dto, currentUserId, currentUserRole, ipAddress) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (dto.role && currentUserRole !== 'ADMIN') {
            throw new common_1.ForbiddenException('Only admins can change user roles');
        }
        if (dto.email && dto.email.toLowerCase() !== user.email) {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: dto.email.toLowerCase() },
            });
            if (existingUser) {
                throw new common_1.ConflictException('Email already in use');
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
    async deactivate(id, currentUserId, ipAddress) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (id === currentUserId) {
            throw new common_1.ForbiddenException('Cannot deactivate your own account');
        }
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: { isActive: false },
            select: this.userSelect,
        });
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
    async resetPassword(id, newPassword, currentUserId, ipAddress) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const passwordHash = await argon2.hash(newPassword);
        await this.prisma.user.update({
            where: { id },
            data: { passwordHash },
        });
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        action_log_service_1.ActionLogService])
], UsersService);
//# sourceMappingURL=users.service.js.map