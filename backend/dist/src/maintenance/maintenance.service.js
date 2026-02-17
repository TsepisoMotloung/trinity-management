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
exports.MaintenanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const action_log_service_1 = require("../action-log/action-log.service");
let MaintenanceService = class MaintenanceService {
    prisma;
    actionLogService;
    constructor(prisma, actionLogService) {
        this.prisma = prisma;
        this.actionLogService = actionLogService;
    }
    async create(dto, userId) {
        const equipment = await this.prisma.equipmentItem.findUnique({
            where: { id: dto.equipmentId },
            include: { category: true },
        });
        if (!equipment) {
            throw new common_1.NotFoundException('Equipment item not found');
        }
        const ticket = await this.prisma.maintenanceTicket.create({
            data: {
                equipmentId: dto.equipmentId,
                title: dto.title,
                description: dto.description,
                reportedIssue: dto.reportedIssue,
                priority: dto.priority || 'MEDIUM',
                status: 'OPEN',
                createdById: userId,
            },
            include: {
                equipment: { include: { category: true } },
                createdBy: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
            },
        });
        if (!['DAMAGED', 'UNDER_REPAIR'].includes(equipment.currentStatus)) {
            await this.prisma.equipmentItem.update({
                where: { id: dto.equipmentId },
                data: { currentStatus: 'UNDER_REPAIR' },
            });
            await this.prisma.equipmentStatusHistory.create({
                data: {
                    equipmentId: dto.equipmentId,
                    previousStatus: equipment.currentStatus,
                    newStatus: 'UNDER_REPAIR',
                    reason: `Maintenance ticket created: ${dto.title}`,
                    changedBy: userId,
                },
            });
        }
        await this.actionLogService.log({
            userId,
            action: 'CREATE',
            entityType: 'MaintenanceTicket',
            entityId: ticket.id,
            details: {
                equipmentId: dto.equipmentId,
                equipmentName: equipment.name,
                priority: dto.priority || 'MEDIUM',
            },
        });
        return ticket;
    }
    async findAll(params) {
        const { skip = 0, take = 20, status, priority, equipmentId, assignedToId, search, } = params;
        const where = {};
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        if (equipmentId)
            where.equipmentId = equipmentId;
        if (assignedToId)
            where.assignedToId = assignedToId;
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
                { equipment: { name: { contains: search } } },
            ];
        }
        const [tickets, total] = await Promise.all([
            this.prisma.maintenanceTicket.findMany({
                where,
                skip,
                take,
                orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
                include: {
                    equipment: { include: { category: true } },
                    createdBy: {
                        select: { id: true, email: true, firstName: true, lastName: true },
                    },
                    assignedTo: {
                        select: { id: true, email: true, firstName: true, lastName: true },
                    },
                },
            }),
            this.prisma.maintenanceTicket.count({ where }),
        ]);
        return { tickets, total, skip, take };
    }
    async findOne(id) {
        const ticket = await this.prisma.maintenanceTicket.findUnique({
            where: { id },
            include: {
                equipment: {
                    include: {
                        category: true,
                        statusHistory: {
                            orderBy: { createdAt: 'desc' },
                            take: 10,
                        },
                    },
                },
                createdBy: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                assignedTo: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
            },
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Maintenance ticket not found');
        }
        return ticket;
    }
    async update(id, dto, userId) {
        const existing = await this.findOne(id);
        if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Cannot update completed or cancelled tickets');
        }
        const ticket = await this.prisma.maintenanceTicket.update({
            where: { id },
            data: {
                title: dto.title,
                description: dto.description,
                reportedIssue: dto.reportedIssue,
                priority: dto.priority,
                assignedToId: dto.assignedToId,
                diagnosis: dto.diagnosis,
                repairNotes: dto.repairNotes,
                vendorName: dto.vendorName,
            },
            include: {
                equipment: { include: { category: true } },
                createdBy: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                assignedTo: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
            },
        });
        await this.actionLogService.log({
            userId,
            action: 'UPDATE',
            entityType: 'MaintenanceTicket',
            entityId: id,
            details: { changes: dto },
        });
        return ticket;
    }
    async updateStatus(id, dto, userId) {
        const existing = await this.findOne(id);
        if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Cannot update status of completed or cancelled tickets');
        }
        const updateData = { status: dto.status };
        if (dto.status === 'IN_PROGRESS' && existing.status === 'OPEN') {
            updateData.startedAt = new Date();
        }
        const ticket = await this.prisma.maintenanceTicket.update({
            where: { id },
            data: updateData,
            include: {
                equipment: { include: { category: true } },
            },
        });
        if (dto.status === 'IN_PROGRESS') {
            await this.prisma.equipmentItem.update({
                where: { id: ticket.equipmentId },
                data: { currentStatus: 'UNDER_REPAIR' },
            });
            await this.prisma.equipmentStatusHistory.create({
                data: {
                    equipmentId: ticket.equipmentId,
                    previousStatus: ticket.equipment.currentStatus,
                    newStatus: 'UNDER_REPAIR',
                    reason: dto.notes || 'Maintenance started',
                    changedBy: userId,
                },
            });
        }
        await this.actionLogService.log({
            userId,
            action: 'STATUS_CHANGE',
            entityType: 'MaintenanceTicket',
            entityId: id,
            details: {
                previousStatus: existing.status,
                newStatus: dto.status,
                notes: dto.notes,
            },
        });
        return ticket;
    }
    async complete(id, dto, userId) {
        const existing = await this.findOne(id);
        if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Ticket is already completed or cancelled');
        }
        const ticket = await this.prisma.maintenanceTicket.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                repairNotes: dto.repairNotes,
                diagnosis: dto.diagnosis,
                completedAt: new Date(),
                returnToServiceAt: dto.setAvailable !== false ? new Date() : null,
            },
            include: {
                equipment: { include: { category: true } },
            },
        });
        const newStatus = dto.setAvailable !== false ? 'AVAILABLE' : 'UNDER_REPAIR';
        await this.prisma.equipmentItem.update({
            where: { id: ticket.equipmentId },
            data: { currentStatus: newStatus },
        });
        await this.prisma.equipmentStatusHistory.create({
            data: {
                equipmentId: ticket.equipmentId,
                previousStatus: ticket.equipment.currentStatus,
                newStatus: newStatus,
                reason: `Maintenance completed: ${dto.repairNotes}`,
                changedBy: userId,
            },
        });
        await this.actionLogService.log({
            userId,
            action: 'COMPLETE',
            entityType: 'MaintenanceTicket',
            entityId: id,
            details: {
                repairNotes: dto.repairNotes,
                equipmentStatus: newStatus,
            },
        });
        return ticket;
    }
    async cancel(id, userId) {
        const existing = await this.findOne(id);
        if (existing.status === 'COMPLETED') {
            throw new common_1.BadRequestException('Cannot cancel completed ticket');
        }
        const ticket = await this.prisma.maintenanceTicket.update({
            where: { id },
            data: { status: 'CANCELLED' },
            include: {
                equipment: { include: { category: true } },
            },
        });
        await this.actionLogService.log({
            userId,
            action: 'CANCEL',
            entityType: 'MaintenanceTicket',
            entityId: id,
            details: { title: ticket.title },
        });
        return ticket;
    }
    async getStatistics() {
        const [byStatus, byPriority, recentTickets] = await Promise.all([
            this.prisma.maintenanceTicket.groupBy({
                by: ['status'],
                _count: true,
            }),
            this.prisma.maintenanceTicket.groupBy({
                by: ['priority'],
                where: { status: { not: 'COMPLETED' } },
                _count: true,
            }),
            this.prisma.maintenanceTicket.findMany({
                where: { status: { not: 'COMPLETED' } },
                orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
                take: 5,
                include: {
                    equipment: { select: { id: true, name: true } },
                },
            }),
        ]);
        return {
            byStatus: byStatus.reduce((acc, item) => {
                acc[item.status] = item._count;
                return acc;
            }, {}),
            byPriority: byPriority.reduce((acc, item) => {
                acc[item.priority] = item._count;
                return acc;
            }, {}),
            openTickets: byStatus.find((s) => s.status === 'OPEN')?._count || 0,
            inProgressTickets: byStatus.find((s) => s.status === 'IN_PROGRESS')?._count || 0,
            recentTickets,
        };
    }
};
exports.MaintenanceService = MaintenanceService;
exports.MaintenanceService = MaintenanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        action_log_service_1.ActionLogService])
], MaintenanceService);
//# sourceMappingURL=maintenance.service.js.map