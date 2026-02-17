import { PrismaService } from '../prisma/prisma.service';
import { ActionLogService } from '../action-log/action-log.service';
import { CreateEventDto, UpdateEventDto, BookEquipmentDto, AssignStaffDto, EventStatus } from './dto/event.dto';
export declare class EventsService {
    private prisma;
    private actionLogService;
    constructor(prisma: PrismaService, actionLogService: ActionLogService);
    create(dto: CreateEventDto, userId: string, ipAddress?: string): Promise<{
        client: {
            id: string;
            phone: string;
            name: string;
            contactPerson: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        notes: string | null;
        eventType: string;
        venue: string;
        venueAddress: string | null;
        startDate: Date;
        endDate: Date;
        setupTime: Date | null;
        status: import("@prisma/client").$Enums.EventStatus;
        requirements: string | null;
        clientId: string;
    }>;
    findAll(params: {
        skip?: number;
        take?: number;
        search?: string;
        status?: EventStatus;
        clientId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        items: ({
            client: {
                id: string;
                name: string;
                contactPerson: string | null;
            };
            _count: {
                staffAssignments: number;
                equipmentBookings: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            notes: string | null;
            eventType: string;
            venue: string;
            venueAddress: string | null;
            startDate: Date;
            endDate: Date;
            setupTime: Date | null;
            status: import("@prisma/client").$Enums.EventStatus;
            requirements: string | null;
            clientId: string;
        })[];
        total: number;
        skip: number;
        take: number;
    }>;
    findOne(id: string): Promise<{
        staffAssignments: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                phone: string | null;
            };
        } & {
            id: string;
            role: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            eventId: string;
            userId: string;
        })[];
        checkOuts: ({
            items: ({
                equipment: {
                    id: string;
                    name: string;
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
                    id: string;
                    name: string;
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
        quotes: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            status: import("@prisma/client").$Enums.QuoteStatus;
            clientId: string;
            eventId: string | null;
            quoteNumber: string;
            issueDate: Date;
            validUntil: Date;
            subtotal: import("@prisma/client-runtime-utils").Decimal;
            taxAmount: import("@prisma/client-runtime-utils").Decimal;
            discount: import("@prisma/client-runtime-utils").Decimal;
            total: import("@prisma/client-runtime-utils").Decimal;
            terms: string | null;
            pdfUrl: string | null;
            createdById: string;
        }[];
        invoices: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            status: import("@prisma/client").$Enums.InvoiceStatus;
            clientId: string;
            eventId: string | null;
            issueDate: Date;
            subtotal: import("@prisma/client-runtime-utils").Decimal;
            taxAmount: import("@prisma/client-runtime-utils").Decimal;
            discount: import("@prisma/client-runtime-utils").Decimal;
            total: import("@prisma/client-runtime-utils").Decimal;
            terms: string | null;
            pdfUrl: string | null;
            createdById: string;
            invoiceNumber: string;
            dueDate: Date;
            amountPaid: import("@prisma/client-runtime-utils").Decimal;
        }[];
        client: {
            id: string;
            email: string | null;
            phone: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            notes: string | null;
            contactPerson: string | null;
            alternatePhone: string | null;
            address: string | null;
            city: string | null;
            billingAddress: string | null;
            taxId: string | null;
        };
        equipmentBookings: ({
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
            createdAt: Date;
            updatedAt: Date;
            quantity: number;
            notes: string | null;
            status: import("@prisma/client").$Enums.BookingStatus;
            eventId: string;
            equipmentId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        notes: string | null;
        eventType: string;
        venue: string;
        venueAddress: string | null;
        startDate: Date;
        endDate: Date;
        setupTime: Date | null;
        status: import("@prisma/client").$Enums.EventStatus;
        requirements: string | null;
        clientId: string;
    }>;
    update(id: string, dto: UpdateEventDto, userId: string, ipAddress?: string): Promise<{
        client: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        notes: string | null;
        eventType: string;
        venue: string;
        venueAddress: string | null;
        startDate: Date;
        endDate: Date;
        setupTime: Date | null;
        status: import("@prisma/client").$Enums.EventStatus;
        requirements: string | null;
        clientId: string;
    }>;
    updateStatus(id: string, status: EventStatus, userId: string, ipAddress?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        notes: string | null;
        eventType: string;
        venue: string;
        venueAddress: string | null;
        startDate: Date;
        endDate: Date;
        setupTime: Date | null;
        status: import("@prisma/client").$Enums.EventStatus;
        requirements: string | null;
        clientId: string;
    }>;
    bookEquipment(eventId: string, dto: BookEquipmentDto, userId: string, ipAddress?: string): Promise<{
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
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        notes: string | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        eventId: string;
        equipmentId: string;
    }>;
    bookMultipleEquipment(eventId: string, items: BookEquipmentDto[], userId: string, ipAddress?: string): Promise<{
        success: any[];
        errors: {
            equipmentId: string;
            error: string;
        }[];
    }>;
    removeEquipmentBooking(eventId: string, bookingId: string, userId: string, ipAddress?: string): Promise<{
        message: string;
    }>;
    confirmBookings(eventId: string, userId: string, ipAddress?: string): Promise<{
        message: string;
    }>;
    assignStaff(eventId: string, dto: AssignStaffDto, userId: string, ipAddress?: string): Promise<{
        user: {
            id: string;
            firstName: string;
            lastName: string;
            phone: string | null;
        };
    } & {
        id: string;
        role: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        eventId: string;
        userId: string;
    }>;
    removeStaffAssignment(eventId: string, assignmentId: string, userId: string, ipAddress?: string): Promise<{
        message: string;
    }>;
    getCalendar(startDate: Date, endDate: Date, filters?: {
        status?: string;
        clientId?: string;
    }): Promise<({
        client: {
            id: string;
            name: string;
        };
        _count: {
            staffAssignments: number;
            equipmentBookings: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        notes: string | null;
        eventType: string;
        venue: string;
        venueAddress: string | null;
        startDate: Date;
        endDate: Date;
        setupTime: Date | null;
        status: import("@prisma/client").$Enums.EventStatus;
        requirements: string | null;
        clientId: string;
    })[]>;
    getStatistics(): Promise<{
        totalEvents: number;
        byStatus: {
            status: import("@prisma/client").$Enums.EventStatus;
            count: number;
        }[];
        thisMonth: number;
        upcoming: number;
    }>;
}
