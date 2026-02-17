import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum EventStatus {
  DRAFT = 'DRAFT',
  QUOTED = 'QUOTED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateEventDto {
  @ApiProperty({ example: 'ABC Company Annual Party' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Corporate Event' })
  @IsString()
  eventType: string;

  @ApiPropertyOptional({
    example: 'Annual company celebration with live music',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'uuid-of-client' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ example: 'Grand Hotel Ballroom' })
  @IsString()
  venue: string;

  @ApiPropertyOptional({ example: '123 Hotel Street, Harare' })
  @IsOptional()
  @IsString()
  venueAddress?: string;

  @ApiProperty({ example: '2024-03-15T18:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-03-15T23:00:00Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: '2024-03-15T14:00:00Z' })
  @IsOptional()
  @IsDateString()
  setupTime?: string;

  @ApiPropertyOptional({ example: '2x PA speakers, 4x microphones, DJ setup' })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venueAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  setupTime?: string;

  @ApiPropertyOptional({ enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BookEquipmentDto {
  @ApiProperty({ example: 'uuid-of-equipment' })
  @IsUUID()
  equipmentId: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BookMultipleEquipmentDto {
  @ApiProperty({ type: [BookEquipmentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookEquipmentDto)
  items: BookEquipmentDto[];
}

export class AssignStaffDto {
  @ApiProperty({ example: 'uuid-of-user' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'Sound Engineer' })
  @IsString()
  role: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CalendarQueryDto {
  @ApiProperty({ example: '2024-03-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-03-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string;
}
