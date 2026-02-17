export declare class CreateClientDto {
    name: string;
    contactPerson?: string;
    email?: string;
    phone: string;
    alternatePhone?: string;
    address?: string;
    city?: string;
    billingAddress?: string;
    taxId?: string;
    notes?: string;
}
export declare class UpdateClientDto {
    name?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    alternatePhone?: string;
    address?: string;
    city?: string;
    billingAddress?: string;
    taxId?: string;
    notes?: string;
    isActive?: boolean;
}
