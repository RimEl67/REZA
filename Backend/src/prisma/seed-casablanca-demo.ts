/**
 * Casablanca demo venues from Mobile/reza_client_mobile/lib/constants.dart
 * Idempotent upserts by subdomain.
 */
import { PrismaClient } from '../../prisma/generated/prisma/client';
import bcrypt from 'bcryptjs';

const SALT = 10;

const WEEKDAY_HOURS = [
  { day: 'Lundi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  { day: 'Mardi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  { day: 'Mercredi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  { day: 'Jeudi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  { day: 'Vendredi', isOpen: true, openTime: '09:00', closeTime: '19:00' },
  { day: 'Samedi', isOpen: true, openTime: '10:00', closeTime: '18:00' },
  { day: 'Dimanche', isOpen: false, openTime: '10:00', closeTime: '18:00' },
];

/** English keys required by schedulingValidation + getAvailableSlots */
const BUSINESS_HOURS_BY_DAY = {
  monday: { open: '09:00', close: '19:00' },
  tuesday: { open: '09:00', close: '19:00' },
  wednesday: { open: '09:00', close: '19:00' },
  thursday: { open: '09:00', close: '19:00' },
  friday: { open: '09:00', close: '19:00' },
  saturday: { open: '10:00', close: '18:00' },
  sunday: null as null,
};

const TENANT_BUSINESS_HOURS = {
  schedules: WEEKDAY_HOURS,
  ...BUSINESS_HOURS_BY_DAY,
};

const EMPLOYEE_HOURS = [
  { day: 'Lundi', isWorking: true, startTime: '09:00', endTime: '19:00', breaks: [{ start: '13:00', end: '14:00' }] },
  { day: 'Mardi', isWorking: true, startTime: '09:00', endTime: '19:00', breaks: [{ start: '13:00', end: '14:00' }] },
  { day: 'Mercredi', isWorking: true, startTime: '09:00', endTime: '19:00', breaks: [{ start: '13:00', end: '14:00' }] },
  { day: 'Jeudi', isWorking: true, startTime: '09:00', endTime: '19:00', breaks: [{ start: '13:00', end: '14:00' }] },
  { day: 'Vendredi', isWorking: true, startTime: '09:00', endTime: '19:00', breaks: [{ start: '13:00', end: '14:00' }] },
  { day: 'Samedi', isWorking: true, startTime: '10:00', endTime: '18:00', breaks: [] },
  { day: 'Dimanche', isWorking: false, startTime: '10:00', endTime: '18:00', breaks: [] },
];

type VenueSeed = {
  subdomain: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  address: string;
  city: string;
  coverImage: string;
  latitude: number;
  longitude: number;
  featured: boolean;
  shortDescription: string;
  services: Array<{ name: string; duration: number; price: number; description: string; category: string }>;
};

const VENUES: VenueSeed[] = [
  {
    subdomain: 'elegance',
    name: 'Salon Élégance',
    email: 'contact@elegance.ma',
    phone: '+212522000001',
    category: 'Coiffeur',
    address: 'Maarif, Casablanca',
    city: 'Casablanca',
    coverImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop',
    latitude: 33.585,
    longitude: -7.635,
    featured: true,
    shortDescription: 'Salon de coiffure premium à Maarif',
    services: [
      { name: 'Coupe femme', duration: 45, price: 150, description: 'Coupe, shampoing et brushing inclus', category: 'Coiffure' },
      { name: 'Brushing', duration: 30, price: 80, description: 'Brushing lissant ou volumisant', category: 'Coiffure' },
      { name: 'Coloration', duration: 90, price: 250, description: 'Coloration complète avec soin', category: 'Coloration' },
      { name: 'Mèches', duration: 120, price: 320, description: 'Balayage ou mèches classiques', category: 'Coloration' },
    ],
  },
  {
    subdomain: 'barber-studio',
    name: 'Barber Studio',
    email: 'contact@barberstudio.ma',
    phone: '+212522000002',
    category: 'Barbier',
    address: 'Racine, Casablanca',
    city: 'Casablanca',
    coverImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop',
    latitude: 33.595,
    longitude: -7.637,
    featured: true,
    shortDescription: 'Barbershop moderne à Racine',
    services: [
      { name: 'Coupe homme', duration: 30, price: 80, description: 'Coupe classique ou moderne', category: 'Barbier' },
      { name: "Rasage à l'ancienne", duration: 30, price: 70, description: 'Rasage au blaireau et rasoir', category: 'Barbier' },
      { name: 'Taille de barbe', duration: 20, price: 50, description: 'Taille et entretien de barbe', category: 'Barbier' },
    ],
  },
  {
    subdomain: 'spa-royal',
    name: 'Spa Royal Casablanca',
    email: 'contact@sparoyal.ma',
    phone: '+212522000003',
    category: 'Spa',
    address: 'Oasis, Casablanca',
    city: 'Casablanca',
    coverImage: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=800&auto=format&fit=crop',
    latitude: 33.555,
    longitude: -7.636,
    featured: true,
    shortDescription: 'Spa et hammam à Oasis',
    services: [
      { name: 'Hammam traditionnel', duration: 60, price: 200, description: 'Hammam avec gommage au savon beldi', category: 'Spa' },
      { name: 'Massage relaxant', duration: 60, price: 250, description: 'Massage corps complet aux huiles', category: 'Massage' },
      { name: "Gommage argan", duration: 45, price: 180, description: "Gommage corps à l'huile d'argan", category: 'Spa' },
    ],
  },
  {
    subdomain: 'beauty-chic',
    name: 'Beauty Center Chic',
    email: 'contact@beautychic.ma',
    phone: '+212522000004',
    category: 'Institut de beauté',
    address: 'Centre-ville, Casablanca',
    city: 'Casablanca',
    coverImage: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?q=80&w=800&auto=format&fit=crop',
    latitude: 33.59,
    longitude: -7.61,
    featured: false,
    shortDescription: 'Centre de beauté en centre-ville',
    services: [
      { name: 'Manucure gel', duration: 60, price: 120, description: 'Pose de gel et nail art inclus', category: 'Manucure' },
      { name: 'Pédicure complète', duration: 60, price: 130, description: 'Soin pieds + vernis semi-permanent', category: 'Manucure' },
      { name: 'Épilation jambes', duration: 30, price: 90, description: 'Épilation à la cire tiède', category: 'Esthétique' },
    ],
  },
  {
    subdomain: 'nail-bar',
    name: 'Nail Bar Chic',
    email: 'contact@nailbar.ma',
    phone: '+212522000005',
    category: 'Manucure',
    address: 'Racine, Casablanca',
    city: 'Casablanca',
    coverImage: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800&auto=format&fit=crop',
    latitude: 33.594,
    longitude: -7.638,
    featured: false,
    shortDescription: 'Nail bar à Racine',
    services: [
      { name: 'Pose résine', duration: 75, price: 160, description: 'Pose résine avec nail art personnalisé', category: 'Manucure' },
      { name: 'Vernis semi-permanent', duration: 45, price: 100, description: 'Vernis longue durée 3 semaines', category: 'Manucure' },
    ],
  },
  {
    subdomain: 'zen-spa',
    name: 'Zen Spa',
    email: 'contact@zenspa.ma',
    phone: '+212522000006',
    category: 'Massage',
    address: 'Anfa, Casablanca',
    city: 'Casablanca',
    coverImage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop',
    latitude: 33.592,
    longitude: -7.648,
    featured: true,
    shortDescription: 'Massages et bien-être à Anfa',
    services: [
      { name: 'Massage suédois', duration: 60, price: 220, description: 'Massage relaxant complet du corps', category: 'Massage' },
      { name: 'Massage aux pierres chaudes', duration: 75, price: 280, description: 'Détente profonde avec pierres volcaniques', category: 'Massage' },
      { name: 'Réflexologie plantaire', duration: 45, price: 160, description: 'Massage des pieds et points réflexes', category: 'Massage' },
    ],
  },
];

export async function seedCasablancaDemo(prisma: PrismaClient) {
  console.log('\n📍 Seeding Casablanca demo venues (mobile mocks)...');
  const clientPassword = await bcrypt.hash('123456', SALT);
  const adminPassword = await bcrypt.hash('password123', SALT);

  let platformClientId: string | null = null;
  let firstTenantId: string | null = null;
  let firstServiceId: string | null = null;
  let firstAdminId: string | null = null;

  for (const venue of VENUES) {
    const tenant = await prisma.tenant.upsert({
      where: { subdomain: venue.subdomain },
      update: {
        name: venue.name,
        email: venue.email,
        phone: venue.phone,
        address: venue.address,
        category: venue.category,
        coverImage: venue.coverImage,
        shortDescription: venue.shortDescription,
        city: venue.city,
        latitude: venue.latitude,
        longitude: venue.longitude,
        googleMapsLink: `https://maps.google.com/?q=${venue.latitude},${venue.longitude}`,
        isActive: true,
        subscriptionActive: true,
        tags: [venue.category.toLowerCase(), 'casablanca'],
      },
      create: {
        name: venue.name,
        subdomain: venue.subdomain,
        email: venue.email,
        phone: venue.phone,
        address: venue.address,
        category: venue.category,
        coverImage: venue.coverImage,
        shortDescription: venue.shortDescription,
        city: venue.city,
        latitude: venue.latitude,
        longitude: venue.longitude,
        googleMapsLink: `https://maps.google.com/?q=${venue.latitude},${venue.longitude}`,
        isActive: true,
        subscriptionActive: true,
        tags: [venue.category.toLowerCase(), 'casablanca'],
      },
    });

    await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      update: {
        timezone: 'Africa/Casablanca',
        currency: 'MAD',
        language: 'fr',
        businessHours: TENANT_BUSINESS_HOURS,
        photos: [venue.coverImage],
        description: venue.shortDescription,
        featured: venue.featured,
        showOnlineReservation: true,
        onlineReservationEnabled: true,
        showReviews: true,
        showMap: true,
        showOpeningHours: true,
      },
      create: {
        tenantId: tenant.id,
        timezone: 'Africa/Casablanca',
        currency: 'MAD',
        language: 'fr',
        bookingAdvanceDays: 30,
        cancellationHours: 24,
        businessHours: TENANT_BUSINESS_HOURS,
        photos: [venue.coverImage],
        description: venue.shortDescription,
        featured: venue.featured,
        showOnlineReservation: true,
        onlineReservationEnabled: true,
        showReviews: true,
        showMap: true,
        showOpeningHours: true,
      },
    });

    const adminEmail = `admin@${venue.subdomain}.ma`;
    const admin = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: adminEmail } },
      update: { password: adminPassword, isActive: true },
      create: {
        email: adminEmail,
        password: adminPassword,
        firstName: 'Admin',
        lastName: venue.name.split(' ')[0],
        role: 'ADMIN',
        tenantId: tenant.id,
        isActive: true,
      },
    });

    // Reset catalog for this tenant (keep users)
    await prisma.appointment.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.review.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.favorite.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.bookingParticipant.deleteMany({
      where: { bookingGroup: { tenantId: tenant.id } },
    });
    await prisma.bookingGroup.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.employeeService.deleteMany({
      where: { employee: { tenantId: tenant.id } },
    });
    await prisma.employee.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.service.deleteMany({ where: { tenantId: tenant.id } });

    const services = [];
    for (const s of venue.services) {
      const abbr = s.name.slice(0, 8).toUpperCase().replace(/\s+/g, '');
      const created = await prisma.service.create({
        data: {
          tenantId: tenant.id,
          name: s.name,
          abbreviation: abbr.slice(0, 10),
          description: s.description,
          category: s.category,
          color: '#111827',
          price: s.price,
          priceType: 'FIXED',
          duration: s.duration,
          visibility: 'BOOKABLE',
          competences: [],
        },
      });
      services.push(created);
    }

    const employee = await prisma.employee.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Sara',
        lastName: 'Benali',
        email: `sara@${venue.subdomain}.ma`,
        phone: '+212600000001',
        isActive: true,
        workingHours: EMPLOYEE_HOURS,
        agendaSettings: {
          color: '#7C3AED',
          role: 'Styliste',
          timeSlotDuration: 30,
          bufferTime: 5,
          maxAppointmentsPerDay: 14,
          allowOnlineBooking: true,
          status: 'active',
        },
      },
    });

    await prisma.employeeService.createMany({
      data: services.map((svc) => ({ employeeId: employee.id, serviceId: svc.id })),
      skipDuplicates: true,
    });

    if (!firstTenantId) {
      firstTenantId = tenant.id;
      firstServiceId = services[0]?.id ?? null;
      firstAdminId = admin.id;
    }

    console.log(`  ✓ ${venue.name} (${venue.subdomain}) — ${services.length} services`);
  }

  // Platform test client with password (on first Casablanca tenant)
  if (firstTenantId) {
    const existing = await prisma.client.findFirst({
      where: { tenantId: firstTenantId, email: 'client1@gmail.com' },
    });
    if (existing) {
      platformClientId = (
        await prisma.client.update({
          where: { id: existing.id },
          data: {
            password: clientPassword,
            firstName: 'Client',
            lastName: 'Demo',
            phone: '+212612345678',
            status: 'ACTIVE',
          },
        })
      ).id;
    } else {
      platformClientId = (
        await prisma.client.create({
          data: {
            tenantId: firstTenantId,
            email: 'client1@gmail.com',
            password: clientPassword,
            firstName: 'Client',
            lastName: 'Demo',
            phone: '+212612345678',
            status: 'ACTIVE',
          },
        })
      ).id;
    }

    // Sample appointments + reviews
    if (platformClientId && firstServiceId && firstAdminId) {
      const now = new Date();
      const upcoming = new Date(now);
      upcoming.setDate(upcoming.getDate() + 2);
      upcoming.setHours(15, 0, 0, 0);
      const upcomingEnd = new Date(upcoming);
      upcomingEnd.setMinutes(upcomingEnd.getMinutes() + 45);

      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      past.setHours(11, 0, 0, 0);
      const pastEnd = new Date(past);
      pastEnd.setMinutes(pastEnd.getMinutes() + 45);

      await prisma.appointment.create({
        data: {
          tenantId: firstTenantId,
          clientId: platformClientId,
          serviceId: firstServiceId,
          createdById: firstAdminId,
          startTime: upcoming,
          endTime: upcomingEnd,
          duration: 45,
          status: 'CONFIRMED',
          notes: 'Seed upcoming',
        },
      });

      const pastAppt = await prisma.appointment.create({
        data: {
          tenantId: firstTenantId,
          clientId: platformClientId,
          serviceId: firstServiceId,
          createdById: firstAdminId,
          startTime: past,
          endTime: pastEnd,
          duration: 45,
          status: 'COMPLETED',
          notes: 'Seed past',
        },
      });

      await prisma.review.create({
        data: {
          tenantId: firstTenantId,
          clientId: platformClientId,
          appointmentId: pastAppt.id,
          rating: 5,
          comment: 'Excellent service, je recommande !',
          status: 'APPROVED',
        },
      });

      console.log('  ✓ client1@gmail.com / 123456 + sample RDVs/reviews');
    }
  }

  console.log('✅ Casablanca demo seed done');
}
