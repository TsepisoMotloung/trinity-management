import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum EquipmentStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  IN_USE = 'IN_USE',
  DAMAGED = 'DAMAGED',
  UNDER_REPAIR = 'UNDER_REPAIR',
  LOST = 'LOST',
  RETIRED = 'RETIRED',
}

export class CreateEquipmentCategoryDto {
  @ApiProperty({ example: 'Speakers' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'All types of speakers and monitors' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateEquipmentCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateEquipmentItemDto {
  @ApiProperty({ example: 'JBL EON615 #1' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '15-inch powered PA speaker' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-of-category' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: 'JBL-EON615-001' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ example: 'BC123456' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: 599.99 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  purchasePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateEquipmentItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  purchasePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateEquipmentStatusDto {
  @ApiProperty({ enum: EquipmentStatus })
  @IsEnum(EquipmentStatus)
  status: EquipmentStatus;

  @ApiPropertyOptional({ example: 'Returned from event, in good condition' })
  @IsOptional()
  @IsString()
  reason?: string;
}
