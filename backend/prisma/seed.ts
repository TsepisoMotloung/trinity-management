import { PrismaClient, Role, EquipmentStatus, EventStatus, BookingStatus, QuoteStatus, InvoiceStatus, PaymentMethod, MaintenanceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed with Sotho names...');

  // Clear existing data
  await prisma.payment.deleteMany();
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.quoteLineItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.checkInItem.deleteMany();
  await prisma.checkInTransaction.deleteMany();
  await prisma.checkOutItem.deleteMany();
  await prisma.checkOutTransaction.deleteMany();
  await prisma.eventEquipmentBooking.deleteMany();
  await prisma.staffAssignment.deleteMany();
  await prisma.maintenanceTicket.deleteMany();
  await prisma.equipmentStatusHistory.deleteMany();
  await prisma.equipmentItem.deleteMany();
  await prisma.equipmentCategory.deleteMany();
  await prisma.event.deleteMany();
  await prisma.client.deleteMany();
  await prisma.actionLog.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Create Users with Sotho Names
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'thabo.molefe@trinity.co.za',
        passwordHash,
        firstName: 'Thabo',
        lastName: 'Molefe',
        phone: '+27 71 234 5678',
        role: Role.ADMIN,
        isActive: true,
        isApproved: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'palesa.mokhethi@trinity.co.za',
        passwordHash,
        firstName: 'Palesa',
        lastName: 'Mokhethi',
        phone: '+27 72 345 6789',
        role: Role.EMPLOYEE,
        isActive: true,
        isApproved: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'lerato.mokoena@trinity.co.za',
        passwordHash,
        firstName: 'Lerato',
        lastName: 'Mokoena',
        phone: '+27 73 456 7890',
        role: Role.EMPLOYEE,
        isActive: true,
        isApproved: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'tshepo.masilo@trinity.co.za',
        passwordHash,
        firstName: 'Tshepo',
        lastName: 'Masilo',
        phone: '+27 74 567 8901',
        role: Role.EMPLOYEE,
        isActive: true,
        isApproved: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'mpho.lebelo@trinity.co.za',
        passwordHash,
        firstName: 'Mpho',
        lastName: 'Lebelo',
        phone: '+27 75 678 9012',
        role: Role.EMPLOYEE,
        isActive: true,
        isApproved: true,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create Equipment Categories
  const categories = await Promise.all([
    prisma.equipmentCategory.create({
      data: {
        name: 'Sound Equipment',
        description: 'Speakers, amplifiers, mixers and audio equipment',
      },
    }),
    prisma.equipmentCategory.create({
      data: {
        name: 'Lighting',
        description: 'Stage lights, LED panels, and lighting controllers',
      },
    }),
    prisma.equipmentCategory.create({
      data: {
        name: 'DJ Equipment',
        description: 'Turntables, CDJs, controllers and DJ mixers',
      },
    }),
    prisma.equipmentCategory.create({
      data: {
        name: 'Cables & Accessories',
        description: 'Audio cables, power cables, stands and accessories',
      },
    }),
    prisma.equipmentCategory.create({
      data: {
        name: 'Stage Equipment',
        description: 'Stage platforms, risers, and staging equipment',
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} equipment categories`);

  // Create Equipment Items
  const equipment = await Promise.all([
    // Sound Equipment
    prisma.equipmentItem.create({
      data: {
        name: 'JBL EON615 Powered Speaker',
        description: '15-inch two-way powered PA speaker',
        categoryId: categories[0].id,
        serialNumber: 'JBL-EON615-001',
        barcode: 'TMS-SND-001',
        purchaseDate: new Date('2023-01-15'),
        purchasePrice: 8500,
        currentStatus: EquipmentStatus.AVAILABLE,
        quantity: 4,
        unit: 'unit',
      },
    }),
    prisma.equipmentItem.create({
      data: {
        name: 'Yamaha MG16XU Mixer',
        description: '16-channel mixing console with USB and effects',
        categoryId: categories[0].id,
        serialNumber: 'YAM-MG16-001',
        barcode: 'TMS-SND-002',
        purchaseDate: new Date('2023-02-20'),
        purchasePrice: 6500,
        currentStatus: EquipmentStatus.AVAILABLE,
        quantity: 2,
        unit: 'unit',
      },
    }),
    prisma.equipmentItem.create({
      data: {
        name: 'Shure SM58 Microphone',
        description: 'Dynamic vocal microphone',
        categoryId: categories[0].id,
        serialNumber: 'SHR-SM58-001',
        barcode: 'TMS-SND-003',
        purchaseDate: new Date('2023-03-10'),
        purchasePrice: 2200,
        currentStatus: EquipmentStatus.AVAILABLE,
        quantity: 8,
        unit: 'unit',
      },
    }),
    prisma.equipmentItem.create({
      data: {
        name: 'QSC K12.2 Powered Speaker',
        description: '12-inch powered loudspeaker',
        categoryId: categories[0].id,
        serialNumber: 'QSC-K12-001',
        barcode: 'TMS-SND-004',
        purchaseDate: new Date('2023-04-05'),
        purchasePrice: 12000,
        currentStatus: EquipmentStatus.AVAILABLE,
        quantity: 4,
        unit: 'unit',
      },
    }),
    // Lighting
    prisma.equipmentItem.create({
      data: {
        name: 'Chauvet DJ SlimPAR Pro H',
        description: 'RGBAW+UV LED wash light',
        categoryId: categories[1].id,
        serialNumber: 'CHV-SLIMPAR-001',
        barcode: 'TMS-LGT-001',
        purchaseDate: new Date('2023-05-12'),
        purchasePrice: 3200,
        currentStatus: EquipmentStatus.AVAILABLE,
        quantity: 8,
        unit: 'unit',
      },
    }),
    prisma.equipmentItem.create({
      data: {
        name: 'ADJ Mega Bar RGBA',
        description: 'LED bar with 14 LEDs',
        categoryId: categories[1].id,
        serialNumber: 'ADJ-MEGABAR-001',
        barcode: 'TMS-LGT-002',
        purchaseDate: new Date('2023-06-18'),
        purchasePrice: 2800,
        currentStatus: EquipmentStatus.AVAILABLE,
        quantity: 6,
        unit: 'unit',
      },
    }),
    prisma.equipmentItem.create({
      data: {
        name: 'Martin Rush MH5 Profile',
        description: 'Moving head profile fixture',
        categoryId: categories[1].id,
        serialNumber: 'MRT-MH5-001',
        barcode: 'TMS-LGT-003',
        purchaseDate: new Date('2023-07-22'),
        purchasePrice: 18000,
        currentStatus: EquipmentStatus.AVAILABLE,
        quantity: 4,
        unit: 'unit',
      },
    }),
    // DJ Equipment
    prisma.equipmentItem.create({
      data: {
        name: 'Pioneer CDJ-2000NXS2',
        description: 'Professional DJ multi-player',
        categoryId: categories[2].id,
        serialNumber: 'PIO-CDJ2000-001',
        barcode: 'TMS-DJ-001',
        purchaseDate: new Date('2023-08-30'),
        purchasePrice: 35000,
        currentStatus: EquipmentStatus.AVAILABLE,
        quantity: 2,
        unit: 'unit',
      },
    }),
    prisma.equipmentItem.create({
      data: {
        name: 'Pioneer DJM-900NXS2',
        description: '4-channel professional DJ mixer',
        categoryId: categories[2].id,
        serialNumber: 'PIO-DJM900-001',
        barcode: 'TMS-DJ-002',
        purchaseDate: new Date('2023-09-15'),
        purchasePrice: 28000,
        currentStatus: EquipmentStatus.AVAILABLE,
        quantity: 1,
        unit: 'unit',
      },
    }),
    // Cables & Accessories
    prisma.equipmentItem.create({
      data: {
        name: 'XLR Cable 10m',
        description: '10-meter balanced XLR cable',
        categoryId: categories[3].id,
        barcode: 'TMS-CBL-001',
        purchaseDate: new Date('2023-10-01'),
        purchasePrice: 350,
        currentStatus: EquipmentStatus.AVAILABLE,
        quantity: 20,
        unit: 'piece',
      },
    }),
    prisma.equipmentItem.create({
      data: {
        name: 'Speaker Stand',
        description: 'Tripod speaker stand with adjustable height',
        categoryId: categories[3].id,
        barcode: 'TMS-ACC-001',
        purchaseDate: new Date('2023-10-15'),
        purchasePrice: 850,
        currentStatus: EquipmentStatus.AVAILABLE,
        quantity: 8,
        unit: 'unit',
      },
    }),
    // Stage Equipment
    prisma.equipmentItem.create({
      data: {
        name: 'Stage Platform 2x1m',
        description: '2m x 1m modular stage platform',
        categoryId: categories[4].id,
        barcode: 'TMS-STG-001',
        purchaseDate: new Date('2023-11-01'),
        purchasePrice: 4500,
        currentStatus: EquipmentStatus.AVAILABLE,
        quantity: 12,
        unit: 'unit',
      },
    }),
    prisma.equipmentItem.create({
      data: {
        name: 'Stage Riser 40cm',
        description: '40cm height stage riser legs',
        categoryId: categories[4].id,
        barcode: 'TMS-STG-002',
        purchaseDate: new Date('2023-11-10'),
        purchasePrice: 1200,
        currentStatus: EquipmentStatus.AVAILABLE,
        quantity: 48,
        unit: 'set',
      },
    }),
  ]);

  console.log(`✅ Created ${equipment.length} equipment items`);

  // Create Clients with Sotho Names
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Mokete Catering & Events',
        contactPerson: 'Nthabiseng Tau',
        email: 'nthabiseng@moketecatering.co.za',
        phone: '+27 11 234 5678',
        address: '45 Commissioner Street, Johannesburg, 2001',
        city: 'Johannesburg',
        billingAddress: '45 Commissioner Street, Johannesburg, 2001',
        notes: 'Regular client for wedding events',
        isActive: true,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Letlotlo Entertainment',
        contactPerson: 'Kabelo Nkosi',
        email: 'kabelo@letlotlo.co.za',
        phone: '+27 12 345 6789',
        alternatePhone: '+27 82 123 4567',
        address: '123 Church Street, Pretoria, 0002',
        city: 'Pretoria',
        billingAddress: '123 Church Street, Pretoria, 0002',
        notes: 'Corporate event specialists',
        isActive: true,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Thuto Schools Foundation',
        contactPerson: 'Dikeledi Moagi',
        email: 'dikeledi@thutofoundation.org',
        phone: '+27 51 456 7890',
        address: '78 Kellner Street, Bloemfontein, 9301',
        city: 'Bloemfontein',
        notes: 'Education foundation - school events',
        isActive: true,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Kgotla Conference Center',
        contactPerson: 'Tebogo Makgoba',
        email: 'bookings@kgotlaconference.co.za',
        phone: '+27 18 567 8901',
        address: '56 Nelson Mandela Drive, Rustenburg, 0299',
        city: 'Rustenburg',
        billingAddress: '56 Nelson Mandela Drive, Rustenburg, 0299',
        notes: 'Conference and seminar venues',
        isActive: true,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Bokamoso Community Hall',
        contactPerson: 'Seipati Moloi',
        email: 'seipati@bokamosohall.co.za',
        phone: '+27 16 678 9012',
        address: '34 Main Road, Vereeniging, 1930',
        city: 'Vereeniging',
        notes: 'Community events and celebrations',
        isActive: true,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Mahlale Corporate Services',
        contactPerson: 'Katlego Dlamini',
        email: 'katlego@mahlalelcorp.co.za',
        phone: '+27 11 789 0123',
        alternatePhone: '+27 83 234 5678',
        address: '200 Sandton Drive, Sandton, 2196',
        city: 'Sandton',
        billingAddress: '200 Sandton Drive, Sandton, 2196',
        notes: 'High-end corporate functions',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${clients.length} clients`);

  // Create Events
  const now = new Date();
  const events = await Promise.all([
    prisma.event.create({
      data: {
        name: 'Mokete Wedding Reception',
        eventType: 'Wedding',
        description: 'Traditional Sotho wedding reception with live entertainment',
        clientId: clients[0].id,
        venue: 'Emoyeni Country Lodge',
        venueAddress: 'R512, Lanseria, Johannesburg',
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8 hours later
        setupTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000),
        status: EventStatus.CONFIRMED,
        requirements: 'Full sound system, 4 speakers, DJ setup, mood lighting',
        notes: '300 guests expected',
      },
    }),
    prisma.event.create({
      data: {
        name: 'Letlotlo Annual Conference',
        eventType: 'Corporate',
        description: 'Annual corporate conference and awards ceremony',
        clientId: clients[1].id,
        venue: 'CSIR International Convention Centre',
        venueAddress: 'Meiring Naude Road, Brummeria, Pretoria',
        startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
        setupTime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000),
        status: EventStatus.QUOTED,
        requirements: 'Conference audio setup, presentation system, stage lighting',
        notes: '500 attendees, requires high-quality audio for speeches',
      },
    }),
    prisma.event.create({
      data: {
        name: 'Thuto Schools Awards Ceremony',
        eventType: 'Awards',
        description: 'Annual schools awards ceremony',
        clientId: clients[2].id,
        venue: 'Sand du Plessis Theatre',
        venueAddress: 'Markgraaff Street, Bloemfontein',
        startDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        endDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
        status: EventStatus.DRAFT,
        requirements: 'Basic sound setup, microphones, background music',
        notes: 'Keep setup simple and professional',
      },
    }),
    prisma.event.create({
      data: {
        name: 'Kgotla Business Seminar',
        eventType: 'Seminar',
        description: 'Business development seminar',
        clientId: clients[3].id,
        venue: 'Kgotla Conference Center',
        venueAddress: '56 Nelson Mandela Drive, Rustenburg',
        startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        status: EventStatus.CONFIRMED,
        requirements: 'Wireless microphones, speaker system for presentations',
        notes: '150 attendees - in-house venue',
      },
    }),
    prisma.event.create({
      data: {
        name: 'Bokamoso Heritage Day Celebration',
        eventType: 'Cultural',
        description: 'Heritage Day community celebration with traditional music',
        clientId: clients[4].id,
        venue: 'Bokamoso Community Hall',
        venueAddress: '34 Main Road, Vereeniging',
        startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
        status: EventStatus.DRAFT,
        requirements: 'Outdoor PA system, stage setup, full lighting rig',
        notes: 'Outdoor event - need weatherproof equipment',
      },
    }),
    prisma.event.create({
      data: {
        name: 'Mahlale Year-End Function',
        eventType: 'Corporate',
        description: 'Corporate year-end celebration and party',
        clientId: clients[5].id,
        venue: 'The Venue at Royal Villas',
        venueAddress: 'Pretoria Road, Midrand',
        startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (completed)
        endDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
        status: EventStatus.COMPLETED,
        requirements: 'Full DJ setup, party lighting, quality speakers',
        notes: 'VIP corporate client - premium service',
      },
    }),
  ]);

  console.log(`✅ Created ${events.length} events`);

  // Create Equipment Bookings for confirmed events
  const bookings = await Promise.all([
    // Mokete Wedding Reception
    prisma.eventEquipmentBooking.create({
      data: {
        eventId: events[0].id,
        equipmentId: equipment[0].id, // JBL speakers
        quantity: 4,
        status: BookingStatus.CONFIRMED,
      },
    }),
    prisma.eventEquipmentBooking.create({
      data: {
        eventId: events[0].id,
        equipmentId: equipment[1].id, // Yamaha mixer
        quantity: 1,
        status: BookingStatus.CONFIRMED,
      },
    }),
    prisma.eventEquipmentBooking.create({
      data: {
        eventId: events[0].id,
        equipmentId: equipment[4].id, // Chauvet lights
        quantity: 6,
        status: BookingStatus.CONFIRMED,
      },
    }),
    prisma.eventEquipmentBooking.create({
      data: {
        eventId: events[0].id,
        equipmentId: equipment[7].id, // CDJ
        quantity: 2,
        status: BookingStatus.CONFIRMED,
      },
    }),
    // Kgotla Business Seminar
    prisma.eventEquipmentBooking.create({
      data: {
        eventId: events[3].id,
        equipmentId: equipment[2].id, // SM58 microphones
        quantity: 4,
        status: BookingStatus.CONFIRMED,
      },
    }),
    prisma.eventEquipmentBooking.create({
      data: {
        eventId: events[3].id,
        equipmentId: equipment[3].id, // QSC speakers
        quantity: 2,
        status: BookingStatus.CONFIRMED,
      },
    }),
  ]);

  console.log(`✅ Created ${bookings.length} equipment bookings`);

  // Create Staff Assignments
  const assignments = await Promise.all([
    prisma.staffAssignment.create({
      data: {
        eventId: events[0].id,
        userId: users[1].id, // Palesa
        role: 'Sound Engineer',
        notes: 'Lead sound engineer for the event',
      },
    }),
    prisma.staffAssignment.create({
      data: {
        eventId: events[0].id,
        userId: users[2].id, // Lerato
        role: 'Lighting Technician',
        notes: 'Handle all lighting setup and operation',
      },
    }),
    prisma.staffAssignment.create({
      data: {
        eventId: events[3].id,
        userId: users[3].id, // Tshepo
        role: 'Sound Engineer',
        notes: 'Audio setup for seminar',
      },
    }),
  ]);

  console.log(`✅ Created ${assignments.length} staff assignments`);

  // Create Quotes
  const quotes = await Promise.all([
    prisma.quote.create({
      data: {
        quoteNumber: 'QT-2024001',
        clientId: clients[0].id,
        eventId: events[0].id,
        createdById: users[0].id,
        issueDate: new Date(),
        validUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        subtotal: 25000,
        taxAmount: 3750,
        discount: 2000,
        total: 26750,
        status: QuoteStatus.ACCEPTED,
        notes: 'Wedding package includes full sound and lighting',
        lineItems: {
          create: [
            { description: 'Sound System (4x JBL Speakers + Mixer)', quantity: 1, unitPrice: 12000, total: 12000 },
            { description: 'DJ Equipment Setup', quantity: 1, unitPrice: 8000, total: 8000 },
            { description: 'Mood Lighting Package', quantity: 1, unitPrice: 5000, total: 5000 },
          ],
        },
      },
    }),
    prisma.quote.create({
      data: {
        quoteNumber: 'QT-2024002',
        clientId: clients[1].id,
        eventId: events[1].id,
        createdById: users[0].id,
        issueDate: new Date(),
        validUntil: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        subtotal: 45000,
        taxAmount: 6750,
        discount: 0,
        total: 51750,
        status: QuoteStatus.SENT,
        notes: 'Corporate conference audio-visual package',
        lineItems: {
          create: [
            { description: 'Conference Audio System', quantity: 1, unitPrice: 20000, total: 20000 },
            { description: 'Wireless Microphone System', quantity: 1, unitPrice: 8000, total: 8000 },
            { description: 'Stage Lighting', quantity: 1, unitPrice: 12000, total: 12000 },
            { description: 'Technical Staff (2 days)', quantity: 1, unitPrice: 5000, total: 5000 },
          ],
        },
      },
    }),
    prisma.quote.create({
      data: {
        quoteNumber: 'QT-2024003',
        clientId: clients[2].id,
        eventId: events[2].id,
        createdById: users[0].id,
        issueDate: new Date(),
        validUntil: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
        subtotal: 15000,
        taxAmount: 2250,
        discount: 1500,
        total: 15750,
        status: QuoteStatus.DRAFT,
        notes: 'Schools awards - discounted rate for education foundation',
        lineItems: {
          create: [
            { description: 'Basic Sound System', quantity: 1, unitPrice: 8000, total: 8000 },
            { description: 'Wireless Microphones (4)', quantity: 1, unitPrice: 4000, total: 4000 },
            { description: 'Background Music System', quantity: 1, unitPrice: 3000, total: 3000 },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${quotes.length} quotes`);

  // Create Invoices
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2024001',
        clientId: clients[0].id,
        eventId: events[0].id,
        createdById: users[0].id,
        issueDate: new Date(),
        dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        subtotal: 25000,
        taxAmount: 3750,
        discount: 2000,
        total: 26750,
        amountPaid: 13375, // 50% deposit paid
        status: InvoiceStatus.PARTIALLY_PAID,
        notes: 'Wedding event - 50% deposit received',
        lineItems: {
          create: [
            { description: 'Sound System (4x JBL Speakers + Mixer)', quantity: 1, unitPrice: 12000, total: 12000 },
            { description: 'DJ Equipment Setup', quantity: 1, unitPrice: 8000, total: 8000 },
            { description: 'Mood Lighting Package', quantity: 1, unitPrice: 5000, total: 5000 },
          ],
        },
      },
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2024002',
        clientId: clients[5].id,
        eventId: events[5].id,
        createdById: users[0].id,
        issueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
        subtotal: 35000,
        taxAmount: 5250,
        discount: 0,
        total: 40250,
        amountPaid: 40250, // Fully paid
        status: InvoiceStatus.PAID,
        notes: 'Year-end function - paid in full',
        lineItems: {
          create: [
            { description: 'Full DJ & Sound Package', quantity: 1, unitPrice: 20000, total: 20000 },
            { description: 'Premium Lighting Package', quantity: 1, unitPrice: 10000, total: 10000 },
            { description: 'Technical Staff', quantity: 1, unitPrice: 5000, total: 5000 },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${invoices.length} invoices`);

  // Create Payments
  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        invoiceId: invoices[0].id,
        amount: 13375,
        paymentMethod: PaymentMethod.EFT,
        paymentDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        referenceNumber: 'REF-MOK-001',
        notes: '50% deposit for wedding event',
        recordedById: users[0].id,
      },
    }),
    prisma.payment.create({
      data: {
        invoiceId: invoices[1].id,
        amount: 20000,
        paymentMethod: PaymentMethod.EFT,
        paymentDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        referenceNumber: 'REF-MAH-001',
        notes: 'First payment - corporate function',
        recordedById: users[0].id,
      },
    }),
    prisma.payment.create({
      data: {
        invoiceId: invoices[1].id,
        amount: 20250,
        paymentMethod: PaymentMethod.CARD,
        paymentDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        referenceNumber: 'REF-MAH-002',
        notes: 'Final payment - corporate function',
        recordedById: users[0].id,
      },
    }),
  ]);

  console.log(`✅ Created ${payments.length} payments`);

  // Create Maintenance Tickets
  const maintenanceTickets = await Promise.all([
    prisma.maintenanceTicket.create({
      data: {
        equipmentId: equipment[5].id, // ADJ Mega Bar
        title: 'LED panel not working',
        reportedIssue: '3 LEDs on the bar are not lighting up properly',
        description: 'During last event, noticed 3 LEDs flickering and now not working',
        status: MaintenanceStatus.IN_PROGRESS,
        priority: 'MEDIUM',
        createdById: users[1].id,
        assignedToId: users[3].id,
        repairNotes: 'Parts ordered from supplier',
      },
    }),
    prisma.maintenanceTicket.create({
      data: {
        equipmentId: equipment[9].id, // XLR Cables
        title: 'Cable inspection needed',
        reportedIssue: 'Some XLR cables showing wear',
        description: 'Regular inspection needed for XLR cable batch',
        status: MaintenanceStatus.OPEN,
        priority: 'LOW',
        createdById: users[2].id,
        repairNotes: 'Schedule for next maintenance window',
      },
    }),
  ]);

  console.log(`✅ Created ${maintenanceTickets.length} maintenance tickets`);

  // Create Action Logs
  await prisma.actionLog.createMany({
    data: [
      {
        userId: users[0].id,
        action: 'CREATE',
        entityType: 'Event',
        entityId: events[0].id,
        details: { eventName: 'Mokete Wedding Reception' },
      },
      {
        userId: users[0].id,
        action: 'CREATE',
        entityType: 'Quote',
        entityId: quotes[0].id,
        details: { quoteNumber: 'QT-2024001', amount: 26750 },
      },
      {
        userId: users[0].id,
        action: 'CREATE',
        entityType: 'Invoice',
        entityId: invoices[0].id,
        details: { invoiceNumber: 'INV-2024001', amount: 26750 },
      },
      {
        userId: users[0].id,
        action: 'PAYMENT_RECEIVED',
        entityType: 'Payment',
        entityId: payments[0].id,
        details: { amount: 13375, method: 'EFT' },
      },
    ],
  });

  console.log('✅ Created action logs');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Admin: thabo.molefe@trinity.co.za / password123');
  console.log('   Staff: palesa.mokhethi@trinity.co.za / password123');
  console.log('          lerato.mokoena@trinity.co.za / password123');
  console.log('          tshepo.masilo@trinity.co.za / password123');
  console.log('          mpho.lebelo@trinity.co.za / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
