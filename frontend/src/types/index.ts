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
  isApproved: boolean;
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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
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
  items?: { id: string; currentStatus: EquipmentStatus; purchasePrice?: number }[];
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
  notes?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  bookings?: EventEquipmentBooking[];
  _count?: {
    maintenanceTickets: number;
    statusHistory: number;
  };
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
  quoteId?: string;
  originQuote?: Pick<Quote, 'id' | 'quoteNumber' | 'total' | 'status' | 'quoteType'>;
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
  notes?: string;
  status: BookingStatus;
  reservedFrom?: string;
  reservedUntil?: string;
  event?: Pick<Event, 'id' | 'name' | 'startDate' | 'endDate' | 'status'>;
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

// Quote Types
export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface QuoteLineItem {
  id: string;
  quoteId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  clientId: string;
  client?: Client;
  eventId?: string;
  event?: Event;
  createdById: string;
  createdBy?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
  quoteType: string;
  proposedEventName?: string;
  proposedEventType?: string;
  proposedStartDate?: string;
  proposedEndDate?: string;
  proposedVenue?: string;
  proposedVenueAddress?: string;
  issueDate: string;
  validUntil: string;
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  status: QuoteStatus;
  notes?: string;
  terms?: string;
  pdfUrl?: string;
  acceptToken?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  sentAt?: string;
  sentToEmail?: string;
  lineItems?: QuoteLineItem[];
  invoices?: Pick<Invoice, 'id' | 'invoiceNumber' | 'status' | 'total'>[];
  originEvents?: Pick<Event, 'id' | 'name'>[];
  _count?: { invoices: number };
  createdAt: string;
  updatedAt: string;
}

// Invoice Types
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  ECOCASH = 'ECOCASH',
  MPESA = 'MPESA',
  EFT = 'EFT',
  CARD = 'CARD',
  OTHER = 'OTHER',
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoice?: Invoice;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  proofOfPaymentUrl?: string;
  notes?: string;
  paymentDate: string;
  recordedById: string;
  recordedBy?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: Client;
  eventId?: string;
  event?: Event;
  quoteId?: string;
  quote?: Pick<Quote, 'id' | 'quoteNumber' | 'status'>;
  createdById: string;
  createdBy?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue?: number;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  lineItems?: InvoiceLineItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

// Maintenance Types
export enum MaintenanceStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_PARTS = 'WAITING_PARTS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface MaintenanceTicket {
  id: string;
  equipmentId: string;
  equipment?: EquipmentItem;
  title: string;
  description?: string;
  reportedIssue: string;
  diagnosis?: string;
  repairNotes?: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  createdById: string;
  createdBy?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
  assignedToId?: string;
  assignedTo?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
  vendorName?: string;
  startedAt?: string;
  completedAt?: string;
  returnToServiceAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Transaction Types
export enum ItemCondition {
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  DAMAGED = 'DAMAGED',
  LOST = 'LOST',
}

export interface CheckOutItem {
  id: string;
  equipmentId: string;
  equipment?: EquipmentItem;
  condition?: string;
  notes?: string;
}

export interface CheckOutTransaction {
  id: string;
  eventId: string;
  event?: Pick<Event, 'id' | 'name'>;
  checkedOutBy: string;
  checkedOutByUser?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
  checkedOutAt: string;
  notes?: string;
  items: CheckOutItem[];
}

export interface CheckInItem {
  id: string;
  equipmentId: string;
  equipment?: EquipmentItem;
  condition: ItemCondition;
  damageNotes?: string;
}

export interface CheckInTransaction {
  id: string;
  eventId: string;
  event?: Pick<Event, 'id' | 'name'>;
  checkedInBy: string;
  checkedInByUser?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
  checkedInAt: string;
  notes?: string;
  items: CheckInItem[];
}

// Pagination Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  take: number;
}

export interface QuotesResponse {
  quotes: Quote[];
  total: number;
  skip: number;
  take: number;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  total: number;
  skip: number;
  take: number;
}

export interface PaymentsResponse {
  payments: Payment[];
  total: number;
  skip: number;
  take: number;
}

export interface MaintenanceResponse {
  tickets: MaintenanceTicket[];
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

// Notification Types
export enum NotificationType {
  EVENT_UPCOMING_14D = 'EVENT_UPCOMING_14D',
  EVENT_UPCOMING_7D = 'EVENT_UPCOMING_7D',
  EVENT_UPCOMING_3D = 'EVENT_UPCOMING_3D',
  EVENT_UPCOMING_2D = 'EVENT_UPCOMING_2D',
  EVENT_UPCOMING_1D = 'EVENT_UPCOMING_1D',
  QUOTE_ACCEPTED = 'QUOTE_ACCEPTED',
  QUOTE_REJECTED = 'QUOTE_REJECTED',
  INVOICE_OVERDUE = 'INVOICE_OVERDUE',
  INVOICE_PAID = 'INVOICE_PAID',
  EQUIPMENT_RESERVED = 'EQUIPMENT_RESERVED',
  EQUIPMENT_OVERDUE_RETURN = 'EQUIPMENT_OVERDUE_RETURN',
  MAINTENANCE_DUE = 'MAINTENANCE_DUE',
  SYSTEM = 'SYSTEM',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  readAt?: string;
  userId?: string;
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  skip: number;
  take: number;
}

export interface EquipmentStatistics {
  totalItems: number;
  totalCategories: number;
  totalAvailable: number;
  totalReserved: number;
  totalInUse: number;
  totalDamaged: number;
  totalRetired: number;
  totalInventoryValue: number;
  recentBookings: number;
  upcomingBookings: number;
  categories: {
    id: string;
    name: string;
    totalItems: number;
    available: number;
    reserved: number;
    inUse: number;
    damaged: number;
    totalValue: number;
  }[];
}

export interface FinancialSummary {
  totalRevenue: number;
  outstandingAmount: number;
  outstandingCount: number;
  overdueAmount: number;
  overdueCount: number;
  pendingQuotes: number;
  acceptedQuotesValue: number;
  acceptedQuotesCount: number;
  recentPayments: Payment[];
}
