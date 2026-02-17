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
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const action_log_service_1 = require("../action-log/action-log.service");
let EventsService = class EventsService {
    prisma;
    actionLogService;
    constructor(prisma, actionLogService) {
        this.prisma = prisma;
        this.actionLogService = actionLogService;
    }
    async create(dto, userId, ipAddress) {
        const client = await this.prisma.client.findUnique({
            where: { id: dto.clientId },
        });
        if (!client) {
            throw new common_1.BadRequestException('Invalid client');
        }
        if (!client.isActive) {
            throw new common_1.BadRequestException('Client is inactive');
        }
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        if (endDate <= startDate) {
            throw new common_1.BadRequestException('End date must be after start date');
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
    async findAll(params) {
        const { skip = 0, take = 50, search, status, clientId, startDate, endDate, } = params;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { venue: { contains: search } },
                { eventType: { contains: search } },
            ];
        }
        if (status)
            where.status = status;
        if (clientId)
            where.clientId = clientId;
        if (startDate || endDate) {
            where.AND = [];
            if (startDate)
                where.AND.push({ startDate: { gte: startDate } });
            if (endDate)
                where.AND.push({ endDate: { lte: endDate } });
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
    async findOne(id) {
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
            throw new common_1.NotFoundException('Event not found');
        }
        return event;
    }
    async update(id, dto, userId, ipAddress) {
        const event = await this.prisma.event.findUnique({ where: { id } });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const startDate = dto.startDate ? new Date(dto.startDate) : event.startDate;
        const endDate = dto.endDate ? new Date(dto.endDate) : event.endDate;
        if (endDate <= startDate) {
            throw new common_1.BadRequestException('End date must be after start date');
        }
        if (dto.clientId && dto.clientId !== event.clientId) {
            const client = await this.prisma.client.findUnique({
                where: { id: dto.clientId },
            });
            if (!client || !client.isActive) {
                throw new common_1.BadRequestException('Invalid or inactive client');
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
    async updateStatus(id, status, userId, ipAddress) {
        const event = await this.prisma.event.findUnique({ where: { id } });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
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
    async bookEquipment(eventId, dto, userId, ipAddress) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        if (['COMPLETED', 'CANCELLED'].includes(event.status)) {
            throw new common_1.BadRequestException('Cannot book equipment for completed or cancelled events');
        }
        const equipment = await this.prisma.equipmentItem.findUnique({
            where: { id: dto.equipmentId },
        });
        if (!equipment) {
            throw new common_1.BadRequestException('Equipment not found');
        }
        if (['DAMAGED', 'UNDER_REPAIR', 'LOST', 'RETIRED'].includes(equipment.currentStatus)) {
            throw new common_1.BadRequestException(`Equipment is ${equipment.currentStatus.toLowerCase()} and cannot be booked`);
        }
        const existingBooking = await this.prisma.eventEquipmentBooking.findUnique({
            where: {
                eventId_equipmentId: {
                    eventId,
                    equipmentId: dto.equipmentId,
                },
            },
        });
        if (existingBooking) {
            throw new common_1.ConflictException('Equipment already booked for this event');
        }
        const conflictingBooking = await this.prisma.eventEquipmentBooking.findFirst({
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
            throw new common_1.ConflictException(`Equipment is already booked for "${conflictingBooking.event.name}" during this time`);
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
    async bookMultipleEquipment(eventId, items, userId, ipAddress) {
        const results = [];
        const errors = [];
        for (const item of items) {
            try {
                const booking = await this.bookEquipment(eventId, item, userId, ipAddress);
                results.push(booking);
            }
            catch (error) {
                errors.push({
                    equipmentId: item.equipmentId,
                    error: error.message,
                });
            }
        }
        return { success: results, errors };
    }
    async removeEquipmentBooking(eventId, bookingId, userId, ipAddress) {
        const booking = await this.prisma.eventEquipmentBooking.findFirst({
            where: { id: bookingId, eventId },
            include: { equipment: true },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.status === 'CHECKED_OUT') {
            throw new common_1.BadRequestException('Cannot remove booking for checked-out equipment');
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
    async confirmBookings(eventId, userId, ipAddress) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: { equipmentBookings: { where: { status: 'PENDING' } } },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const result = await this.prisma.eventEquipmentBooking.updateMany({
            where: { eventId, status: 'PENDING' },
            data: { status: 'CONFIRMED' },
        });
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
    async assignStaff(eventId, dto, userId, ipAddress) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            throw new common_1.NotFoundException('Event not found');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: dto.userId },
        });
        if (!user || !user.isActive) {
            throw new common_1.BadRequestException('Invalid or inactive user');
        }
        const existing = await this.prisma.staffAssignment.findUnique({
            where: {
                eventId_userId: {
                    eventId,
                    userId: dto.userId,
                },
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Staff member already assigned to this event');
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
    async removeStaffAssignment(eventId, assignmentId, userId, ipAddress) {
        const assignment = await this.prisma.staffAssignment.findFirst({
            where: { id: assignmentId, eventId },
            include: { user: { select: { firstName: true, lastName: true } } },
        });
        if (!assignment) {
            throw new common_1.NotFoundException('Assignment not found');
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
    async getCalendar(startDate, endDate, filters) {
        const where = {
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
        if (filters?.status)
            where.status = filters.status;
        if (filters?.clientId)
            where.clientId = filters.clientId;
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
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        action_log_service_1.ActionLogService])
], EventsService);
//# sourceMappingURL=events.service.js.map