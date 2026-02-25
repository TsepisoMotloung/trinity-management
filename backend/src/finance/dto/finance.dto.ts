import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { QuoteStatus, InvoiceStatus, PaymentMethod } from '@prisma/client';

// ==================== Quote DTOs ====================

export class QuoteLineItemDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateQuoteDto {
  @ApiProperty()
  @IsString()
  clientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiPropertyOptional({ example: 'EVENT', description: 'EVENT or HIRE' })
  @IsOptional()
  @IsString()
  quoteType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proposedEventName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proposedEventType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  proposedStartDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  proposedEndDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proposedVenue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proposedVenueAddress?: string;

  @ApiProperty({ type: [QuoteLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteLineItemDto)
  lineItems: QuoteLineItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiProperty()
  @IsDateString()
  validUntil: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  terms?: string;
}

export class UpdateQuoteDto extends PartialType(CreateQuoteDto) {}

export class UpdateQuoteStatusDto {
  @ApiProperty({ enum: QuoteStatus })
  @IsEnum(QuoteStatus)
  status: QuoteStatus;
}

// ==================== Invoice DTOs ====================

export class InvoiceLineItemDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  clientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quoteId?: string;

  @ApiProperty({ type: [InvoiceLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  lineItems: InvoiceLineItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiProperty()
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  terms?: string;
}

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {}

export class UpdateInvoiceStatusDto {
  @ApiProperty({ enum: InvoiceStatus })
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;
}

// ==================== Payment DTOs ====================

export class CreatePaymentDto {
  @ApiProperty()
  @IsString()
  invoiceId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proofOfPaymentUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paymentDate?: string;
}

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {}

// ==================== Invoice from Quote ====================

export class CreateInvoiceFromQuoteDto {
  @ApiProperty()
  @IsString()
  quoteId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  terms?: string;
}

// ==================== Send Quote ====================

export class SendQuoteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
}
