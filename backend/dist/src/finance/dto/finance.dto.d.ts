import { QuoteStatus, InvoiceStatus, PaymentMethod } from '@prisma/client';
export declare class QuoteLineItemDto {
    description: string;
    quantity: number;
    unitPrice: number;
}
export declare class CreateQuoteDto {
    clientId: string;
    eventId?: string;
    lineItems: QuoteLineItemDto[];
    discount?: number;
    taxRate?: number;
    validUntil: string;
    notes?: string;
    terms?: string;
}
declare const UpdateQuoteDto_base: import("@nestjs/common").Type<Partial<CreateQuoteDto>>;
export declare class UpdateQuoteDto extends UpdateQuoteDto_base {
}
export declare class UpdateQuoteStatusDto {
    status: QuoteStatus;
}
export declare class InvoiceLineItemDto {
    description: string;
    quantity: number;
    unitPrice: number;
}
export declare class CreateInvoiceDto {
    clientId: string;
    eventId?: string;
    lineItems: InvoiceLineItemDto[];
    discount?: number;
    taxRate?: number;
    dueDate: string;
    notes?: string;
    terms?: string;
}
declare const UpdateInvoiceDto_base: import("@nestjs/common").Type<Partial<CreateInvoiceDto>>;
export declare class UpdateInvoiceDto extends UpdateInvoiceDto_base {
}
export declare class UpdateInvoiceStatusDto {
    status: InvoiceStatus;
}
export declare class CreatePaymentDto {
    invoiceId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    notes?: string;
    paymentDate?: string;
}
declare const UpdatePaymentDto_base: import("@nestjs/common").Type<Partial<CreatePaymentDto>>;
export declare class UpdatePaymentDto extends UpdatePaymentDto_base {
}
export {};
