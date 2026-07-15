/**
 * Backfill multi-salon accounts.
 *
 * - Creates the base subscription plan (800 DH/year, maxSalons = 3) if missing.
 * - For each existing tenant without an account:
 *   - Finds the tenant's ADMIN user (fallback: first user).
 *   - Creates (or reuses) an Account owned by that user.
 *   - Links the tenant to the account.
 *   - Creates an ACTIVE subscription on the base plan (1 year) so existing
 *     salons stay client-visible.
 *
 * Run: npx tsx src/prisma/backfill-accounts.ts
 */
import { prisma } from '../lib/prisma';

const BASE_PLAN_NAME = 'Standard';
const BASE_PLAN_PRICE_CENTS = 80000; // 800 DH
const BASE_PLAN_MAX_SALONS = 3;

async function main() {
  // 1. Base plan
  let plan = await prisma.subscriptionPlan.findFirst({
    where: { name: BASE_PLAN_NAME },
  });
  if (!plan) {
    plan = await prisma.subscriptionPlan.create({
      data: {
        name: BASE_PLAN_NAME,
        priceCents: BASE_PLAN_PRICE_CENTS,
        currency: 'MAD',
        interval: 'year',
        maxSalons: BASE_PLAN_MAX_SALONS,
        isActive: true,
      },
    });
    console.log(`[Backfill] Created base plan "${plan.name}" (${plan.id})`);
  } else {
    console.log(`[Backfill] Base plan already exists (${plan.id})`);
  }

  // 2. Tenants without an account
  const tenants = await prisma.tenant.findMany({
    where: { accountId: null },
    select: { id: true, name: true },
  });
  console.log(`[Backfill] ${tenants.length} tenant(s) without account`);

  for (const tenant of tenants) {
    const owner =
      (await prisma.user.findFirst({
        where: { tenantId: tenant.id, role: 'ADMIN' },
        orderBy: { createdAt: 'asc' },
        select: { id: true, email: true },
      })) ??
      (await prisma.user.findFirst({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: 'asc' },
        select: { id: true, email: true },
      }));

    if (!owner) {
      console.warn(`[Backfill] Tenant "${tenant.name}" (${tenant.id}) has no users — skipped`);
      continue;
    }

    // Reuse the owner's account if they already own one (multi-tenant owners)
    let account = await prisma.account.findUnique({
      where: { ownerUserId: owner.id },
    });
    if (!account) {
      account = await prisma.account.create({
        data: { ownerUserId: owner.id, isActive: true },
      });
      console.log(`[Backfill] Created account ${account.id} for ${owner.email}`);
    }

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { accountId: account.id },
    });

    const existingSub = await prisma.subscription.findUnique({
      where: { accountId: account.id },
    });
    if (!existingSub) {
      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      await prisma.subscription.create({
        data: {
          accountId: account.id,
          planId: plan.id,
          status: 'ACTIVE',
          currentPeriodEnd: periodEnd,
        },
      });
    }

    console.log(`[Backfill] Linked tenant "${tenant.name}" -> account ${account.id}`);
  }

  console.log('[Backfill] Done');
}

main()
  .catch((e) => {
    console.error('[Backfill] Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
