import { PrismaService } from '../prisma/prisma.service';
import { ActionLogService } from '../action-log/action-log.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
export declare class ClientsService {
    private prisma;
    private actionLogService;
    constructor(prisma: PrismaService, actionLogService: ActionLogService);
    create(dto: CreateClientDto, userId: string, ipAddress?: string): Promise<{
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
    }>;
    findAll(params: {
        skip?: number;
        take?: number;
        search?: string;
        city?: string;
        isActive?: boolean;
    }): Promise<{
        items: ({
            _count: {
                events: number;
                invoices: number;
            };
        } & {
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
        })[];
        total: number;
        skip: number;
        take: number;
    }>;
    findOne(id: string): Promise<{
        events: {
            id: string;
            name: string;
            eventType: string;
            venue: string;
            startDate: Date;
            endDate: Date;
            status: import("@prisma/client").$Enums.EventStatus;
        }[];
        quotes: {
            id: string;
            status: import("@prisma/client").$Enums.QuoteStatus;
            quoteNumber: string;
            issueDate: Date;
            validUntil: Date;
            total: import("@prisma/client/runtime/library").Decimal;
        }[];
        invoices: {
            id: string;
            status: import("@prisma/client").$Enums.InvoiceStatus;
            issueDate: Date;
            total: import("@prisma/client/runtime/library").Decimal;
            invoiceNumber: string;
            dueDate: Date;
            amountPaid: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
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
    }>;
    update(id: string, dto: UpdateClientDto, userId: string, ipAddress?: string): Promise<{
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
    }>;
    deactivate(id: string, userId: string, ipAddress?: string): Promise<{
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
    }>;
    getHistory(id: string): Promise<{
        events: {
            id: string;
            name: string;
            eventType: string;
            venue: string;
            startDate: Date;
            endDate: Date;
            status: import("@prisma/client").$Enums.EventStatus;
        }[];
        invoices: ({
            payments: {
                id: string;
                createdAt: Date;
                notes: string | null;
                amount: import("@prisma/client/runtime/library").Decimal;
                paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
                paymentDate: Date;
                referenceNumber: string | null;
                invoiceId: string;
                recordedById: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            status: import("@prisma/client").$Enums.InvoiceStatus;
            clientId: string;
            eventId: string | null;
            issueDate: Date;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            taxAmount: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
            terms: string | null;
            pdfUrl: string | null;
            createdById: string;
            invoiceNumber: string;
            dueDate: Date;
            amountPaid: import("@prisma/client/runtime/library").Decimal;
        })[];
        payments: ({
            invoice: {
                invoiceNumber: string;
            };
        } & {
            id: string;
            createdAt: Date;
            notes: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            paymentDate: Date;
            referenceNumber: string | null;
            invoiceId: string;
            recordedById: string;
        })[];
        summary: {
            totalEvents: number;
            totalBilled: number;
            totalPaid: number;
            outstandingBalance: number;
        };
    }>;
}
