"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const action_log_service_1 = require("../action-log/action-log.service");
let ClientsService = class ClientsService {
    prisma;
    actionLogService;
    constructor(prisma, actionLogService) {
        this.prisma = prisma;
        this.actionLogService = actionLogService;
    }
    async create(dto, userId, ipAddress) {
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
    async findAll(params) {
        const { skip = 0, take = 50, search, city, isActive } = params;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { contactPerson: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
            ];
        }
        if (city)
            where.city = city;
        if (isActive !== undefined)
            where.isActive = isActive;
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
    async findOne(id) {
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
            throw new common_1.NotFoundException('Client not found');
        }
        return client;
    }
    async update(id, dto, userId, ipAddress) {
        const client = await this.prisma.client.findUnique({ where: { id } });
        if (!client) {
            throw new common_1.NotFoundException('Client not found');
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
    async deactivate(id, userId, ipAddress) {
        const client = await this.prisma.client.findUnique({ where: { id } });
        if (!client) {
            throw new common_1.NotFoundException('Client not found');
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
    async getHistory(id) {
        const client = await this.prisma.client.findUnique({ where: { id } });
        if (!client) {
            throw new common_1.NotFoundException('Client not found');
        }
        const [events, invoices, payments] = await Promise.all([
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
        const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const outstandingBalance = totalBilled - totalPaid;
        return {
            events,
            invoices,
            payments,
            summary: {
                totalEvents: events.length,
                totalBilled,
                totalPaid,
                outstandingBalance,
            },
        };
    }
};
exports.ClientsService = ClientsService;
exports.ClientsService = ClientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        action_log_service_1.ActionLogService])
], ClientsService);
//# sourceMappingURL=clients.service.js.map