import dotenv from 'dotenv';
import { PrismaClient } from '../prisma/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const rows = await prisma.client.findMany({
    where: { email: 'client1@gmail.com' },
    select: { id: true, email: true, password: true, tenantId: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
}

main();
