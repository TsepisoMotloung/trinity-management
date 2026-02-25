import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsArray,
  ValidateNested,
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

export class StaffAssignmentInput {
  @ApiProperty()
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

export class CreateEventDto {
  @ApiProperty({ example: 'ABC Company Annual Party' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Corporate Event' })
  @IsString()
  eventType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  quoteId?: string;

  @ApiProperty({ example: 'Grand Hotel Ballroom' })
  @IsString()
  venue: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venueAddress?: string;

  @ApiProperty({ example: '2024-03-15T18:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-03-15T23:00:00Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  setupTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Equipment item IDs to book' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  equipmentIds?: string[];

  @ApiPropertyOptional({ description: 'Staff to assign', type: [StaffAssignmentInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffAssignmentInput)
  staffAssignments?: StaffAssignmentInput[];
}

export class CreateEventFromQuoteDto {
  @ApiProperty()
  @IsUUID()
  quoteId: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  equipmentIds?: string[];

  @ApiPropertyOptional({ type: [StaffAssignmentInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffAssignmentInput)
  staffAssignments?: StaffAssignmentInput[];
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
  @ApiProperty()
  @IsUUID()
  equipmentId: string;

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
  @ApiProperty()
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
  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
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
