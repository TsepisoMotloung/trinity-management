import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import {
  CreateMaintenanceTicketDto,
  UpdateMaintenanceTicketDto,
  UpdateMaintenanceStatusDto,
  CompleteMaintenanceDto,
} from './dto/maintenance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Maintenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a maintenance ticket' })
  create(
    @Body() dto: CreateMaintenanceTicketDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.maintenanceService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all maintenance tickets' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'equipmentId', required: false })
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('equipmentId') equipmentId?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('search') search?: string,
  ) {
    return this.maintenanceService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      status: status as any,
      priority,
      equipmentId,
      assignedToId,
      search,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get maintenance statistics' })
  getStatistics() {
    return this.maintenanceService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a maintenance ticket by ID' })
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a maintenance ticket' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceTicketDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.maintenanceService.update(id, dto, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ticket status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.maintenanceService.updateStatus(id, dto, userId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a maintenance ticket' })
  complete(
    @Param('id') id: string,
    @Body() dto: CompleteMaintenanceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.maintenanceService.complete(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a maintenance ticket' })
  cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.maintenanceService.cancel(id, userId);
  }
}
