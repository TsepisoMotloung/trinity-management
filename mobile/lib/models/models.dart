// ── Enums ──

enum Role { admin, employee }

extension RoleExt on Role {
  String get value => name.toUpperCase();
  static Role fromString(String s) =>
      Role.values.firstWhere((e) => e.value == s.toUpperCase(), orElse: () => Role.employee);
}

enum EquipmentStatus { available, reserved, inUse, damaged, underRepair, lost, retired }

extension EquipmentStatusExt on EquipmentStatus {
  String get value {
    switch (this) {
      case EquipmentStatus.available: return 'AVAILABLE';
      case EquipmentStatus.reserved: return 'RESERVED';
      case EquipmentStatus.inUse: return 'IN_USE';
      case EquipmentStatus.damaged: return 'DAMAGED';
      case EquipmentStatus.underRepair: return 'UNDER_REPAIR';
      case EquipmentStatus.lost: return 'LOST';
      case EquipmentStatus.retired: return 'RETIRED';
    }
  }

  String get label {
    switch (this) {
      case EquipmentStatus.available: return 'Available';
      case EquipmentStatus.reserved: return 'Reserved';
      case EquipmentStatus.inUse: return 'In Use';
      case EquipmentStatus.damaged: return 'Damaged';
      case EquipmentStatus.underRepair: return 'Under Repair';
      case EquipmentStatus.lost: return 'Lost';
      case EquipmentStatus.retired: return 'Retired';
    }
  }

  static EquipmentStatus fromString(String s) => EquipmentStatus.values.firstWhere(
      (e) => e.value == s.toUpperCase(),
      orElse: () => EquipmentStatus.available);
}

enum EventStatus { draft, quoted, confirmed, inProgress, completed, cancelled }

extension EventStatusExt on EventStatus {
  String get value {
    switch (this) {
      case EventStatus.draft: return 'DRAFT';
      case EventStatus.quoted: return 'QUOTED';
      case EventStatus.confirmed: return 'CONFIRMED';
      case EventStatus.inProgress: return 'IN_PROGRESS';
      case EventStatus.completed: return 'COMPLETED';
      case EventStatus.cancelled: return 'CANCELLED';
    }
  }

  String get label {
    switch (this) {
      case EventStatus.draft: return 'Draft';
      case EventStatus.quoted: return 'Quoted';
      case EventStatus.confirmed: return 'Confirmed';
      case EventStatus.inProgress: return 'In Progress';
      case EventStatus.completed: return 'Completed';
      case EventStatus.cancelled: return 'Cancelled';
    }
  }

  static EventStatus fromString(String s) => EventStatus.values.firstWhere(
      (e) => e.value == s.toUpperCase(),
      orElse: () => EventStatus.draft);
}

enum BookingStatus { pending, confirmed, checkedOut, returned, cancelled }

extension BookingStatusExt on BookingStatus {
  String get value {
    switch (this) {
      case BookingStatus.pending: return 'PENDING';
      case BookingStatus.confirmed: return 'CONFIRMED';
      case BookingStatus.checkedOut: return 'CHECKED_OUT';
      case BookingStatus.returned: return 'RETURNED';
      case BookingStatus.cancelled: return 'CANCELLED';
    }
  }

  static BookingStatus fromString(String s) => BookingStatus.values.firstWhere(
      (e) => e.value == s.toUpperCase(),
      orElse: () => BookingStatus.pending);
}

enum QuoteStatus { draft, sent, accepted, rejected, expired }

extension QuoteStatusExt on QuoteStatus {
  String get value => name.toUpperCase();
  String get label => name[0].toUpperCase() + name.substring(1);
  static QuoteStatus fromString(String s) => QuoteStatus.values.firstWhere(
      (e) => e.value == s.toUpperCase(),
      orElse: () => QuoteStatus.draft);
}

enum InvoiceStatus { draft, sent, partiallyPaid, paid, overdue, cancelled }

extension InvoiceStatusExt on InvoiceStatus {
  String get value {
    switch (this) {
      case InvoiceStatus.draft: return 'DRAFT';
      case InvoiceStatus.sent: return 'SENT';
      case InvoiceStatus.partiallyPaid: return 'PARTIALLY_PAID';
      case InvoiceStatus.paid: return 'PAID';
      case InvoiceStatus.overdue: return 'OVERDUE';
      case InvoiceStatus.cancelled: return 'CANCELLED';
    }
  }

  String get label {
    switch (this) {
      case InvoiceStatus.draft: return 'Draft';
      case InvoiceStatus.sent: return 'Sent';
      case InvoiceStatus.partiallyPaid: return 'Partially Paid';
      case InvoiceStatus.paid: return 'Paid';
      case InvoiceStatus.overdue: return 'Overdue';
      case InvoiceStatus.cancelled: return 'Cancelled';
    }
  }

  static InvoiceStatus fromString(String s) => InvoiceStatus.values.firstWhere(
      (e) => e.value == s.toUpperCase(),
      orElse: () => InvoiceStatus.draft);
}

enum PaymentMethod { cash, ecocash, mpesa, eft, card, other }

extension PaymentMethodExt on PaymentMethod {
  String get value => name.toUpperCase();
  String get label => name[0].toUpperCase() + name.substring(1);
  static PaymentMethod fromString(String s) => PaymentMethod.values.firstWhere(
      (e) => e.value == s.toUpperCase(),
      orElse: () => PaymentMethod.cash);
}

enum MaintenanceStatus { open, inProgress, waitingParts, completed, cancelled }

extension MaintenanceStatusExt on MaintenanceStatus {
  String get value {
    switch (this) {
      case MaintenanceStatus.open: return 'OPEN';
      case MaintenanceStatus.inProgress: return 'IN_PROGRESS';
      case MaintenanceStatus.waitingParts: return 'WAITING_PARTS';
      case MaintenanceStatus.completed: return 'COMPLETED';
      case MaintenanceStatus.cancelled: return 'CANCELLED';
    }
  }

  String get label {
    switch (this) {
      case MaintenanceStatus.open: return 'Open';
      case MaintenanceStatus.inProgress: return 'In Progress';
      case MaintenanceStatus.waitingParts: return 'Waiting Parts';
      case MaintenanceStatus.completed: return 'Completed';
      case MaintenanceStatus.cancelled: return 'Cancelled';
    }
  }

  static MaintenanceStatus fromString(String s) => MaintenanceStatus.values.firstWhere(
      (e) => e.value == s.toUpperCase(),
      orElse: () => MaintenanceStatus.open);
}

enum MaintenancePriority { low, medium, high, critical }

extension MaintenancePriorityExt on MaintenancePriority {
  String get value => name.toUpperCase();
  String get label => name[0].toUpperCase() + name.substring(1);
  static MaintenancePriority fromString(String s) => MaintenancePriority.values.firstWhere(
      (e) => e.value == s.toUpperCase(),
      orElse: () => MaintenancePriority.medium);
}

enum ItemCondition { good, fair, damaged, lost }

extension ItemConditionExt on ItemCondition {
  String get value => name.toUpperCase();
  String get label => name[0].toUpperCase() + name.substring(1);
  static ItemCondition fromString(String s) => ItemCondition.values.firstWhere(
      (e) => e.value == s.toUpperCase(),
      orElse: () => ItemCondition.good);
}

// ── Models ──

class User {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? phone;
  final Role role;
  final bool isActive;
  final bool isApproved;
  final String? lastLoginAt;
  final String createdAt;
  final String updatedAt;

  User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.phone,
    required this.role,
    required this.isActive,
    required this.isApproved,
    this.lastLoginAt,
    required this.createdAt,
    required this.updatedAt,
  });

  String get fullName => '$firstName $lastName';
  String get initials => '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'.toUpperCase();

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] ?? '',
        email: json['email'] ?? '',
        firstName: json['firstName'] ?? '',
        lastName: json['lastName'] ?? '',
        phone: json['phone'],
        role: RoleExt.fromString(json['role'] ?? 'EMPLOYEE'),
        isActive: json['isActive'] ?? true,
        isApproved: json['isApproved'] ?? false,
        lastLoginAt: json['lastLoginAt'],
        createdAt: json['createdAt'] ?? '',
        updatedAt: json['updatedAt'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'email': email,
        'firstName': firstName,
        'lastName': lastName,
        'phone': phone,
        'role': role.value,
      };
}

class EquipmentCategory {
  final String id;
  final String name;
  final String? description;
  final int itemCount;

  EquipmentCategory({required this.id, required this.name, this.description, this.itemCount = 0});

  factory EquipmentCategory.fromJson(Map<String, dynamic> json) => EquipmentCategory(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        description: json['description'],
        itemCount: json['_count']?['items'] ?? 0,
      );
}

class EquipmentItem {
  final String id;
  final String name;
  final String? description;
  final String categoryId;
  final EquipmentCategory? category;
  final String? serialNumber;
  final String? barcode;
  final String? purchaseDate;
  final double? purchasePrice;
  final EquipmentStatus currentStatus;
  final String? notes;
  final String? imageUrl;
  final String createdAt;
  final String updatedAt;

  EquipmentItem({
    required this.id,
    required this.name,
    this.description,
    required this.categoryId,
    this.category,
    this.serialNumber,
    this.barcode,
    this.purchaseDate,
    this.purchasePrice,
    required this.currentStatus,
    this.notes,
    this.imageUrl,
    required this.createdAt,
    required this.updatedAt,
  });

  factory EquipmentItem.fromJson(Map<String, dynamic> json) => EquipmentItem(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        description: json['description'],
        categoryId: json['categoryId'] ?? '',
        category: json['category'] != null ? EquipmentCategory.fromJson(json['category']) : null,
        serialNumber: json['serialNumber'],
        barcode: json['barcode'],
        purchaseDate: json['purchaseDate'],
        purchasePrice: (json['purchasePrice'] as num?)?.toDouble(),
        currentStatus: EquipmentStatusExt.fromString(json['currentStatus'] ?? 'AVAILABLE'),
        notes: json['notes'],
        imageUrl: json['imageUrl'],
        createdAt: json['createdAt'] ?? '',
        updatedAt: json['updatedAt'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'description': description,
        'categoryId': categoryId,
        'serialNumber': serialNumber,
        'barcode': barcode,
        'purchaseDate': purchaseDate,
        'purchasePrice': purchasePrice,
        'notes': notes,
      };
}

class Client {
  final String id;
  final String name;
  final String? contactPerson;
  final String? email;
  final String phone;
  final String? alternatePhone;
  final String? address;
  final String? city;
  final String? billingAddress;
  final String? taxId;
  final String? notes;
  final bool isActive;
  final int eventCount;
  final int invoiceCount;
  final String createdAt;
  final String updatedAt;

  Client({
    required this.id,
    required this.name,
    this.contactPerson,
    this.email,
    required this.phone,
    this.alternatePhone,
    this.address,
    this.city,
    this.billingAddress,
    this.taxId,
    this.notes,
    required this.isActive,
    this.eventCount = 0,
    this.invoiceCount = 0,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Client.fromJson(Map<String, dynamic> json) => Client(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        contactPerson: json['contactPerson'],
        email: json['email'],
        phone: json['phone'] ?? '',
        alternatePhone: json['alternatePhone'],
        address: json['address'],
        city: json['city'],
        billingAddress: json['billingAddress'],
        taxId: json['taxId'],
        notes: json['notes'],
        isActive: json['isActive'] ?? true,
        eventCount: json['_count']?['events'] ?? 0,
        invoiceCount: json['_count']?['invoices'] ?? 0,
        createdAt: json['createdAt'] ?? '',
        updatedAt: json['updatedAt'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'contactPerson': contactPerson,
        'email': email,
        'phone': phone,
        'alternatePhone': alternatePhone,
        'address': address,
        'city': city,
        'billingAddress': billingAddress,
        'taxId': taxId,
        'notes': notes,
      };
}

class EventEquipmentBooking {
  final String id;
  final String eventId;
  final String equipmentId;
  final EquipmentItem? equipment;
  final String? notes;
  final BookingStatus status;
  final String createdAt;

  EventEquipmentBooking({
    required this.id,
    required this.eventId,
    required this.equipmentId,
    this.equipment,
    this.notes,
    required this.status,
    required this.createdAt,
  });

  factory EventEquipmentBooking.fromJson(Map<String, dynamic> json) => EventEquipmentBooking(
        id: json['id'] ?? '',
        eventId: json['eventId'] ?? '',
        equipmentId: json['equipmentId'] ?? '',
        equipment: json['equipment'] != null ? EquipmentItem.fromJson(json['equipment']) : null,
        notes: json['notes'],
        status: BookingStatusExt.fromString(json['status'] ?? 'PENDING'),
        createdAt: json['createdAt'] ?? '',
      );
}

class StaffAssignment {
  final String id;
  final String eventId;
  final String userId;
  final User? user;
  final String role;
  final String? notes;
  final String createdAt;

  StaffAssignment({
    required this.id,
    required this.eventId,
    required this.userId,
    this.user,
    required this.role,
    this.notes,
    required this.createdAt,
  });

  factory StaffAssignment.fromJson(Map<String, dynamic> json) => StaffAssignment(
        id: json['id'] ?? '',
        eventId: json['eventId'] ?? '',
        userId: json['userId'] ?? '',
        user: json['user'] != null ? User.fromJson(json['user']) : null,
        role: json['role'] ?? '',
        notes: json['notes'],
        createdAt: json['createdAt'] ?? '',
      );
}

class Event {
  final String id;
  final String name;
  final String eventType;
  final String? description;
  final String clientId;
  final Client? client;
  final String? quoteId;
  final String venue;
  final String? venueAddress;
  final String startDate;
  final String endDate;
  final String? setupTime;
  final EventStatus status;
  final String? requirements;
  final String? notes;
  final List<EventEquipmentBooking>? equipmentBookings;
  final List<StaffAssignment>? staffAssignments;
  final int equipmentCount;
  final int staffCount;
  final String createdAt;
  final String updatedAt;

  Event({
    required this.id,
    required this.name,
    required this.eventType,
    this.description,
    required this.clientId,
    this.client,
    this.quoteId,
    required this.venue,
    this.venueAddress,
    required this.startDate,
    required this.endDate,
    this.setupTime,
    required this.status,
    this.requirements,
    this.notes,
    this.equipmentBookings,
    this.staffAssignments,
    this.equipmentCount = 0,
    this.staffCount = 0,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Event.fromJson(Map<String, dynamic> json) => Event(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        eventType: json['eventType'] ?? '',
        description: json['description'],
        clientId: json['clientId'] ?? '',
        client: json['client'] != null ? Client.fromJson(json['client']) : null,
        quoteId: json['quoteId'],
        venue: json['venue'] ?? '',
        venueAddress: json['venueAddress'],
        startDate: json['startDate'] ?? '',
        endDate: json['endDate'] ?? '',
        setupTime: json['setupTime'],
        status: EventStatusExt.fromString(json['status'] ?? 'DRAFT'),
        requirements: json['requirements'],
        notes: json['notes'],
        equipmentBookings: (json['equipmentBookings'] as List?)
            ?.map((e) => EventEquipmentBooking.fromJson(e))
            .toList(),
        staffAssignments: (json['staffAssignments'] as List?)
            ?.map((e) => StaffAssignment.fromJson(e))
            .toList(),
        equipmentCount: json['_count']?['equipmentBookings'] ?? 0,
        staffCount: json['_count']?['staffAssignments'] ?? 0,
        createdAt: json['createdAt'] ?? '',
        updatedAt: json['updatedAt'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'eventType': eventType,
        'description': description,
        'clientId': clientId,
        'venue': venue,
        'venueAddress': venueAddress,
        'startDate': startDate,
        'endDate': endDate,
        'setupTime': setupTime,
        'requirements': requirements,
        'notes': notes,
      };
}

class QuoteLineItem {
  final String? id;
  final String description;
  final int quantity;
  final double unitPrice;
  final double total;

  QuoteLineItem({this.id, required this.description, required this.quantity, required this.unitPrice, required this.total});

  factory QuoteLineItem.fromJson(Map<String, dynamic> json) => QuoteLineItem(
        id: json['id'],
        description: json['description'] ?? '',
        quantity: json['quantity'] ?? 1,
        unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0,
        total: (json['total'] as num?)?.toDouble() ?? 0,
      );

  Map<String, dynamic> toJson() => {
        'description': description,
        'quantity': quantity,
        'unitPrice': unitPrice,
      };
}

class Quote {
  final String id;
  final String quoteNumber;
  final String clientId;
  final Client? client;
  final String? eventId;
  final String createdById;
  final User? createdBy;
  final String quoteType;
  final String? proposedEventName;
  final String? proposedEventType;
  final String? proposedStartDate;
  final String? proposedEndDate;
  final String? proposedVenue;
  final String? proposedVenueAddress;
  final String issueDate;
  final String validUntil;
  final double subtotal;
  final double discount;
  final double taxAmount;
  final double total;
  final QuoteStatus status;
  final String? notes;
  final String? terms;
  final List<QuoteLineItem>? lineItems;
  final String createdAt;
  final String updatedAt;

  Quote({
    required this.id,
    required this.quoteNumber,
    required this.clientId,
    this.client,
    this.eventId,
    required this.createdById,
    this.createdBy,
    required this.quoteType,
    this.proposedEventName,
    this.proposedEventType,
    this.proposedStartDate,
    this.proposedEndDate,
    this.proposedVenue,
    this.proposedVenueAddress,
    required this.issueDate,
    required this.validUntil,
    required this.subtotal,
    required this.discount,
    required this.taxAmount,
    required this.total,
    required this.status,
    this.notes,
    this.terms,
    this.lineItems,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Quote.fromJson(Map<String, dynamic> json) => Quote(
        id: json['id'] ?? '',
        quoteNumber: json['quoteNumber'] ?? '',
        clientId: json['clientId'] ?? '',
        client: json['client'] != null ? Client.fromJson(json['client']) : null,
        eventId: json['eventId'],
        createdById: json['createdById'] ?? '',
        createdBy: json['createdBy'] != null ? User.fromJson(json['createdBy']) : null,
        quoteType: json['quoteType'] ?? '',
        proposedEventName: json['proposedEventName'],
        proposedEventType: json['proposedEventType'],
        proposedStartDate: json['proposedStartDate'],
        proposedEndDate: json['proposedEndDate'],
        proposedVenue: json['proposedVenue'],
        proposedVenueAddress: json['proposedVenueAddress'],
        issueDate: json['issueDate'] ?? '',
        validUntil: json['validUntil'] ?? '',
        subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0,
        discount: (json['discount'] as num?)?.toDouble() ?? 0,
        taxAmount: (json['taxAmount'] as num?)?.toDouble() ?? 0,
        total: (json['total'] as num?)?.toDouble() ?? 0,
        status: QuoteStatusExt.fromString(json['status'] ?? 'DRAFT'),
        notes: json['notes'],
        terms: json['terms'],
        lineItems: (json['lineItems'] as List?)?.map((e) => QuoteLineItem.fromJson(e)).toList(),
        createdAt: json['createdAt'] ?? '',
        updatedAt: json['updatedAt'] ?? '',
      );
}

class InvoiceLineItem {
  final String? id;
  final String description;
  final int quantity;
  final double unitPrice;
  final double total;

  InvoiceLineItem({this.id, required this.description, required this.quantity, required this.unitPrice, required this.total});

  factory InvoiceLineItem.fromJson(Map<String, dynamic> json) => InvoiceLineItem(
        id: json['id'],
        description: json['description'] ?? '',
        quantity: json['quantity'] ?? 1,
        unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0,
        total: (json['total'] as num?)?.toDouble() ?? 0,
      );

  Map<String, dynamic> toJson() => {
        'description': description,
        'quantity': quantity,
        'unitPrice': unitPrice,
      };
}

class Payment {
  final String id;
  final String invoiceId;
  final double amount;
  final PaymentMethod paymentMethod;
  final String? referenceNumber;
  final String? notes;
  final String paymentDate;
  final User? recordedBy;
  final String createdAt;

  Payment({
    required this.id,
    required this.invoiceId,
    required this.amount,
    required this.paymentMethod,
    this.referenceNumber,
    this.notes,
    required this.paymentDate,
    this.recordedBy,
    required this.createdAt,
  });

  factory Payment.fromJson(Map<String, dynamic> json) => Payment(
        id: json['id'] ?? '',
        invoiceId: json['invoiceId'] ?? '',
        amount: (json['amount'] as num?)?.toDouble() ?? 0,
        paymentMethod: PaymentMethodExt.fromString(json['paymentMethod'] ?? 'CASH'),
        referenceNumber: json['referenceNumber'],
        notes: json['notes'],
        paymentDate: json['paymentDate'] ?? '',
        recordedBy: json['recordedBy'] != null ? User.fromJson(json['recordedBy']) : null,
        createdAt: json['createdAt'] ?? '',
      );
}

class Invoice {
  final String id;
  final String invoiceNumber;
  final String clientId;
  final Client? client;
  final String? eventId;
  final Event? event;
  final String? quoteId;
  final String createdById;
  final User? createdBy;
  final String issueDate;
  final String dueDate;
  final double subtotal;
  final double discount;
  final double taxAmount;
  final double total;
  final double amountPaid;
  final double? balanceDue;
  final InvoiceStatus status;
  final String? notes;
  final String? terms;
  final List<InvoiceLineItem>? lineItems;
  final List<Payment>? payments;
  final String createdAt;
  final String updatedAt;

  Invoice({
    required this.id,
    required this.invoiceNumber,
    required this.clientId,
    this.client,
    this.eventId,
    this.event,
    this.quoteId,
    required this.createdById,
    this.createdBy,
    required this.issueDate,
    required this.dueDate,
    required this.subtotal,
    required this.discount,
    required this.taxAmount,
    required this.total,
    required this.amountPaid,
    this.balanceDue,
    required this.status,
    this.notes,
    this.terms,
    this.lineItems,
    this.payments,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Invoice.fromJson(Map<String, dynamic> json) => Invoice(
        id: json['id'] ?? '',
        invoiceNumber: json['invoiceNumber'] ?? '',
        clientId: json['clientId'] ?? '',
        client: json['client'] != null ? Client.fromJson(json['client']) : null,
        eventId: json['eventId'],
        event: json['event'] != null ? Event.fromJson(json['event']) : null,
        quoteId: json['quoteId'],
        createdById: json['createdById'] ?? '',
        createdBy: json['createdBy'] != null ? User.fromJson(json['createdBy']) : null,
        issueDate: json['issueDate'] ?? '',
        dueDate: json['dueDate'] ?? '',
        subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0,
        discount: (json['discount'] as num?)?.toDouble() ?? 0,
        taxAmount: (json['taxAmount'] as num?)?.toDouble() ?? 0,
        total: (json['total'] as num?)?.toDouble() ?? 0,
        amountPaid: (json['amountPaid'] as num?)?.toDouble() ?? 0,
        balanceDue: (json['balanceDue'] as num?)?.toDouble(),
        status: InvoiceStatusExt.fromString(json['status'] ?? 'DRAFT'),
        notes: json['notes'],
        terms: json['terms'],
        lineItems: (json['lineItems'] as List?)?.map((e) => InvoiceLineItem.fromJson(e)).toList(),
        payments: (json['payments'] as List?)?.map((e) => Payment.fromJson(e)).toList(),
        createdAt: json['createdAt'] ?? '',
        updatedAt: json['updatedAt'] ?? '',
      );
}

class MaintenanceTicket {
  final String id;
  final String equipmentId;
  final EquipmentItem? equipment;
  final String title;
  final String? description;
  final String reportedIssue;
  final String? diagnosis;
  final String? repairNotes;
  final MaintenancePriority priority;
  final MaintenanceStatus status;
  final String createdById;
  final User? createdBy;
  final String? assignedToId;
  final User? assignedTo;
  final String? vendorName;
  final String? startedAt;
  final String? completedAt;
  final String createdAt;
  final String updatedAt;

  MaintenanceTicket({
    required this.id,
    required this.equipmentId,
    this.equipment,
    required this.title,
    this.description,
    required this.reportedIssue,
    this.diagnosis,
    this.repairNotes,
    required this.priority,
    required this.status,
    required this.createdById,
    this.createdBy,
    this.assignedToId,
    this.assignedTo,
    this.vendorName,
    this.startedAt,
    this.completedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MaintenanceTicket.fromJson(Map<String, dynamic> json) => MaintenanceTicket(
        id: json['id'] ?? '',
        equipmentId: json['equipmentId'] ?? '',
        equipment: json['equipment'] != null ? EquipmentItem.fromJson(json['equipment']) : null,
        title: json['title'] ?? '',
        description: json['description'],
        reportedIssue: json['reportedIssue'] ?? '',
        diagnosis: json['diagnosis'],
        repairNotes: json['repairNotes'],
        priority: MaintenancePriorityExt.fromString(json['priority'] ?? 'MEDIUM'),
        status: MaintenanceStatusExt.fromString(json['status'] ?? 'OPEN'),
        createdById: json['createdById'] ?? '',
        createdBy: json['createdBy'] != null ? User.fromJson(json['createdBy']) : null,
        assignedToId: json['assignedToId'],
        assignedTo: json['assignedTo'] != null ? User.fromJson(json['assignedTo']) : null,
        vendorName: json['vendorName'],
        startedAt: json['startedAt'],
        completedAt: json['completedAt'],
        createdAt: json['createdAt'] ?? '',
        updatedAt: json['updatedAt'] ?? '',
      );
}

class CheckOutItem {
  final String id;
  final String equipmentId;
  final EquipmentItem? equipment;
  final String? condition;
  final String? notes;

  CheckOutItem({required this.id, required this.equipmentId, this.equipment, this.condition, this.notes});

  factory CheckOutItem.fromJson(Map<String, dynamic> json) => CheckOutItem(
        id: json['id'] ?? '',
        equipmentId: json['equipmentId'] ?? '',
        equipment: json['equipment'] != null ? EquipmentItem.fromJson(json['equipment']) : null,
        condition: json['condition'],
        notes: json['notes'],
      );
}

class CheckOutTransaction {
  final String id;
  final String eventId;
  final Map<String, dynamic>? event;
  final String checkedOutBy;
  final User? checkedOutByUser;
  final String checkedOutAt;
  final String? notes;
  final List<CheckOutItem> items;

  CheckOutTransaction({
    required this.id,
    required this.eventId,
    this.event,
    required this.checkedOutBy,
    this.checkedOutByUser,
    required this.checkedOutAt,
    this.notes,
    required this.items,
  });

  factory CheckOutTransaction.fromJson(Map<String, dynamic> json) => CheckOutTransaction(
        id: json['id'] ?? '',
        eventId: json['eventId'] ?? '',
        event: json['event'],
        checkedOutBy: json['checkedOutBy'] ?? '',
        checkedOutByUser: json['checkedOutByUser'] != null ? User.fromJson(json['checkedOutByUser']) : null,
        checkedOutAt: json['checkedOutAt'] ?? '',
        notes: json['notes'],
        items: (json['items'] as List?)?.map((e) => CheckOutItem.fromJson(e)).toList() ?? [],
      );
}

class CheckInItem {
  final String id;
  final String equipmentId;
  final EquipmentItem? equipment;
  final ItemCondition condition;
  final String? damageNotes;

  CheckInItem({required this.id, required this.equipmentId, this.equipment, required this.condition, this.damageNotes});

  factory CheckInItem.fromJson(Map<String, dynamic> json) => CheckInItem(
        id: json['id'] ?? '',
        equipmentId: json['equipmentId'] ?? '',
        equipment: json['equipment'] != null ? EquipmentItem.fromJson(json['equipment']) : null,
        condition: ItemConditionExt.fromString(json['condition'] ?? 'GOOD'),
        damageNotes: json['damageNotes'],
      );
}

class CheckInTransaction {
  final String id;
  final String eventId;
  final Map<String, dynamic>? event;
  final String checkedInBy;
  final User? checkedInByUser;
  final String checkedInAt;
  final String? notes;
  final List<CheckInItem> items;

  CheckInTransaction({
    required this.id,
    required this.eventId,
    this.event,
    required this.checkedInBy,
    this.checkedInByUser,
    required this.checkedInAt,
    this.notes,
    required this.items,
  });

  factory CheckInTransaction.fromJson(Map<String, dynamic> json) => CheckInTransaction(
        id: json['id'] ?? '',
        eventId: json['eventId'] ?? '',
        event: json['event'],
        checkedInBy: json['checkedInBy'] ?? '',
        checkedInByUser: json['checkedInByUser'] != null ? User.fromJson(json['checkedInByUser']) : null,
        checkedInAt: json['checkedInAt'] ?? '',
        notes: json['notes'],
        items: (json['items'] as List?)?.map((e) => CheckInItem.fromJson(e)).toList() ?? [],
      );
}

class ActionLog {
  final String id;
  final String? userId;
  final User? user;
  final String action;
  final String entityType;
  final String? entityId;
  final Map<String, dynamic>? details;
  final String createdAt;

  ActionLog({
    required this.id,
    this.userId,
    this.user,
    required this.action,
    required this.entityType,
    this.entityId,
    this.details,
    required this.createdAt,
  });

  factory ActionLog.fromJson(Map<String, dynamic> json) => ActionLog(
        id: json['id'] ?? '',
        userId: json['userId'],
        user: json['user'] != null ? User.fromJson(json['user']) : null,
        action: json['action'] ?? '',
        entityType: json['entityType'] ?? '',
        entityId: json['entityId'],
        details: json['details'],
        createdAt: json['createdAt'] ?? '',
      );
}

class AppNotification {
  final String id;
  final String type;
  final String title;
  final String message;
  final String priority;
  final bool isRead;
  final String? readAt;
  final String createdAt;

  AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.priority,
    required this.isRead,
    this.readAt,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: json['id'] ?? '',
        type: json['type'] ?? '',
        title: json['title'] ?? '',
        message: json['message'] ?? '',
        priority: json['priority'] ?? 'NORMAL',
        isRead: json['isRead'] ?? false,
        readAt: json['readAt'],
        createdAt: json['createdAt'] ?? '',
      );
}

class EquipmentStatistics {
  final int totalItems;
  final int totalCategories;
  final int totalAvailable;
  final int totalReserved;
  final int totalInUse;
  final int totalDamaged;
  final int totalRetired;
  final double totalInventoryValue;

  EquipmentStatistics({
    required this.totalItems,
    required this.totalCategories,
    required this.totalAvailable,
    required this.totalReserved,
    required this.totalInUse,
    required this.totalDamaged,
    required this.totalRetired,
    required this.totalInventoryValue,
  });

  factory EquipmentStatistics.fromJson(Map<String, dynamic> json) => EquipmentStatistics(
        totalItems: json['totalItems'] ?? 0,
        totalCategories: json['totalCategories'] ?? 0,
        totalAvailable: json['totalAvailable'] ?? 0,
        totalReserved: json['totalReserved'] ?? 0,
        totalInUse: json['totalInUse'] ?? 0,
        totalDamaged: json['totalDamaged'] ?? 0,
        totalRetired: json['totalRetired'] ?? 0,
        totalInventoryValue: (json['totalInventoryValue'] as num?)?.toDouble() ?? 0,
      );
}

class FinancialSummary {
  final double totalRevenue;
  final double outstandingAmount;
  final int outstandingCount;
  final double overdueAmount;
  final int overdueCount;
  final int pendingQuotes;
  final double acceptedQuotesValue;
  final int acceptedQuotesCount;
  final List<Payment> recentPayments;

  FinancialSummary({
    required this.totalRevenue,
    required this.outstandingAmount,
    required this.outstandingCount,
    required this.overdueAmount,
    required this.overdueCount,
    required this.pendingQuotes,
    required this.acceptedQuotesValue,
    required this.acceptedQuotesCount,
    required this.recentPayments,
  });

  factory FinancialSummary.fromJson(Map<String, dynamic> json) => FinancialSummary(
        totalRevenue: (json['totalRevenue'] as num?)?.toDouble() ?? 0,
        outstandingAmount: (json['outstandingAmount'] as num?)?.toDouble() ?? 0,
        outstandingCount: json['outstandingCount'] ?? 0,
        overdueAmount: (json['overdueAmount'] as num?)?.toDouble() ?? 0,
        overdueCount: json['overdueCount'] ?? 0,
        pendingQuotes: json['pendingQuotes'] ?? 0,
        acceptedQuotesValue: (json['acceptedQuotesValue'] as num?)?.toDouble() ?? 0,
        acceptedQuotesCount: json['acceptedQuotesCount'] ?? 0,
        recentPayments: (json['recentPayments'] as List?)?.map((e) => Payment.fromJson(e)).toList() ?? [],
      );
}
