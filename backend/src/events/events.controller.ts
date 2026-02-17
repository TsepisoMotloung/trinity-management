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
import { EventsService } from './events.service';
import {
  CreateEventDto,
  UpdateEventDto,
  BookEquipmentDto,
  BookMultipleEquipmentDto,
  AssignStaffDto,
  EventStatus,
} from './dto/event.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  create(
    @Body() dto: CreateEventDto,
    @CurrentUser('id') userId: string,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.eventsService.create(dto, userId, ipAddress);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: EventStatus })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: EventStatus,
    @Query('clientId') clientId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.eventsService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
      status,
      clientId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get events for calendar view' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  getCalendar(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.eventsService.getCalendar(
      new Date(startDate),
      new Date(endDate),
      { status, clientId },
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get event statistics' })
  getStatistics() {
    return this.eventsService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update event' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser('id') userId: string,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.eventsService.update(id, dto, userId, ipAddress);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update event status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: EventStatus,
    @CurrentUser('id') userId: string,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.eventsService.updateStatus(id, status, userId, ipAddress);
  }

  // ==================== EQUIPMENT BOOKING ====================

  @Post(':id/equipment')
  @ApiOperation({ summary: 'Book equipment for event' })
  bookEquipment(
    @Param('id') eventId: string,
    @Body() dto: BookEquipmentDto,
    @CurrentUser('id') userId: string,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.eventsService.bookEquipment(eventId, dto, userId, ipAddress);
  }

  @Post(':id/equipment/bulk')
  @ApiOperation({ summary: 'Book multiple equipment for event' })
  bookMultipleEquipment(
    @Param('id') eventId: string,
    @Body() dto: BookMultipleEquipmentDto,
    @CurrentUser('id') userId: string,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.eventsService.bookMultipleEquipment(
      eventId,
      dto.items,
      userId,
      ipAddress,
    );
  }

  @Delete(':id/equipment/:bookingId')
  @ApiOperation({ summary: 'Remove equipment booking' })
  removeEquipmentBooking(
    @Param('id') eventId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser('id') userId: string,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.eventsService.removeEquipmentBooking(
      eventId,
      bookingId,
      userId,
      ipAddress,
    );
  }

  @Post(':id/equipment/confirm')
  @ApiOperation({ summary: 'Confirm all pending equipment bookings' })
  confirmBookings(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.eventsService.confirmBookings(eventId, userId, ipAddress);
  }

  // ==================== STAFF ASSIGNMENTS ====================

  @Post(':id/staff')
  @ApiOperation({ summary: 'Assign staff to event' })
  assignStaff(
    @Param('id') eventId: string,
    @Body() dto: AssignStaffDto,
    @CurrentUser('id') userId: string,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.eventsService.assignStaff(eventId, dto, userId, ipAddress);
  }

  @Delete(':id/staff/:assignmentId')
  @ApiOperation({ summary: 'Remove staff assignment' })
  removeStaffAssignment(
    @Param('id') eventId: string,
    @Param('assignmentId') assignmentId: string,
    @CurrentUser('id') userId: string,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    return this.eventsService.removeStaffAssignment(
      eventId,
      assignmentId,
      userId,
      ipAddress,
    );
  }
}
