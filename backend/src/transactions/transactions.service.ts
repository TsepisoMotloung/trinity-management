import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActionLogService } from '../action-log/action-log.service';
import { CreateCheckOutDto, CreateCheckInDto } from './dto/transactions.dto';
import { EquipmentStatus, ItemCondition } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private actionLogService: ActionLogService,
  ) {}

  // ==================== CHECK-OUT ====================

  async createCheckOut(dto: CreateCheckOutDto, userId: string) {
    // Validate event exists and is in a valid state
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      include: {
        equipmentBookings: {
          include: { equipment: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!['CONFIRMED', 'IN_PROGRESS'].includes(event.status)) {
      throw new BadRequestException(
        'Event must be confirmed or in progress to check out equipment',
      );
    }

    // Validate all equipment items are booked for this event
    const bookedEquipmentIds = event.equipmentBookings.map(
      (b) => b.equipmentId,
    );
    const requestedEquipmentIds = dto.items.map((item) => item.equipmentId);

    for (const equipmentId of requestedEquipmentIds) {
      if (!bookedEquipmentIds.includes(equipmentId)) {
        throw new BadRequestException(
          `Equipment ${equipmentId} is not booked for this event`,
        );
      }
    }

    // Check if equipment is available
    const equipment = await this.prisma.equipmentItem.findMany({
      where: {
        id: { in: requestedEquipmentIds },
      },
    });

    for (const item of equipment) {
      if (
        item.currentStatus !== EquipmentStatus.AVAILABLE &&
        item.currentStatus !== EquipmentStatus.RESERVED
      ) {
        throw new BadRequestException(
          `Equipment ${item.name} is not available for check-out (status: ${item.currentStatus})`,
        );
      }
    }

    // Create check-out transaction with items
    const checkOut = await this.prisma.checkOutTransaction.create({
      data: {
        eventId: dto.eventId,
        checkedOutBy: userId,
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => ({
            equipmentId: item.equipmentId,
            condition: item.condition,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: {
          include: {
            equipment: { include: { category: true } },
          },
        },
        checkedOutByUser: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        event: { select: { id: true, name: true } },
      },
    });

    // Update equipment statuses to IN_USE and create status history
    for (const item of dto.items) {
      await this.prisma.equipmentItem.update({
        where: { id: item.equipmentId },
        data: { currentStatus: EquipmentStatus.IN_USE },
      });

      await this.prisma.equipmentStatusHistory.create({
        data: {
          equipmentId: item.equipmentId,
          previousStatus: EquipmentStatus.AVAILABLE,
          newStatus: EquipmentStatus.IN_USE,
          reason: `Checked out for event: ${event.name}`,
          changedBy: userId,
        },
      });
    }

    // Update event status to in progress if it was confirmed
    if (event.status === 'CONFIRMED') {
      await this.prisma.event.update({
        where: { id: dto.eventId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Update booking statuses
    await this.prisma.eventEquipmentBooking.updateMany({
      where: {
        eventId: dto.eventId,
        equipmentId: { in: requestedEquipmentIds },
      },
      data: { status: 'CHECKED_OUT' },
    });

    await this.actionLogService.log({
      userId,
      action: 'CHECK_OUT',
      entityType: 'Event',
      entityId: dto.eventId,
      details: {
        eventId: dto.eventId,
        eventName: event.name,
        itemCount: dto.items.length,
        equipmentIds: requestedEquipmentIds,
      },
    });

    return {
      event: { id: event.id, name: event.name },
      checkOut,
      totalItems: dto.items.length,
    };
  }

  // ==================== CHECK-IN ====================

  async createCheckIn(dto: CreateCheckInDto, userId: string) {
    // Validate event exists
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!['IN_PROGRESS', 'COMPLETED'].includes(event.status)) {
      throw new BadRequestException(
        'Event must be in progress or completed to check in equipment',
      );
    }

    const itemsWithDamage: string[] = [];

    // Validate equipment is actually checked out for this event
    const checkOuts = await this.prisma.checkOutTransaction.findMany({
      where: { eventId: dto.eventId },
      include: { items: true },
    });

    const checkedOutEquipmentIds = checkOuts.flatMap((co) =>
      co.items.map((item) => item.equipmentId),
    );
    const requestedEquipmentIds = dto.items.map((i) => i.equipmentId);

    for (const equipmentId of requestedEquipmentIds) {
      if (!checkedOutEquipmentIds.includes(equipmentId)) {
        throw new BadRequestException(
          `Equipment ${equipmentId} was not checked out for this event`,
        );
      }
    }

    // Create check-in transaction with items
    const checkIn = await this.prisma.checkInTransaction.create({
      data: {
        eventId: dto.eventId,
        checkedInBy: userId,
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => ({
            equipmentId: item.equipmentId,
            condition: item.condition,
            damageNotes: item.damageNotes,
          })),
        },
      },
      include: {
        items: {
          include: {
            equipment: { include: { category: true } },
          },
        },
        checkedInByUser: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        event: { select: { id: true, name: true } },
      },
    });

    // Update equipment statuses based on condition
    for (const item of dto.items) {
      let newStatus: EquipmentStatus;
      if (item.condition === ItemCondition.DAMAGED) {
        newStatus = EquipmentStatus.DAMAGED;
        itemsWithDamage.push(item.equipmentId);
      } else if (item.condition === ItemCondition.LOST) {
        newStatus = EquipmentStatus.LOST;
      } else {
        newStatus = EquipmentStatus.AVAILABLE;
      }

      await this.prisma.equipmentItem.update({
        where: { id: item.equipmentId },
        data: { currentStatus: newStatus },
      });

      await this.prisma.equipmentStatusHistory.create({
        data: {
          equipmentId: item.equipmentId,
          previousStatus: EquipmentStatus.IN_USE,
          newStatus,
          reason: `Checked in from event: ${event.name}. Condition: ${item.condition}${item.damageNotes ? `. Notes: ${item.damageNotes}` : ''}`,
          changedBy: userId,
        },
      });

      // Create maintenance ticket if damaged
      if (item.condition === ItemCondition.DAMAGED) {
        await this.prisma.maintenanceTicket.create({
          data: {
            equipmentId: item.equipmentId,
            title: `Damaged equipment returned from event`,
            reportedIssue:
              item.damageNotes ||
              `Equipment returned damaged from event "${event.name}"`,
            description: `Equipment was returned in damaged condition after event "${event.name}"`,
            priority: 'HIGH',
            status: 'OPEN',
            createdById: userId,
          },
        });
      }
    }

    // Update booking statuses
    await this.prisma.eventEquipmentBooking.updateMany({
      where: {
        eventId: dto.eventId,
        equipmentId: { in: requestedEquipmentIds },
      },
      data: { status: 'RETURNED' },
    });

    // Check if all equipment has been returned - check the bookings
    const pendingBookings = await this.prisma.eventEquipmentBooking.count({
      where: {
        eventId: dto.eventId,
        status: { notIn: ['RETURNED', 'CANCELLED'] },
      },
    });

    if (pendingBookings === 0 && event.status === 'IN_PROGRESS') {
      await this.prisma.event.update({
        where: { id: dto.eventId },
        data: { status: 'COMPLETED' },
      });
    }

    await this.actionLogService.log({
      userId,
      action: 'CHECK_IN',
      entityType: 'Event',
      entityId: dto.eventId,
      details: {
        eventId: dto.eventId,
        eventName: event.name,
        itemCount: dto.items.length,
        itemsWithIssues: itemsWithDamage,
      },
    });

    return {
      event: { id: event.id, name: event.name },
      checkIn,
      totalItems: dto.items.length,
      itemsWithIssues: itemsWithDamage.length,
      allReturned: pendingBookings === 0,
    };
  }

  // ==================== QUERIES ====================

  async getEventTransactions(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        equipmentBookings: {
          include: {
            equipment: { include: { category: true } },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const checkOuts = await this.prisma.checkOutTransaction.findMany({
      where: { eventId },
      include: {
        items: {
          include: {
            equipment: { include: { category: true } },
          },
        },
        checkedOutByUser: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { checkedOutAt: 'desc' },
    });

    const checkIns = await this.prisma.checkInTransaction.findMany({
      where: { eventId },
      include: {
        items: {
          include: {
            equipment: { include: { category: true } },
          },
        },
        checkedInByUser: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { checkedInAt: 'desc' },
    });

    const checkedOutCount = checkOuts.reduce(
      (sum, co) => sum + co.items.length,
      0,
    );
    const checkedInCount = checkIns.reduce(
      (sum, ci) => sum + ci.items.length,
      0,
    );
    const totalBooked = event.equipmentBookings.length;

    return {
      event: { id: event.id, name: event.name, status: event.status },
      checkOuts,
      checkIns,
      summary: {
        totalBooked,
        checkedOut: checkedOutCount,
        checkedIn: checkedInCount,
      },
    };
  }

  async getEquipmentTransactionHistory(
    equipmentId: string,
    params: { skip?: number; take?: number },
  ) {
    const { skip = 0, take = 20 } = params;

    const item = await this.prisma.equipmentItem.findUnique({
      where: { id: equipmentId },
      include: { category: true },
    });

    if (!item) {
      throw new NotFoundException('Equipment item not found');
    }

    const [checkOutItems, checkInItems] = await Promise.all([
      this.prisma.checkOutItem.findMany({
        where: { equipmentId },
        skip,
        take,
        orderBy: { checkOutTransaction: { checkedOutAt: 'desc' } },
        include: {
          checkOutTransaction: {
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                  startDate: true,
                  endDate: true,
                },
              },
              checkedOutByUser: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.checkInItem.findMany({
        where: { equipmentId },
        skip,
        take,
        orderBy: { checkInTransaction: { checkedInAt: 'desc' } },
        include: {
          checkInTransaction: {
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                  startDate: true,
                  endDate: true,
                },
              },
              checkedInByUser: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      equipmentItem: item,
      checkOutHistory: checkOutItems,
      checkInHistory: checkInItems,
      skip,
      take,
    };
  }

  async getPendingCheckIns() {
    // Find events with equipment checked out but not yet returned
    const pendingBookings = await this.prisma.eventEquipmentBooking.findMany({
      where: {
        status: 'CHECKED_OUT',
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        equipment: { include: { category: true } },
      },
      orderBy: { event: { endDate: 'asc' } },
    });

    // Group by event
    const byEvent = pendingBookings.reduce(
      (acc, booking) => {
        const eventId = booking.eventId;
        if (!acc[eventId]) {
          acc[eventId] = {
            event: booking.event,
            items: [],
          };
        }
        acc[eventId].items.push(booking.equipment);
        return acc;
      },
      {} as Record<string, { event: any; items: any[] }>,
    );

    return {
      totalPending: pendingBookings.length,
      byEvent: Object.values(byEvent),
    };
  }

  async getOverdueCheckIns() {
    // Find equipment that should be returned (event ended) but hasn't been checked in
    const overdue = await this.prisma.eventEquipmentBooking.findMany({
      where: {
        status: 'CHECKED_OUT',
        event: {
          endDate: { lt: new Date() },
        },
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        equipment: { include: { category: true } },
      },
      orderBy: { event: { endDate: 'asc' } },
    });

    return {
      totalOverdue: overdue.length,
      items: overdue.map((booking) => ({
        ...booking,
        daysOverdue: Math.floor(
          (new Date().getTime() - new Date(booking.event.endDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      })),
    };
  }
}
