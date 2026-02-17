export declare enum EquipmentStatus {
    AVAILABLE = "AVAILABLE",
    RESERVED = "RESERVED",
    IN_USE = "IN_USE",
    DAMAGED = "DAMAGED",
    UNDER_REPAIR = "UNDER_REPAIR",
    LOST = "LOST",
    RETIRED = "RETIRED"
}
export declare class CreateEquipmentCategoryDto {
    name: string;
    description?: string;
}
export declare class UpdateEquipmentCategoryDto {
    name?: string;
    description?: string;
}
export declare class CreateEquipmentItemDto {
    name: string;
    description?: string;
    categoryId: string;
    serialNumber?: string;
    barcode?: string;
    purchaseDate?: string;
    purchasePrice?: number;
    quantity?: number;
    unit?: string;
    notes?: string;
    imageUrl?: string;
}
export declare class UpdateEquipmentItemDto {
    name?: string;
    description?: string;
    categoryId?: string;
    serialNumber?: string;
    barcode?: string;
    purchaseDate?: string;
    purchasePrice?: number;
    quantity?: number;
    unit?: string;
    notes?: string;
    imageUrl?: string;
}
export declare class UpdateEquipmentStatusDto {
    status: EquipmentStatus;
    reason?: string;
}
