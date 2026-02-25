import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActionLogService } from '../action-log/action-log.service';
import {
  CreateEventDto,
  UpdateEventDto,
  BookEquipmentDto,
  AssignStaffDto,
  EventStatus,
  CreateEventFromQuoteDto,
} from './dto/event.dto';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private actionLogService: ActionLogService,
  ) {}

  async create(dto: CreateEventDto, userId: string, ipAddress?: string) {
    const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
    if (!client) throw new BadRequestException('Invalid client');
    if (!client.isActive) throw new BadRequestException('Client is inactive');

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate <= startDate) throw new BadRequestException('End date must be after start date');

    const event = await this.prisma.event.create({
      data: {
        name: dto.name,
        eventType: dto.eventType,
        description: dto.description,
        clientId: dto.clientId,
        quoteId: dto.quoteId || null,
        venue: dto.venue,
        venueAddress: dto.venueAddress,
        startDate,
        endDate,
        setupTime: dto.setupTime ? new Date(dto.setupTime) : null,
        requirements: dto.requirements,
        notes: dto.notes,
        status: 'DRAFT',
      },
      include: {
        client: { select: { id: true, name: true, contactPerson: true, phone: true } },
      },
    });

    // Book equipment if provided
    if (dto.equipmentIds?.length) {
      const setupBuffer = 4 * 60 * 60 * 1000;
      const reservedFrom = dto.setupTime ? new Date(dto.setupTime) : new Date(startDate.getTime() - setupBuffer);
      for (const equipmentId of dto.equipmentIds) {
        try {
          await this.prisma.eventEquipmentBooking.create({
            data: {
              eventId: event.id,
              equipmentId,
              status: 'PENDING',
              reservedFrom,
              reservedUntil: endDate,
            },
          });
        } catch (e) {
          // Skip duplicates
        }
      }
    }

    // Assign staff if provided
    if (dto.staffAssignments?.length) {
      for (const staff of dto.staffAssignments) {
        try {
          await this.prisma.staffAssignment.create({
            data: {
              eventId: event.id,
              userId: staff.userId,
              role: staff.role,
              notes: staff.notes,
            },
          });
        } catch (e) {
          // Skip duplicates
        }
      }
    }

    await this.actionLogService.log({
      userId,
      action: 'EVENT_CREATED',
      entityType: 'Event',
      entityId: event.id,
      details: { name: event.name, client: client.name },
      ipAddress,
    });

    return this.findOne(event.id);
  }

  async createFromQuote(dto: CreateEventFromQuoteDto, userId: string, ipAddress?: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: dto.quoteId },
      include: { client: true },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== 'ACCEPTED') throw new BadRequestException('Can only create events from accepted quotes');

    const startDate = new Date(dto.startDate || quote.proposedStartDate || new Date());
    const endDate = new Date(dto.endDate || quote.proposedEndDate || new Date());
    if (endDate <= startDate) throw new BadRequestException('End date must be after start date');

    const event = await this.prisma.event.create({
      data: {
        name: dto.name || quote.proposedEventName || `Event for ${quote.client.name}`,
        eventType: dto.eventType || quote.proposedEventType || quote.quoteType,
        description: dto.description,
        clientId: quote.clientId,
        quoteId: quote.id,
        venue: dto.venue || quote.proposedVenue || '',
        venueAddress: dto.venueAddress || quote.proposedVenueAddress,
        startDate,
        endDate,
        setupTime: dto.setupTime ? new Date(dto.setupTime) : null,
        requirements: dto.requirements,
        notes: dto.notes,
        status: 'CONFIRMED',
      },
    });

    // Book equipment
    if (dto.equipmentIds?.length) {
      const setupBuffer = 4 * 60 * 60 * 1000;
      const reservedFrom = dto.setupTime ? new Date(dto.setupTime) : new Date(startDate.getTime() - setupBuffer);
      for (const equipmentId of dto.equipmentIds) {
        try {
          await this.prisma.eventEquipmentBooking.create({
            data: { eventId: event.id, equipmentId, status: 'CONFIRMED', reservedFrom, reservedUntil: endDate },
          });
        } catch (e) {}
      }
    }

    // Assign staff
    if (dto.staffAssignments?.length) {
      for (const staff of dto.staffAssignments) {
        try {
          await this.prisma.staffAssignment.create({
            data: { eventId: event.id, userId: staff.userId, role: staff.role, notes: staff.notes },
          });
        } catch (e) {}
      }
    }

    // Link quote to this event if not already linked
    if (!quote.eventId) {
      await this.prisma.quote.update({ where: { id: quote.id }, data: { eventId: event.id } });
    }

    await this.actionLogService.log({
      userId,
      action: 'EVENT_CREATED_FROM_QUOTE',
      entityType: 'Event',
      entityId: event.id,
      details: { quoteNumber: quote.quoteNumber, clientName: quote.client.name },
      ipAddress,
    });

    return this.findOne(event.id);
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    status?: EventStatus;
    clientId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { skip = 0, take = 50, search, status, clientId, startDate, endDate } = params;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { venue: { contains: search } },
        { eventType: { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (startDate || endDate) {
      where.AND = [];
      if (startDate) where.AND.push({ startDate: { gte: startDate } });
      if (endDate) where.AND.push({ endDate: { lte: endDate } });
    }

    const [items, total] = await Promise.all([
      this.prisma.event.findMany({
        where, skip, take,
        orderBy: { startDate: 'desc' },
        include: {
          client: { select: { id: true, name: true, contactPerson: true } },
          equipmentBookings: {
            include: { equipment: { select: { id: true, name: true } } },
          },
          staffAssignments: {
            include: { user: { select: { id: true, firstName: true, lastName: true } } },
          },
          _count: { select: { equipmentBookings: true, staffAssignments: true } },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        client: true,
        originQuote: {
          select: { id: true, quoteNumber: true, total: true, status: true, quoteType: true },
        },
        equipmentBookings: {
          include: { equipment: { include: { category: true } } },
          orderBy: { createdAt: 'asc' },
        },
        staffAssignments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
          },
        },
        quotes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, quoteNumber: true, total: true, status: true, createdAt: true },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, invoiceNumber: true, total: true, amountPaid: true, status: true, createdAt: true },
        },
        checkOuts: {
          include: {
            checkedOutByUser: { select: { id: true, firstName: true, lastName: true } },
            items: { include: { equipment: { select: { id: true, name: true } } } },
          },
          orderBy: { checkedOutAt: 'desc' },
        },
        checkIns: {
          include: {
            checkedInByUser: { select: { id: true, firstName: true, lastName: true } },
            items: { include: { equipment: { select: { id: true, name: true } } } },
          },
          orderBy: { checkedInAt: 'desc' },
        },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(id: string, dto: UpdateEventDto, userId: string, ipAddress?: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    const startDate = dto.startDate ? new Date(dto.startDate) : event.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : event.endDate;
    if (endDate <= startDate) throw new BadRequestException('End date must be after start date');

    if (dto.clientId && dto.clientId !== event.clientId) {
      const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
      if (!client || !client.isActive) throw new BadRequestException('Invalid or inactive client');
    }

    const datesChanged =
      (dto.startDate && new Date(dto.startDate).getTime() !== event.startDate.getTime()) ||
      (dto.endDate && new Date(dto.endDate).getTime() !== event.endDate.getTime());

    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.eventType && { eventType: dto.eventType }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.clientId && { clientId: dto.clientId }),
        ...(dto.venue && { venue: dto.venue }),
        ...(dto.venueAddress !== undefined && { venueAddress: dto.venueAddress }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.setupTime !== undefined && { setupTime: dto.setupTime ? new Date(dto.setupTime) : null }),
        ...(dto.status && { status: dto.status }),
        ...(dto.requirements !== undefined && { requirements: dto.requirements }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: { client: { select: { id: true, name: true } } },
    });

    if (datesChanged) {
      const setupBuffer = 4 * 60 * 60 * 1000;
      const reserveFrom = dto.setupTime ? new Date(dto.setupTime) : new Date(startDate.getTime() - setupBuffer);
      await this.prisma.eventEquipmentBooking.updateMany({
        where: { eventId: id, status: { in: ['PENDING', 'CONFIRMED'] } },
        data: { reservedFrom: reserveFrom, reservedUntil: endDate },
      });
    }

    await this.actionLogService.log({
      userId, action: 'EVENT_UPDATED', entityType: 'Event', entityId: id,
      details: { changes: dto }, ipAddress,
    });

    return updated;
  }

  async updateStatus(id: string, status: EventStatus, userId: string, ipAddress?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { equipmentBookings: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    const previousStatus = event.status;
    const updated = await this.prisma.event.update({ where: { id }, data: { status } });

    if (status === 'CANCELLED') {
      await this.prisma.eventEquipmentBooking.updateMany({
        where: { eventId: id, status: { in: ['PENDING', 'CONFIRMED'] } },
        data: { status: 'CANCELLED' },
      });
    }

    if (status === 'COMPLETED') {
      await this.prisma.eventEquipmentBooking.updateMany({
        where: { eventId: id, status: { in: ['CONFIRMED', 'CHECKED_OUT'] } },
        data: { status: 'RETURNED' },
      });
    }

    await this.actionLogService.log({
      userId, action: 'EVENT_STATUS_CHANGED', entityType: 'Event', entityId: id,
      details: { previousStatus, newStatus: status }, ipAddress,
    });

    return updated;
  }

  // ==================== EQUIPMENT BOOKING (per-item) ====================

  async bookEquipment(eventId: string, dto: BookEquipmentDto, userId: string, ipAddress?: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (['COMPLETED', 'CANCELLED'].includes(event.status)) {
      throw new BadRequestException('Cannot book equipment for completed or cancelled events');
    }

    const equipment = await this.prisma.equipmentItem.findUnique({ where: { id: dto.equipmentId } });
    if (!equipment) throw new BadRequestException('Equipment not found');
    if (['DAMAGED', 'UNDER_REPAIR', 'LOST', 'RETIRED'].includes(equipment.currentStatus)) {
      throw new BadRequestException(`Equipment is ${equipment.currentStatus.toLowerCase()}`);
    }

    const existingBooking = await this.prisma.eventEquipmentBooking.findUnique({
      where: { eventId_equipmentId: { eventId, equipmentId: dto.equipmentId } },
    });
    if (existingBooking) throw new ConflictException('Equipment already booked for this event');

    // Check availability for the period
    const isAvailable = await this.isEquipmentAvailable(dto.equipmentId, event.startDate, event.endDate, eventId);
    if (!isAvailable) throw new BadRequestException(`"${equipment.name}" is not available for this period`);

    const setupBuffer = 4 * 60 * 60 * 1000;
    const reservedFrom = event.setupTime || new Date(event.startDate.getTime() - setupBuffer);

    const booking = await this.prisma.eventEquipmentBooking.create({
      data: {
        eventId,
        equipmentId: dto.equipmentId,
        notes: dto.notes,
        status: 'PENDING',
        reservedFrom,
        reservedUntil: event.endDate,
      },
      include: { equipment: { include: { category: true } } },
    });

    await this.actionLogService.log({
      userId, action: 'EQUIPMENT_BOOKED', entityType: 'EventEquipmentBooking', entityId: booking.id,
      details: { eventId, equipmentId: dto.equipmentId, equipmentName: equipment.name }, ipAddress,
    });

    return booking;
  }

  async bookMultipleEquipment(eventId: string, items: BookEquipmentDto[], userId: string, ipAddress?: string) {
    const results: any[] = [];
    const errors: { equipmentId: string; error: string }[] = [];
    for (const item of items) {
      try {
        const booking = await this.bookEquipment(eventId, item, userId, ipAddress);
        results.push(booking);
      } catch (error: any) {
        errors.push({ equipmentId: item.equipmentId, error: error.message });
      }
    }
    return { success: results, errors };
  }

  async removeEquipmentBooking(eventId: string, bookingId: string, userId: string, ipAddress?: string) {
    const booking = await this.prisma.eventEquipmentBooking.findFirst({
      where: { id: bookingId, eventId },
      include: { equipment: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === 'CHECKED_OUT') {
      throw new BadRequestException('Cannot remove booking for checked-out equipment');
    }
    await this.prisma.eventEquipmentBooking.delete({ where: { id: bookingId } });
    await this.actionLogService.log({
      userId, action: 'EQUIPMENT_BOOKING_REMOVED', entityType: 'EventEquipmentBooking', entityId: bookingId,
      details: { eventId, equipmentName: booking.equipment.name }, ipAddress,
    });
    return { message: 'Booking removed' };
  }

  async confirmBookings(eventId: string, userId: string, ipAddress?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { equipmentBookings: { where: { status: 'PENDING' }, include: { equipment: true } } },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Verify each item is still available
    for (const booking of event.equipmentBookings) {
      const available = await this.isEquipmentAvailable(booking.equipmentId, event.startDate, event.endDate, eventId);
      if (!available) {
        throw new BadRequestException(`"${booking.equipment.name}" is no longer available`);
      }
    }

    const result = await this.prisma.eventEquipmentBooking.updateMany({
      where: { eventId, status: 'PENDING' },
      data: { status: 'CONFIRMED' },
    });

    if (['DRAFT', 'QUOTED'].includes(event.status)) {
      await this.prisma.event.update({ where: { id: eventId }, data: { status: 'CONFIRMED' } });
    }

    await this.actionLogService.log({
      userId, action: 'BOOKINGS_CONFIRMED', entityType: 'Event', entityId: eventId,
      details: { count: result.count }, ipAddress,
    });

    return { message: `${result.count} bookings confirmed` };
  }

  // ==================== STAFF ====================

  async assignStaff(eventId: string, dto: AssignStaffDto, userId: string, ipAddress?: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user || !user.isActive) throw new BadRequestException('Invalid or inactive user');

    const existing = await this.prisma.staffAssignment.findUnique({
      where: { eventId_userId: { eventId, userId: dto.userId } },
    });
    if (existing) throw new ConflictException('Staff already assigned');

    // Check overlap
    const overlapping = await this.prisma.staffAssignment.findFirst({
      where: {
        userId: dto.userId,
        event: {
          id: { not: eventId },
          status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
          OR: [{ startDate: { lte: event.endDate }, endDate: { gte: event.startDate } }],
        },
      },
      include: { event: { select: { name: true, startDate: true, endDate: true } } },
    });
    if (overlapping) {
      throw new ConflictException(`Staff assigned to "${overlapping.event.name}" during this time`);
    }

    const assignment = await this.prisma.staffAssignment.create({
      data: { eventId, userId: dto.userId, role: dto.role, notes: dto.notes },
      include: { user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } } },
    });

    await this.actionLogService.log({
      userId, action: 'STAFF_ASSIGNED', entityType: 'StaffAssignment', entityId: assignment.id,
      details: { eventId, assignedUserId: dto.userId, role: dto.role }, ipAddress,
    });

    return assignment;
  }

  async removeStaffAssignment(eventId: string, assignmentId: string, userId: string, ipAddress?: string) {
    const assignment = await this.prisma.staffAssignment.findFirst({
      where: { id: assignmentId, eventId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.prisma.staffAssignment.delete({ where: { id: assignmentId } });
    await this.actionLogService.log({
      userId, action: 'STAFF_UNASSIGNED', entityType: 'StaffAssignment', entityId: assignmentId,
      details: { eventId, staffName: `${assignment.user.firstName} ${assignment.user.lastName}` }, ipAddress,
    });
    return { message: 'Staff assignment removed' };
  }

  // ==================== AVAILABLE STAFF ====================

  async getAvailableStaff(startDate: Date, endDate: Date, excludeEventId?: string) {
    const allStaff = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true, phone: true, email: true, role: true },
      orderBy: { firstName: 'asc' },
    });

    const assignmentWhere: any = {
      event: {
        status: { in: ['CONFIRMED', 'IN_PROGRESS', 'DRAFT'] },
        OR: [{ startDate: { lte: endDate }, endDate: { gte: startDate } }],
      },
    };
    if (excludeEventId) assignmentWhere.event.id = { not: excludeEventId };

    const busyAssignments = await this.prisma.staffAssignment.findMany({
      where: assignmentWhere,
      select: { userId: true },
    });

    const busyIds = new Set(busyAssignments.map((a) => a.userId));
    return allStaff.filter((s) => !busyIds.has(s.id));
  }

  // ==================== CALENDAR ====================

  async getCalendar(startDate: Date, endDate: Date, filters?: { status?: string; clientId?: string }) {
    const where: any = {
      OR: [
        { startDate: { gte: startDate, lte: endDate } },
        { endDate: { gte: startDate, lte: endDate } },
        { startDate: { lte: startDate }, endDate: { gte: endDate } },
      ],
    };
    if (filters?.status) where.status = filters.status;
    if (filters?.clientId) where.clientId = filters.clientId;

    return this.prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        client: { select: { id: true, name: true } },
        equipmentBookings: { include: { equipment: { select: { id: true, name: true } } } },
        staffAssignments: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        _count: { select: { equipmentBookings: true, staffAssignments: true } },
      },
    });
  }

  // ==================== STATISTICS ====================

  async getStatistics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalEvents, byStatus, thisMonth, upcoming, upcomingEvents] = await Promise.all([
      this.prisma.event.count(),
      this.prisma.event.groupBy({ by: ['status'], _count: true }),
      this.prisma.event.count({ where: { startDate: { gte: startOfMonth, lte: endOfMonth } } }),
      this.prisma.event.count({ where: { startDate: { gte: now }, status: { in: ['DRAFT', 'QUOTED', 'CONFIRMED'] } } }),
      this.prisma.event.findMany({
        where: { startDate: { gte: now }, status: { in: ['CONFIRMED', 'QUOTED', 'DRAFT'] } },
        orderBy: { startDate: 'asc' },
        take: 5,
        include: {
          client: { select: { id: true, name: true } },
          _count: { select: { equipmentBookings: true, staffAssignments: true } },
        },
      }),
    ]);

    return {
      totalEvents,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      thisMonth,
      upcoming,
      upcomingEvents,
    };
  }

  // ==================== UTILITIES ====================

  private async isEquipmentAvailable(equipmentId: string, startDate: Date, endDate: Date, excludeEventId?: string): Promise<boolean> {
    const item = await this.prisma.equipmentItem.findUnique({
      where: { id: equipmentId },
      select: { currentStatus: true },
    });
    if (!item || item.currentStatus !== 'AVAILABLE') return false;

    const bookingWhere: any = {
      equipmentId,
      status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_OUT'] },
      OR: [
        { reservedFrom: { lte: endDate }, reservedUntil: { gte: startDate } },
        { reservedFrom: null, event: { startDate: { lte: endDate }, endDate: { gte: startDate } } },
      ],
    };
    if (excludeEventId) bookingWhere.eventId = { not: excludeEventId };

    const conflict = await this.prisma.eventEquipmentBooking.findFirst({ where: bookingWhere });
    return !conflict;
  }
}
