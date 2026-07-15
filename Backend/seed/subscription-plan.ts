import type { PrismaClient } from '../prisma/generated/prisma/client';
import { BASE_PLAN } from './constants';

export async function seedSubscriptionPlan(prisma: PrismaClient) {
  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: BASE_PLAN.name,
      priceCents: BASE_PLAN.priceCents,
      currency: BASE_PLAN.currency,
      interval: BASE_PLAN.interval,
      maxSalons: BASE_PLAN.maxSalons,
      isActive: true,
    },
  });
  console.log(`  ✓ Plan "${plan.name}" (${plan.maxSalons} salons, ${plan.priceCents / 100} ${plan.currency}/yr)`);
  return plan;
}
