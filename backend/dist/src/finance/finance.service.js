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
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const action_log_service_1 = require("../action-log/action-log.service");
let FinanceService = class FinanceService {
    prisma;
    actionLogService;
    constructor(prisma, actionLogService) {
        this.prisma = prisma;
        this.actionLogService = actionLogService;
    }
    async generateQuoteNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const count = await this.prisma.quote.count({
            where: {
                createdAt: {
                    gte: new Date(year, date.getMonth(), 1),
                    lt: new Date(year, date.getMonth() + 1, 1),
                },
            },
        });
        return `QT-${year}${month}-${String(count + 1).padStart(4, '0')}`;
    }
    async generateInvoiceNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const count = await this.prisma.invoice.count({
            where: {
                createdAt: {
                    gte: new Date(year, date.getMonth(), 1),
                    lt: new Date(year, date.getMonth() + 1, 1),
                },
            },
        });
        return `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
    }
    async createQuote(dto, userId) {
        const client = await this.prisma.client.findUnique({
            where: { id: dto.clientId },
        });
        if (!client) {
            throw new common_1.NotFoundException('Client not found');
        }
        const quoteNumber = await this.generateQuoteNumber();
        const subtotal = dto.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const discount = dto.discount || 0;
        const taxRate = dto.taxRate || 0;
        const taxAmount = (subtotal - discount) * (taxRate / 100);
        const total = subtotal - discount + taxAmount;
        const quote = await this.prisma.quote.create({
            data: {
                quoteNumber,
                clientId: dto.clientId,
                eventId: dto.eventId,
                createdById: userId,
                validUntil: new Date(dto.validUntil),
                subtotal,
                discount,
                taxAmount,
                total,
                status: 'DRAFT',
                notes: dto.notes,
                terms: dto.terms,
                lineItems: {
                    create: dto.lineItems.map((item) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.quantity * item.unitPrice,
                    })),
                },
            },
            include: {
                client: true,
                event: true,
                createdBy: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                lineItems: true,
            },
        });
        await this.actionLogService.log({
            userId,
            action: 'CREATE',
            entityType: 'Quote',
            entityId: quote.id,
            details: { quoteNumber, clientId: dto.clientId, total },
        });
        return quote;
    }
    async findAllQuotes(params) {
        const { skip = 0, take = 20, status, clientId, search } = params;
        const where = {};
        if (status)
            where.status = status;
        if (clientId)
            where.clientId = clientId;
        if (search) {
            where.OR = [
                { quoteNumber: { contains: search } },
                { client: { name: { contains: search } } },
            ];
        }
        const [quotes, total] = await Promise.all([
            this.prisma.quote.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    client: true,
                    event: { select: { id: true, name: true } },
                    createdBy: {
                        select: { id: true, email: true, firstName: true, lastName: true },
                    },
                },
            }),
            this.prisma.quote.count({ where }),
        ]);
        return { quotes, total, skip, take };
    }
    async findOneQuote(id) {
        const quote = await this.prisma.quote.findUnique({
            where: { id },
            include: {
                client: true,
                event: true,
                createdBy: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                lineItems: true,
            },
        });
        if (!quote) {
            throw new common_1.NotFoundException('Quote not found');
        }
        return quote;
    }
    async updateQuote(id, dto, userId) {
        const existing = await this.findOneQuote(id);
        if (existing.status !== 'DRAFT') {
            throw new common_1.BadRequestException('Only draft quotes can be edited');
        }
        let updateData = {
            notes: dto.notes,
            terms: dto.terms,
            validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        };
        if (dto.lineItems) {
            const subtotal = dto.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
            const discount = dto.discount ?? Number(existing.discount);
            const taxRate = dto.taxRate ?? 0;
            const taxAmount = (subtotal - discount) * (taxRate / 100);
            const total = subtotal - discount + taxAmount;
            await this.prisma.quoteLineItem.deleteMany({ where: { quoteId: id } });
            updateData = {
                ...updateData,
                subtotal,
                discount,
                taxAmount,
                total,
                lineItems: {
                    create: dto.lineItems.map((item) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.quantity * item.unitPrice,
                    })),
                },
            };
        }
        const quote = await this.prisma.quote.update({
            where: { id },
            data: updateData,
            include: {
                client: true,
                event: true,
                createdBy: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                lineItems: true,
            },
        });
        await this.actionLogService.log({
            userId,
            action: 'UPDATE',
            entityType: 'Quote',
            entityId: id,
            details: { quoteNumber: quote.quoteNumber },
        });
        return quote;
    }
    async updateQuoteStatus(id, dto, userId) {
        const existing = await this.findOneQuote(id);
        const quote = await this.prisma.quote.update({
            where: { id },
            data: { status: dto.status },
            include: { client: true, event: true },
        });
        await this.actionLogService.log({
            userId,
            action: 'STATUS_CHANGE',
            entityType: 'Quote',
            entityId: id,
            details: { previousStatus: existing.status, newStatus: dto.status },
        });
        return quote;
    }
    async deleteQuote(id, userId) {
        const quote = await this.findOneQuote(id);
        if (quote.status !== 'DRAFT') {
            throw new common_1.BadRequestException('Only draft quotes can be deleted');
        }
        await this.prisma.quote.delete({ where: { id } });
        await this.actionLogService.log({
            userId,
            action: 'DELETE',
            entityType: 'Quote',
            entityId: id,
            details: { quoteNumber: quote.quoteNumber },
        });
    }
    async createInvoice(dto, userId) {
        const client = await this.prisma.client.findUnique({
            where: { id: dto.clientId },
        });
        if (!client) {
            throw new common_1.NotFoundException('Client not found');
        }
        const invoiceNumber = await this.generateInvoiceNumber();
        const subtotal = dto.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const discount = dto.discount || 0;
        const taxRate = dto.taxRate || 0;
        const taxAmount = (subtotal - discount) * (taxRate / 100);
        const total = subtotal - discount + taxAmount;
        const invoice = await this.prisma.invoice.create({
            data: {
                invoiceNumber,
                clientId: dto.clientId,
                eventId: dto.eventId,
                createdById: userId,
                dueDate: new Date(dto.dueDate),
                subtotal,
                discount,
                taxAmount,
                total,
                status: 'DRAFT',
                notes: dto.notes,
                terms: dto.terms,
                lineItems: {
                    create: dto.lineItems.map((item) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.quantity * item.unitPrice,
                    })),
                },
            },
            include: {
                client: true,
                event: true,
                createdBy: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                lineItems: true,
            },
        });
        await this.actionLogService.log({
            userId,
            action: 'CREATE',
            entityType: 'Invoice',
            entityId: invoice.id,
            details: { invoiceNumber, clientId: dto.clientId, total },
        });
        return invoice;
    }
    async findAllInvoices(params) {
        const { skip = 0, take = 20, status, clientId, search } = params;
        const where = {};
        if (status)
            where.status = status;
        if (clientId)
            where.clientId = clientId;
        if (search) {
            where.OR = [
                { invoiceNumber: { contains: search } },
                { client: { name: { contains: search } } },
            ];
        }
        const [invoices, total] = await Promise.all([
            this.prisma.invoice.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    client: true,
                    event: { select: { id: true, name: true } },
                    payments: true,
                    createdBy: {
                        select: { id: true, email: true, firstName: true, lastName: true },
                    },
                },
            }),
            this.prisma.invoice.count({ where }),
        ]);
        return {
            invoices: invoices.map((inv) => ({
                ...inv,
                amountPaid: inv.payments.reduce((sum, p) => sum + Number(p.amount), 0),
                balanceDue: Number(inv.total) -
                    inv.payments.reduce((sum, p) => sum + Number(p.amount), 0),
            })),
            total,
            skip,
            take,
        };
    }
    async findOneInvoice(id) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: {
                client: true,
                event: true,
                payments: {
                    include: {
                        recordedBy: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                createdBy: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                lineItems: true,
            },
        });
        if (!invoice) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        const amountPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const balanceDue = Number(invoice.total) - amountPaid;
        return { ...invoice, amountPaid, balanceDue };
    }
    async updateInvoice(id, dto, userId) {
        const existing = await this.findOneInvoice(id);
        if (existing.status !== 'DRAFT') {
            throw new common_1.BadRequestException('Only draft invoices can be edited');
        }
        let updateData = {
            notes: dto.notes,
            terms: dto.terms,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        };
        if (dto.lineItems) {
            const subtotal = dto.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
            const discount = dto.discount ?? Number(existing.discount);
            const taxRate = dto.taxRate ?? 0;
            const taxAmount = (subtotal - discount) * (taxRate / 100);
            const total = subtotal - discount + taxAmount;
            await this.prisma.invoiceLineItem.deleteMany({
                where: { invoiceId: id },
            });
            updateData = {
                ...updateData,
                subtotal,
                discount,
                taxAmount,
                total,
                lineItems: {
                    create: dto.lineItems.map((item) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.quantity * item.unitPrice,
                    })),
                },
            };
        }
        const invoice = await this.prisma.invoice.update({
            where: { id },
            data: updateData,
            include: {
                client: true,
                event: true,
                createdBy: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                lineItems: true,
            },
        });
        await this.actionLogService.log({
            userId,
            action: 'UPDATE',
            entityType: 'Invoice',
            entityId: id,
            details: { invoiceNumber: invoice.invoiceNumber },
        });
        return invoice;
    }
    async updateInvoiceStatus(id, dto, userId) {
        const existing = await this.findOneInvoice(id);
        const invoice = await this.prisma.invoice.update({
            where: { id },
            data: { status: dto.status },
            include: { client: true, event: true },
        });
        await this.actionLogService.log({
            userId,
            action: 'STATUS_CHANGE',
            entityType: 'Invoice',
            entityId: id,
            details: { previousStatus: existing.status, newStatus: dto.status },
        });
        return invoice;
    }
    async deleteInvoice(id, userId) {
        const invoice = await this.findOneInvoice(id);
        if (invoice.status !== 'DRAFT') {
            throw new common_1.BadRequestException('Only draft invoices can be deleted');
        }
        if (invoice.payments.length > 0) {
            throw new common_1.BadRequestException('Cannot delete invoice with payments');
        }
        await this.prisma.invoice.delete({ where: { id } });
        await this.actionLogService.log({
            userId,
            action: 'DELETE',
            entityType: 'Invoice',
            entityId: id,
            details: { invoiceNumber: invoice.invoiceNumber },
        });
    }
    async createPayment(dto, userId) {
        const invoice = await this.findOneInvoice(dto.invoiceId);
        if (invoice.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Cannot add payment to cancelled invoice');
        }
        if (dto.amount > invoice.balanceDue) {
            throw new common_1.BadRequestException(`Payment amount exceeds balance due (${invoice.balanceDue})`);
        }
        const payment = await this.prisma.payment.create({
            data: {
                invoiceId: dto.invoiceId,
                amount: dto.amount,
                paymentMethod: dto.paymentMethod,
                referenceNumber: dto.referenceNumber,
                notes: dto.notes,
                paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
                recordedById: userId,
            },
            include: {
                invoice: { include: { client: true } },
                recordedBy: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
            },
        });
        const newAmountPaid = invoice.amountPaid + dto.amount;
        const newBalanceDue = Number(invoice.total) - newAmountPaid;
        let newStatus = invoice.status;
        if (newBalanceDue <= 0) {
            newStatus = 'PAID';
        }
        else if (newAmountPaid > 0) {
            newStatus = 'PARTIALLY_PAID';
        }
        await this.prisma.invoice.update({
            where: { id: dto.invoiceId },
            data: { amountPaid: newAmountPaid, status: newStatus },
        });
        await this.actionLogService.log({
            userId,
            action: 'CREATE',
            entityType: 'Payment',
            entityId: payment.id,
            details: {
                invoiceNumber: invoice.invoiceNumber,
                amount: dto.amount,
                paymentMethod: dto.paymentMethod,
            },
        });
        return payment;
    }
    async findAllPayments(params) {
        const { skip = 0, take = 20, invoiceId, clientId } = params;
        const where = {};
        if (invoiceId)
            where.invoiceId = invoiceId;
        if (clientId) {
            where.invoice = { clientId };
        }
        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                skip,
                take,
                orderBy: { paymentDate: 'desc' },
                include: {
                    invoice: {
                        include: { client: { select: { id: true, name: true } } },
                    },
                    recordedBy: {
                        select: { id: true, email: true, firstName: true, lastName: true },
                    },
                },
            }),
            this.prisma.payment.count({ where }),
        ]);
        return { payments, total, skip, take };
    }
    async findOnePayment(id) {
        const payment = await this.prisma.payment.findUnique({
            where: { id },
            include: {
                invoice: { include: { client: true } },
                recordedBy: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
            },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        return payment;
    }
    async deletePayment(id, userId) {
        const payment = await this.findOnePayment(id);
        await this.prisma.payment.delete({ where: { id } });
        const invoice = await this.findOneInvoice(payment.invoiceId);
        let newStatus = invoice.status;
        if (invoice.amountPaid <= 0) {
            newStatus = invoice.status === 'CANCELLED' ? 'CANCELLED' : 'SENT';
        }
        else if (invoice.balanceDue > 0) {
            newStatus = 'PARTIALLY_PAID';
        }
        await this.prisma.invoice.update({
            where: { id: payment.invoiceId },
            data: {
                amountPaid: invoice.amountPaid,
                status: newStatus,
            },
        });
        await this.actionLogService.log({
            userId,
            action: 'DELETE',
            entityType: 'Payment',
            entityId: id,
            details: {
                invoiceNumber: payment.invoice.invoiceNumber,
                amount: payment.amount,
            },
        });
    }
    async getFinancialSummary(params) {
        const { startDate, endDate } = params;
        const dateFilter = {};
        if (startDate)
            dateFilter.gte = new Date(startDate);
        if (endDate)
            dateFilter.lte = new Date(endDate);
        const paymentWhere = {};
        if (startDate || endDate) {
            paymentWhere.paymentDate = dateFilter;
        }
        const [totalRevenue, outstandingInvoices, recentPayments] = await Promise.all([
            this.prisma.payment.aggregate({
                where: paymentWhere,
                _sum: { amount: true },
            }),
            this.prisma.invoice.aggregate({
                where: { status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } },
                _sum: { total: true },
                _count: true,
            }),
            this.prisma.payment.findMany({
                orderBy: { paymentDate: 'desc' },
                take: 10,
                include: {
                    invoice: {
                        include: { client: { select: { id: true, name: true } } },
                    },
                },
            }),
        ]);
        return {
            totalRevenue: Number(totalRevenue._sum.amount) || 0,
            outstandingAmount: Number(outstandingInvoices._sum.total) || 0,
            outstandingCount: outstandingInvoices._count,
            recentPayments,
        };
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        action_log_service_1.ActionLogService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map