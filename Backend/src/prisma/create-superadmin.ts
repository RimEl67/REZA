/**
 * Create a global SUPER_ADMIN (no tenant). Local / ops only — not an HTTP API.
 *
 * Usage:
 *   npx tsx src/prisma/create-superadmin.ts
 *   npx tsx src/prisma/create-superadmin.ts --email=you@example.com --password=secret --first=Super --last=Admin
 */
import { prisma } from '../lib/prisma';
import { hashPassword } from '../utils/password';

function arg(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

async function main() {
  const email = arg('email', 'superadmin@gmail.com').trim().toLowerCase();
  const password = arg('password', '123456');
  const firstName = arg('first', 'Super');
  const lastName = arg('last', 'Admin');

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' }, role: 'SUPER_ADMIN' },
  });
  if (existing) {
    console.log(`[create-superadmin] Already exists: ${existing.email} (${existing.id})`);
    return;
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      firstName,
      lastName,
      role: 'SUPER_ADMIN',
      tenantId: null,
      isActive: true,
    },
    select: { id: true, email: true, role: true },
  });

  console.log('[create-superadmin] Created:', user);
}

main()
  .catch((e) => {
    console.error('[create-superadmin] Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
