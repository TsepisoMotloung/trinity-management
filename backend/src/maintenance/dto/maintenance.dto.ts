import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { MaintenancePriority, MaintenanceStatus } from '@prisma/client';

export class CreateMaintenanceTicketDto {
  @ApiProperty()
  @IsString()
  equipmentId: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  reportedIssue: string;

  @ApiPropertyOptional({ enum: MaintenancePriority })
  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;
}

export class UpdateMaintenanceTicketDto extends PartialType(
  CreateMaintenanceTicketDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  repairNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorName?: string;
}

export class UpdateMaintenanceStatusDto {
  @ApiProperty({ enum: MaintenanceStatus })
  @IsEnum(MaintenanceStatus)
  status: MaintenanceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteMaintenanceDto {
  @ApiProperty()
  @IsString()
  repairNotes: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({
    description: 'Set equipment back to available after repair',
  })
  @IsOptional()
  setAvailable?: boolean;
}
