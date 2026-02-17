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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const action_log_service_1 = require("../action-log/action-log.service");
const client_1 = require("@prisma/client");
let TransactionsService = class TransactionsService {
    prisma;
    actionLogService;
    constructor(prisma, actionLogService) {
        this.prisma = prisma;
        this.actionLogService = actionLogService;
    }
    async createCheckOut(dto, userId) {
        const event = await this.prisma.event.findUnique({
            where: { id: dto.eventId },
            include: {
                equipmentBookings: {
                    include: { equipment: true },
                },
            },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        if (!['CONFIRMED', 'IN_PROGRESS'].includes(event.status)) {
            throw new common_1.BadRequestException('Event must be confirmed or in progress to check out equipment');
        }
        const bookedEquipmentIds = event.equipmentBookings.map((b) => b.equipmentId);
        const requestedEquipmentIds = dto.items.map((item) => item.equipmentId);
        for (const equipmentId of requestedEquipmentIds) {
            if (!bookedEquipmentIds.includes(equipmentId)) {
                throw new common_1.BadRequestException(`Equipment ${equipmentId} is not booked for this event`);
            }
        }
        const equipment = await this.prisma.equipmentItem.findMany({
            where: {
                id: { in: requestedEquipmentIds },
            },
        });
        for (const item of equipment) {
            if (item.currentStatus !== client_1.EquipmentStatus.AVAILABLE &&
                item.currentStatus !== client_1.EquipmentStatus.RESERVED) {
                throw new common_1.BadRequestException(`Equipment ${item.name} is not available for check-out (status: ${item.currentStatus})`);
            }
        }
        const checkOut = await this.prisma.checkOutTransaction.create({
            data: {
                eventId: dto.eventId,
                checkedOutBy: userId,
                notes: dto.notes,
                items: {
                    create: dto.items.map((item) => ({
                        equipmentId: item.equipmentId,
                        quantity: item.quantity || 1,
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
        for (const item of dto.items) {
            await this.prisma.equipmentItem.update({
                where: { id: item.equipmentId },
                data: { currentStatus: client_1.EquipmentStatus.IN_USE },
            });
            await this.prisma.equipmentStatusHistory.create({
                data: {
                    equipmentId: item.equipmentId,
                    previousStatus: client_1.EquipmentStatus.AVAILABLE,
                    newStatus: client_1.EquipmentStatus.IN_USE,
                    reason: `Checked out for event: ${event.name}`,
                    changedBy: userId,
                },
            });
        }
        if (event.status === 'CONFIRMED') {
            await this.prisma.event.update({
                where: { id: dto.eventId },
                data: { status: 'IN_PROGRESS' },
            });
        }
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
    async createCheckIn(dto, userId) {
        const event = await this.prisma.event.findUnique({
            where: { id: dto.eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        if (!['IN_PROGRESS', 'COMPLETED'].includes(event.status)) {
            throw new common_1.BadRequestException('Event must be in progress or completed to check in equipment');
        }
        const itemsWithDamage = [];
        const checkOuts = await this.prisma.checkOutTransaction.findMany({
            where: { eventId: dto.eventId },
            include: { items: true },
        });
        const checkedOutEquipmentIds = checkOuts.flatMap((co) => co.items.map((item) => item.equipmentId));
        const requestedEquipmentIds = dto.items.map((i) => i.equipmentId);
        for (const equipmentId of requestedEquipmentIds) {
            if (!checkedOutEquipmentIds.includes(equipmentId)) {
                throw new common_1.BadRequestException(`Equipment ${equipmentId} was not checked out for this event`);
            }
        }
        const checkIn = await this.prisma.checkInTransaction.create({
            data: {
                eventId: dto.eventId,
                checkedInBy: userId,
                notes: dto.notes,
                items: {
                    create: dto.items.map((item) => ({
                        equipmentId: item.equipmentId,
                        quantity: item.quantity || 1,
                        returnedQuantity: item.returnedQuantity || item.quantity || 1,
                        condition: item.condition,
                        damageNotes: item.damageNotes,
                        isShortage: (item.returnedQuantity || item.quantity || 1) <
                            (item.quantity || 1),
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
        for (const item of dto.items) {
            let newStatus;
            if (item.condition === client_1.ItemCondition.DAMAGED) {
                newStatus = client_1.EquipmentStatus.DAMAGED;
                itemsWithDamage.push(item.equipmentId);
            }
            else if (item.condition === client_1.ItemCondition.LOST) {
                newStatus = client_1.EquipmentStatus.LOST;
            }
            else {
                newStatus = client_1.EquipmentStatus.AVAILABLE;
            }
            await this.prisma.equipmentItem.update({
                where: { id: item.equipmentId },
                data: { currentStatus: newStatus },
            });
            await this.prisma.equipmentStatusHistory.create({
                data: {
                    equipmentId: item.equipmentId,
                    previousStatus: client_1.EquipmentStatus.IN_USE,
                    newStatus,
                    reason: `Checked in from event: ${event.name}. Condition: ${item.condition}${item.damageNotes ? `. Notes: ${item.damageNotes}` : ''}`,
                    changedBy: userId,
                },
            });
            if (item.condition === client_1.ItemCondition.DAMAGED) {
                await this.prisma.maintenanceTicket.create({
                    data: {
                        equipmentId: item.equipmentId,
                        title: `Damaged equipment returned from event`,
                        reportedIssue: item.damageNotes ||
                            `Equipment returned damaged from event "${event.name}"`,
                        description: `Equipment was returned in damaged condition after event "${event.name}"`,
                        priority: 'HIGH',
                        status: 'OPEN',
                        createdById: userId,
                    },
                });
            }
        }
        await this.prisma.eventEquipmentBooking.updateMany({
            where: {
                eventId: dto.eventId,
                equipmentId: { in: requestedEquipmentIds },
            },
            data: { status: 'RETURNED' },
        });
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
    async getEventTransactions(eventId) {
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
            throw new common_1.NotFoundException('Event not found');
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
        const checkedOutCount = checkOuts.reduce((sum, co) => sum + co.items.length, 0);
        const checkedInCount = checkIns.reduce((sum, ci) => sum + ci.items.length, 0);
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
    async getEquipmentTransactionHistory(equipmentId, params) {
        const { skip = 0, take = 20 } = params;
        const item = await this.prisma.equipmentItem.findUnique({
            where: { id: equipmentId },
            include: { category: true },
        });
        if (!item) {
            throw new common_1.NotFoundException('Equipment item not found');
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
        const byEvent = pendingBookings.reduce((acc, booking) => {
            const eventId = booking.eventId;
            if (!acc[eventId]) {
                acc[eventId] = {
                    event: booking.event,
                    items: [],
                };
            }
            acc[eventId].items.push(booking.equipment);
            return acc;
        }, {});
        return {
            totalPending: pendingBookings.length,
            byEvent: Object.values(byEvent),
        };
    }
    async getOverdueCheckIns() {
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
                daysOverdue: Math.floor((new Date().getTime() - new Date(booking.event.endDate).getTime()) /
                    (1000 * 60 * 60 * 24)),
            })),
        };
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        action_log_service_1.ActionLogService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map