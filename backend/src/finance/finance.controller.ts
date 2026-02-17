import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import {
  CreateQuoteDto,
  UpdateQuoteDto,
  UpdateQuoteStatusDto,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  UpdateInvoiceStatusDto,
  CreatePaymentDto,
} from './dto/finance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { QuoteStatus, InvoiceStatus } from '@prisma/client';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ==================== QUOTES ====================

  @Post('quotes')
  @ApiOperation({ summary: 'Create a new quote' })
  createQuote(@Body() dto: CreateQuoteDto, @CurrentUser('id') userId: string) {
    return this.financeService.createQuote(dto, userId);
  }

  @Get('quotes')
  @ApiOperation({ summary: 'Get all quotes' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAllQuotes(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('search') search?: string,
  ) {
    return this.financeService.findAllQuotes({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      status: status as QuoteStatus | undefined,
      clientId,
      search,
    });
  }

  @Get('quotes/:id')
  @ApiOperation({ summary: 'Get a quote by ID' })
  findOneQuote(@Param('id') id: string) {
    return this.financeService.findOneQuote(id);
  }

  @Put('quotes/:id')
  @ApiOperation({ summary: 'Update a quote' })
  updateQuote(
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.financeService.updateQuote(id, dto, userId);
  }

  @Patch('quotes/:id/status')
  @ApiOperation({ summary: 'Update quote status' })
  updateQuoteStatus(
    @Param('id') id: string,
    @Body() dto: UpdateQuoteStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.financeService.updateQuoteStatus(id, dto, userId);
  }

  @Delete('quotes/:id')
  @ApiOperation({ summary: 'Delete a quote' })
  deleteQuote(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.financeService.deleteQuote(id, userId);
  }

  // ==================== INVOICES ====================

  @Post('invoices')
  @ApiOperation({ summary: 'Create a new invoice' })
  createInvoice(
    @Body() dto: CreateInvoiceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.financeService.createInvoice(dto, userId);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAllInvoices(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('search') search?: string,
  ) {
    return this.financeService.findAllInvoices({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      status: status as InvoiceStatus | undefined,
      clientId,
      search,
    });
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  findOneInvoice(@Param('id') id: string) {
    return this.financeService.findOneInvoice(id);
  }

  @Put('invoices/:id')
  @ApiOperation({ summary: 'Update an invoice' })
  updateInvoice(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.financeService.updateInvoice(id, dto, userId);
  }

  @Patch('invoices/:id/status')
  @ApiOperation({ summary: 'Update invoice status' })
  updateInvoiceStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.financeService.updateInvoiceStatus(id, dto, userId);
  }

  @Delete('invoices/:id')
  @ApiOperation({ summary: 'Delete an invoice' })
  deleteInvoice(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.financeService.deleteInvoice(id, userId);
  }

  // ==================== PAYMENTS ====================

  @Post('payments')
  @ApiOperation({ summary: 'Record a payment' })
  createPayment(
    @Body() dto: CreatePaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.financeService.createPayment(dto, userId);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get all payments' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'invoiceId', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  findAllPayments(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.financeService.findAllPayments({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      invoiceId,
      clientId,
    });
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Get a payment by ID' })
  findOnePayment(@Param('id') id: string) {
    return this.financeService.findOnePayment(id);
  }

  @Delete('payments/:id')
  @ApiOperation({ summary: 'Delete a payment' })
  deletePayment(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.financeService.deletePayment(id, userId);
  }

  // ==================== REPORTS ====================

  @Get('summary')
  @ApiOperation({ summary: 'Get financial summary' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getFinancialSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getFinancialSummary({ startDate, endDate });
  }
}
