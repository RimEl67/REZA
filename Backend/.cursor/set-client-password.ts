import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../prisma/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const email = process.argv[2] || 'client1@gmail.com';
const password = process.argv[3] || '123456';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const hash = await bcrypt.hash(password, 10);
  const result = await prisma.client.updateMany({
    where: { email: email.toLowerCase() },
    data: { password: hash },
  });
  const withPassword = await prisma.client.count({
    where: { email: email.toLowerCase(), password: { not: null } },
  });
  console.log(JSON.stringify({ email, updated: result.count, withPassword, ok: withPassword > 0 }));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
