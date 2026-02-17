import * as express from 'express';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
export declare class ClientsController {
    private readonly clientsService;
    constructor(clientsService: ClientsService);
    create(dto: CreateClientDto, userId: string, req: express.Request): Promise<{
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
    findAll(skip?: string, take?: string, search?: string, city?: string, isActive?: string): Promise<{
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
            total: import("@prisma/client-runtime-utils").Decimal;
        }[];
        invoices: {
            id: string;
            status: import("@prisma/client").$Enums.InvoiceStatus;
            issueDate: Date;
            total: import("@prisma/client-runtime-utils").Decimal;
            invoiceNumber: string;
            dueDate: Date;
            amountPaid: import("@prisma/client-runtime-utils").Decimal;
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
                amount: import("@prisma/client-runtime-utils").Decimal;
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
        })[];
        payments: ({
            invoice: {
                invoiceNumber: string;
            };
        } & {
            id: string;
            createdAt: Date;
            notes: string | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
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
    update(id: string, dto: UpdateClientDto, userId: string, req: express.Request): Promise<{
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
    deactivate(id: string, userId: string, req: express.Request): Promise<{
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
}
