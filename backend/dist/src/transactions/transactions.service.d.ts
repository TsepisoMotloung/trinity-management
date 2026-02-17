import { PrismaService } from '../prisma/prisma.service';
import { ActionLogService } from '../action-log/action-log.service';
import { CreateCheckOutDto, CreateCheckInDto } from './dto/transactions.dto';
export declare class TransactionsService {
    private prisma;
    private actionLogService;
    constructor(prisma: PrismaService, actionLogService: ActionLogService);
    createCheckOut(dto: CreateCheckOutDto, userId: string): Promise<{
        event: {
            id: string;
            name: string;
        };
        checkOut: {
            items: ({
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
                    purchasePrice: import("@prisma/client-runtime-utils").Decimal | null;
                    currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
                    quantity: number;
                    unit: string;
                    notes: string | null;
                    imageUrl: string | null;
                    categoryId: string;
                };
            } & {
                id: string;
                quantity: number;
                notes: string | null;
                equipmentId: string;
                checkOutTransactionId: string;
                condition: string | null;
            })[];
            event: {
                id: string;
                name: string;
            };
            checkedOutByUser: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            notes: string | null;
            eventId: string;
            checkedOutBy: string;
            checkedOutAt: Date;
        };
        totalItems: number;
    }>;
    createCheckIn(dto: CreateCheckInDto, userId: string): Promise<{
        event: {
            id: string;
            name: string;
        };
        checkIn: {
            items: ({
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
                    purchasePrice: import("@prisma/client-runtime-utils").Decimal | null;
                    currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
                    quantity: number;
                    unit: string;
                    notes: string | null;
                    imageUrl: string | null;
                    categoryId: string;
                };
            } & {
                id: string;
                quantity: number;
                equipmentId: string;
                condition: import("@prisma/client").$Enums.ItemCondition;
                checkInTransactionId: string;
                returnedQuantity: number;
                damageNotes: string | null;
                isShortage: boolean;
            })[];
            event: {
                id: string;
                name: string;
            };
            checkedInByUser: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            notes: string | null;
            eventId: string;
            checkedInBy: string;
            checkedInAt: Date;
            isReconciled: boolean;
        };
        totalItems: number;
        itemsWithIssues: number;
        allReturned: boolean;
    }>;
    getEventTransactions(eventId: string): Promise<{
        event: {
            id: string;
            name: string;
            status: import("@prisma/client").$Enums.EventStatus;
        };
        checkOuts: ({
            items: ({
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
                    purchasePrice: import("@prisma/client-runtime-utils").Decimal | null;
                    currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
                    quantity: number;
                    unit: string;
                    notes: string | null;
                    imageUrl: string | null;
                    categoryId: string;
                };
            } & {
                id: string;
                quantity: number;
                notes: string | null;
                equipmentId: string;
                checkOutTransactionId: string;
                condition: string | null;
            })[];
            checkedOutByUser: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            notes: string | null;
            eventId: string;
            checkedOutBy: string;
            checkedOutAt: Date;
        })[];
        checkIns: ({
            items: ({
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
                    purchasePrice: import("@prisma/client-runtime-utils").Decimal | null;
                    currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
                    quantity: number;
                    unit: string;
                    notes: string | null;
                    imageUrl: string | null;
                    categoryId: string;
                };
            } & {
                id: string;
                quantity: number;
                equipmentId: string;
                condition: import("@prisma/client").$Enums.ItemCondition;
                checkInTransactionId: string;
                returnedQuantity: number;
                damageNotes: string | null;
                isShortage: boolean;
            })[];
            checkedInByUser: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            notes: string | null;
            eventId: string;
            checkedInBy: string;
            checkedInAt: Date;
            isReconciled: boolean;
        })[];
        summary: {
            totalBooked: number;
            checkedOut: number;
            checkedIn: number;
        };
    }>;
    getEquipmentTransactionHistory(equipmentId: string, params: {
        skip?: number;
        take?: number;
    }): Promise<{
        equipmentItem: {
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
        };
        checkOutHistory: ({
            checkOutTransaction: {
                event: {
                    id: string;
                    name: string;
                    startDate: Date;
                    endDate: Date;
                };
                checkedOutByUser: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                };
            } & {
                id: string;
                createdAt: Date;
                notes: string | null;
                eventId: string;
                checkedOutBy: string;
                checkedOutAt: Date;
            };
        } & {
            id: string;
            quantity: number;
            notes: string | null;
            equipmentId: string;
            checkOutTransactionId: string;
            condition: string | null;
        })[];
        checkInHistory: ({
            checkInTransaction: {
                event: {
                    id: string;
                    name: string;
                    startDate: Date;
                    endDate: Date;
                };
                checkedInByUser: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                };
            } & {
                id: string;
                createdAt: Date;
                notes: string | null;
                eventId: string;
                checkedInBy: string;
                checkedInAt: Date;
                isReconciled: boolean;
            };
        } & {
            id: string;
            quantity: number;
            equipmentId: string;
            condition: import("@prisma/client").$Enums.ItemCondition;
            checkInTransactionId: string;
            returnedQuantity: number;
            damageNotes: string | null;
            isShortage: boolean;
        })[];
        skip: number;
        take: number;
    }>;
    getPendingCheckIns(): Promise<{
        totalPending: number;
        byEvent: {
            event: any;
            items: any[];
        }[];
    }>;
    getOverdueCheckIns(): Promise<{
        totalOverdue: number;
        items: {
            daysOverdue: number;
            event: {
                id: string;
                name: string;
                startDate: Date;
                endDate: Date;
                status: import("@prisma/client").$Enums.EventStatus;
            };
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
                purchasePrice: import("@prisma/client-runtime-utils").Decimal | null;
                currentStatus: import("@prisma/client").$Enums.EquipmentStatus;
                quantity: number;
                unit: string;
                notes: string | null;
                imageUrl: string | null;
                categoryId: string;
            };
            id: string;
            createdAt: Date;
            updatedAt: Date;
            quantity: number;
            notes: string | null;
            status: import("@prisma/client").$Enums.BookingStatus;
            eventId: string;
            equipmentId: string;
        }[];
    }>;
}
