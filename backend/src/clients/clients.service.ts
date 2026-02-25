import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActionLogService } from '../action-log/action-log.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private actionLogService: ActionLogService,
  ) {}

  async create(dto: CreateClientDto, userId: string, ipAddress?: string) {
    const client = await this.prisma.client.create({
      data: dto,
    });

    await this.actionLogService.log({
      userId,
      action: 'CLIENT_CREATED',
      entityType: 'Client',
      entityId: client.id,
      details: { name: client.name },
      ipAddress,
    });

    return client;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    city?: string;
    isActive?: boolean;
  }) {
    const { skip = 0, take = 50, search, city, isActive } = params;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { contactPerson: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (city) where.city = city;
    if (isActive !== undefined) where.isActive = isActive;

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { events: true, invoices: true },
          },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      items,
      total,
      skip,
      take,
    };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: { startDate: 'desc' },
          take: 10,
          select: {
            id: true,
            name: true,
            eventType: true,
            venue: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            amountPaid: true,
            status: true,
            issueDate: true,
            dueDate: true,
          },
        },
        quotes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            quoteNumber: true,
            total: true,
            status: true,
            issueDate: true,
            validUntil: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async update(
    id: string,
    dto: UpdateClientDto,
    userId: string,
    ipAddress?: string,
  ) {
    const client = await this.prisma.client.findUnique({ where: { id } });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const updated = await this.prisma.client.update({
      where: { id },
      data: dto,
    });

    await this.actionLogService.log({
      userId,
      action: 'CLIENT_UPDATED',
      entityType: 'Client',
      entityId: id,
      details: { changes: dto },
      ipAddress,
    });

    return updated;
  }

  async deactivate(id: string, userId: string, ipAddress?: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const updated = await this.prisma.client.update({
      where: { id },
      data: { isActive: false },
    });

    await this.actionLogService.log({
      userId,
      action: 'CLIENT_DEACTIVATED',
      entityType: 'Client',
      entityId: id,
      details: { name: client.name },
      ipAddress,
    });

    return updated;
  }

  async getHistory(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const [events, quotes, invoices, payments] = await Promise.all([
      this.prisma.event.findMany({
        where: { clientId: id },
        orderBy: { startDate: 'desc' },
        select: {
          id: true,
          name: true,
          eventType: true,
          venue: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      }),
      this.prisma.quote.findMany({
        where: { clientId: id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          quoteNumber: true,
          total: true,
          status: true,
          createdAt: true,
          event: { select: { id: true, name: true } },
        },
      }),
      this.prisma.invoice.findMany({
        where: { clientId: id },
        orderBy: { createdAt: 'desc' },
        include: {
          payments: true,
        },
      }),
      this.prisma.payment.findMany({
        where: { invoice: { clientId: id } },
        orderBy: { paymentDate: 'desc' },
        include: {
          invoice: {
            select: { invoiceNumber: true },
          },
        },
      }),
    ]);

    const totalBilled = invoices.reduce(
      (sum, inv) => sum + Number(inv.total),
      0,
    );
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const outstandingBalance = totalBilled - totalPaid;

    return {
      events,
      quotes,
      invoices,
      payments,
      financialSummary: {
        totalEvents: events.length,
        totalInvoiced: totalBilled,
        totalPaid,
        outstanding: outstandingBalance,
      },
    };
  }
}
