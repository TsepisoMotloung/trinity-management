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
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  create(
    @Body() dto: CreateClientDto,
    @CurrentUser('id') userId: string,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.clientsService.create(dto, userId, ipAddress);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clients' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('city') city?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.clientsService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
      city,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get client event and payment history' })
  getHistory(@Param('id') id: string) {
    return this.clientsService.getHistory(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser('id') userId: string,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.clientsService.update(id, dto, userId, ipAddress);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate client' })
  deactivate(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.clientsService.deactivate(id, userId, ipAddress);
  }
}
