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
exports.EquipmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const action_log_service_1 = require("../action-log/action-log.service");
let EquipmentService = class EquipmentService {
    prisma;
    actionLogService;
    constructor(prisma, actionLogService) {
        this.prisma = prisma;
        this.actionLogService = actionLogService;
    }
    async createCategory(dto, userId, ipAddress) {
        const existing = await this.prisma.equipmentCategory.findUnique({
            where: { name: dto.name },
        });
        if (existing) {
            throw new common_1.ConflictException('Category with this name already exists');
        }
        const category = await this.prisma.equipmentCategory.create({
            data: dto,
        });
        await this.actionLogService.log({
            userId,
            action: 'EQUIPMENT_CATEGORY_CREATED',
            entityType: 'EquipmentCategory',
            entityId: category.id,
            details: { name: category.name },
            ipAddress,
        });
        return category;
    }
    async findAllCategories() {
        return this.prisma.equipmentCategory.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { items: true },
                },
            },
        });
    }
    async findCategoryById(id) {
        const category = await this.prisma.equipmentCategory.findUnique({
            where: { id },
            include: {
                items: true,
            },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        return category;
    }
    async updateCategory(id, dto, userId, ipAddress) {
        const category = await this.prisma.equipmentCategory.findUnique({
            where: { id },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        if (dto.name && dto.name !== category.name) {
            const existing = await this.prisma.equipmentCategory.findUnique({
                where: { name: dto.name },
            });
            if (existing) {
                throw new common_1.ConflictException('Category with this name already exists');
            }
        }
        const updated = await this.prisma.equipmentCategory.update({
            where: { id },
            data: dto,
        });
        await this.actionLogService.log({
            userId,
            action: 'EQUIPMENT_CATEGORY_UPDATED',
            entityType: 'EquipmentCategory',
            entityId: id,
            details: { changes: dto },
            ipAddress,
        });
        return updated;
    }
    async deleteCategory(id, userId, ipAddress) {
        const category = await this.prisma.equipmentCategory.findUnique({
            where: { id },
            include: { _count: { select: { items: true } } },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        if (category._count.items > 0) {
            throw new common_1.BadRequestException('Cannot delete category with existing items');
        }
        await this.prisma.equipmentCategory.delete({ where: { id } });
        await this.actionLogService.log({
            userId,
            action: 'EQUIPMENT_CATEGORY_DELETED',
            entityType: 'EquipmentCategory',
            entityId: id,
            details: { name: category.name },
            ipAddress,
        });
        return { message: 'Category deleted successfully' };
    }
    async createItem(dto, userId, ipAddress) {
        const category = await this.prisma.equipmentCategory.findUnique({
            where: { id: dto.categoryId },
        });
        if (!category) {
            throw new common_1.BadRequestException('Invalid category');
        }
        if (dto.serialNumber) {
            const existingSerial = await this.prisma.equipmentItem.findUnique({
                where: { serialNumber: dto.serialNumber },
            });
            if (existingSerial) {
                throw new common_1.ConflictException('Serial number already exists');
            }
        }
        if (dto.barcode) {
            const existingBarcode = await this.prisma.equipmentItem.findUnique({
                where: { barcode: dto.barcode },
            });
            if (existingBarcode) {
                throw new common_1.ConflictException('Barcode already exists');
            }
        }
        const item = await this.prisma.equipmentItem.create({
            data: {
                name: dto.name,
                description: dto.description,
                categoryId: dto.categoryId,
                serialNumber: dto.serialNumber,
                barcode: dto.barcode,
                purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
                purchasePrice: dto.purchasePrice,
                quantity: dto.quantity || 1,
                unit: dto.unit || 'piece',
                notes: dto.notes,
                imageUrl: dto.imageUrl,
                currentStatus: 'AVAILABLE',
            },
            include: {
                category: true,
            },
        });
        await this.prisma.equipmentStatusHistory.create({
            data: {
                equipmentId: item.id,
                newStatus: 'AVAILABLE',
                reason: 'Initial inventory entry',
                changedBy: userId,
            },
        });
        await this.actionLogService.log({
            userId,
            action: 'EQUIPMENT_ITEM_CREATED',
            entityType: 'EquipmentItem',
            entityId: item.id,
            details: { name: item.name, category: category.name },
            ipAddress,
        });
        return item;
    }
    async findAllItems(params) {
        const { skip = 0, take = 50, search, categoryId, status } = params;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { serialNumber: { contains: search } },
                { barcode: { contains: search } },
                { description: { contains: search } },
            ];
        }
        if (categoryId)
            where.categoryId = categoryId;
        if (status)
            where.currentStatus = status;
        const [items, total] = await Promise.all([
            this.prisma.equipmentItem.findMany({
                where,
                skip,
                take,
                orderBy: { name: 'asc' },
                include: {
                    category: true,
                },
            }),
            this.prisma.equipmentItem.count({ where }),
        ]);
        return {
            items,
            total,
            skip,
            take,
        };
    }
    async findItemById(id) {
        const item = await this.prisma.equipmentItem.findUnique({
            where: { id },
            include: {
                category: true,
                statusHistory: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                bookings: {
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
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                maintenanceTickets: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });
        if (!item) {
            throw new common_1.NotFoundException('Equipment item not found');
        }
        return item;
    }
    async findItemByBarcode(barcode) {
        const item = await this.prisma.equipmentItem.findUnique({
            where: { barcode },
            include: {
                category: true,
            },
        });
        if (!item) {
            throw new common_1.NotFoundException('Equipment item not found');
        }
        return item;
    }
    async updateItem(id, dto, userId, ipAddress) {
        const item = await this.prisma.equipmentItem.findUnique({ where: { id } });
        if (!item) {
            throw new common_1.NotFoundException('Equipment item not found');
        }
        if (dto.categoryId) {
            const category = await this.prisma.equipmentCategory.findUnique({
                where: { id: dto.categoryId },
            });
            if (!category) {
                throw new common_1.BadRequestException('Invalid category');
            }
        }
        if (dto.serialNumber && dto.serialNumber !== item.serialNumber) {
            const existing = await this.prisma.equipmentItem.findUnique({
                where: { serialNumber: dto.serialNumber },
            });
            if (existing) {
                throw new common_1.ConflictException('Serial number already exists');
            }
        }
        if (dto.barcode && dto.barcode !== item.barcode) {
            const existing = await this.prisma.equipmentItem.findUnique({
                where: { barcode: dto.barcode },
            });
            if (existing) {
                throw new common_1.ConflictException('Barcode already exists');
            }
        }
        const updated = await this.prisma.equipmentItem.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.categoryId && { categoryId: dto.categoryId }),
                ...(dto.serialNumber !== undefined && {
                    serialNumber: dto.serialNumber,
                }),
                ...(dto.barcode !== undefined && { barcode: dto.barcode }),
                ...(dto.purchaseDate && { purchaseDate: new Date(dto.purchaseDate) }),
                ...(dto.purchasePrice !== undefined && {
                    purchasePrice: dto.purchasePrice,
                }),
                ...(dto.quantity !== undefined && { quantity: dto.quantity }),
                ...(dto.unit !== undefined && { unit: dto.unit }),
                ...(dto.notes !== undefined && { notes: dto.notes }),
                ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
            },
            include: {
                category: true,
            },
        });
        await this.actionLogService.log({
            userId,
            action: 'EQUIPMENT_ITEM_UPDATED',
            entityType: 'EquipmentItem',
            entityId: id,
            details: { changes: dto },
            ipAddress,
        });
        return updated;
    }
    async updateItemStatus(id, dto, userId, ipAddress) {
        const item = await this.prisma.equipmentItem.findUnique({ where: { id } });
        if (!item) {
            throw new common_1.NotFoundException('Equipment item not found');
        }
        const previousStatus = item.currentStatus;
        const updated = await this.prisma.equipmentItem.update({
            where: { id },
            data: { currentStatus: dto.status },
            include: {
                category: true,
            },
        });
        await this.prisma.equipmentStatusHistory.create({
            data: {
                equipmentId: id,
                previousStatus: previousStatus,
                newStatus: dto.status,
                reason: dto.reason,
                changedBy: userId,
            },
        });
        await this.actionLogService.log({
            userId,
            action: 'EQUIPMENT_STATUS_CHANGED',
            entityType: 'EquipmentItem',
            entityId: id,
            details: {
                previousStatus,
                newStatus: dto.status,
                reason: dto.reason,
            },
            ipAddress,
        });
        return updated;
    }
    async deleteItem(id, userId, ipAddress) {
        const item = await this.prisma.equipmentItem.findUnique({
            where: { id },
            include: {
                bookings: {
                    where: { status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_OUT'] } },
                },
            },
        });
        if (!item) {
            throw new common_1.NotFoundException('Equipment item not found');
        }
        if (item.bookings.length > 0) {
            throw new common_1.BadRequestException('Cannot delete equipment with active bookings');
        }
        await this.prisma.equipmentItem.delete({ where: { id } });
        await this.actionLogService.log({
            userId,
            action: 'EQUIPMENT_ITEM_DELETED',
            entityType: 'EquipmentItem',
            entityId: id,
            details: { name: item.name },
            ipAddress,
        });
        return { message: 'Equipment item deleted successfully' };
    }
    async checkAvailability(equipmentIds, startDate, endDate, excludeEventId) {
        const unavailableItems = await this.prisma.equipmentItem.findMany({
            where: {
                id: { in: equipmentIds },
                OR: [
                    {
                        currentStatus: {
                            in: ['DAMAGED', 'UNDER_REPAIR', 'LOST', 'RETIRED'],
                        },
                    },
                    {
                        bookings: {
                            some: {
                                status: { in: ['CONFIRMED', 'CHECKED_OUT'] },
                                ...(excludeEventId && { eventId: { not: excludeEventId } }),
                                event: {
                                    OR: [
                                        {
                                            startDate: { lte: endDate },
                                            endDate: { gte: startDate },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                currentStatus: true,
            },
        });
        const availableIds = equipmentIds.filter((id) => !unavailableItems.find((item) => item.id === id));
        return {
            available: availableIds,
            unavailable: unavailableItems,
        };
    }
    async getStatistics() {
        const [totalCount, byStatus, byCategory] = await Promise.all([
            this.prisma.equipmentItem.count(),
            this.prisma.equipmentItem.groupBy({
                by: ['currentStatus'],
                _count: true,
            }),
            this.prisma.equipmentItem.groupBy({
                by: ['categoryId'],
                _count: true,
            }),
        ]);
        const categories = await this.prisma.equipmentCategory.findMany({
            select: { id: true, name: true },
        });
        const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
        return {
            totalCount,
            byStatus: byStatus.map((s) => ({
                status: s.currentStatus,
                count: s._count,
            })),
            byCategory: byCategory.map((c) => ({
                categoryId: c.categoryId,
                categoryName: categoryMap.get(c.categoryId),
                count: c._count,
            })),
        };
    }
};
exports.EquipmentService = EquipmentService;
exports.EquipmentService = EquipmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        action_log_service_1.ActionLogService])
], EquipmentService);
//# sourceMappingURL=equipment.service.js.map