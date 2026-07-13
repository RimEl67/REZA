import dotenv from 'dotenv';
import { PrismaClient } from '../../prisma/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { seedCasablancaDemo } from './seed-casablanca-demo';

// Load environment variables
dotenv.config();

const SALT_ROUNDS = 10;
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create multiple tenants (SaaS multi-tenancy)
  // Use subdomain for upsert to avoid unique constraint issues
  const tenants = await Promise.all([
    // Tenant 1: WellBePro Demo
    prisma.tenant.upsert({
      where: { subdomain: 'demo' },
      update: {
        name: 'WellBePro Demo',
        email: 'demo@wellbepro.com',
        phone: '+33123456789',
        isActive: true
      },
      create: {
        id: 'tenant-1',
        name: 'WellBePro Demo',
        email: 'demo@wellbepro.com',
        phone: '+33123456789',
        subdomain: 'demo',
        isActive: true
      }
    }),
    // Tenant 2: Salon Beauty
    prisma.tenant.upsert({
      where: { subdomain: 'salonbeauty' },
      update: {
        name: 'Salon Beauty',
        email: 'contact@salonbeauty.com',
        phone: '+33987654321',
        isActive: true
      },
      create: {
        id: 'tenant-2',
        name: 'Salon Beauty',
        email: 'contact@salonbeauty.com',
        phone: '+33987654321',
        subdomain: 'salonbeauty',
        isActive: true
      }
    }),
    // Tenant 3: Spa Relax
    prisma.tenant.upsert({
      where: { subdomain: 'sparelax' },
      update: {
        name: 'Spa Relax',
        email: 'info@sparelax.com',
        phone: '+33555666777',
        isActive: true
      },
      create: {
        id: 'tenant-3',
        name: 'Spa Relax',
        email: 'info@sparelax.com',
        phone: '+33555666777',
        subdomain: 'sparelax',
        isActive: true
      }
    })
  ]);

  console.log('✅ Created tenants:', tenants.length);

  // Create tenant settings for each tenant
  for (const tenant of tenants) {
    await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      update: {},
      create: {
        tenantId: tenant.id,
        timezone: 'Europe/Paris',
        currency: 'EUR',
        language: 'fr',
        bookingAdvanceDays: 30,
        cancellationHours: 24
      }
    });
  }

  const defaultPassword = await hashPassword('password123');

  // Create users for each tenant (separate admins for each tenant)
  const tenant1Users = await Promise.all([
    prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: tenants[0].id,
          email: 'wail@ouz.ma'
        }
      },
      update: { password: await hashPassword('ouz1234'), isActive: true },
      create: {
        email: 'wail@ouz.ma',
        password: await hashPassword('ouz1234'),
        firstName: 'Wail',
        lastName: 'Ouz',
        role: 'ADMIN',
        tenantId: tenants[0].id,
        isActive: true
      }
    }),
    prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: tenants[0].id,
          email: 'admin@wellbepro.com'
        }
      },
      update: { password: defaultPassword, isActive: true },
      create: {
        email: 'admin@wellbepro.com',
        password: defaultPassword,
        firstName: 'Admin',
        lastName: 'Principal',
        role: 'ADMIN',
        tenantId: tenants[0].id,
        isActive: true
      }
    })
  ]);

  const tenant2Users = await Promise.all([
    prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: tenants[1].id,
          email: 'admin@salonbeauty.com'
        }
      },
      update: { password: defaultPassword, isActive: true },
      create: {
        email: 'admin@salonbeauty.com',
        password: defaultPassword,
        firstName: 'Sophie',
        lastName: 'Martin',
        role: 'ADMIN',
        tenantId: tenants[1].id,
        isActive: true
      }
    }),
    prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: tenants[1].id,
          email: 'manager@salonbeauty.com'
        }
      },
      update: { password: defaultPassword, isActive: true },
      create: {
        email: 'manager@salonbeauty.com',
        password: defaultPassword,
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'ADMIN',
        tenantId: tenants[1].id,
        isActive: true
      }
    })
  ]);

  const tenant3Users = await Promise.all([
    prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: tenants[2].id,
          email: 'admin@sparelax.com'
        }
      },
      update: { password: defaultPassword, isActive: true },
      create: {
        email: 'admin@sparelax.com',
        password: defaultPassword,
        firstName: 'Marie',
        lastName: 'Dubois',
        role: 'ADMIN',
        tenantId: tenants[2].id,
        isActive: true
      }
    })
  ]);

  console.log('✅ Created users for all tenants');
  console.log('   - Tenant 1 (WellBePro Demo):', tenant1Users.length, 'admins');
  console.log('   - Tenant 2 (Salon Beauty):', tenant2Users.length, 'admins');
  console.log('   - Tenant 3 (Spa Relax):', tenant3Users.length, 'admins');

  // Delete existing data for clean seed (in correct order to respect foreign keys)
  // This ensures we start fresh each time
  console.log('🧹 Cleaning existing data...');
  const tenantIds = tenants.map(t => t.id);
  
  // Delete in order: appointments -> invoices -> employeeServices -> employees -> services -> clients
  await prisma.appointment.deleteMany({
    where: { tenantId: { in: tenantIds } }
  });
  await prisma.invoice.deleteMany({
    where: { tenantId: { in: tenantIds } }
  });
  await prisma.review.deleteMany({
    where: { tenantId: { in: tenantIds } }
  });
  await prisma.employeeService.deleteMany({
    where: {
      employee: { tenantId: { in: tenantIds } }
    }
  });
  await prisma.employee.deleteMany({
    where: { tenantId: { in: tenantIds } }
  });
  await prisma.service.deleteMany({
    where: { tenantId: { in: tenantIds } }
  });
  await prisma.client.deleteMany({
    where: { tenantId: { in: tenantIds } }
  });
  console.log('✅ Cleaned existing data');

  // Create services for Tenant 1
  const tenant1Services = await Promise.all([
    prisma.service.create({
      data: {
        tenantId: tenants[0].id,
        name: 'Coupe de cheveux',
        abbreviation: 'COUPE',
        description: 'Coupe de cheveux classique',
        category: 'Coiffure',
        color: '#002366',
        price: 25,
        priceType: 'FIXED',
        duration: 30,
        visibility: 'BOOKABLE',
        competences: []
      }
    }),
    prisma.service.create({
      data: {
        tenantId: tenants[0].id,
        name: 'Coloration',
        abbreviation: 'COLOR',
        description: 'Coloration complète',
        category: 'Coloration',
        color: '#FF6B6B',
        price: 60,
        priceType: 'FIXED',
        duration: 90,
        visibility: 'BOOKABLE',
        competences: []
      }
    }),
    prisma.service.create({
      data: {
        tenantId: tenants[0].id,
        name: 'Brushing',
        abbreviation: 'BRUSH',
        description: 'Mise en forme et séchage',
        category: 'Soin',
        color: '#4ECDC4',
        price: 20,
        priceType: 'FIXED',
        duration: 20,
        visibility: 'BOOKABLE',
        competences: []
      }
    })
  ]);

  // Create services for Tenant 2
  const tenant2Services = await Promise.all([
    prisma.service.create({
      data: {
        tenantId: tenants[1].id,
        name: 'Coupe Femme',
        abbreviation: 'COUPE F',
        description: 'Coupe féminine moderne',
        category: 'Coiffure',
        color: '#EC4899',
        price: 45,
        priceType: 'FIXED',
        duration: 60,
        visibility: 'BOOKABLE',
        competences: []
      }
    }),
    prisma.service.create({
      data: {
        tenantId: tenants[1].id,
        name: 'Mèches',
        abbreviation: 'MECHES',
        description: 'Mèches balayage',
        category: 'Coloration',
        color: '#F59E0B',
        price: 120,
        priceType: 'FIXED',
        duration: 120,
        visibility: 'BOOKABLE',
        competences: []
      }
    })
  ]);

  // Create services for Tenant 3
  const tenant3Services = await Promise.all([
    prisma.service.create({
      data: {
        tenantId: tenants[2].id,
        name: 'Massage Relaxant',
        abbreviation: 'MASSAGE',
        description: 'Massage complet du corps',
        category: 'Massage',
        color: '#8B5CF6',
        price: 80,
        priceType: 'FIXED',
        duration: 60,
        visibility: 'BOOKABLE',
        competences: []
      }
    }),
    prisma.service.create({
      data: {
        tenantId: tenants[2].id,
        name: 'Soin du Visage',
        abbreviation: 'SOIN',
        description: 'Soin complet du visage',
        category: 'Soin',
        color: '#10B981',
        price: 65,
        priceType: 'FIXED',
        duration: 45,
        visibility: 'BOOKABLE',
        competences: []
      }
    })
  ]);

  console.log('✅ Created services for all tenants');
  console.log('   - Tenant 1:', tenant1Services.length, 'services');
  console.log('   - Tenant 2:', tenant2Services.length, 'services');
  console.log('   - Tenant 3:', tenant3Services.length, 'services');

  // Create employees for Tenant 1
  const tenant1Employees = await Promise.all([
    prisma.employee.create({
      data: {
        tenantId: tenants[0].id,
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie@wellbepro.com',
        phone: '+33123456790',
        isActive: true,
        workingHours: [
          { day: 'Lundi', isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [{ start: '12:00', end: '13:00' }] },
          { day: 'Mardi', isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [{ start: '12:00', end: '13:00' }] },
          { day: 'Mercredi', isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [{ start: '12:00', end: '13:00' }] },
          { day: 'Jeudi', isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [{ start: '12:00', end: '13:00' }] },
          { day: 'Vendredi', isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [{ start: '12:00', end: '13:00' }] },
          { day: 'Samedi', isWorking: false, startTime: '09:00', endTime: '18:00', breaks: [] },
          { day: 'Dimanche', isWorking: false, startTime: '09:00', endTime: '18:00', breaks: [] }
        ],
        agendaSettings: {
          color: '#3B82F6',
          role: 'Coiffeur Senior',
          timeSlotDuration: 30,
          bufferTime: 5,
          maxAppointmentsPerDay: 12,
          allowOnlineBooking: true,
          status: 'active'
        }
      }
    }),
    prisma.employee.create({
      data: {
        tenantId: tenants[0].id,
        firstName: 'Jean',
        lastName: 'Martin',
        email: 'jean@wellbepro.com',
        phone: '+33123456791',
        isActive: true,
        workingHours: [
          { day: 'Lundi', isWorking: true, startTime: '10:00', endTime: '19:00', breaks: [{ start: '13:00', end: '14:00' }] },
          { day: 'Mardi', isWorking: true, startTime: '10:00', endTime: '19:00', breaks: [{ start: '13:00', end: '14:00' }] },
          { day: 'Mercredi', isWorking: true, startTime: '10:00', endTime: '19:00', breaks: [{ start: '13:00', end: '14:00' }] },
          { day: 'Jeudi', isWorking: true, startTime: '10:00', endTime: '19:00', breaks: [{ start: '13:00', end: '14:00' }] },
          { day: 'Vendredi', isWorking: true, startTime: '10:00', endTime: '19:00', breaks: [{ start: '13:00', end: '14:00' }] },
          { day: 'Samedi', isWorking: true, startTime: '09:00', endTime: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
          { day: 'Dimanche', isWorking: false, startTime: '09:00', endTime: '18:00', breaks: [] }
        ],
        agendaSettings: {
          color: '#EC4899',
          role: 'Coloriste',
          timeSlotDuration: 45,
          bufferTime: 10,
          maxAppointmentsPerDay: 8,
          allowOnlineBooking: true,
          status: 'active'
        }
      }
    })
  ]);

  // Create employees for Tenant 2
  const tenant2Employees = await Promise.all([
    prisma.employee.create({
      data: {
        tenantId: tenants[1].id,
        firstName: 'Sophie',
        lastName: 'Bernard',
        email: 'sophie@salonbeauty.com',
        phone: '+33987654320',
        isActive: true,
        workingHours: [
          { day: 'Lundi', isWorking: true, startTime: '08:00', endTime: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
          { day: 'Mardi', isWorking: true, startTime: '08:00', endTime: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
          { day: 'Mercredi', isWorking: true, startTime: '08:00', endTime: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
          { day: 'Jeudi', isWorking: true, startTime: '08:00', endTime: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
          { day: 'Vendredi', isWorking: true, startTime: '08:00', endTime: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
          { day: 'Samedi', isWorking: false, startTime: '09:00', endTime: '18:00', breaks: [] },
          { day: 'Dimanche', isWorking: false, startTime: '09:00', endTime: '18:00', breaks: [] }
        ],
        agendaSettings: {
          color: '#F59E0B',
          role: 'Styliste',
          timeSlotDuration: 60,
          bufferTime: 15,
          maxAppointmentsPerDay: 6,
          allowOnlineBooking: true,
          status: 'active'
        }
      }
    })
  ]);

  // Create employees for Tenant 3
  const tenant3Employees = await Promise.all([
    prisma.employee.create({
      data: {
        tenantId: tenants[2].id,
        firstName: 'Emma',
        lastName: 'Lefebvre',
        email: 'emma@sparelax.com',
        phone: '+33555666770',
        isActive: true,
        workingHours: [
          { day: 'Lundi', isWorking: true, startTime: '10:00', endTime: '20:00', breaks: [{ start: '14:00', end: '15:00' }] },
          { day: 'Mardi', isWorking: true, startTime: '10:00', endTime: '20:00', breaks: [{ start: '14:00', end: '15:00' }] },
          { day: 'Mercredi', isWorking: true, startTime: '10:00', endTime: '20:00', breaks: [{ start: '14:00', end: '15:00' }] },
          { day: 'Jeudi', isWorking: true, startTime: '10:00', endTime: '20:00', breaks: [{ start: '14:00', end: '15:00' }] },
          { day: 'Vendredi', isWorking: true, startTime: '10:00', endTime: '20:00', breaks: [{ start: '14:00', end: '15:00' }] },
          { day: 'Samedi', isWorking: true, startTime: '09:00', endTime: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
          { day: 'Dimanche', isWorking: true, startTime: '10:00', endTime: '16:00', breaks: [] }
        ],
        agendaSettings: {
          color: '#8B5CF6',
          role: 'Masseuse',
          timeSlotDuration: 60,
          bufferTime: 10,
          maxAppointmentsPerDay: 8,
          allowOnlineBooking: true,
          status: 'active'
        }
      }
    })
  ]);

  console.log('✅ Created employees for all tenants');
  console.log('   - Tenant 1:', tenant1Employees.length, 'employees');
  console.log('   - Tenant 2:', tenant2Employees.length, 'employees');
  console.log('   - Tenant 3:', tenant3Employees.length, 'employees');

  // Link employees to services for Tenant 1
  await prisma.employeeService.createMany({
    data: [
      { employeeId: tenant1Employees[0].id, serviceId: tenant1Services[0].id },
      { employeeId: tenant1Employees[0].id, serviceId: tenant1Services[1].id },
      { employeeId: tenant1Employees[1].id, serviceId: tenant1Services[0].id },
      { employeeId: tenant1Employees[1].id, serviceId: tenant1Services[2].id }
    ],
    skipDuplicates: true
  });

  // Link employees to services for Tenant 2
  await prisma.employeeService.createMany({
    data: [
      { employeeId: tenant2Employees[0].id, serviceId: tenant2Services[0].id },
      { employeeId: tenant2Employees[0].id, serviceId: tenant2Services[1].id }
    ],
    skipDuplicates: true
  });

  // Link employees to services for Tenant 3
  await prisma.employeeService.createMany({
    data: [
      { employeeId: tenant3Employees[0].id, serviceId: tenant3Services[0].id },
      { employeeId: tenant3Employees[0].id, serviceId: tenant3Services[1].id }
    ],
    skipDuplicates: true
  });

  console.log('✅ Linked employees to services for all tenants');

  // Create clients for Tenant 1
  const tenant1Clients = await Promise.all([
    prisma.client.create({
      data: {
        tenantId: tenants[0].id,
        firstName: 'Sophie',
        lastName: 'Bernard',
        email: 'sophie@example.com',
        phone: '+33123456792',
        status: 'ACTIVE'
      }
    }),
    prisma.client.create({
      data: {
        tenantId: tenants[0].id,
        firstName: 'Pierre',
        lastName: 'Lefebvre',
        email: 'pierre@example.com',
        phone: '+33123456793',
        status: 'ACTIVE'
      }
    })
  ]);

  // Create clients for Tenant 2
  const tenant2Clients = await Promise.all([
    prisma.client.create({
      data: {
        tenantId: tenants[1].id,
        firstName: 'Marie',
        lastName: 'Dubois',
        email: 'marie@example.com',
        phone: '+33987654322',
        status: 'ACTIVE'
      }
    }),
    prisma.client.create({
      data: {
        tenantId: tenants[1].id,
        firstName: 'Luc',
        lastName: 'Moreau',
        email: 'luc@example.com',
        phone: '+33987654323',
        status: 'ACTIVE'
      }
    })
  ]);

  // Create clients for Tenant 3
  const tenant3Clients = await Promise.all([
    prisma.client.create({
      data: {
        tenantId: tenants[2].id,
        firstName: 'Julie',
        lastName: 'Garcia',
        email: 'julie@example.com',
        phone: '+33555666772',
        status: 'ACTIVE'
      }
    }),
    prisma.client.create({
      data: {
        tenantId: tenants[2].id,
        firstName: 'Thomas',
        lastName: 'Petit',
        email: 'thomas@example.com',
        phone: '+33555666773',
        status: 'ACTIVE'
      }
    })
  ]);

  console.log('✅ Created clients for all tenants');
  console.log('   - Tenant 1:', tenant1Clients.length, 'clients');
  console.log('   - Tenant 2:', tenant2Clients.length, 'clients');
  console.log('   - Tenant 3:', tenant3Clients.length, 'clients');

  console.log('\n🎉 Seeding completed!');
  console.log('\n📋 Tenant Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Tenant 1: WellBePro Demo');
  console.log('  - Admins: wail@ouz.ma, admin@wellbepro.com');
  console.log('  - Employees:', tenant1Employees.length);
  console.log('  - Services:', tenant1Services.length);
  console.log('  - Clients:', tenant1Clients.length);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Tenant 2: Salon Beauty');
  console.log('  - Admins: admin@salonbeauty.com, manager@salonbeauty.com');
  console.log('  - Employees:', tenant2Employees.length);
  console.log('  - Services:', tenant2Services.length);
  console.log('  - Clients:', tenant2Clients.length);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Tenant 3: Spa Relax');
  console.log('  - Admins: admin@sparelax.com');
  console.log('  - Employees:', tenant3Employees.length);
  console.log('  - Services:', tenant3Services.length);
  console.log('  - Clients:', tenant3Clients.length);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔐 All data is completely isolated per tenant!');
  console.log('   Each admin can only see and manage their own tenant\'s data.');

  await seedCasablancaDemo(prisma);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
