import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import * as express from 'express';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser('id') currentUserId: string,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.usersService.create(dto, currentUserId, ipAddress);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.usersService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get a user by ID (Admin only)' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a user (Admin only)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.usersService.update(
      id,
      dto,
      currentUserId,
      currentUserRole,
      ipAddress,
    );
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Deactivate a user (Admin only)' })
  deactivate(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.usersService.deactivate(id, currentUserId, ipAddress);
  }

  @Post(':id/reset-password')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reset a user password (Admin only)' })
  resetPassword(
    @Param('id') id: string,
    @Body('newPassword') newPassword: string,
    @CurrentUser('id') currentUserId: string,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.usersService.resetPassword(
      id,
      newPassword,
      currentUserId,
      ipAddress,
    );
  }

  @Post(':id/approve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Approve a pending user registration (Admin only)' })
  approveUser(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.usersService.approveUser(id, currentUserId, ipAddress);
  }

  @Post(':id/reject')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reject a pending user registration (Admin only)' })
  rejectUser(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.usersService.rejectUser(id, currentUserId, ipAddress);
  }
}
