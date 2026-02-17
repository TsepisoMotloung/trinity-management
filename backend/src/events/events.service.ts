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
} from './dto/event.dto';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private actionLogService: ActionLogService,
  ) {}

  async create(dto: CreateEventDto, userId: string, ipAddress?: string) {
    // Validate client
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });

    if (!client) {
      throw new BadRequestException('Invalid client');
    }

    if (!client.isActive) {
      throw new BadRequestException('Client is inactive');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const event = await this.prisma.event.create({
      data: {
        name: dto.name,
        eventType: dto.eventType,
        description: dto.description,
        clientId: dto.clientId,
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
        client: {
          select: { id: true, name: true, contactPerson: true, phone: true },
        },
      },
    });

    await this.actionLogService.log({
      userId,
      action: 'EVENT_CREATED',
      entityType: 'Event',
      entityId: event.id,
      details: { name: event.name, client: client.name },
      ipAddress,
    });

    return event;
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
    const {
      skip = 0,
      take = 50,
      search,
      status,
      clientId,
      startDate,
      endDate,
    } = params;

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
        where,
        skip,
        take,
        orderBy: { startDate: 'desc' },
        include: {
          client: {
            select: { id: true, name: true, contactPerson: true },
          },
          _count: {
            select: {
              equipmentBookings: true,
              staffAssignments: true,
            },
          },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      items,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        client: true,
        equipmentBookings: {
          include: {
            equipment: {
              include: {
                category: true,
              },
            },
          },
        },
        staffAssignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        quotes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        checkOuts: {
          include: {
            checkedOutByUser: {
              select: { id: true, firstName: true, lastName: true },
            },
            items: {
              include: {
                equipment: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        checkIns: {
          include: {
            checkedInByUser: {
              select: { id: true, firstName: true, lastName: true },
            },
            items: {
              include: {
                equipment: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async update(
    id: string,
    dto: UpdateEventDto,
    userId: string,
    ipAddress?: string,
  ) {
    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate dates if provided
    const startDate = dto.startDate ? new Date(dto.startDate) : event.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : event.endDate;

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate client if changing
    if (dto.clientId && dto.clientId !== event.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: dto.clientId },
      });
      if (!client || !client.isActive) {
        throw new BadRequestException('Invalid or inactive client');
      }
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.eventType && { eventType: dto.eventType }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.clientId && { clientId: dto.clientId }),
        ...(dto.venue && { venue: dto.venue }),
        ...(dto.venueAddress !== undefined && {
          venueAddress: dto.venueAddress,
        }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.setupTime !== undefined && {
          setupTime: dto.setupTime ? new Date(dto.setupTime) : null,
        }),
        ...(dto.status && { status: dto.status }),
        ...(dto.requirements !== undefined && {
          requirements: dto.requirements,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    await this.actionLogService.log({
      userId,
      action: 'EVENT_UPDATED',
      entityType: 'Event',
      entityId: id,
      details: { changes: dto },
      ipAddress,
    });

    return updated;
  }

  async updateStatus(
    id: string,
    status: EventStatus,
    userId: string,
    ipAddress?: string,
  ) {
    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const previousStatus = event.status;

    const updated = await this.prisma.event.update({
      where: { id },
      data: { status },
    });

    await this.actionLogService.log({
      userId,
      action: 'EVENT_STATUS_CHANGED',
      entityType: 'Event',
      entityId: id,
      details: { previousStatus, newStatus: status },
      ipAddress,
    });

    return updated;
  }

  // ==================== EQUIPMENT BOOKING ====================

  async bookEquipment(
    eventId: string,
    dto: BookEquipmentDto,
    userId: string,
    ipAddress?: string,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (['COMPLETED', 'CANCELLED'].includes(event.status)) {
      throw new BadRequestException(
        'Cannot book equipment for completed or cancelled events',
      );
    }

    const equipment = await this.prisma.equipmentItem.findUnique({
      where: { id: dto.equipmentId },
    });

    if (!equipment) {
      throw new BadRequestException('Equipment not found');
    }

    // Check if equipment is bookable
    if (
      ['DAMAGED', 'UNDER_REPAIR', 'LOST', 'RETIRED'].includes(
        equipment.currentStatus,
      )
    ) {
      throw new BadRequestException(
        `Equipment is ${equipment.currentStatus.toLowerCase()} and cannot be booked`,
      );
    }

    // Check for existing booking
    const existingBooking = await this.prisma.eventEquipmentBooking.findUnique({
      where: {
        eventId_equipmentId: {
          eventId,
          equipmentId: dto.equipmentId,
        },
      },
    });

    if (existingBooking) {
      throw new ConflictException('Equipment already booked for this event');
    }

    // Check for conflicts with other events
    const conflictingBooking =
      await this.prisma.eventEquipmentBooking.findFirst({
        where: {
          equipmentId: dto.equipmentId,
          status: { in: ['CONFIRMED', 'CHECKED_OUT'] },
          event: {
            id: { not: eventId },
            OR: [
              {
                startDate: { lte: event.endDate },
                endDate: { gte: event.startDate },
              },
            ],
          },
        },
        include: {
          event: {
            select: { id: true, name: true, startDate: true, endDate: true },
          },
        },
      });

    if (conflictingBooking) {
      throw new ConflictException(
        `Equipment is already booked for "${conflictingBooking.event.name}" during this time`,
      );
    }

    const booking = await this.prisma.eventEquipmentBooking.create({
      data: {
        eventId,
        equipmentId: dto.equipmentId,
        quantity: dto.quantity || 1,
        notes: dto.notes,
        status: 'PENDING',
      },
      include: {
        equipment: {
          include: { category: true },
        },
      },
    });

    await this.actionLogService.log({
      userId,
      action: 'EQUIPMENT_BOOKED',
      entityType: 'EventEquipmentBooking',
      entityId: booking.id,
      details: {
        eventId,
        equipmentId: dto.equipmentId,
        equipmentName: equipment.name,
      },
      ipAddress,
    });

    return booking;
  }

  async bookMultipleEquipment(
    eventId: string,
    items: BookEquipmentDto[],
    userId: string,
    ipAddress?: string,
  ) {
    const results: any[] = [];
    const errors: { equipmentId: string; error: string }[] = [];

    for (const item of items) {
      try {
        const booking = await this.bookEquipment(
          eventId,
          item,
          userId,
          ipAddress,
        );
        results.push(booking);
      } catch (error: any) {
        errors.push({
          equipmentId: item.equipmentId,
          error: error.message,
        });
      }
    }

    return { success: results, errors };
  }

  async removeEquipmentBooking(
    eventId: string,
    bookingId: string,
    userId: string,
    ipAddress?: string,
  ) {
    const booking = await this.prisma.eventEquipmentBooking.findFirst({
      where: { id: bookingId, eventId },
      include: { equipment: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'CHECKED_OUT') {
      throw new BadRequestException(
        'Cannot remove booking for checked-out equipment',
      );
    }

    await this.prisma.eventEquipmentBooking.delete({
      where: { id: bookingId },
    });

    await this.actionLogService.log({
      userId,
      action: 'EQUIPMENT_BOOKING_REMOVED',
      entityType: 'EventEquipmentBooking',
      entityId: bookingId,
      details: { eventId, equipmentName: booking.equipment.name },
      ipAddress,
    });

    return { message: 'Booking removed successfully' };
  }

  async confirmBookings(eventId: string, userId: string, ipAddress?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { equipmentBookings: { where: { status: 'PENDING' } } },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const result = await this.prisma.eventEquipmentBooking.updateMany({
      where: { eventId, status: 'PENDING' },
      data: { status: 'CONFIRMED' },
    });

    // Update event status to confirmed if it was draft/quoted
    if (['DRAFT', 'QUOTED'].includes(event.status)) {
      await this.prisma.event.update({
        where: { id: eventId },
        data: { status: 'CONFIRMED' },
      });
    }

    await this.actionLogService.log({
      userId,
      action: 'BOOKINGS_CONFIRMED',
      entityType: 'Event',
      entityId: eventId,
      details: { count: result.count },
      ipAddress,
    });

    return { message: `${result.count} bookings confirmed` };
  }

  // ==================== STAFF ASSIGNMENTS ====================

  async assignStaff(
    eventId: string,
    dto: AssignStaffDto,
    userId: string,
    ipAddress?: string,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user || !user.isActive) {
      throw new BadRequestException('Invalid or inactive user');
    }

    // Check for existing assignment
    const existing = await this.prisma.staffAssignment.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: dto.userId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Staff member already assigned to this event',
      );
    }

    const assignment = await this.prisma.staffAssignment.create({
      data: {
        eventId,
        userId: dto.userId,
        role: dto.role,
        notes: dto.notes,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
    });

    await this.actionLogService.log({
      userId,
      action: 'STAFF_ASSIGNED',
      entityType: 'StaffAssignment',
      entityId: assignment.id,
      details: {
        eventId,
        assignedUserId: dto.userId,
        role: dto.role,
      },
      ipAddress,
    });

    return assignment;
  }

  async removeStaffAssignment(
    eventId: string,
    assignmentId: string,
    userId: string,
    ipAddress?: string,
  ) {
    const assignment = await this.prisma.staffAssignment.findFirst({
      where: { id: assignmentId, eventId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    await this.prisma.staffAssignment.delete({ where: { id: assignmentId } });

    await this.actionLogService.log({
      userId,
      action: 'STAFF_UNASSIGNED',
      entityType: 'StaffAssignment',
      entityId: assignmentId,
      details: {
        eventId,
        staffName: `${assignment.user.firstName} ${assignment.user.lastName}`,
      },
      ipAddress,
    });

    return { message: 'Staff assignment removed' };
  }

  // ==================== CALENDAR ====================

  async getCalendar(
    startDate: Date,
    endDate: Date,
    filters?: { status?: string; clientId?: string },
  ) {
    const where: any = {
      OR: [
        {
          startDate: { gte: startDate, lte: endDate },
        },
        {
          endDate: { gte: startDate, lte: endDate },
        },
        {
          startDate: { lte: startDate },
          endDate: { gte: endDate },
        },
      ],
    };

    if (filters?.status) where.status = filters.status;
    if (filters?.clientId) where.clientId = filters.clientId;

    return this.prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        client: {
          select: { id: true, name: true },
        },
        _count: {
          select: { equipmentBookings: true, staffAssignments: true },
        },
      },
    });
  }

  // ==================== STATISTICS ====================

  async getStatistics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalEvents, byStatus, thisMonth, upcoming] = await Promise.all([
      this.prisma.event.count(),
      this.prisma.event.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.event.count({
        where: {
          startDate: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      this.prisma.event.count({
        where: {
          startDate: { gte: now },
          status: { in: ['DRAFT', 'QUOTED', 'CONFIRMED'] },
        },
      }),
    ]);

    return {
      totalEvents,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      thisMonth,
      upcoming,
    };
  }
}
