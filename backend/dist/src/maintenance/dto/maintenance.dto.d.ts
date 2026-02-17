import { MaintenancePriority, MaintenanceStatus } from '@prisma/client';
export declare class CreateMaintenanceTicketDto {
    equipmentId: string;
    title: string;
    description: string;
    reportedIssue: string;
    priority?: MaintenancePriority;
}
declare const UpdateMaintenanceTicketDto_base: import("@nestjs/common").Type<Partial<CreateMaintenanceTicketDto>>;
export declare class UpdateMaintenanceTicketDto extends UpdateMaintenanceTicketDto_base {
    assignedToId?: string;
    diagnosis?: string;
    repairNotes?: string;
    vendorName?: string;
}
export declare class UpdateMaintenanceStatusDto {
    status: MaintenanceStatus;
    notes?: string;
}
export declare class CompleteMaintenanceDto {
    repairNotes: string;
    diagnosis?: string;
    setAvailable?: boolean;
}
export {};
