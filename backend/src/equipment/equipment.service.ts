import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEquipmentCategoryDto,
  UpdateEquipmentCategoryDto,
  CreateEquipmentItemDto,
  UpdateEquipmentItemDto,
  UpdateEquipmentStatusDto,
} from './dto/equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  // ==================== CATEGORIES ====================

  async createCategory(dto: CreateEquipmentCategoryDto, userId: string, ipAddress?: string) {
    const existing = await this.prisma.equipmentCategory.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Category "${dto.name}" already exists`);

    const category = await this.prisma.equipmentCategory.create({
      data: { name: dto.name, description: dto.description },
      include: { _count: { select: { items: true } } },
    });

    await this.logAction(userId, 'CATEGORY_CREATED', 'EquipmentCategory', category.id, { name: dto.name }, ipAddress);
    return category;
  }

  async findAllCategories() {
    return this.prisma.equipmentCategory.findMany({
      include: {
        _count: { select: { items: true } },
        items: { select: { id: true, currentStatus: true, purchasePrice: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findCategoryById(id: string) {
    const category = await this.prisma.equipmentCategory.findUnique({
      where: { id },
      include: {
        items: { include: { category: true }, orderBy: { name: 'asc' } },
        _count: { select: { items: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async updateCategory(id: string, dto: UpdateEquipmentCategoryDto, userId: string, ipAddress?: string) {
    const category = await this.prisma.equipmentCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    if (dto.name && dto.name !== category.name) {
      const dup = await this.prisma.equipmentCategory.findUnique({ where: { name: dto.name } });
      if (dup) throw new ConflictException(`Category "${dto.name}" already exists`);
    }

    const updated = await this.prisma.equipmentCategory.update({
      where: { id },
      data: { ...(dto.name && { name: dto.name }), ...(dto.description !== undefined && { description: dto.description }) },
      include: { _count: { select: { items: true } } },
    });

    await this.logAction(userId, 'CATEGORY_UPDATED', 'EquipmentCategory', id, dto, ipAddress);
    return updated;
  }

  async deleteCategory(id: string, userId: string, ipAddress?: string) {
    const category = await this.prisma.equipmentCategory.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } },
    });
    if (!category) throw new NotFoundException('Category not found');
    if (category._count.items > 0) {
      throw new BadRequestException(`Cannot delete category with ${category._count.items} items`);
    }
    await this.prisma.equipmentCategory.delete({ where: { id } });
    await this.logAction(userId, 'CATEGORY_DELETED', 'EquipmentCategory', id, { name: category.name }, ipAddress);
    return { message: 'Category deleted' };
  }

  // ==================== EQUIPMENT ITEMS (Individual units) ====================

  async createItem(dto: CreateEquipmentItemDto, userId: string, ipAddress?: string) {
    const category = await this.prisma.equipmentCategory.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new BadRequestException('Category not found');

    if (dto.serialNumber) {
      const dup = await this.prisma.equipmentItem.findUnique({ where: { serialNumber: dto.serialNumber } });
      if (dup) throw new ConflictException('Serial number already exists');
    }
    if (dto.barcode) {
      const dup = await this.prisma.equipmentItem.findUnique({ where: { barcode: dto.barcode } });
      if (dup) throw new ConflictException('Barcode already exists');
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
        notes: dto.notes,
        imageUrl: dto.imageUrl,
        currentStatus: 'AVAILABLE',
      },
      include: { category: true },
    });

    await this.prisma.equipmentStatusHistory.create({
      data: { equipmentId: item.id, newStatus: 'AVAILABLE', reason: 'Item created', changedBy: userId },
    });

    await this.logAction(userId, 'EQUIPMENT_CREATED', 'EquipmentItem', item.id, { name: dto.name, category: category.name }, ipAddress);
    return item;
  }

  async findAllItems(params: { skip?: number; take?: number; search?: string; categoryId?: string; status?: string }) {
    const { skip = 0, take = 50, search, categoryId, status } = params;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { serialNumber: { contains: search } },
        { barcode: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (status) where.currentStatus = status;

    const [items, total] = await Promise.all([
      this.prisma.equipmentItem.findMany({
        where, skip, take,
        orderBy: { name: 'asc' },
        include: { category: { select: { id: true, name: true } } },
      }),
      this.prisma.equipmentItem.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async findItemById(id: string) {
    const item = await this.prisma.equipmentItem.findUnique({
      where: { id },
      include: {
        category: true,
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
        bookings: {
          include: { event: { select: { id: true, name: true, startDate: true, endDate: true, status: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        maintenanceTickets: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!item) throw new NotFoundException('Equipment item not found');
    return item;
  }

  async findItemByBarcode(barcode: string) {
    const item = await this.prisma.equipmentItem.findUnique({
      where: { barcode },
      include: { category: true },
    });
    if (!item) throw new NotFoundException('No equipment found with this barcode');
    return item;
  }

  async updateItem(id: string, dto: UpdateEquipmentItemDto, userId: string, ipAddress?: string) {
    const item = await this.prisma.equipmentItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Equipment item not found');

    if (dto.serialNumber && dto.serialNumber !== item.serialNumber) {
      const dup = await this.prisma.equipmentItem.findUnique({ where: { serialNumber: dto.serialNumber } });
      if (dup) throw new ConflictException('Serial number already exists');
    }
    if (dto.barcode && dto.barcode !== item.barcode) {
      const dup = await this.prisma.equipmentItem.findUnique({ where: { barcode: dto.barcode } });
      if (dup) throw new ConflictException('Barcode already exists');
    }

    const updated = await this.prisma.equipmentItem.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.serialNumber !== undefined && { serialNumber: dto.serialNumber }),
        ...(dto.barcode !== undefined && { barcode: dto.barcode }),
        ...(dto.purchaseDate !== undefined && { purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null }),
        ...(dto.purchasePrice !== undefined && { purchasePrice: dto.purchasePrice }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      },
      include: { category: true },
    });

    await this.logAction(userId, 'EQUIPMENT_UPDATED', 'EquipmentItem', id, dto, ipAddress);
    return updated;
  }

  async updateItemStatus(id: string, dto: UpdateEquipmentStatusDto, userId: string, ipAddress?: string) {
    const item = await this.prisma.equipmentItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Equipment item not found');

    const previousStatus = item.currentStatus;

    const updated = await this.prisma.equipmentItem.update({
      where: { id },
      data: { currentStatus: dto.status },
      include: { category: true },
    });

    await this.prisma.equipmentStatusHistory.create({
      data: {
        equipmentId: id,
        previousStatus: previousStatus as any,
        newStatus: dto.status,
        reason: dto.reason,
        changedBy: userId,
      },
    });

    await this.logAction(userId, 'EQUIPMENT_STATUS_CHANGED', 'EquipmentItem', id, {
      previousStatus, newStatus: dto.status, reason: dto.reason,
    }, ipAddress);

    return updated;
  }

  async deleteItem(id: string, userId: string, ipAddress?: string) {
    const item = await this.prisma.equipmentItem.findUnique({
      where: { id },
      include: { bookings: { where: { status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_OUT'] } } } },
    });
    if (!item) throw new NotFoundException('Equipment item not found');
    if (item.bookings.length > 0) throw new BadRequestException('Cannot delete equipment with active bookings');

    await this.prisma.equipmentItem.delete({ where: { id } });
    await this.logAction(userId, 'EQUIPMENT_DELETED', 'EquipmentItem', id, { name: item.name }, ipAddress);
    return { message: 'Equipment item deleted' };
  }

  // ==================== AVAILABILITY ====================

  async getAvailableItems(startDate: Date, endDate: Date, categoryId?: string, excludeEventId?: string) {
    const where: any = { currentStatus: 'AVAILABLE' };
    if (categoryId) where.categoryId = categoryId;

    const items = await this.prisma.equipmentItem.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });

    const bookingWhere: any = {
      status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_OUT'] },
      OR: [
        { reservedFrom: { lte: endDate }, reservedUntil: { gte: startDate } },
        { reservedFrom: null, event: { startDate: { lte: endDate }, endDate: { gte: startDate } } },
      ],
    };
    if (excludeEventId) bookingWhere.eventId = { not: excludeEventId };

    const bookedItems = await this.prisma.eventEquipmentBooking.findMany({
      where: bookingWhere,
      select: { equipmentId: true },
    });

    const bookedIds = new Set(bookedItems.map((b) => b.equipmentId));
    return items.filter((item) => !bookedIds.has(item.id));
  }

  async checkAvailability(equipmentIds: string[], startDate: Date, endDate: Date, excludeEventId?: string) {
    return Promise.all(
      equipmentIds.map(async (equipmentId) => {
        const item = await this.prisma.equipmentItem.findUnique({
          where: { id: equipmentId },
          select: { id: true, name: true, currentStatus: true },
        });
        if (!item) return { equipmentId, name: 'Unknown', available: false, reason: 'Not found' };
        if (item.currentStatus !== 'AVAILABLE') {
          return { equipmentId, name: item.name, available: false, reason: `Status: ${item.currentStatus}` };
        }

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
        return { equipmentId, name: item.name, available: !conflict, reason: conflict ? 'Booked for another event' : undefined };
      }),
    );
  }

  // ==================== STATISTICS ====================

  async getStatistics() {
    const [totalItems, totalCategories, byStatus, totalValue, recentBookings, upcomingBookings] = await Promise.all([
      this.prisma.equipmentItem.count(),
      this.prisma.equipmentCategory.count(),
      this.prisma.equipmentItem.groupBy({ by: ['currentStatus'], _count: true }),
      this.prisma.equipmentItem.aggregate({ _sum: { purchasePrice: true } }),
      this.prisma.eventEquipmentBooking.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.eventEquipmentBooking.count({
        where: {
          status: 'CONFIRMED',
          reservedFrom: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const s of byStatus) statusMap[s.currentStatus] = s._count;

    const categoryBreakdown = await this.prisma.equipmentCategory.findMany({
      include: {
        items: { select: { currentStatus: true, purchasePrice: true } },
        _count: { select: { items: true } },
      },
      orderBy: { name: 'asc' },
    });

    const categories = categoryBreakdown.map((cat) => ({
      id: cat.id,
      name: cat.name,
      totalItems: cat._count.items,
      available: cat.items.filter((i) => i.currentStatus === 'AVAILABLE').length,
      reserved: cat.items.filter((i) => i.currentStatus === 'RESERVED').length,
      inUse: cat.items.filter((i) => i.currentStatus === 'IN_USE').length,
      damaged: cat.items.filter((i) => ['DAMAGED', 'UNDER_REPAIR'].includes(i.currentStatus)).length,
      totalValue: cat.items.reduce((s, i) => s + Number(i.purchasePrice || 0), 0),
    }));

    return {
      totalItems,
      totalCategories,
      totalAvailable: statusMap['AVAILABLE'] || 0,
      totalReserved: statusMap['RESERVED'] || 0,
      totalInUse: statusMap['IN_USE'] || 0,
      totalDamaged: (statusMap['DAMAGED'] || 0) + (statusMap['UNDER_REPAIR'] || 0),
      totalRetired: (statusMap['RETIRED'] || 0) + (statusMap['LOST'] || 0),
      totalInventoryValue: Number(totalValue._sum.purchasePrice || 0),
      recentBookings,
      upcomingBookings,
      categories,
    };
  }

  private async logAction(userId: string, action: string, entityType: string, entityId: string, details: any, ipAddress?: string) {
    try {
      await this.prisma.actionLog.create({ data: { userId, action, entityType, entityId, details, ipAddress } });
    } catch (error) {
      console.error('Failed to create action log:', error);
    }
  }
}
