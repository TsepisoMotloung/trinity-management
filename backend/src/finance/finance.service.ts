import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActionLogService } from '../action-log/action-log.service';
import { QuoteStatus, InvoiceStatus } from '@prisma/client';
import {
  CreateQuoteDto,
  UpdateQuoteDto,
  UpdateQuoteStatusDto,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  UpdateInvoiceStatusDto,
  CreatePaymentDto,
  CreateInvoiceFromQuoteDto,
  SendQuoteDto,
} from './dto/finance.dto';
import * as crypto from 'crypto';

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    private actionLogService: ActionLogService,
  ) {}

  // ==================== NUMBER GENERATORS ====================

  private async generateQuoteNumber(): Promise<string> {
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

  private async generateInvoiceNumber(): Promise<string> {
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

  // ==================== QUOTES ====================

  async createQuote(dto: CreateQuoteDto, userId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const quoteNumber = await this.generateQuoteNumber();

    const subtotal = dto.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const discount = dto.discount || 0;
    const taxRate = dto.taxRate || 0;
    const taxAmount = (subtotal - discount) * (taxRate / 100);
    const total = subtotal - discount + taxAmount;

    // Generate acceptance token
    const acceptToken = crypto.randomBytes(32).toString('hex');

    const quote = await this.prisma.quote.create({
      data: {
        quoteNumber,
        clientId: dto.clientId,
        eventId: dto.eventId,
        createdById: userId,
        quoteType: dto.quoteType || 'EVENT',
        proposedEventName: dto.proposedEventName,
        proposedEventType: dto.proposedEventType,
        proposedStartDate: dto.proposedStartDate ? new Date(dto.proposedStartDate) : null,
        proposedEndDate: dto.proposedEndDate ? new Date(dto.proposedEndDate) : null,
        proposedVenue: dto.proposedVenue,
        proposedVenueAddress: dto.proposedVenueAddress,
        validUntil: new Date(dto.validUntil),
        subtotal,
        discount,
        taxAmount,
        total,
        status: 'DRAFT',
        notes: dto.notes,
        terms: dto.terms,
        acceptToken,
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

  async findAllQuotes(params: {
    skip?: number;
    take?: number;
    status?: QuoteStatus;
    clientId?: string;
    search?: string;
  }) {
    const { skip = 0, take = 20, status, clientId, search } = params;

    const where: any = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
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
          _count: { select: { invoices: true } },
        },
      }),
      this.prisma.quote.count({ where }),
    ]);

    return { quotes, total, skip, take };
  }

  async findOneQuote(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        client: true,
        event: true,
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        lineItems: true,
        invoices: {
          select: { id: true, invoiceNumber: true, status: true, total: true },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    return quote;
  }

  async updateQuote(id: string, dto: UpdateQuoteDto, userId: string) {
    const existing = await this.findOneQuote(id);

    if (existing.status !== 'DRAFT') {
      throw new BadRequestException('Only draft quotes can be edited');
    }

    let updateData: any = {
      notes: dto.notes,
      terms: dto.terms,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
    };

    if (dto.lineItems) {
      const subtotal = dto.lineItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );
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

  async updateQuoteStatus(
    id: string,
    dto: UpdateQuoteStatusDto,
    userId: string,
  ) {
    const existing = await this.findOneQuote(id);

    const updateData: any = { status: dto.status };

    // Set timestamps for accept/reject
    if (dto.status === 'ACCEPTED') {
      updateData.acceptedAt = new Date();
    } else if (dto.status === 'REJECTED') {
      updateData.rejectedAt = new Date();
    }

    const quote = await this.prisma.quote.update({
      where: { id },
      data: updateData,
      include: { client: true, event: true },
    });

    // Notify admins when quote is accepted
    if (dto.status === 'ACCEPTED') {
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true },
      });
      for (const admin of admins) {
        await this.prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'QUOTE_ACCEPTED',
            title: 'Quote Accepted',
            message: `Quote ${quote.quoteNumber} for ${quote.client.name} has been accepted (R${Number(quote.total).toLocaleString()})`,
            entityType: 'Quote',
            entityId: quote.id,
            priority: 'HIGH',
          },
        });
      }
    }

    if (dto.status === 'REJECTED') {
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true },
      });
      for (const admin of admins) {
        await this.prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'QUOTE_REJECTED',
            title: 'Quote Rejected',
            message: `Quote ${quote.quoteNumber} for ${quote.client.name} has been rejected`,
            entityType: 'Quote',
            entityId: quote.id,
            priority: 'NORMAL',
          },
        });
      }
    }

    await this.actionLogService.log({
      userId,
      action: 'STATUS_CHANGE',
      entityType: 'Quote',
      entityId: id,
      details: { previousStatus: existing.status, newStatus: dto.status },
    });

    return quote;
  }

  // ==================== QUOTE SEND & ACCEPT ====================

  async sendQuote(id: string, dto: SendQuoteDto, userId: string) {
    const quote = await this.findOneQuote(id);

    if (quote.status !== 'DRAFT' && quote.status !== 'SENT') {
      throw new BadRequestException('Quote must be in DRAFT or SENT status to send');
    }

    const email = dto.email || quote.client.email;
    if (!email) {
      throw new BadRequestException('No email address provided and client has no email on file');
    }

    // In a production system, this would send an actual email with PDF attachment
    // For now, we mark the quote as sent and record the email
    const updated = await this.prisma.quote.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        sentToEmail: email,
      },
      include: { client: true, event: true, lineItems: true },
    });

    await this.actionLogService.log({
      userId,
      action: 'QUOTE_SENT',
      entityType: 'Quote',
      entityId: id,
      details: { quoteNumber: quote.quoteNumber, sentTo: email },
    });

    return {
      ...updated,
      message: `Quote ${quote.quoteNumber} marked as sent to ${email}`,
      acceptUrl: `/api/v1/finance/quotes/accept/${quote.acceptToken}`,
    };
  }

  async acceptQuoteByToken(token: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { acceptToken: token },
      include: { client: true, lineItems: true },
    });

    if (!quote) {
      throw new NotFoundException('Invalid or expired quote link');
    }

    if (quote.status === 'ACCEPTED') {
      return { message: 'This quote has already been accepted', quote };
    }

    if (quote.status === 'REJECTED') {
      throw new BadRequestException('This quote has been rejected');
    }

    if (new Date() > quote.validUntil) {
      await this.prisma.quote.update({
        where: { id: quote.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('This quote has expired');
    }

    const updated = await this.prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
      include: { client: true },
    });

    // Notify admins
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
    });
    for (const admin of admins) {
      await this.prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'QUOTE_ACCEPTED',
          title: 'Quote Accepted by Client',
          message: `${quote.client.name} accepted quote ${quote.quoteNumber} (R${Number(quote.total).toLocaleString()})`,
          entityType: 'Quote',
          entityId: quote.id,
          priority: 'HIGH',
        },
      });
    }

    return {
      message: 'Quote accepted successfully! Thank you.',
      quote: updated,
    };
  }

  async rejectQuoteByToken(token: string, reason?: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { acceptToken: token },
      include: { client: true },
    });

    if (!quote) {
      throw new NotFoundException('Invalid or expired quote link');
    }

    if (quote.status !== 'SENT') {
      throw new BadRequestException('This quote cannot be rejected');
    }

    const updated = await this.prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      include: { client: true },
    });

    // Notify admins
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
    });
    for (const admin of admins) {
      await this.prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'QUOTE_REJECTED',
          title: 'Quote Rejected by Client',
          message: `${quote.client.name} rejected quote ${quote.quoteNumber}${reason ? `: ${reason}` : ''}`,
          entityType: 'Quote',
          entityId: quote.id,
          priority: 'NORMAL',
        },
      });
    }

    return { message: 'Quote rejected', quote: updated };
  }

  // ==================== QUOTE PDF ====================

  async generateQuotePdf(id: string): Promise<Buffer> {
    const quote = await this.findOneQuote(id);

    // Build a simple text-based PDF representation
    // In production, use pdfkit or similar for proper PDF generation
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).text('TRINITY SOUND', { align: 'center' });
      doc.fontSize(10).text('Sound & Event Solutions - Lesotho', { align: 'center' });
      doc.moveDown(2);

      // Quote details
      doc.fontSize(18).text('QUOTATION', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10);
      doc.text(`Quote Number: ${quote.quoteNumber}`);
      doc.text(`Date: ${quote.issueDate.toLocaleDateString()}`);
      doc.text(`Valid Until: ${quote.validUntil.toLocaleDateString()}`);
      doc.moveDown();

      // Client details
      doc.fontSize(12).text('Bill To:', { underline: true });
      doc.fontSize(10);
      doc.text(quote.client.name);
      if (quote.client.contactPerson) doc.text(`Attn: ${quote.client.contactPerson}`);
      if (quote.client.email) doc.text(quote.client.email);
      if (quote.client.phone) doc.text(quote.client.phone);
      if (quote.client.address) doc.text(quote.client.address);
      doc.moveDown();

      // Event details
      if (quote.event) {
        doc.fontSize(12).text('Event:', { underline: true });
        doc.fontSize(10);
        doc.text(`${quote.event.name} - ${quote.event.eventType}`);
        doc.text(`Venue: ${quote.event.venue}`);
        doc.text(`Date: ${quote.event.startDate.toLocaleDateString()} - ${quote.event.endDate.toLocaleDateString()}`);
        doc.moveDown();
      }

      // Line items table
      doc.fontSize(12).text('Items:', { underline: true });
      doc.moveDown(0.5);

      const tableTop = doc.y;
      doc.fontSize(9);

      // Table header
      doc.text('Description', 50, tableTop, { width: 250 });
      doc.text('Qty', 310, tableTop, { width: 40, align: 'center' });
      doc.text('Unit Price', 360, tableTop, { width: 80, align: 'right' });
      doc.text('Total', 450, tableTop, { width: 80, align: 'right' });

      doc.moveTo(50, tableTop + 15).lineTo(530, tableTop + 15).stroke();

      let y = tableTop + 20;
      for (const item of quote.lineItems) {
        doc.text(item.description, 50, y, { width: 250 });
        doc.text(String(item.quantity), 310, y, { width: 40, align: 'center' });
        doc.text(`R${Number(item.unitPrice).toFixed(2)}`, 360, y, { width: 80, align: 'right' });
        doc.text(`R${Number(item.total).toFixed(2)}`, 450, y, { width: 80, align: 'right' });
        y += 20;
      }

      doc.moveTo(50, y).lineTo(530, y).stroke();
      y += 10;

      // Totals
      doc.text('Subtotal:', 360, y, { width: 80, align: 'right' });
      doc.text(`R${Number(quote.subtotal).toFixed(2)}`, 450, y, { width: 80, align: 'right' });
      y += 15;

      if (Number(quote.discount) > 0) {
        doc.text('Discount:', 360, y, { width: 80, align: 'right' });
        doc.text(`-R${Number(quote.discount).toFixed(2)}`, 450, y, { width: 80, align: 'right' });
        y += 15;
      }

      if (Number(quote.taxAmount) > 0) {
        doc.text('VAT (15%):', 360, y, { width: 80, align: 'right' });
        doc.text(`R${Number(quote.taxAmount).toFixed(2)}`, 450, y, { width: 80, align: 'right' });
        y += 15;
      }

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL:', 360, y, { width: 80, align: 'right' });
      doc.text(`R${Number(quote.total).toFixed(2)}`, 450, y, { width: 80, align: 'right' });

      doc.font('Helvetica');

      // Notes
      if (quote.notes) {
        doc.moveDown(3);
        doc.fontSize(10).text('Notes:', { underline: true });
        doc.text(quote.notes);
      }

      // Terms
      if (quote.terms) {
        doc.moveDown();
        doc.fontSize(10).text('Terms & Conditions:', { underline: true });
        doc.text(quote.terms);
      }

      doc.moveDown(2);
      doc.fontSize(8).text('Trinity Sound - Professional Sound & Event Solutions - Lesotho', { align: 'center' });

      doc.end();
    });
  }

  async deleteQuote(id: string, userId: string) {
    const quote = await this.findOneQuote(id);

    if (quote.status !== 'DRAFT') {
      throw new BadRequestException('Only draft quotes can be deleted');
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

  // ==================== INVOICES ====================

  async createInvoice(dto: CreateInvoiceDto, userId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const invoiceNumber = await this.generateInvoiceNumber();

    const subtotal = dto.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const discount = dto.discount || 0;
    const taxRate = dto.taxRate || 0;
    const taxAmount = (subtotal - discount) * (taxRate / 100);
    const total = subtotal - discount + taxAmount;

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: dto.clientId,
        eventId: dto.eventId,
        quoteId: dto.quoteId,
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
        quote: { select: { id: true, quoteNumber: true } },
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

  // Create invoice from an accepted quote
  async createInvoiceFromQuote(dto: CreateInvoiceFromQuoteDto, userId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: dto.quoteId },
      include: { client: true, event: true, lineItems: true },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.status !== 'ACCEPTED') {
      throw new BadRequestException('Can only create invoices from accepted quotes');
    }

    const invoiceNumber = await this.generateInvoiceNumber();
    const dueDate = new Date(dto.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: quote.clientId,
        eventId: quote.eventId,
        quoteId: quote.id,
        createdById: userId,
        dueDate,
        subtotal: quote.subtotal,
        discount: quote.discount,
        taxAmount: quote.taxAmount,
        total: quote.total,
        status: 'DRAFT',
        notes: dto.notes || quote.notes,
        terms: dto.terms || quote.terms,
        lineItems: {
          create: quote.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
      include: {
        client: true,
        event: true,
        quote: { select: { id: true, quoteNumber: true } },
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        lineItems: true,
      },
    });

    await this.actionLogService.log({
      userId,
      action: 'INVOICE_FROM_QUOTE',
      entityType: 'Invoice',
      entityId: invoice.id,
      details: {
        invoiceNumber,
        quoteNumber: quote.quoteNumber,
        total: Number(quote.total),
      },
    });

    return invoice;
  }

  async findAllInvoices(params: {
    skip?: number;
    take?: number;
    status?: InvoiceStatus;
    clientId?: string;
    search?: string;
  }) {
    const { skip = 0, take = 20, status, clientId, search } = params;

    const where: any = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
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
          quote: { select: { id: true, quoteNumber: true } },
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
        balanceDue:
          Number(inv.total) -
          inv.payments.reduce((sum, p) => sum + Number(p.amount), 0),
      })),
      total,
      skip,
      take,
    };
  }

  async findOneInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        event: true,
        quote: { select: { id: true, quoteNumber: true, status: true } },
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
          orderBy: { paymentDate: 'desc' },
        },
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        lineItems: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const amountPaid = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const balanceDue = Number(invoice.total) - amountPaid;

    return { ...invoice, amountPaid, balanceDue };
  }

  async updateInvoice(id: string, dto: UpdateInvoiceDto, userId: string) {
    const existing = await this.findOneInvoice(id);

    if (existing.status !== 'DRAFT') {
      throw new BadRequestException('Only draft invoices can be edited');
    }

    let updateData: any = {
      notes: dto.notes,
      terms: dto.terms,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    };

    if (dto.lineItems) {
      const subtotal = dto.lineItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );
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

  async updateInvoiceStatus(
    id: string,
    dto: UpdateInvoiceStatusDto,
    userId: string,
  ) {
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

  async deleteInvoice(id: string, userId: string) {
    const invoice = await this.findOneInvoice(id);

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Only draft invoices can be deleted');
    }

    if (invoice.payments.length > 0) {
      throw new BadRequestException('Cannot delete invoice with payments');
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

  // ==================== INVOICE PDF ====================

  async generateInvoicePdf(id: string): Promise<Buffer> {
    const invoice = await this.findOneInvoice(id);

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).text('TRINITY SOUND', { align: 'center' });
      doc.fontSize(10).text('Sound & Event Solutions - Lesotho', { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(18).text('TAX INVOICE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10);
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`);
      doc.text(`Date: ${invoice.issueDate.toLocaleDateString()}`);
      doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`);
      if (invoice.quote) {
        doc.text(`Reference Quote: ${invoice.quote.quoteNumber}`);
      }
      doc.moveDown();

      // Client
      doc.fontSize(12).text('Bill To:', { underline: true });
      doc.fontSize(10);
      doc.text(invoice.client.name);
      if (invoice.client.contactPerson) doc.text(`Attn: ${invoice.client.contactPerson}`);
      if (invoice.client.email) doc.text(invoice.client.email);
      if (invoice.client.phone) doc.text(invoice.client.phone);
      if (invoice.client.billingAddress) doc.text(invoice.client.billingAddress);
      else if (invoice.client.address) doc.text(invoice.client.address);
      doc.moveDown();

      // Line items
      const tableTop = doc.y;
      doc.fontSize(9);
      doc.text('Description', 50, tableTop, { width: 250 });
      doc.text('Qty', 310, tableTop, { width: 40, align: 'center' });
      doc.text('Unit Price', 360, tableTop, { width: 80, align: 'right' });
      doc.text('Total', 450, tableTop, { width: 80, align: 'right' });
      doc.moveTo(50, tableTop + 15).lineTo(530, tableTop + 15).stroke();

      let y = tableTop + 20;
      for (const item of invoice.lineItems) {
        doc.text(item.description, 50, y, { width: 250 });
        doc.text(String(item.quantity), 310, y, { width: 40, align: 'center' });
        doc.text(`R${Number(item.unitPrice).toFixed(2)}`, 360, y, { width: 80, align: 'right' });
        doc.text(`R${Number(item.total).toFixed(2)}`, 450, y, { width: 80, align: 'right' });
        y += 20;
      }

      doc.moveTo(50, y).lineTo(530, y).stroke();
      y += 10;

      doc.text('Subtotal:', 360, y, { width: 80, align: 'right' });
      doc.text(`R${Number(invoice.subtotal).toFixed(2)}`, 450, y, { width: 80, align: 'right' });
      y += 15;

      if (Number(invoice.discount) > 0) {
        doc.text('Discount:', 360, y, { width: 80, align: 'right' });
        doc.text(`-R${Number(invoice.discount).toFixed(2)}`, 450, y, { width: 80, align: 'right' });
        y += 15;
      }
      if (Number(invoice.taxAmount) > 0) {
        doc.text('VAT (15%):', 360, y, { width: 80, align: 'right' });
        doc.text(`R${Number(invoice.taxAmount).toFixed(2)}`, 450, y, { width: 80, align: 'right' });
        y += 15;
      }

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL:', 360, y, { width: 80, align: 'right' });
      doc.text(`R${Number(invoice.total).toFixed(2)}`, 450, y, { width: 80, align: 'right' });
      y += 20;

      // Payment info
      if (invoice.amountPaid > 0) {
        doc.font('Helvetica').fontSize(10);
        doc.text('Amount Paid:', 360, y, { width: 80, align: 'right' });
        doc.text(`R${invoice.amountPaid.toFixed(2)}`, 450, y, { width: 80, align: 'right' });
        y += 15;
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('BALANCE DUE:', 340, y, { width: 100, align: 'right' });
        doc.text(`R${invoice.balanceDue.toFixed(2)}`, 450, y, { width: 80, align: 'right' });
      }

      doc.font('Helvetica');

      if (invoice.notes) {
        doc.moveDown(3);
        doc.fontSize(10).text('Notes:', { underline: true });
        doc.text(invoice.notes);
      }

      doc.moveDown(2);
      doc.fontSize(8).text('Trinity Sound - Professional Sound & Event Solutions - Lesotho', { align: 'center' });

      doc.end();
    });
  }

  // ==================== PAYMENTS ====================

  async createPayment(dto: CreatePaymentDto, userId: string) {
    const invoice = await this.findOneInvoice(dto.invoiceId);

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot add payment to cancelled invoice');
    }

    if (dto.amount > invoice.balanceDue) {
      throw new BadRequestException(
        `Payment amount exceeds balance due (R${invoice.balanceDue.toFixed(2)})`,
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: dto.invoiceId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        referenceNumber: dto.referenceNumber,
        proofOfPaymentUrl: dto.proofOfPaymentUrl,
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

    // Update invoice amountPaid and status
    const newAmountPaid = invoice.amountPaid + dto.amount;
    const newBalanceDue = Number(invoice.total) - newAmountPaid;

    let newStatus: InvoiceStatus = invoice.status;
    if (newBalanceDue <= 0) {
      newStatus = 'PAID';
    } else if (newAmountPaid > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    await this.prisma.invoice.update({
      where: { id: dto.invoiceId },
      data: { amountPaid: newAmountPaid, status: newStatus },
    });

    // Notify on full payment
    if (newStatus === 'PAID') {
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true },
      });
      for (const admin of admins) {
        await this.prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'INVOICE_PAID',
            title: 'Invoice Paid in Full',
            message: `Invoice ${invoice.invoiceNumber} for ${invoice.client.name} has been paid in full (R${Number(invoice.total).toLocaleString()})`,
            entityType: 'Invoice',
            entityId: invoice.id,
            priority: 'NORMAL',
          },
        });
      }
    }

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

  async findAllPayments(params: {
    skip?: number;
    take?: number;
    invoiceId?: string;
    clientId?: string;
  }) {
    const { skip = 0, take = 20, invoiceId, clientId } = params;

    const where: any = {};
    if (invoiceId) where.invoiceId = invoiceId;
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

  async findOnePayment(id: string) {
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
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async deletePayment(id: string, userId: string) {
    const payment = await this.findOnePayment(id);

    await this.prisma.payment.delete({ where: { id } });

    // Recalculate invoice amountPaid
    const invoice = await this.findOneInvoice(payment.invoiceId);

    let newStatus: InvoiceStatus = invoice.status;
    if (invoice.amountPaid <= 0) {
      newStatus = invoice.status === 'CANCELLED' ? 'CANCELLED' : 'SENT';
    } else if (invoice.balanceDue > 0) {
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

  // ==================== FINANCIAL REPORTS ====================

  async getFinancialSummary(params: { startDate?: string; endDate?: string }) {
    const { startDate, endDate } = params;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const paymentWhere: any = {};
    if (startDate || endDate) {
      paymentWhere.paymentDate = dateFilter;
    }

    const [
      totalRevenue,
      outstandingInvoices,
      overdueInvoices,
      pendingQuotes,
      acceptedQuotes,
      recentPayments,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: paymentWhere,
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.invoice.aggregate({
        where: { status: 'OVERDUE' },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.quote.count({
        where: { status: 'SENT' },
      }),
      this.prisma.quote.aggregate({
        where: { status: 'ACCEPTED' },
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
      overdueAmount: Number(overdueInvoices._sum.total) || 0,
      overdueCount: overdueInvoices._count,
      pendingQuotes,
      acceptedQuotesValue: Number(acceptedQuotes._sum.total) || 0,
      acceptedQuotesCount: acceptedQuotes._count,
      recentPayments,
    };
  }
}
