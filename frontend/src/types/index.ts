// User Types
export enum Role {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Equipment Types
export enum EquipmentStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  IN_USE = 'IN_USE',
  DAMAGED = 'DAMAGED',
  UNDER_REPAIR = 'UNDER_REPAIR',
  LOST = 'LOST',
  RETIRED = 'RETIRED',
}

export interface EquipmentCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    items: number;
  };
}

export interface EquipmentItem {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: EquipmentCategory;
  serialNumber?: string;
  barcode?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentStatus: EquipmentStatus;
  quantity: number;
  unit: string;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Client Types
export interface Client {
  id: string;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    events: number;
    invoices: number;
  };
}

// Event Types
export enum EventStatus {
  DRAFT = 'DRAFT',
  QUOTED = 'QUOTED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Event {
  id: string;
  name: string;
  eventType: string;
  description?: string;
  clientId: string;
  client?: Client;
  venue: string;
  venueAddress?: string;
  startDate: string;
  endDate: string;
  setupTime?: string;
  status: EventStatus;
  requirements?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  equipmentBookings?: EventEquipmentBooking[];
  staffAssignments?: StaffAssignment[];
  _count?: {
    equipmentBookings: number;
    staffAssignments: number;
  };
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_OUT = 'CHECKED_OUT',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

export interface EventEquipmentBooking {
  id: string;
  eventId: string;
  equipmentId: string;
  equipment?: EquipmentItem;
  quantity: number;
  notes?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StaffAssignment {
  id: string;
  eventId: string;
  userId: string;
  user?: User;
  role: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Pagination Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  take: number;
}

// Action Log Types
export interface ActionLog {
  id: string;
  userId?: string;
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
