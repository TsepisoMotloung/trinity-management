export declare enum EventStatus {
    DRAFT = "DRAFT",
    QUOTED = "QUOTED",
    CONFIRMED = "CONFIRMED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare class CreateEventDto {
    name: string;
    eventType: string;
    description?: string;
    clientId: string;
    venue: string;
    venueAddress?: string;
    startDate: string;
    endDate: string;
    setupTime?: string;
    requirements?: string;
    notes?: string;
}
export declare class UpdateEventDto {
    name?: string;
    eventType?: string;
    description?: string;
    clientId?: string;
    venue?: string;
    venueAddress?: string;
    startDate?: string;
    endDate?: string;
    setupTime?: string;
    status?: EventStatus;
    requirements?: string;
    notes?: string;
}
export declare class BookEquipmentDto {
    equipmentId: string;
    quantity?: number;
    notes?: string;
}
export declare class BookMultipleEquipmentDto {
    items: BookEquipmentDto[];
}
export declare class AssignStaffDto {
    userId: string;
    role: string;
    notes?: string;
}
export declare class CalendarQueryDto {
    startDate: string;
    endDate: string;
    status?: string;
    clientId?: string;
}
