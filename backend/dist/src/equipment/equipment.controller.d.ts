import * as express from 'express';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentCategoryDto, UpdateEquipmentCategoryDto, CreateEquipmentItemDto, UpdateEquipmentItemDto, UpdateEquipmentStatusDto, EquipmentStatus } from './dto/equipment.dto';
export declare class EquipmentController {
    private readonly equipmentService;
    constructor(equipmentService: EquipmentService);
    createCategory(dto: CreateEquipmentCategoryDto, userId: string, req: express.Request): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }>;
    findAllCategories(): Promise<({
        _count: {
            items: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    })[]>;
    findCategoryById(id: string): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            serialNumber: string | null;
            barcode: string | null;
            purchaseDate: Date | null;
            purchasePrice: import("@prisma/client-runtime-utils").Decimal | null;
            currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
            quantity: number;
            unit: string;
            notes: string | null;
            imageUrl: string | null;
            categoryId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }>;
    updateCategory(id: string, dto: UpdateEquipmentCategoryDto, userId: string, req: express.Request): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }>;
    deleteCategory(id: string, userId: string, req: express.Request): Promise<{
        message: string;
    }>;
    createItem(dto: CreateEquipmentItemDto, userId: string, req: express.Request): Promise<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        serialNumber: string | null;
        barcode: string | null;
        purchaseDate: Date | null;
        purchasePrice: import("@prisma/client-runtime-utils").Decimal | null;
        currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
        quantity: number;
        unit: string;
        notes: string | null;
        imageUrl: string | null;
        categoryId: string;
    }>;
    findAllItems(skip?: string, take?: string, search?: string, categoryId?: string, status?: EquipmentStatus): Promise<{
        items: ({
            category: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            serialNumber: string | null;
            barcode: string | null;
            purchaseDate: Date | null;
            purchasePrice: import("@prisma/client-runtime-utils").Decimal | null;
            currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
            quantity: number;
            unit: string;
            notes: string | null;
            imageUrl: string | null;
            categoryId: string;
        })[];
        total: number;
        skip: number;
        take: number;
    }>;
    findItemById(id: string): Promise<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        };
        statusHistory: {
            id: string;
            createdAt: Date;
            equipmentId: string;
            reason: string | null;
            previousStatus: import("@prisma/client").$Enums.EquipmentStatus | null;
            newStatus: import("@prisma/client").$Enums.EquipmentStatus;
            changedBy: string | null;
        }[];
        bookings: ({
            event: {
                id: string;
                name: string;
                startDate: Date;
                endDate: Date;
                status: import("@prisma/client").$Enums.EventStatus;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            quantity: number;
            notes: string | null;
            status: import("@prisma/client").$Enums.BookingStatus;
            eventId: string;
            equipmentId: string;
        })[];
        maintenanceTickets: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            status: import("@prisma/client").$Enums.MaintenanceStatus;
            equipmentId: string;
            createdById: string;
            title: string;
            priority: import("@prisma/client").$Enums.MaintenancePriority;
            reportedIssue: string;
            diagnosis: string | null;
            repairNotes: string | null;
            cost: import("@prisma/client-runtime-utils").Decimal | null;
            vendorName: string | null;
            startedAt: Date | null;
            completedAt: Date | null;
            returnToServiceAt: Date | null;
            assignedToId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        serialNumber: string | null;
        barcode: string | null;
        purchaseDate: Date | null;
        purchasePrice: import("@prisma/client-runtime-utils").Decimal | null;
        currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
        quantity: number;
        unit: string;
        notes: string | null;
        imageUrl: string | null;
        categoryId: string;
    }>;
    findItemByBarcode(barcode: string): Promise<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        serialNumber: string | null;
        barcode: string | null;
        purchaseDate: Date | null;
        purchasePrice: import("@prisma/client-runtime-utils").Decimal | null;
        currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
        quantity: number;
        unit: string;
        notes: string | null;
        imageUrl: string | null;
        categoryId: string;
    }>;
    updateItem(id: string, dto: UpdateEquipmentItemDto, userId: string, req: express.Request): Promise<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        serialNumber: string | null;
        barcode: string | null;
        purchaseDate: Date | null;
        purchasePrice: import("@prisma/client-runtime-utils").Decimal | null;
        currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
        quantity: number;
        unit: string;
        notes: string | null;
        imageUrl: string | null;
        categoryId: string;
    }>;
    updateItemStatus(id: string, dto: UpdateEquipmentStatusDto, userId: string, req: express.Request): Promise<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        serialNumber: string | null;
        barcode: string | null;
        purchaseDate: Date | null;
        purchasePrice: import("@prisma/client-runtime-utils").Decimal | null;
        currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
        quantity: number;
        unit: string;
        notes: string | null;
        imageUrl: string | null;
        categoryId: string;
    }>;
    deleteItem(id: string, userId: string, req: express.Request): Promise<{
        message: string;
    }>;
    checkAvailability(body: {
        equipmentIds: string[];
        startDate: string;
        endDate: string;
        excludeEventId?: string;
    }): Promise<{
        available: string[];
        unavailable: {
            id: string;
            name: string;
            currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
        }[];
    }>;
    getStatistics(): Promise<{
        totalCount: number;
        byStatus: {
            status: import("@prisma/client").$Enums.EquipmentStatus;
            count: number;
        }[];
        byCategory: {
            categoryId: string;
            categoryName: string | undefined;
            count: number;
        }[];
    }>;
}
