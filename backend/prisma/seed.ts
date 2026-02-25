import {
  PrismaClient,
  Role,
  EquipmentStatus,
  EventStatus,
  BookingStatus,
  QuoteStatus,
  InvoiceStatus,
  PaymentMethod,
  MaintenanceStatus,
  NotificationPriority,
  NotificationType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed — Trinity Sound Lesotho...');

  // Clear existing data
  await prisma.notification.deleteMany();
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

  // ─── Users (Lesotho, trinitysound.co.ls, +266) ───
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'thabo.molefe@trinitysound.co.ls',
        passwordHash,
        firstName: 'Thabo',
        lastName: 'Molefe',
        phone: '+266 5885 1234',
        role: Role.ADMIN,
        isActive: true,
        isApproved: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'palesa.mokhethi@trinitysound.co.ls',
        passwordHash,
        firstName: 'Palesa',
        lastName: 'Mokhethi',
        phone: '+266 5776 2345',
        role: Role.EMPLOYEE,
        isActive: true,
        isApproved: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'lerato.mokoena@trinitysound.co.ls',
        passwordHash,
        firstName: 'Lerato',
        lastName: 'Mokoena',
        phone: '+266 6300 3456',
        role: Role.EMPLOYEE,
        isActive: true,
        isApproved: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'tshepo.masilo@trinitysound.co.ls',
        passwordHash,
        firstName: 'Tshepo',
        lastName: 'Masilo',
        phone: '+266 5891 4567',
        role: Role.EMPLOYEE,
        isActive: true,
        isApproved: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'mpho.lebelo@trinitysound.co.ls',
        passwordHash,
        firstName: 'Mpho',
        lastName: 'Lebelo',
        phone: '+266 6312 5678',
        role: Role.EMPLOYEE,
        isActive: true,
        isApproved: true,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // ─── Equipment Categories ───
  const categories = await Promise.all([
    prisma.equipmentCategory.create({
      data: { name: 'Speakers', description: 'PA speakers, monitors, and subwoofers' },
    }),
    prisma.equipmentCategory.create({
      data: { name: 'Microphones', description: 'Wired and wireless microphones' },
    }),
    prisma.equipmentCategory.create({
      data: { name: 'Mixers & Amplifiers', description: 'Audio mixers, amplifiers, and processors' },
    }),
    prisma.equipmentCategory.create({
      data: { name: 'Lighting', description: 'Stage lights, LED pars, moving heads, and controllers' },
    }),
    prisma.equipmentCategory.create({
      data: { name: 'DJ Equipment', description: 'CDJs, controllers, turntables, and DJ mixers' },
    }),
    prisma.equipmentCategory.create({
      data: { name: 'Cables & Stands', description: 'XLR, speaker cables, stands, and accessories' },
    }),
    prisma.equipmentCategory.create({
      data: { name: 'Stage Equipment', description: 'Platforms, risers, and staging' },
    }),
  ]);

  console.log(`✅ Created ${categories.length} equipment categories`);

  // ─── Equipment Items — each physical unit is its own record ───
  const equipment = await Promise.all([
    // Speakers (4x JBL EON615 + 4x QSC K12.2 + 2x JBL SRX sub)
    ...[1, 2, 3, 4].map((n) =>
      prisma.equipmentItem.create({
        data: {
          name: `JBL EON615 Speaker ${n}`,
          description: '15-inch two-way powered PA speaker',
          categoryId: categories[0].id,
          serialNumber: `JBL-EON615-${String(n).padStart(3, '0')}`,
          barcode: `TS-SPK-${String(n).padStart(3, '0')}`,
          purchaseDate: new Date('2023-01-15'),
          purchasePrice: 8500,
          currentStatus: EquipmentStatus.AVAILABLE,
        },
      }),
    ),
    ...[1, 2, 3, 4].map((n) =>
      prisma.equipmentItem.create({
        data: {
          name: `QSC K12.2 Speaker ${n}`,
          description: '12-inch powered loudspeaker',
          categoryId: categories[0].id,
          serialNumber: `QSC-K12-${String(n).padStart(3, '0')}`,
          barcode: `TS-SPK-${String(n + 4).padStart(3, '0')}`,
          purchaseDate: new Date('2023-04-05'),
          purchasePrice: 12000,
          currentStatus: EquipmentStatus.AVAILABLE,
        },
      }),
    ),
    ...[1, 2].map((n) =>
      prisma.equipmentItem.create({
        data: {
          name: `JBL SRX818S Subwoofer ${n}`,
          description: '18-inch powered subwoofer',
          categoryId: categories[0].id,
          serialNumber: `JBL-SRX818-${String(n).padStart(3, '0')}`,
          barcode: `TS-SUB-${String(n).padStart(3, '0')}`,
          purchaseDate: new Date('2023-06-20'),
          purchasePrice: 15000,
          currentStatus: EquipmentStatus.AVAILABLE,
        },
      }),
    ),
    // Microphones (8x SM58 + 4x SM57 + 2x wireless)
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) =>
      prisma.equipmentItem.create({
        data: {
          name: `Shure SM58 Mic ${n}`,
          description: 'Dynamic vocal microphone',
          categoryId: categories[1].id,
          serialNumber: `SHR-SM58-${String(n).padStart(3, '0')}`,
          barcode: `TS-MIC-${String(n).padStart(3, '0')}`,
          purchaseDate: new Date('2023-03-10'),
          purchasePrice: 2200,
          currentStatus: EquipmentStatus.AVAILABLE,
        },
      }),
    ),
    ...[1, 2, 3, 4].map((n) =>
      prisma.equipmentItem.create({
        data: {
          name: `Shure SM57 Mic ${n}`,
          description: 'Dynamic instrument microphone',
          categoryId: categories[1].id,
          serialNumber: `SHR-SM57-${String(n).padStart(3, '0')}`,
          barcode: `TS-MIC-${String(n + 8).padStart(3, '0')}`,
          purchaseDate: new Date('2023-03-10'),
          purchasePrice: 2000,
          currentStatus: EquipmentStatus.AVAILABLE,
        },
      }),
    ),
    ...[1, 2].map((n) =>
      prisma.equipmentItem.create({
        data: {
          name: `Shure BLX Wireless Mic ${n}`,
          description: 'Wireless handheld microphone system',
          categoryId: categories[1].id,
          serialNumber: `SHR-BLX-${String(n).padStart(3, '0')}`,
          barcode: `TS-WMC-${String(n).padStart(3, '0')}`,
          purchaseDate: new Date('2023-08-15'),
          purchasePrice: 4500,
          currentStatus: EquipmentStatus.AVAILABLE,
        },
      }),
    ),
    // Mixers & Amplifiers
    prisma.equipmentItem.create({
      data: {
        name: 'Yamaha MG16XU Mixer 1',
        description: '16-channel mixing console with USB and effects',
        categoryId: categories[2].id,
        serialNumber: 'YAM-MG16-001',
        barcode: 'TS-MIX-001',
        purchaseDate: new Date('2023-02-20'),
        purchasePrice: 6500,
        currentStatus: EquipmentStatus.AVAILABLE,
      },
    }),
    prisma.equipmentItem.create({
      data: {
        name: 'Yamaha MG16XU Mixer 2',
        description: '16-channel mixing console with USB and effects',
        categoryId: categories[2].id,
        serialNumber: 'YAM-MG16-002',
        barcode: 'TS-MIX-002',
        purchaseDate: new Date('2023-02-20'),
        purchasePrice: 6500,
        currentStatus: EquipmentStatus.AVAILABLE,
      },
    }),
    prisma.equipmentItem.create({
      data: {
        name: 'Crown XLS 2002 Amp 1',
        description: '2-channel power amplifier',
        categoryId: categories[2].id,
        serialNumber: 'CRN-XLS2002-001',
        barcode: 'TS-AMP-001',
        purchaseDate: new Date('2023-05-10'),
        purchasePrice: 9000,
        currentStatus: EquipmentStatus.AVAILABLE,
      },
    }),
    // Lighting (8x LED Par + 4x Moving Head + 1x Controller)
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) =>
      prisma.equipmentItem.create({
        data: {
          name: `Chauvet SlimPAR LED ${n}`,
          description: 'RGBAW+UV LED wash light',
          categoryId: categories[3].id,
          serialNumber: `CHV-SLIMPAR-${String(n).padStart(3, '0')}`,
          barcode: `TS-LGT-${String(n).padStart(3, '0')}`,
          purchaseDate: new Date('2023-05-12'),
          purchasePrice: 3200,
          currentStatus: EquipmentStatus.AVAILABLE,
        },
      }),
    ),
    ...[1, 2, 3, 4].map((n) =>
      prisma.equipmentItem.create({
        data: {
          name: `Martin Rush MH5 Moving Head ${n}`,
          description: 'Moving head profile fixture',
          categoryId: categories[3].id,
          serialNumber: `MRT-MH5-${String(n).padStart(3, '0')}`,
          barcode: `TS-MHD-${String(n).padStart(3, '0')}`,
          purchaseDate: new Date('2023-07-22'),
          purchasePrice: 18000,
          currentStatus: EquipmentStatus.AVAILABLE,
        },
      }),
    ),
    prisma.equipmentItem.create({
      data: {
        name: 'DMX Controller 1',
        description: 'Chauvet Obey 70 DMX controller',
        categoryId: categories[3].id,
        serialNumber: 'CHV-OBEY70-001',
        barcode: 'TS-DMX-001',
        purchaseDate: new Date('2023-07-22'),
        purchasePrice: 4500,
        currentStatus: EquipmentStatus.AVAILABLE,
      },
    }),
    // DJ Equipment
    ...[1, 2].map((n) =>
      prisma.equipmentItem.create({
        data: {
          name: `Pioneer CDJ-2000NXS2 ${n}`,
          description: 'Professional DJ multi-player',
          categoryId: categories[4].id,
          serialNumber: `PIO-CDJ2000-${String(n).padStart(3, '0')}`,
          barcode: `TS-DJ-${String(n).padStart(3, '0')}`,
          purchaseDate: new Date('2023-08-30'),
          purchasePrice: 35000,
          currentStatus: EquipmentStatus.AVAILABLE,
        },
      }),
    ),
    prisma.equipmentItem.create({
      data: {
        name: 'Pioneer DJM-900NXS2 Mixer 1',
        description: '4-channel professional DJ mixer',
        categoryId: categories[4].id,
        serialNumber: 'PIO-DJM900-001',
        barcode: 'TS-DJ-003',
        purchaseDate: new Date('2023-09-15'),
        purchasePrice: 28000,
        currentStatus: EquipmentStatus.AVAILABLE,
      },
    }),
    // Cables & Stands
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) =>
      prisma.equipmentItem.create({
        data: {
          name: `Speaker Stand ${n}`,
          description: 'Tripod speaker stand with adjustable height',
          categoryId: categories[5].id,
          barcode: `TS-STD-${String(n).padStart(3, '0')}`,
          purchaseDate: new Date('2023-10-15'),
          purchasePrice: 850,
          currentStatus: EquipmentStatus.AVAILABLE,
        },
      }),
    ),
    ...[1, 2, 3, 4].map((n) =>
      prisma.equipmentItem.create({
        data: {
          name: `Mic Stand ${n}`,
          description: 'Boom microphone stand',
          categoryId: categories[5].id,
          barcode: `TS-MST-${String(n).padStart(3, '0')}`,
          purchaseDate: new Date('2023-10-15'),
          purchasePrice: 450,
          currentStatus: EquipmentStatus.AVAILABLE,
        },
      }),
    ),
  ]);

  // Set one item as damaged for realism
  await prisma.equipmentItem.update({
    where: { id: equipment[equipment.length - 5].id },
    data: { currentStatus: EquipmentStatus.DAMAGED },
  });

  console.log(`✅ Created ${equipment.length} individual equipment items`);

  // ─── Clients (Lesotho context, +266 phones, Maseru/Lesotho) ───
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Mokete Catering & Events',
        contactPerson: 'Nthabiseng Tau',
        email: 'nthabiseng@moketecatering.co.ls',
        phone: '+266 2231 4567',
        address: '45 Kingsway Road, Maseru 100',
        city: 'Maseru',
        billingAddress: '45 Kingsway Road, Maseru 100',
        notes: 'Regular client for wedding events',
        isActive: true,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Letlotlo Entertainment',
        contactPerson: 'Kabelo Nkosi',
        email: 'kabelo@letlotlo.co.ls',
        phone: '+266 2232 5678',
        alternatePhone: '+266 5800 1234',
        address: '12 Pioneer Road, Maseru 100',
        city: 'Maseru',
        billingAddress: '12 Pioneer Road, Maseru 100',
        notes: 'Corporate event specialists',
        isActive: true,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Thuto Schools Foundation',
        contactPerson: 'Dikeledi Moagi',
        email: 'dikeledi@thutofoundation.org.ls',
        phone: '+266 2231 6789',
        address: '78 Main North 1, Maseru 100',
        city: 'Maseru',
        notes: 'Education foundation — school events',
        isActive: true,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Avani Maseru Hotel',
        contactPerson: 'Tebogo Makgoba',
        email: 'events@avanimaseru.co.ls',
        phone: '+266 2231 2434',
        address: '12 Orpen Road, Maseru 100',
        city: 'Maseru',
        billingAddress: '12 Orpen Road, Maseru 100',
        notes: 'Hotel conferences and functions',
        isActive: true,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Lehae Community Centre',
        contactPerson: 'Seipati Moloi',
        email: 'seipati@lehaecc.co.ls',
        phone: '+266 2231 7890',
        address: '5 Stadium Road, Maseru 100',
        city: 'Maseru',
        notes: 'Community events and celebrations',
        isActive: true,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Maluti Corporate Services',
        contactPerson: 'Katlego Dlamini',
        email: 'katlego@maluticorp.co.ls',
        phone: '+266 2232 8901',
        alternatePhone: '+266 6312 9988',
        address: 'LNDC Centre, Kingsway, Maseru 100',
        city: 'Maseru',
        billingAddress: 'LNDC Centre, Kingsway, Maseru 100',
        notes: 'High-end corporate functions',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${clients.length} clients`);

  // ─── Events (Lesotho venues) ───
  const now = new Date();
  const d = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const dh = (days: number, hours: number) =>
    new Date(now.getTime() + days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000);

  const events = await Promise.all([
    prisma.event.create({
      data: {
        name: 'Mokete Wedding Reception',
        eventType: 'Wedding',
        description: 'Traditional Sesotho wedding reception with live entertainment',
        clientId: clients[0].id,
        venue: 'Maseru Sun Hotel',
        venueAddress: '12 Open Road, Maseru 100, Lesotho',
        startDate: d(7),
        endDate: dh(7, 8),
        setupTime: dh(7, -4),
        status: EventStatus.CONFIRMED,
        requirements: 'Full sound system, 4 speakers, DJ setup, mood lighting',
        notes: '300 guests expected',
      },
    }),
    prisma.event.create({
      data: {
        name: 'Letlotlo Annual Conference',
        eventType: 'Corporate Event',
        description: 'Annual corporate conference and awards ceremony',
        clientId: clients[1].id,
        venue: 'Manthabiseng Convention Centre',
        venueAddress: 'Moshoeshoe Road, Maseru 100, Lesotho',
        startDate: d(14),
        endDate: dh(14, 10),
        setupTime: dh(14, -6),
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
        venue: 'Lehakoe National Recreation Centre',
        venueAddress: 'Maseru, Lesotho',
        startDate: d(21),
        endDate: dh(21, 5),
        status: EventStatus.DRAFT,
        requirements: 'Basic sound setup, microphones, background music',
        notes: 'Keep setup simple and professional',
      },
    }),
    prisma.event.create({
      data: {
        name: 'Avani Business Seminar',
        eventType: 'Conference',
        description: 'Business development seminar',
        clientId: clients[3].id,
        venue: 'Avani Maseru Hotel',
        venueAddress: '12 Orpen Road, Maseru 100, Lesotho',
        startDate: d(3),
        endDate: dh(3, 6),
        status: EventStatus.CONFIRMED,
        requirements: 'Wireless microphones, speaker system for presentations',
        notes: '150 attendees — in-house venue',
      },
    }),
    prisma.event.create({
      data: {
        name: 'Lehae Heritage Day Celebration',
        eventType: 'Cultural',
        description: 'Heritage Day community celebration with traditional music',
        clientId: clients[4].id,
        venue: 'Setsoto Stadium Grounds',
        venueAddress: 'Stadium Area, Maseru 100, Lesotho',
        startDate: d(30),
        endDate: dh(30, 12),
        status: EventStatus.DRAFT,
        requirements: 'Outdoor PA system, stage setup, full lighting rig',
        notes: 'Outdoor event — need weatherproof equipment',
      },
    }),
    prisma.event.create({
      data: {
        name: 'Maluti Year-End Function',
        eventType: 'Corporate Event',
        description: 'Corporate year-end celebration and party',
        clientId: clients[5].id,
        venue: 'Avani Maseru Hotel',
        venueAddress: '12 Orpen Road, Maseru 100, Lesotho',
        startDate: d(-5),
        endDate: dh(-5, 8),
        status: EventStatus.COMPLETED,
        requirements: 'Full DJ setup, party lighting, quality speakers',
        notes: 'VIP corporate client — premium service',
      },
    }),
  ]);

  console.log(`✅ Created ${events.length} events`);

  // ─── Equipment Bookings (individual items, no quantity) ───
  const weddingSetup = events[0].setupTime || dh(7, -4);
  const weddingEnd = events[0].endDate;
  const seminarStart = events[3].startDate;
  const seminarEnd = events[3].endDate;
  const seminarSetup = new Date(seminarStart.getTime() - 4 * 60 * 60 * 1000);

  const bookings = await Promise.all([
    // Mokete Wedding: 4x JBL speakers + mixer + 6x LEDs + 2x CDJs + DJ mixer
    ...[0, 1, 2, 3].map((i) =>
      prisma.eventEquipmentBooking.create({
        data: {
          eventId: events[0].id,
          equipmentId: equipment[i].id, // JBL EON615 1-4
          status: BookingStatus.CONFIRMED,
          reservedFrom: weddingSetup,
          reservedUntil: weddingEnd,
        },
      }),
    ),
    prisma.eventEquipmentBooking.create({
      data: {
        eventId: events[0].id,
        equipmentId: equipment[24].id, // Yamaha MG16XU Mixer 1
        status: BookingStatus.CONFIRMED,
        reservedFrom: weddingSetup,
        reservedUntil: weddingEnd,
      },
    }),
    // 6x LED Pars for wedding
    ...[27, 28, 29, 30, 31, 32].map((i) =>
      prisma.eventEquipmentBooking.create({
        data: {
          eventId: events[0].id,
          equipmentId: equipment[i].id, // Chauvet SlimPAR LED
          status: BookingStatus.CONFIRMED,
          reservedFrom: weddingSetup,
          reservedUntil: weddingEnd,
        },
      }),
    ),
    // CDJs + DJ mixer for wedding
    prisma.eventEquipmentBooking.create({
      data: {
        eventId: events[0].id,
        equipmentId: equipment[40].id, // CDJ 1
        status: BookingStatus.CONFIRMED,
        reservedFrom: weddingSetup,
        reservedUntil: weddingEnd,
      },
    }),
    prisma.eventEquipmentBooking.create({
      data: {
        eventId: events[0].id,
        equipmentId: equipment[41].id, // CDJ 2
        status: BookingStatus.CONFIRMED,
        reservedFrom: weddingSetup,
        reservedUntil: weddingEnd,
      },
    }),
    prisma.eventEquipmentBooking.create({
      data: {
        eventId: events[0].id,
        equipmentId: equipment[42].id, // DJM-900
        status: BookingStatus.CONFIRMED,
        reservedFrom: weddingSetup,
        reservedUntil: weddingEnd,
      },
    }),
    // Avani Seminar: 4x SM58 + 2x QSC speakers
    ...[10, 11, 12, 13].map((i) =>
      prisma.eventEquipmentBooking.create({
        data: {
          eventId: events[3].id,
          equipmentId: equipment[i].id, // SM58 Mic 1-4
          status: BookingStatus.CONFIRMED,
          reservedFrom: seminarSetup,
          reservedUntil: seminarEnd,
        },
      }),
    ),
    ...[4, 5].map((i) =>
      prisma.eventEquipmentBooking.create({
        data: {
          eventId: events[3].id,
          equipmentId: equipment[i].id, // QSC K12.2 Speaker 1-2
          status: BookingStatus.CONFIRMED,
          reservedFrom: seminarSetup,
          reservedUntil: seminarEnd,
        },
      }),
    ),
  ]);

  console.log(`✅ Created ${bookings.length} equipment bookings`);

  // ─── Staff Assignments ───
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
        eventId: events[0].id,
        userId: users[4].id, // Mpho
        role: 'DJ',
        notes: 'Wedding DJ set',
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

  // ─── Quotes (M currency, Lesotho) ───
  const quotes = await Promise.all([
    prisma.quote.create({
      data: {
        quoteNumber: 'QT-2024001',
        clientId: clients[0].id,
        eventId: events[0].id,
        createdById: users[0].id,
        quoteType: 'Event Hire',
        proposedEventName: 'Mokete Wedding Reception',
        proposedEventType: 'Wedding',
        proposedStartDate: events[0].startDate,
        proposedEndDate: events[0].endDate,
        proposedVenue: 'Maseru Sun Hotel',
        proposedVenueAddress: '12 Open Road, Maseru 100, Lesotho',
        issueDate: new Date(),
        validUntil: d(30),
        subtotal: 25000,
        taxAmount: 3750,
        discount: 2000,
        total: 26750,
        status: QuoteStatus.ACCEPTED,
        acceptToken: crypto.randomBytes(32).toString('hex'),
        acceptedAt: d(-3),
        notes: 'Wedding package includes full sound and lighting',
        lineItems: {
          create: [
            { description: 'Sound System (4x JBL Speakers + Mixer)', quantity: 1, unitPrice: 12000, total: 12000 },
            { description: 'DJ Equipment Setup (CDJs + Mixer)', quantity: 1, unitPrice: 8000, total: 8000 },
            { description: 'Mood Lighting Package (6x LED + Controller)', quantity: 1, unitPrice: 5000, total: 5000 },
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
        quoteType: 'Conference',
        proposedEventName: 'Letlotlo Annual Conference',
        proposedEventType: 'Corporate Event',
        proposedStartDate: events[1].startDate,
        proposedEndDate: events[1].endDate,
        proposedVenue: 'Manthabiseng Convention Centre',
        issueDate: new Date(),
        validUntil: d(14),
        subtotal: 45000,
        taxAmount: 6750,
        discount: 0,
        total: 51750,
        status: QuoteStatus.SENT,
        acceptToken: crypto.randomBytes(32).toString('hex'),
        sentAt: d(-1),
        sentToEmail: 'kabelo@letlotlo.co.ls',
        notes: 'Corporate conference audio-visual package',
        lineItems: {
          create: [
            { description: 'Conference Audio System', quantity: 1, unitPrice: 20000, total: 20000 },
            { description: 'Wireless Microphone System (4 units)', quantity: 1, unitPrice: 8000, total: 8000 },
            { description: 'Stage Lighting (Moving Heads + LED Pars)', quantity: 1, unitPrice: 12000, total: 12000 },
            { description: 'Technical Staff (2 × full day)', quantity: 2, unitPrice: 2500, total: 5000 },
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
        quoteType: 'Schools Event',
        proposedEventName: 'Thuto Schools Awards Ceremony',
        proposedEventType: 'Awards',
        proposedStartDate: events[2].startDate,
        proposedEndDate: events[2].endDate,
        proposedVenue: 'Lehakoe National Recreation Centre',
        issueDate: new Date(),
        validUntil: d(21),
        subtotal: 15000,
        taxAmount: 2250,
        discount: 1500,
        total: 15750,
        status: QuoteStatus.DRAFT,
        acceptToken: crypto.randomBytes(32).toString('hex'),
        notes: 'Schools awards — discounted rate for education foundation',
        lineItems: {
          create: [
            { description: 'Basic Sound System (2x QSC Speakers + Mixer)', quantity: 1, unitPrice: 8000, total: 8000 },
            { description: 'Wireless Microphones (4 units)', quantity: 1, unitPrice: 4000, total: 4000 },
            { description: 'Background Music System', quantity: 1, unitPrice: 3000, total: 3000 },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${quotes.length} quotes`);

  // ─── Invoices (M currency) ───
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2024001',
        clientId: clients[0].id,
        eventId: events[0].id,
        quoteId: quotes[0].id,
        createdById: users[0].id,
        issueDate: new Date(),
        dueDate: d(30),
        subtotal: 25000,
        taxAmount: 3750,
        discount: 2000,
        total: 26750,
        amountPaid: 13375,
        status: InvoiceStatus.PARTIALLY_PAID,
        notes: 'Wedding event — 50% deposit received',
        lineItems: {
          create: [
            { description: 'Sound System (4x JBL Speakers + Mixer)', quantity: 1, unitPrice: 12000, total: 12000 },
            { description: 'DJ Equipment Setup (CDJs + Mixer)', quantity: 1, unitPrice: 8000, total: 8000 },
            { description: 'Mood Lighting Package (6x LED + Controller)', quantity: 1, unitPrice: 5000, total: 5000 },
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
        issueDate: d(-10),
        dueDate: d(20),
        subtotal: 35000,
        taxAmount: 5250,
        discount: 0,
        total: 40250,
        amountPaid: 40250,
        status: InvoiceStatus.PAID,
        notes: 'Year-end function — paid in full',
        lineItems: {
          create: [
            { description: 'Full DJ & Sound Package', quantity: 1, unitPrice: 20000, total: 20000 },
            { description: 'Premium Lighting Package', quantity: 1, unitPrice: 10000, total: 10000 },
            { description: 'Technical Staff (full day × 2)', quantity: 2, unitPrice: 2500, total: 5000 },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${invoices.length} invoices`);

  // ─── Payments ───
  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        invoiceId: invoices[0].id,
        amount: 13375,
        paymentMethod: PaymentMethod.EFT,
        paymentDate: d(-2),
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
        paymentDate: d(-8),
        referenceNumber: 'REF-MAL-001',
        notes: 'First payment — corporate function',
        recordedById: users[0].id,
      },
    }),
    prisma.payment.create({
      data: {
        invoiceId: invoices[1].id,
        amount: 20250,
        paymentMethod: PaymentMethod.ECOCASH,
        paymentDate: d(-4),
        referenceNumber: 'REF-MAL-002',
        notes: 'Final payment — corporate function (EcoCash)',
        recordedById: users[0].id,
      },
    }),
  ]);

  console.log(`✅ Created ${payments.length} payments`);

  // ─── Maintenance Tickets ───
  await Promise.all([
    prisma.maintenanceTicket.create({
      data: {
        equipmentId: equipment[equipment.length - 5].id,
        title: 'Speaker stand damaged',
        reportedIssue: 'Tripod leg bent during transport',
        description: 'Stand was damaged during loading for the Maluti event',
        status: MaintenanceStatus.IN_PROGRESS,
        priority: 'MEDIUM',
        createdById: users[1].id,
        assignedToId: users[3].id,
        repairNotes: 'Attempting to straighten leg, may need replacement',
      },
    }),
    prisma.maintenanceTicket.create({
      data: {
        equipmentId: equipment[30].id,
        title: 'LED par flickering',
        reportedIssue: 'LED 5 occasionally flickers on green channel',
        description: 'Noticed during last event — intermittent issue',
        status: MaintenanceStatus.OPEN,
        priority: 'LOW',
        createdById: users[2].id,
        repairNotes: 'Schedule inspection',
      },
    }),
  ]);

  console.log('✅ Created maintenance tickets');

  // ─── Action Logs ───
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

  // ─── Notifications ───
  await prisma.notification.createMany({
    data: [
      {
        type: NotificationType.EVENT_UPCOMING_7D,
        title: 'Event in 7 days',
        message: `${events[0].name} is scheduled in 7 days at ${events[0].venue}`,
        priority: NotificationPriority.NORMAL,
        userId: users[0].id,
        entityType: 'Event',
        entityId: events[0].id,
      },
      {
        type: NotificationType.EVENT_UPCOMING_3D,
        title: 'Event in 3 days',
        message: `${events[3].name} is scheduled in 3 days at ${events[3].venue}`,
        priority: NotificationPriority.HIGH,
        userId: users[0].id,
        entityType: 'Event',
        entityId: events[3].id,
      },
      {
        type: NotificationType.QUOTE_ACCEPTED,
        title: 'Quote Accepted',
        message: `Quote QT-2024001 for ${clients[0].name} has been accepted`,
        priority: NotificationPriority.HIGH,
        userId: users[0].id,
        entityType: 'Quote',
        entityId: quotes[0].id,
      },
    ],
  });

  console.log('✅ Created notifications');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Admin: thabo.molefe@trinitysound.co.ls / password123');
  console.log('   Staff: palesa.mokhethi@trinitysound.co.ls / password123');
  console.log('          lerato.mokoena@trinitysound.co.ls / password123');
  console.log('          tshepo.masilo@trinitysound.co.ls / password123');
  console.log('          mpho.lebelo@trinitysound.co.ls / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
