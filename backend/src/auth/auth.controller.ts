import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import * as express from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  TokenResponseDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user (requires admin approval)' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully, pending admin approval',
  })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: express.Request,
  ): Promise<{ message: string }> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.authService.register(dto, ipAddress);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: TokenResponseDto,
  })
  async login(
    @Body() dto: LoginDto,
    @Req() req: express.Request,
  ): Promise<TokenResponseDto> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, ipAddress, userAgent);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed',
    type: TokenResponseDto,
  })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Req() req: express.Request,
  ): Promise<TokenResponseDto> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.authService.refreshToken(dto, ipAddress);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke tokens' })
  async logout(
    @CurrentUser('id') userId: string,
    @Body('refreshToken') refreshToken: string,
    @Req() req: express.Request,
  ): Promise<{ message: string }> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    await this.authService.logout(userId, refreshToken, ipAddress);
    return { message: 'Logged out successfully' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current user password' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
    @Req() req: express.Request,
  ): Promise<{ message: string }> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    await this.authService.changePassword(userId, dto, ipAddress);
    return { message: 'Password changed successfully' };
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password reset token generated (or message sent)',
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() req: express.Request,
  ): Promise<{ message: string; resetToken?: string }> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.authService.forgotPassword(dto, ipAddress);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a reset token' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() req: express.Request,
  ): Promise<{ message: string }> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.authService.resetPassword(dto, ipAddress);
  }

  @Post('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  me(@CurrentUser() user: any) {
    return user;
  }
}
