import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../ormconfig';
import { User, UserRole } from '../entities/User';
import { Wallet } from '../entities/Wallet';
import { WalletTransaction, TransactionType, TransactionReason } from '../entities/WalletTransaction';
import { ProfessionalProfile, OnboardingStatus } from '../entities/ProfessionalProfile';
import { ProfessionalCategory } from '../entities/ProfessionalCategory';
import { ProfessionalScheduleSlot } from '../entities/ProfessionalScheduleSlot';
import { Category } from '../entities/Category';
import { CategoryChip } from '../entities/CategoryChip';
import { CategoryConditionalField } from '../entities/CategoryConditionalField';
import { Lead, LeadStatus } from '../entities/Lead';
import { LeadChip } from '../entities/LeadChip';
import { LeadConditionalFieldValue } from '../entities/LeadConditionalFieldValue';
import { LeadMatch, MatchStatus } from '../entities/LeadMatch';
import { UrgencyTier } from '../entities/CategoryPricing';
import { AdminAction, AdminActionType } from '../entities/AdminAction';
import { Report, ReportTargetType, ReportReason, ReportStatus } from '../entities/Report';

export async function seedTestData() {
  const userRepo = AppDataSource.getRepository(User);
  const walletRepo = AppDataSource.getRepository(Wallet);
  const txRepo = AppDataSource.getRepository(WalletTransaction);
  const proRepo = AppDataSource.getRepository(ProfessionalProfile);
  const proCatRepo = AppDataSource.getRepository(ProfessionalCategory);
  const scheduleRepo = AppDataSource.getRepository(ProfessionalScheduleSlot);
  const categoryRepo = AppDataSource.getRepository(Category);
  const chipRepo = AppDataSource.getRepository(CategoryChip);
  const fieldRepo = AppDataSource.getRepository(CategoryConditionalField);
  const leadRepo = AppDataSource.getRepository(Lead);
  const leadChipRepo = AppDataSource.getRepository(LeadChip);
  const leadFieldRepo = AppDataSource.getRepository(LeadConditionalFieldValue);
  const matchRepo = AppDataSource.getRepository(LeadMatch);
  const adminRepo = AppDataSource.getRepository(AdminAction);
  const reportRepo = AppDataSource.getRepository(Report);

  // Check if test data already exists
  const existingTestUser = await userRepo.findOne({ where: { phone: '+525530001001' } });
  if (existingTestUser) {
    console.log('Test data already exists, skipping');
    return;
  }

  // ─── Load categories for reference ─────────────────────────
  const categorySlugs = [
    'plomeria', 'electricidad', 'cerrajeria', 'gas',
    'aire-acondicionado', 'boiler-calentadores', 'carpinteria',
    'herreria-aluminio', 'pintura', 'impermeabilizacion',
    'mecanica-domicilio', 'jardineria',
  ];

  const categories: Record<string, Category> = {};
  for (const slug of categorySlugs) {
    const cat = await categoryRepo.findOne({ where: { slug } });
    if (!cat) throw new Error(`Category ${slug} not found — run category seeds first`);
    categories[slug] = cat;
  }

  // Load chips and conditional fields per category
  const chipsByCategory: Record<number, CategoryChip[]> = {};
  const fieldsByCategory: Record<number, CategoryConditionalField[]> = {};
  for (const cat of Object.values(categories)) {
    chipsByCategory[cat.id] = await chipRepo.find({ where: { categoryId: cat.id }, order: { sortOrder: 'ASC' } });
    fieldsByCategory[cat.id] = await fieldRepo.find({ where: { categoryId: cat.id } });
  }

  // ─── 1. USERS ──────────────────────────────────────────────
  console.log('Seeding test users...');

  const regularUserData = [
    { phone: '+525530001001', name: 'María García López' },
    { phone: '+525530001002', name: 'Carlos Hernández Ruiz' },
    { phone: '+525530001003', name: 'Ana Martínez Flores' },
    { phone: '+525530001004', name: 'Roberto Sánchez Díaz' },
    { phone: '+525530001005', name: 'Laura Torres Morales' },
  ];

  const proUserData = [
    { phone: '+525530002001', name: 'Juan Pérez Instalaciones' },
    { phone: '+525530002002', name: 'Miguel Ángel Cerrajero' },
    { phone: '+525530002003', name: 'Fernando Ramos Construcción' },
    { phone: '+525530002004', name: 'Pedro Gómez Servicios' },
    { phone: '+525530002005', name: 'Ricardo Luna Verde' },
  ];

  // Index 0 (María) will be dual-role: professional + user
  const dualRoleIndices = new Set([0]);

  const regularUsers: User[] = [];
  for (let i = 0; i < regularUserData.length; i++) {
    const u = regularUserData[i];
    const user = await userRepo.save(userRepo.create({
      id: uuidv4(),
      phone: u.phone,
      name: u.name,
      role: dualRoleIndices.has(i) ? UserRole.PROFESSIONAL : UserRole.USER,
      phoneVerified: true,
      isActive: true,
    }));
    regularUsers.push(user);
    await walletRepo.save(walletRepo.create({
      userId: user.id,
      balance: 0,
      totalLoaded: 0,
      totalSpent: 0,
    }));
  }

  const proUsers: User[] = [];
  for (const u of proUserData) {
    const user = await userRepo.save(userRepo.create({
      id: uuidv4(),
      phone: u.phone,
      name: u.name,
      role: UserRole.PROFESSIONAL,
      phoneVerified: true,
      isActive: true,
    }));
    proUsers.push(user);
  }

  // Flag user 3 (Ana Martínez)
  regularUsers[2].isFlagged = true;
  regularUsers[2].flagReason = 'Reporte de comportamiento inapropiado con profesional';
  await userRepo.save(regularUsers[2]);

  console.log(`  ${regularUsers.length} regular users created`);
  console.log(`  ${proUsers.length} professional users created`);

  // ─── 2. PROFESSIONAL PROFILES ──────────────────────────────
  console.log('Seeding professional profiles...');

  const proProfileData = [
    {
      userIdx: 0,
      businessName: 'Plomería y Electricidad JP',
      description: 'Más de 15 años de experiencia en plomería y electricidad residencial en la zona Condesa-Roma.',
      baseLat: 19.4115, baseLng: -99.1734,
      serviceRadiusKm: 10,
      onboardingStatus: OnboardingStatus.APPROVED,
      rating: 4.80, completedJobs: 127, avgResponseTimeMinutes: 8,
      acceptanceRate: 92.50, cancellationRate: 2.10,
      badges: ['top_rated', 'fast_responder'],
      categorySlugs: ['plomeria', 'electricidad'],
      walletBalance: 1500,
    },
    {
      userIdx: 1,
      businessName: 'Cerrajería Express MA',
      description: 'Servicio 24/7 de cerrajería automotriz y residencial. Zona sur CDMX.',
      baseLat: 19.3500, baseLng: -99.1627,
      serviceRadiusKm: 15,
      onboardingStatus: OnboardingStatus.APPROVED,
      rating: 4.50, completedJobs: 89, avgResponseTimeMinutes: 12,
      acceptanceRate: 85.00, cancellationRate: 4.50,
      badges: ['verified'],
      categorySlugs: ['cerrajeria', 'gas'],
      walletBalance: 800,
    },
    {
      userIdx: 2,
      businessName: 'Ramos Carpintería & Herrería',
      description: 'Carpintería fina, herrería artística y pintura decorativa. Zona Polanco.',
      baseLat: 19.4320, baseLng: -99.1937,
      serviceRadiusKm: 8,
      onboardingStatus: OnboardingStatus.COMPLETED,
      rating: 4.20, completedJobs: 45, avgResponseTimeMinutes: 20,
      acceptanceRate: 78.00, cancellationRate: 6.00,
      badges: null,
      categorySlugs: ['carpinteria', 'herreria-aluminio', 'pintura'],
      walletBalance: 500,
    },
    {
      userIdx: 3,
      businessName: 'Gómez Clima & Calentadores',
      description: 'Especialista en aire acondicionado, boilers y mecánica ligera. Naucalpan y alrededores.',
      baseLat: 19.4784, baseLng: -99.2397,
      serviceRadiusKm: 20,
      onboardingStatus: OnboardingStatus.APPROVED,
      rating: 3.90, completedJobs: 63, avgResponseTimeMinutes: 15,
      acceptanceRate: 88.00, cancellationRate: 3.00,
      badges: ['verified'],
      categorySlugs: ['aire-acondicionado', 'boiler-calentadores', 'mecanica-domicilio'],
      walletBalance: 2000,
    },
    {
      userIdx: 4,
      businessName: 'Luna Verde Jardines',
      description: 'Impermeabilización profesional y diseño de jardines. Zona Tlalpan-Coyoacán.',
      baseLat: 19.2890, baseLng: -99.1680,
      serviceRadiusKm: 12,
      onboardingStatus: OnboardingStatus.COMPLETED,
      rating: 4.10, completedJobs: 18, avgResponseTimeMinutes: 25,
      acceptanceRate: 75.00, cancellationRate: 5.00,
      badges: null,
      categorySlugs: ['impermeabilizacion', 'jardineria'],
      walletBalance: 500,
    },
  ];

  const profiles: ProfessionalProfile[] = [];

  for (const pd of proProfileData) {
    const profile = await proRepo.save(proRepo.create({
      userId: proUsers[pd.userIdx].id,
      businessName: pd.businessName,
      description: pd.description,
      baseLat: pd.baseLat,
      baseLng: pd.baseLng,
      serviceRadiusKm: pd.serviceRadiusKm,
      isAvailable: true,
      receiveOutsideHours: false,
      rating: pd.rating,
      completedJobs: pd.completedJobs,
      avgResponseTimeMinutes: pd.avgResponseTimeMinutes,
      acceptanceRate: pd.acceptanceRate,
      cancellationRate: pd.cancellationRate,
      badges: pd.badges,
      onboardingStatus: pd.onboardingStatus,
    }));
    profiles.push(profile);

    // Professional categories
    for (const slug of pd.categorySlugs) {
      await proCatRepo.save(proCatRepo.create({
        professionalProfileId: profile.id,
        categoryId: categories[slug].id,
      }));
    }

    // Schedule slots: Mon-Fri 08:00-18:00, Sat 09:00-14:00
    for (let day = 1; day <= 5; day++) {
      await scheduleRepo.save(scheduleRepo.create({
        professionalProfileId: profile.id,
        dayOfWeek: day,
        startTime: '08:00:00',
        endTime: '18:00:00',
      }));
    }
    await scheduleRepo.save(scheduleRepo.create({
      professionalProfileId: profile.id,
      dayOfWeek: 6,
      startTime: '09:00:00',
      endTime: '14:00:00',
    }));

    // Wallet
    const wallet = await walletRepo.save(walletRepo.create({
      userId: proUsers[pd.userIdx].id,
      balance: pd.walletBalance,
      totalLoaded: pd.walletBalance,
      totalSpent: 0,
    }));

    // TOPUP transaction
    await txRepo.save(txRepo.create({
      walletId: wallet.id,
      type: TransactionType.CREDIT,
      reason: TransactionReason.TOPUP,
      amount: pd.walletBalance,
      balanceAfter: pd.walletBalance,
      notes: 'Recarga inicial de saldo',
    }));
  }

  console.log(`  ${profiles.length} professional profiles created with categories, schedules, and wallets`);

  // ─── 2b. DUAL-ROLE USER PROFILES (users who are also professionals) ──
  console.log('Seeding dual-role user professional profiles...');

  const dualProfileData = [
    {
      userIdx: 0, // María García López
      businessName: 'María Plomería Residencial',
      description: 'Plomería básica residencial, reparaciones de fugas y destapes.',
      baseLat: 19.4195, baseLng: -99.1580,
      serviceRadiusKm: 8,
      onboardingStatus: OnboardingStatus.APPROVED,
      rating: 4.30, completedJobs: 22, avgResponseTimeMinutes: 15,
      acceptanceRate: 80.00, cancellationRate: 5.00,
      badges: ['verified'],
      categorySlugs: ['plomeria'],
      walletTopup: 300,
    },
  ];

  for (const dp of dualProfileData) {
    const dualUser = regularUsers[dp.userIdx];
    const profile = await proRepo.save(proRepo.create({
      userId: dualUser.id,
      businessName: dp.businessName,
      description: dp.description,
      baseLat: dp.baseLat,
      baseLng: dp.baseLng,
      serviceRadiusKm: dp.serviceRadiusKm,
      isAvailable: true,
      receiveOutsideHours: false,
      rating: dp.rating,
      completedJobs: dp.completedJobs,
      avgResponseTimeMinutes: dp.avgResponseTimeMinutes,
      acceptanceRate: dp.acceptanceRate,
      cancellationRate: dp.cancellationRate,
      badges: dp.badges,
      onboardingStatus: dp.onboardingStatus,
    }));

    for (const slug of dp.categorySlugs) {
      await proCatRepo.save(proCatRepo.create({
        professionalProfileId: profile.id,
        categoryId: categories[slug].id,
      }));
    }

    // Schedule: Mon-Fri 09:00-17:00
    for (let day = 1; day <= 5; day++) {
      await scheduleRepo.save(scheduleRepo.create({
        professionalProfileId: profile.id,
        dayOfWeek: day,
        startTime: '09:00:00',
        endTime: '17:00:00',
      }));
    }

    // Top up wallet for lead purchases
    const dualWallet = await walletRepo.findOne({ where: { userId: dualUser.id } });
    if (dualWallet) {
      dualWallet.balance = Number(dualWallet.balance) + dp.walletTopup;
      dualWallet.totalLoaded = Number(dualWallet.totalLoaded) + dp.walletTopup;
      await walletRepo.save(dualWallet);

      await txRepo.save(txRepo.create({
        walletId: dualWallet.id,
        type: TransactionType.CREDIT,
        reason: TransactionReason.TOPUP,
        amount: dp.walletTopup,
        balanceAfter: dualWallet.balance,
        notes: 'Recarga inicial — usuario dual',
      }));
    }
  }

  console.log(`  ${dualProfileData.length} dual-role professional profiles created`);

  // ─── 3. LEADS ──────────────────────────────────────────────
  console.log('Seeding leads...');

  // Pricing lookup: category slug + urgency → price
  const priceMap: Record<string, Record<string, number>> = {
    'plomeria':             { standard: 39, today: 49, immediate: 59 },
    'electricidad':         { standard: 39, today: 49, immediate: 59 },
    'cerrajeria':           { standard: 45, today: 55, immediate: 65 },
    'gas':                  { standard: 49, today: 59, immediate: 69 },
    'aire-acondicionado':   { standard: 25, today: 35 },
    'boiler-calentadores':  { standard: 29, today: 39, immediate: 49 },
    'carpinteria':          { standard: 19, today: 29 },
    'herreria-aluminio':    { standard: 19, today: 29 },
    'pintura':              { standard: 19, today: 29 },
    'impermeabilizacion':   { standard: 25, today: 35 },
    'mecanica-domicilio':   { standard: 29, today: 39, immediate: 49 },
    'jardineria':           { standard: 15, today: 25 },
  };

  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
  const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);

  const leadData = [
    {
      catSlug: 'plomeria', userIdx: 0, urgency: UrgencyTier.TODAY,
      status: LeadStatus.TAKEN, lat: 19.4195, lng: -99.1580,
      address: 'Calle Orizaba 42, Roma Norte, CDMX',
      description: 'Fuga debajo del lavabo de la cocina, gotea constante.',
      chipIdx: [0, 4], // Fuga, Regadera/llave gotea
    },
    {
      catSlug: 'electricidad', userIdx: 1, urgency: UrgencyTier.IMMEDIATE,
      status: LeadStatus.MATCHED, lat: 19.3935, lng: -99.1575,
      address: 'Av. Universidad 1200, Narvarte, CDMX',
      description: 'Se baja la pastilla cada vez que conecto la secadora.',
      chipIdx: [1], // pastilla-breaker
    },
    {
      catSlug: 'cerrajeria', userIdx: 0, urgency: UrgencyTier.IMMEDIATE,
      status: LeadStatus.COMPLETED, lat: 19.3810, lng: -99.1715,
      address: 'Av. Insurgentes Sur 1457, Del Valle, CDMX',
      description: 'Me quedé afuera de mi departamento, necesito cerrajero urgente.',
      chipIdx: [0], // me-quede-afuera
    },
    {
      catSlug: 'gas', userIdx: 2, urgency: UrgencyTier.STANDARD,
      status: LeadStatus.PENDING, lat: 19.3560, lng: -99.0930,
      address: 'Calle Ermita Iztapalapa 3200, Iztapalapa, CDMX',
      description: 'Revisión preventiva de instalación de gas, tanque estacionario.',
      chipIdx: [2], // revision-preventiva
    },
    {
      catSlug: 'aire-acondicionado', userIdx: 1, urgency: UrgencyTier.TODAY,
      status: LeadStatus.TAKEN, lat: 19.3650, lng: -99.2620,
      address: 'Av. Santa Fe 505, Santa Fe, CDMX',
      description: 'Minisplit no enfría, hace ruido extraño.',
      chipIdx: [0, 4], // no-enfria, hace-ruido
    },
    {
      catSlug: 'boiler-calentadores', userIdx: 3, urgency: UrgencyTier.IMMEDIATE,
      status: LeadStatus.IN_PROGRESS, lat: 19.2640, lng: -99.1040,
      address: 'Calle del Niño Jesús 18, Xochimilco, CDMX',
      description: 'El boiler de paso no enciende, no tenemos agua caliente.',
      chipIdx: [0], // no-enciende-boiler
    },
    {
      catSlug: 'carpinteria', userIdx: 0, urgency: UrgencyTier.STANDARD,
      status: LeadStatus.MATCHED, lat: 19.4130, lng: -99.1750,
      address: 'Calle Tamaulipas 78, Condesa, CDMX',
      description: 'Necesito un closet a medida para recámara de 3x2.5m.',
      chipIdx: [4], // closet-cajonera
    },
    {
      catSlug: 'herreria-aluminio', userIdx: 4, urgency: UrgencyTier.STANDARD,
      status: LeadStatus.PENDING, lat: 19.5300, lng: -99.0280,
      address: 'Calle Morelos 456, Ecatepec, Estado de México',
      description: 'Necesito reja de protección para ventana de planta baja.',
      chipIdx: [0], // reja-proteccion
    },
    {
      catSlug: 'pintura', userIdx: 2, urgency: UrgencyTier.TODAY,
      status: LeadStatus.CANCELLED, lat: 19.3530, lng: -99.1610,
      address: 'Calle Pacífico 250, Coyoacán, CDMX',
      description: 'Pintar sala-comedor, paredes con humedad.',
      chipIdx: [1, 4], // pintar-sala-comedor, humedad-manchas
    },
    {
      catSlug: 'impermeabilizacion', userIdx: 3, urgency: UrgencyTier.STANDARD,
      status: LeadStatus.EXPIRED, lat: 19.2850, lng: -99.1700,
      address: 'Calzada de Tlalpan 4200, Tlalpan, CDMX',
      description: 'Goteras en techo de losa, necesito impermeabilizar 80m².',
      chipIdx: [0, 1], // goteras, impermeabilizar-techo
    },
    {
      catSlug: 'mecanica-domicilio', userIdx: 1, urgency: UrgencyTier.IMMEDIATE,
      status: LeadStatus.TAKEN, lat: 19.4340, lng: -99.1900,
      address: 'Av. Presidente Masaryk 320, Polanco, CDMX',
      description: 'Auto no arranca, posible problema de batería o alternador.',
      chipIdx: [2, 0], // no-arranca, bateria-descargada
    },
    {
      catSlug: 'jardineria', userIdx: 4, urgency: UrgencyTier.STANDARD,
      status: LeadStatus.MATCHED, lat: 19.3120, lng: -99.2050,
      address: 'Calle Cantera 15, Pedregal, CDMX',
      description: 'Poda de jardín grande, incluye 2 árboles medianos.',
      chipIdx: [0, 5], // podar-deshierbar, arboles-poda-ligera
    },
  ];

  const leads: Lead[] = [];

  for (const ld of leadData) {
    const cat = categories[ld.catSlug];
    const price = priceMap[ld.catSlug][ld.urgency] || 0;

    const lead = await leadRepo.save(leadRepo.create({
      userId: regularUsers[ld.userIdx].id,
      categoryId: cat.id,
      urgencyTier: ld.urgency,
      status: ld.status,
      description: ld.description,
      lat: ld.lat,
      lng: ld.lng,
      address: ld.address,
      priceMXN: price,
      isQualified: false,
      expiresAt: ld.status === LeadStatus.EXPIRED ? hoursAgo(2) : hoursFromNow(24),
      takenAt: [LeadStatus.TAKEN, LeadStatus.IN_PROGRESS, LeadStatus.COMPLETED].includes(ld.status) ? hoursAgo(3) : null,
    }));
    leads.push(lead);

    // Lead chips
    const catChips = chipsByCategory[cat.id];
    for (const idx of ld.chipIdx) {
      if (catChips[idx]) {
        await leadChipRepo.save(leadChipRepo.create({
          leadId: lead.id,
          categoryChipId: catChips[idx].id,
        }));
      }
    }
  }

  // Conditional field values for leads that have relevant fields
  const conditionalValues: { leadIdx: number; catSlug: string; fieldKey: string; value: string }[] = [
    { leadIdx: 0, catSlug: 'plomeria', fieldKey: 'extra_symptom', value: 'Olor / drenaje lento' },
    { leadIdx: 2, catSlug: 'cerrajeria', fieldKey: 'target_type', value: 'Casa' },
    { leadIdx: 3, catSlug: 'gas', fieldKey: 'gas_type', value: 'Tanque estacionario' },
    { leadIdx: 4, catSlug: 'aire-acondicionado', fieldKey: 'ac_type', value: 'Minisplit' },
    { leadIdx: 5, catSlug: 'boiler-calentadores', fieldKey: 'boiler_type', value: 'De paso' },
    { leadIdx: 8, catSlug: 'pintura', fieldKey: 'has_paint', value: 'No' },
    { leadIdx: 9, catSlug: 'impermeabilizacion', fieldKey: 'roof_type', value: 'Losa' },
    { leadIdx: 10, catSlug: 'mecanica-domicilio', fieldKey: 'vehicle_type', value: 'Auto' },
    { leadIdx: 10, catSlug: 'mecanica-domicilio', fieldKey: 'vehicle_info', value: 'Volkswagen Jetta 2019' },
  ];

  for (const cv of conditionalValues) {
    const catFields = fieldsByCategory[categories[cv.catSlug].id];
    const field = catFields.find(f => f.fieldKey === cv.fieldKey);
    if (field) {
      await leadFieldRepo.save(leadFieldRepo.create({
        leadId: leads[cv.leadIdx].id,
        conditionalFieldId: field.id,
        value: cv.value,
      }));
    }
  }

  console.log(`  ${leads.length} leads created with chips and conditional fields`);

  // ─── 4. LEAD MATCHES ──────────────────────────────────────
  console.log('Seeding lead matches...');

  // Helper to calculate approximate distance between two coords
  const approxDistKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const dlat = (lat2 - lat1) * 111.32;
    const dlng = (lng2 - lng1) * 111.32 * Math.cos((lat1 * Math.PI) / 180);
    return Math.round(Math.sqrt(dlat * dlat + dlng * dlng) * 100) / 100;
  };

  // [leadIdx, profileIdx, score, matchStatus]
  const matchData: [number, number, number, MatchStatus][] = [
    // Lead 0 (Plomería, TAKEN) — Pro 0 has plomeria
    [0, 0, 92.50, MatchStatus.TAKEN],

    // Lead 1 (Electricidad, MATCHED) — Pro 0 has electricidad
    [1, 0, 88.00, MatchStatus.NOTIFIED],

    // Lead 2 (Cerrajería, COMPLETED) — Pro 1 has cerrajeria
    [2, 1, 95.00, MatchStatus.TAKEN],

    // Lead 4 (AC, TAKEN) — Pro 3 has AC
    [4, 3, 85.30, MatchStatus.TAKEN],

    // Lead 5 (Boiler, IN_PROGRESS) — Pro 3 has boiler
    [5, 3, 78.50, MatchStatus.TAKEN],

    // Lead 6 (Carpintería, MATCHED) — Pro 2 has carpinteria
    [6, 2, 90.10, MatchStatus.NOTIFIED],
    [6, 2, 90.10, MatchStatus.VIEWED], // they also viewed it — will skip dup, use different approach

    // Lead 9 (Impermeabilización, EXPIRED) — Pro 4
    [9, 4, 72.00, MatchStatus.EXPIRED],

    // Lead 10 (Mecánica, TAKEN) — Pro 3 has mecanica
    [10, 3, 87.60, MatchStatus.TAKEN],

    // Lead 11 (Jardinería, MATCHED) — Pro 4 has jardineria
    [11, 4, 80.00, MatchStatus.NOTIFIED],
  ];

  // Remove duplicate match entry and add more diverse matches
  const cleanMatchData: { leadIdx: number; profileIdx: number; score: number; status: MatchStatus }[] = [
    // Lead 0 (Plomería, TAKEN by pro 0)
    { leadIdx: 0, profileIdx: 0, score: 92.50, status: MatchStatus.TAKEN },

    // Lead 1 (Electricidad, MATCHED) — multiple pros notified
    { leadIdx: 1, profileIdx: 0, score: 88.00, status: MatchStatus.NOTIFIED },

    // Lead 2 (Cerrajería, COMPLETED by pro 1)
    { leadIdx: 2, profileIdx: 1, score: 95.00, status: MatchStatus.TAKEN },

    // Lead 4 (AC, TAKEN by pro 3)
    { leadIdx: 4, profileIdx: 3, score: 85.30, status: MatchStatus.TAKEN },

    // Lead 5 (Boiler, IN_PROGRESS by pro 3)
    { leadIdx: 5, profileIdx: 3, score: 78.50, status: MatchStatus.TAKEN },

    // Lead 6 (Carpintería, MATCHED — pro 2 notified)
    { leadIdx: 6, profileIdx: 2, score: 90.10, status: MatchStatus.VIEWED },

    // Lead 9 (Impermeabilización, EXPIRED)
    { leadIdx: 9, profileIdx: 4, score: 72.00, status: MatchStatus.EXPIRED },

    // Lead 10 (Mecánica, TAKEN by pro 3)
    { leadIdx: 10, profileIdx: 3, score: 87.60, status: MatchStatus.TAKEN },

    // Lead 11 (Jardinería, MATCHED — pro 4 notified)
    { leadIdx: 11, profileIdx: 4, score: 80.00, status: MatchStatus.NOTIFIED },

    // Additional matches — declined / pending for variety
    { leadIdx: 0, profileIdx: 2, score: 60.00, status: MatchStatus.DECLINED },
    { leadIdx: 1, profileIdx: 3, score: 55.00, status: MatchStatus.PENDING },
    { leadIdx: 2, profileIdx: 0, score: 70.00, status: MatchStatus.DECLINED },
    { leadIdx: 4, profileIdx: 0, score: 45.00, status: MatchStatus.DECLINED },
    { leadIdx: 5, profileIdx: 1, score: 40.00, status: MatchStatus.EXPIRED },
    { leadIdx: 6, profileIdx: 0, score: 50.00, status: MatchStatus.PENDING },
    { leadIdx: 8, profileIdx: 2, score: 82.00, status: MatchStatus.EXPIRED },
    { leadIdx: 9, profileIdx: 2, score: 55.00, status: MatchStatus.EXPIRED },
    { leadIdx: 10, profileIdx: 0, score: 62.00, status: MatchStatus.DECLINED },
    { leadIdx: 11, profileIdx: 2, score: 48.00, status: MatchStatus.PENDING },
    { leadIdx: 3, profileIdx: 1, score: 75.00, status: MatchStatus.PENDING },
    { leadIdx: 7, profileIdx: 2, score: 68.00, status: MatchStatus.PENDING },
  ];

  let matchCount = 0;
  for (const md of cleanMatchData) {
    const lead = leads[md.leadIdx];
    const profile = profiles[md.profileIdx];
    const dist = approxDistKm(
      Number(lead.lat), Number(lead.lng),
      Number(profile.baseLat!), Number(profile.baseLng!),
    );

    await matchRepo.save(matchRepo.create({
      leadId: lead.id,
      professionalProfileId: profile.id,
      score: md.score,
      distanceKm: dist,
      status: md.status,
    }));
    matchCount++;
  }

  // Update takenByProfessionalId for TAKEN/IN_PROGRESS/COMPLETED leads
  const takenLeadPro: [number, number][] = [
    [0, 0], // Lead 0 taken by pro 0
    [2, 1], // Lead 2 completed by pro 1
    [4, 3], // Lead 4 taken by pro 3
    [5, 3], // Lead 5 in_progress by pro 3
    [10, 3], // Lead 10 taken by pro 3
  ];

  for (const [leadIdx, proIdx] of takenLeadPro) {
    leads[leadIdx].takenByProfessionalId = profiles[proIdx].id;
    await leadRepo.save(leads[leadIdx]);
  }

  console.log(`  ${matchCount} lead matches created`);

  // ─── 5. WALLET TRANSACTIONS ────────────────────────────────
  console.log('Seeding wallet transactions...');

  let txCount = 0;

  // Lead purchase transactions for taken leads
  const purchaseLeadPro: { leadIdx: number; proUserIdx: number }[] = [
    { leadIdx: 0, proUserIdx: 0 },
    { leadIdx: 2, proUserIdx: 1 },
    { leadIdx: 4, proUserIdx: 3 },
    { leadIdx: 5, proUserIdx: 3 },
    { leadIdx: 10, proUserIdx: 3 },
  ];

  for (const plp of purchaseLeadPro) {
    const lead = leads[plp.leadIdx];
    const proWallet = await walletRepo.findOne({ where: { userId: proUsers[plp.proUserIdx].id } });
    if (proWallet) {
      const amount = Number(lead.priceMXN);
      proWallet.balance = Number(proWallet.balance) - amount;
      proWallet.totalSpent = Number(proWallet.totalSpent) + amount;
      await walletRepo.save(proWallet);

      await txRepo.save(txRepo.create({
        walletId: proWallet.id,
        type: TransactionType.DEBIT,
        reason: TransactionReason.LEAD_PURCHASE,
        amount,
        balanceAfter: proWallet.balance,
        leadId: lead.id,
        notes: `Compra de lead #${lead.id}`,
      }));
      txCount++;
    }
  }

  // Refund for cancelled lead (lead 8 — pintura)
  const cancelledLeadProWallet = await walletRepo.findOne({ where: { userId: proUsers[2].id } });
  if (cancelledLeadProWallet) {
    const refundAmount = Number(leads[8].priceMXN);
    cancelledLeadProWallet.balance = Number(cancelledLeadProWallet.balance) + refundAmount;
    await walletRepo.save(cancelledLeadProWallet);

    await txRepo.save(txRepo.create({
      walletId: cancelledLeadProWallet.id,
      type: TransactionType.CREDIT,
      reason: TransactionReason.REFUND,
      amount: refundAmount,
      balanceAfter: cancelledLeadProWallet.balance,
      leadId: leads[8].id,
      notes: `Reembolso por lead cancelado #${leads[8].id}`,
    }));
    txCount++;
  }

  // Bonus for pro 0 (top performer)
  const bonusWallet = await walletRepo.findOne({ where: { userId: proUsers[0].id } });
  if (bonusWallet) {
    bonusWallet.balance = Number(bonusWallet.balance) + 100;
    await walletRepo.save(bonusWallet);

    await txRepo.save(txRepo.create({
      walletId: bonusWallet.id,
      type: TransactionType.CREDIT,
      reason: TransactionReason.BONUS,
      amount: 100,
      balanceAfter: bonusWallet.balance,
      notes: 'Bono por desempeño: más de 100 trabajos completados',
    }));
    txCount++;
  }

  console.log(`  ${txCount} wallet transactions created`);

  // ─── 6. ADMIN ACTIONS ──────────────────────────────────────
  console.log('Seeding admin actions...');

  const admin = await userRepo.findOne({ where: { phone: '+525512345678' } });
  if (!admin) {
    console.log('  Admin user not found, skipping admin actions');
  } else {
    const adminActions = [
      {
        actionType: AdminActionType.APPROVE_PROFESSIONAL,
        targetUserId: proUsers[0].id,
        reason: 'Documentación completa, experiencia verificada',
      },
      {
        actionType: AdminActionType.APPROVE_PROFESSIONAL,
        targetUserId: proUsers[1].id,
        reason: 'Documentación y licencia vigente',
      },
      {
        actionType: AdminActionType.APPROVE_PROFESSIONAL,
        targetUserId: proUsers[3].id,
        reason: 'Certificación técnica en HVAC verificada',
      },
      {
        actionType: AdminActionType.FLAG_USER,
        targetUserId: regularUsers[2].id,
        reason: 'Reporte de comportamiento inapropiado con profesional',
      },
      {
        actionType: AdminActionType.REFUND_LEAD,
        targetUserId: null,
        targetLeadId: leads[8].id,
        reason: 'Lead cancelado por el usuario, reembolso aprobado',
      },
    ];

    for (const aa of adminActions) {
      await adminRepo.save(adminRepo.create({
        adminUserId: admin.id,
        actionType: aa.actionType,
        targetUserId: aa.targetUserId || null,
        targetLeadId: (aa as any).targetLeadId || null,
        reason: aa.reason,
      }));
    }

    console.log(`  ${adminActions.length} admin actions created`);
  }

  // ─── 7. REPORTS ──────────────────────────────────────────
  console.log('Seeding reports...');

  const reportData = [
    {
      reporterUserId: regularUsers[0].id, // María
      targetType: ReportTargetType.PROFESSIONAL,
      targetUserId: proUsers[3].id, // Pedro Gómez
      targetLeadId: null,
      reason: ReportReason.NO_SHOW,
      description: 'El profesional confirmó la cita para las 10am pero nunca llegó ni contestó llamadas.',
      status: ReportStatus.PENDING,
      adminNotes: null,
      resolvedAt: null,
    },
    {
      reporterUserId: regularUsers[1].id, // Carlos
      targetType: ReportTargetType.LEAD,
      targetUserId: null,
      targetLeadId: leads[3].id, // lead de gas
      reason: ReportReason.FALSE_INFORMATION,
      description: 'Este lead tiene dirección falsa, al llegar no existe el domicilio indicado.',
      status: ReportStatus.REVIEWING,
      adminNotes: null,
      resolvedAt: null,
    },
    {
      reporterUserId: proUsers[0].id, // Juan Pérez
      targetType: ReportTargetType.USER,
      targetUserId: regularUsers[2].id, // Ana Martínez
      targetLeadId: null,
      reason: ReportReason.INAPPROPRIATE_BEHAVIOR,
      description: 'La usuaria fue agresiva y grosera durante la visita de evaluación.',
      status: ReportStatus.RESOLVED,
      adminNotes: 'Se verificó con evidencia. Se aplicó flag a la cuenta de la usuaria.',
      resolvedAt: hoursAgo(48),
    },
    {
      reporterUserId: regularUsers[3].id, // Roberto
      targetType: ReportTargetType.PROFESSIONAL,
      targetUserId: proUsers[2].id, // Fernando Ramos
      targetLeadId: null,
      reason: ReportReason.FRAUD,
      description: 'El profesional cobró por materiales que no utilizó y se negó a devolver el dinero.',
      status: ReportStatus.DISMISSED,
      adminNotes: 'El profesional presentó facturas de compra de materiales. Reporte desestimado por falta de evidencia.',
      resolvedAt: hoursAgo(24),
    },
    {
      reporterUserId: regularUsers[4].id, // Laura
      targetType: ReportTargetType.PROFESSIONAL,
      targetUserId: proUsers[1].id, // Miguel Ángel
      targetLeadId: null,
      reason: ReportReason.SPAM,
      description: 'El profesional envía mensajes promocionales no solicitados repetidamente.',
      status: ReportStatus.PENDING,
      adminNotes: null,
      resolvedAt: null,
    },
    {
      reporterUserId: proUsers[1].id, // Miguel Ángel
      targetType: ReportTargetType.LEAD,
      targetUserId: null,
      targetLeadId: leads[7].id, // lead de herrería
      reason: ReportReason.FALSE_INFORMATION,
      description: 'Las fotos del lead no corresponden al trabajo real, el problema es mucho más grande de lo indicado.',
      status: ReportStatus.REVIEWING,
      adminNotes: null,
      resolvedAt: null,
    },
  ];

  for (const rd of reportData) {
    await reportRepo.save(reportRepo.create({
      reporterUserId: rd.reporterUserId,
      targetType: rd.targetType,
      targetUserId: rd.targetUserId,
      targetLeadId: rd.targetLeadId,
      reason: rd.reason,
      description: rd.description,
      status: rd.status,
      adminNotes: rd.adminNotes,
      resolvedAt: rd.resolvedAt,
    }));
  }

  console.log(`  ${reportData.length} reports created`);

  console.log('Test data seeded successfully!');
  console.log('Summary:');
  console.log(`  - ${regularUsers.length} regular users (${dualRoleIndices.size} dual-role with pro profile)`);
  console.log(`  - ${proUsers.length} professionals with profiles, schedules & wallets`);
  console.log(`  - ${leads.length} leads with chips & conditional fields`);
  console.log(`  - ${matchCount} lead matches`);
  console.log(`  - ${txCount} wallet transactions (+ ${proProfileData.length} topups)`);
  console.log(`  - 5 admin actions`);
  console.log(`  - ${reportData.length} reports`);
}
