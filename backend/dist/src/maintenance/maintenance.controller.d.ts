import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceTicketDto, UpdateMaintenanceTicketDto, UpdateMaintenanceStatusDto, CompleteMaintenanceDto } from './dto/maintenance.dto';
export declare class MaintenanceController {
    private readonly maintenanceService;
    constructor(maintenanceService: MaintenanceService);
    create(dto: CreateMaintenanceTicketDto, userId: string): Promise<{
        equipment: {
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
            purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
            currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
            quantity: number;
            unit: string;
            notes: string | null;
            imageUrl: string | null;
            categoryId: string;
        };
        createdBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
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
        cost: import("@prisma/client/runtime/library").Decimal | null;
        vendorName: string | null;
        startedAt: Date | null;
        completedAt: Date | null;
        returnToServiceAt: Date | null;
        assignedToId: string | null;
    }>;
    findAll(skip?: string, take?: string, status?: string, priority?: string, equipmentId?: string, assignedToId?: string, search?: string): Promise<{
        tickets: ({
            equipment: {
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
                purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
                currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
                quantity: number;
                unit: string;
                notes: string | null;
                imageUrl: string | null;
                categoryId: string;
            };
            createdBy: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            assignedTo: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
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
            cost: import("@prisma/client/runtime/library").Decimal | null;
            vendorName: string | null;
            startedAt: Date | null;
            completedAt: Date | null;
            returnToServiceAt: Date | null;
            assignedToId: string | null;
        })[];
        total: number;
        skip: number;
        take: number;
    }>;
    getStatistics(): Promise<{
        byStatus: Record<string, number>;
        byPriority: Record<string, number>;
        openTickets: number;
        inProgressTickets: number;
        recentTickets: ({
            equipment: {
                id: string;
                name: string;
            };
        } & {
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
            cost: import("@prisma/client/runtime/library").Decimal | null;
            vendorName: string | null;
            startedAt: Date | null;
            completedAt: Date | null;
            returnToServiceAt: Date | null;
            assignedToId: string | null;
        })[];
    }>;
    findOne(id: string): Promise<{
        equipment: {
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
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            serialNumber: string | null;
            barcode: string | null;
            purchaseDate: Date | null;
            purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
            currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
            quantity: number;
            unit: string;
            notes: string | null;
            imageUrl: string | null;
            categoryId: string;
        };
        createdBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        assignedTo: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
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
        cost: import("@prisma/client/runtime/library").Decimal | null;
        vendorName: string | null;
        startedAt: Date | null;
        completedAt: Date | null;
        returnToServiceAt: Date | null;
        assignedToId: string | null;
    }>;
    update(id: string, dto: UpdateMaintenanceTicketDto, userId: string): Promise<{
        equipment: {
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
            purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
            currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
            quantity: number;
            unit: string;
            notes: string | null;
            imageUrl: string | null;
            categoryId: string;
        };
        createdBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        assignedTo: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
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
        cost: import("@prisma/client/runtime/library").Decimal | null;
        vendorName: string | null;
        startedAt: Date | null;
        completedAt: Date | null;
        returnToServiceAt: Date | null;
        assignedToId: string | null;
    }>;
    updateStatus(id: string, dto: UpdateMaintenanceStatusDto, userId: string): Promise<{
        equipment: {
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
            purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
            currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
            quantity: number;
            unit: string;
            notes: string | null;
            imageUrl: string | null;
            categoryId: string;
        };
    } & {
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
        cost: import("@prisma/client/runtime/library").Decimal | null;
        vendorName: string | null;
        startedAt: Date | null;
        completedAt: Date | null;
        returnToServiceAt: Date | null;
        assignedToId: string | null;
    }>;
    complete(id: string, dto: CompleteMaintenanceDto, userId: string): Promise<{
        equipment: {
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
            purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
            currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
            quantity: number;
            unit: string;
            notes: string | null;
            imageUrl: string | null;
            categoryId: string;
        };
    } & {
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
        cost: import("@prisma/client/runtime/library").Decimal | null;
        vendorName: string | null;
        startedAt: Date | null;
        completedAt: Date | null;
        returnToServiceAt: Date | null;
        assignedToId: string | null;
    }>;
    cancel(id: string, userId: string): Promise<{
        equipment: {
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
            purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
            currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
            quantity: number;
            unit: string;
            notes: string | null;
            imageUrl: string | null;
            categoryId: string;
        };
    } & {
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
        cost: import("@prisma/client/runtime/library").Decimal | null;
        vendorName: string | null;
        startedAt: Date | null;
        completedAt: Date | null;
        returnToServiceAt: Date | null;
        assignedToId: string | null;
    }>;
}
