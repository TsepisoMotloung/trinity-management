import { PrismaService } from '../prisma/prisma.service';
import { ActionLogService } from '../action-log/action-log.service';
import { QuoteStatus, InvoiceStatus } from '@prisma/client';
import { CreateQuoteDto, UpdateQuoteDto, UpdateQuoteStatusDto, CreateInvoiceDto, UpdateInvoiceDto, UpdateInvoiceStatusDto, CreatePaymentDto } from './dto/finance.dto';
export declare class FinanceService {
    private prisma;
    private actionLogService;
    constructor(prisma: PrismaService, actionLogService: ActionLogService);
    private generateQuoteNumber;
    private generateInvoiceNumber;
    createQuote(dto: CreateQuoteDto, userId: string): Promise<{
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
        event: {
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
        } | null;
        createdBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        lineItems: {
            id: string;
            description: string;
            quantity: number;
            total: import("@prisma/client-runtime-utils").Decimal;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            quoteId: string;
        }[];
    } & {
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
    }>;
    findAllQuotes(params: {
        skip?: number;
        take?: number;
        status?: QuoteStatus;
        clientId?: string;
        search?: string;
    }): Promise<{
        quotes: ({
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
            event: {
                id: string;
                name: string;
            } | null;
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
        })[];
        total: number;
        skip: number;
        take: number;
    }>;
    findOneQuote(id: string): Promise<{
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
        event: {
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
        } | null;
        createdBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        lineItems: {
            id: string;
            description: string;
            quantity: number;
            total: import("@prisma/client-runtime-utils").Decimal;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            quoteId: string;
        }[];
    } & {
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
    }>;
    updateQuote(id: string, dto: UpdateQuoteDto, userId: string): Promise<{
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
        event: {
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
        } | null;
        createdBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        lineItems: {
            id: string;
            description: string;
            quantity: number;
            total: import("@prisma/client-runtime-utils").Decimal;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            quoteId: string;
        }[];
    } & {
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
    }>;
    updateQuoteStatus(id: string, dto: UpdateQuoteStatusDto, userId: string): Promise<{
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
        event: {
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
        } | null;
    } & {
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
    }>;
    deleteQuote(id: string, userId: string): Promise<void>;
    createInvoice(dto: CreateInvoiceDto, userId: string): Promise<{
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
        event: {
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
        } | null;
        createdBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        lineItems: {
            id: string;
            description: string;
            quantity: number;
            total: import("@prisma/client-runtime-utils").Decimal;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            invoiceId: string;
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
    }>;
    findAllInvoices(params: {
        skip?: number;
        take?: number;
        status?: InvoiceStatus;
        clientId?: string;
        search?: string;
    }): Promise<{
        invoices: {
            amountPaid: number;
            balanceDue: number;
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
            event: {
                id: string;
                name: string;
            } | null;
            createdBy: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
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
        }[];
        total: number;
        skip: number;
        take: number;
    }>;
    findOneInvoice(id: string): Promise<{
        amountPaid: number;
        balanceDue: number;
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
        event: {
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
        } | null;
        createdBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        lineItems: {
            id: string;
            description: string;
            quantity: number;
            total: import("@prisma/client-runtime-utils").Decimal;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            invoiceId: string;
        }[];
        payments: ({
            recordedBy: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
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
    }>;
    updateInvoice(id: string, dto: UpdateInvoiceDto, userId: string): Promise<{
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
        event: {
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
        } | null;
        createdBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        lineItems: {
            id: string;
            description: string;
            quantity: number;
            total: import("@prisma/client-runtime-utils").Decimal;
            unitPrice: import("@prisma/client-runtime-utils").Decimal;
            invoiceId: string;
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
    }>;
    updateInvoiceStatus(id: string, dto: UpdateInvoiceStatusDto, userId: string): Promise<{
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
        event: {
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
        } | null;
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
    }>;
    deleteInvoice(id: string, userId: string): Promise<void>;
    createPayment(dto: CreatePaymentDto, userId: string): Promise<{
        invoice: {
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
        };
        recordedBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
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
    }>;
    findAllPayments(params: {
        skip?: number;
        take?: number;
        invoiceId?: string;
        clientId?: string;
    }): Promise<{
        payments: ({
            invoice: {
                client: {
                    id: string;
                    name: string;
                };
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
            };
            recordedBy: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
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
        total: number;
        skip: number;
        take: number;
    }>;
    findOnePayment(id: string): Promise<{
        invoice: {
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
        };
        recordedBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
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
    }>;
    deletePayment(id: string, userId: string): Promise<void>;
    getFinancialSummary(params: {
        startDate?: string;
        endDate?: string;
    }): Promise<{
        totalRevenue: number;
        outstandingAmount: number;
        outstandingCount: number;
        recentPayments: ({
            invoice: {
                client: {
                    id: string;
                    name: string;
                };
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
    }>;
}
