import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ActionLogService } from '../action-log/action-log.service';
import { LoginDto, RegisterDto, RefreshTokenDto, TokenResponseDto, ChangePasswordDto } from './dto/auth.dto';
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
}
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private actionLogService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, actionLogService: ActionLogService);
    register(dto: RegisterDto, ipAddress?: string): Promise<TokenResponseDto>;
    login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<TokenResponseDto>;
    refreshToken(dto: RefreshTokenDto, ipAddress?: string): Promise<TokenResponseDto>;
    logout(userId: string, refreshToken?: string, ipAddress?: string): Promise<void>;
    changePassword(userId: string, dto: ChangePasswordDto, ipAddress?: string): Promise<void>;
    validateUser(payload: JwtPayload): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
    }>;
    private generateTokens;
}
