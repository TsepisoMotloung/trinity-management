import {
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItemCondition } from '@prisma/client';

export class CheckOutItemDto {
  @ApiProperty({ description: 'Equipment ID to check out' })
  @IsString()
  equipmentId: string;

  @ApiPropertyOptional({ description: 'Condition at checkout' })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateCheckOutDto {
  @ApiProperty()
  @IsString()
  eventId: string;

  @ApiProperty({ type: [CheckOutItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckOutItemDto)
  items: CheckOutItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CheckInItemDto {
  @ApiProperty({ description: 'Equipment ID to check in' })
  @IsString()
  equipmentId: string;

  @ApiProperty({ enum: ItemCondition, description: 'Condition at check-in' })
  @IsEnum(ItemCondition)
  condition: ItemCondition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  damageNotes?: string;
}

export class CreateCheckInDto {
  @ApiProperty()
  @IsString()
  eventId: string;

  @ApiProperty({ type: [CheckInItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckInItemDto)
  items: CheckInItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
