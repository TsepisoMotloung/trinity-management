import * as express from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, TokenResponseDto, ChangePasswordDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, req: express.Request): Promise<TokenResponseDto>;
    login(dto: LoginDto, req: express.Request): Promise<TokenResponseDto>;
    refreshToken(dto: RefreshTokenDto, req: express.Request): Promise<TokenResponseDto>;
    logout(userId: string, refreshToken: string, req: express.Request): Promise<{
        message: string;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto, req: express.Request): Promise<{
        message: string;
    }>;
    me(user: any): any;
}
