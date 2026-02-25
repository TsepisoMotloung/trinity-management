import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  // ==================== NOTIFICATION CRUD ====================

  async findAll(params: {
    userId?: string;
    isRead?: boolean;
    skip?: number;
    take?: number;
  }) {
    const { userId, isRead, skip = 0, take = 50 } = params;
    const where: any = { isDismissed: false };
    if (userId) where.userId = userId;
    if (isRead !== undefined) where.isRead = isRead;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { ...where, isRead: false },
      }),
    ]);

    return { notifications, total, unreadCount, skip, take };
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read' };
  }

  async dismiss(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isDismissed: true },
    });
  }

  async createNotification(data: {
    userId?: string;
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    priority?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId || null,
        type: data.type as any,
        title: data.title,
        message: data.message,
        entityType: data.entityType,
        entityId: data.entityId,
        priority: (data.priority as any) || 'NORMAL',
      },
    });
  }

  // ==================== SCHEDULED JOBS ====================

  // Run every hour - check for upcoming events and create notifications
  @Cron(CronExpression.EVERY_HOUR)
  async checkUpcomingEvents() {
    this.logger.log('Checking for upcoming events...');
    const now = new Date();
    const intervals = [
      { days: 14, type: 'EVENT_UPCOMING_14D' },
      { days: 7, type: 'EVENT_UPCOMING_7D' },
      { days: 3, type: 'EVENT_UPCOMING_3D' },
      { days: 2, type: 'EVENT_UPCOMING_2D' },
      { days: 1, type: 'EVENT_UPCOMING_1D' },
    ];

    for (const interval of intervals) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + interval.days);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const events = await this.prisma.event.findMany({
        where: {
          startDate: { gte: startOfDay, lte: endOfDay },
          status: { in: ['CONFIRMED', 'QUOTED', 'DRAFT'] },
        },
        include: { client: true },
      });

      for (const event of events) {
        // Check if notification already exists
        const existing = await this.prisma.notification.findFirst({
          where: {
            type: interval.type as any,
            entityType: 'Event',
            entityId: event.id,
          },
        });

        if (!existing) {
          // Create notification for all admins
          const admins = await this.prisma.user.findMany({
            where: { role: 'ADMIN', isActive: true },
          });

          for (const admin of admins) {
            await this.createNotification({
              userId: admin.id,
              type: interval.type,
              title: `Event in ${interval.days} day${interval.days > 1 ? 's' : ''}`,
              message: `"${event.name}" for ${event.client.name} is coming up on ${event.startDate.toLocaleDateString()}`,
              entityType: 'Event',
              entityId: event.id,
              priority: interval.days <= 2 ? 'HIGH' : 'NORMAL',
            });
          }
        }
      }
    }
  }

  // Run every hour - check reserved equipment and auto-transition statuses
  @Cron(CronExpression.EVERY_HOUR)
  async checkEquipmentReservations() {
    this.logger.log('Checking equipment reservations...');
    const now = new Date();

    // Find bookings where reservedFrom has arrived -> change to CHECKED_OUT / IN_USE
    const startingBookings = await this.prisma.eventEquipmentBooking.findMany({
      where: {
        status: 'CONFIRMED',
        reservedFrom: { lte: now },
        reservedUntil: { gte: now },
        event: { status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
      },
      include: { equipment: true, event: true },
    });

    for (const booking of startingBookings) {
      // Mark event as in-progress if it's confirmed and start date is now or past
      if (booking.event.status === 'CONFIRMED' && booking.event.startDate <= now) {
        await this.prisma.event.update({
          where: { id: booking.eventId },
          data: { status: 'IN_PROGRESS' },
        });
      }
    }

    // Find bookings where reservedUntil has passed -> change back
    const endedBookings = await this.prisma.eventEquipmentBooking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_OUT'] },
        reservedUntil: { lt: now },
        event: { status: { not: 'CANCELLED' } },
      },
      include: { equipment: true },
    });

    for (const booking of endedBookings) {
      if (booking.status === 'CONFIRMED') {
        // Reservation expired without check-out, release equipment
        await this.prisma.eventEquipmentBooking.update({
          where: { id: booking.id },
          data: { status: 'RETURNED' },
        });

        // Recalculate equipment quantities
        await this.recalculateEquipmentQuantities(booking.equipmentId);
      }
    }
  }

  // Run every hour - check overdue invoices
  @Cron(CronExpression.EVERY_HOUR)
  async checkOverdueInvoices() {
    this.logger.log('Checking for overdue invoices...');
    const now = new Date();

    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        dueDate: { lt: now },
        status: { in: ['SENT', 'PARTIALLY_PAID', 'DRAFT'] },
      },
      include: { client: true },
    });

    for (const invoice of overdueInvoices) {
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'OVERDUE' },
      });

      // Create notification if none exists
      const existing = await this.prisma.notification.findFirst({
        where: {
          type: 'INVOICE_OVERDUE',
          entityType: 'Invoice',
          entityId: invoice.id,
        },
      });

      if (!existing) {
        const admins = await this.prisma.user.findMany({
          where: { role: 'ADMIN', isActive: true },
        });

        for (const admin of admins) {
          await this.createNotification({
            userId: admin.id,
            type: 'INVOICE_OVERDUE',
            title: 'Invoice Overdue',
            message: `Invoice ${invoice.invoiceNumber} for ${invoice.client.name} is overdue. Amount: R${Number(invoice.total).toLocaleString()}`,
            entityType: 'Invoice',
            entityId: invoice.id,
            priority: 'HIGH',
          });
        }
      }
    }
  }

  // Utility: update equipment status based on active bookings (individual item model)
  async recalculateEquipmentQuantities(equipmentId: string) {
    const equipment = await this.prisma.equipmentItem.findUnique({
      where: { id: equipmentId },
    });
    if (!equipment) return;

    // For individual items, check if there's an active booking
    const activeBooking = await this.prisma.eventEquipmentBooking.findFirst({
      where: {
        equipmentId,
        status: { in: ['CONFIRMED', 'CHECKED_OUT', 'PENDING'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeBooking) {
      // No active bookings — mark as available (unless damaged/lost/retired)
      if (['DAMAGED', 'LOST', 'RETIRED', 'UNDER_REPAIR'].includes(equipment.currentStatus)) {
        return; // Don't override manual status
      }
      await this.prisma.equipmentItem.update({
        where: { id: equipmentId },
        data: { currentStatus: 'AVAILABLE' },
      });
    } else if (activeBooking.status === 'CHECKED_OUT') {
      await this.prisma.equipmentItem.update({
        where: { id: equipmentId },
        data: { currentStatus: 'IN_USE' },
      });
    } else {
      await this.prisma.equipmentItem.update({
        where: { id: equipmentId },
        data: { currentStatus: 'RESERVED' },
      });
    }
  }
}
