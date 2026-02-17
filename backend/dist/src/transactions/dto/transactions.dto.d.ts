import { ItemCondition } from '@prisma/client';
export declare class CheckOutItemDto {
    equipmentId: string;
    quantity?: number;
    condition?: string;
    notes?: string;
}
export declare class CreateCheckOutDto {
    eventId: string;
    items: CheckOutItemDto[];
    notes?: string;
}
export declare class CheckInItemDto {
    equipmentId: string;
    quantity?: number;
    returnedQuantity?: number;
    condition: ItemCondition;
    damageNotes?: string;
}
export declare class CreateCheckInDto {
    eventId: string;
    items: CheckInItemDto[];
    notes?: string;
}
