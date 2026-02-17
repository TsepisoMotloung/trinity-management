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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const argon2 = __importStar(require("argon2"));
const uuid_1 = require("uuid");
const prisma_service_1 = require("../prisma/prisma.service");
const action_log_service_1 = require("../action-log/action-log.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    actionLogService;
    constructor(prisma, jwtService, configService, actionLogService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.actionLogService = actionLogService;
    }
    async register(dto, ipAddress) {
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
                role: 'EMPLOYEE',
            },
        });
        await this.actionLogService.log({
            userId: user.id,
            action: 'USER_REGISTERED',
            entityType: 'User',
            entityId: user.id,
            details: { email: user.email },
            ipAddress,
        });
        return this.generateTokens(user.id, user.email, user.role, ipAddress);
    }
    async login(dto, ipAddress, userAgent) {
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
            throw new common_1.UnauthorizedException('Invalid credentials');
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
            throw new common_1.UnauthorizedException('Account is disabled');
        }
        const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
        if (!isPasswordValid) {
            await this.actionLogService.log({
                userId: user.id,
                action: 'LOGIN_FAILED',
                entityType: 'User',
                entityId: user.id,
                details: { reason: 'Invalid password' },
                ipAddress,
            });
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        await this.actionLogService.log({
            userId: user.id,
            action: 'LOGIN_SUCCESS',
            entityType: 'User',
            entityId: user.id,
            details: { userAgent },
            ipAddress,
        });
        return this.generateTokens(user.id, user.email, user.role, ipAddress, userAgent);
    }
    async refreshToken(dto, ipAddress) {
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: dto.refreshToken },
            include: { user: true },
        });
        if (!storedToken ||
            storedToken.isRevoked ||
            storedToken.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        await this.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { isRevoked: true },
        });
        return this.generateTokens(storedToken.user.id, storedToken.user.email, storedToken.user.role, ipAddress);
    }
    async logout(userId, refreshToken, ipAddress) {
        if (refreshToken) {
            await this.prisma.refreshToken.updateMany({
                where: { token: refreshToken },
                data: { isRevoked: true },
            });
        }
        else {
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
    async changePassword(userId, dto, ipAddress) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const isPasswordValid = await argon2.verify(user.passwordHash, dto.currentPassword);
        if (!isPasswordValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        const newPasswordHash = await argon2.hash(dto.newPassword);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash },
        });
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
    async validateUser(payload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
            },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('User not found or inactive');
        }
        return user;
    }
    async generateTokens(userId, email, role, ipAddress, deviceInfo) {
        const payload = { sub: userId, email, role };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '15m'),
        });
        const refreshToken = (0, uuid_1.v4)();
        const refreshExpiration = this.configService.get('JWT_REFRESH_EXPIRATION', '7d');
        const expiresAt = new Date();
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
        }
        else {
            expiresAt.setDate(expiresAt.getDate() + 7);
        }
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
            expiresIn: 900,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        action_log_service_1.ActionLogService])
], AuthService);
//# sourceMappingURL=auth.service.js.map