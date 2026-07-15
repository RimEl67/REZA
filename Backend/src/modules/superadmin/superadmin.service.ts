import { Prisma } from '../../../prisma/generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { accountService } from '../account/account.service';

export type ListAccountsParams = {
  page?: number;
  limit?: number;
  q?: string;
  planId?: string;
  endsAfter?: string;
  endsBefore?: string;
};

export type UpdateAccountData = {
  isActive?: boolean;
  subscriptionStatus?: 'NONE' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
  planId?: string;
  currentPeriodEnd?: string | null;
};

function parseDayStart(isoDate: string): Date {
  // Accept YYYY-MM-DD or full ISO; treat date-only as start of that UTC day
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return new Date(`${isoDate}T00:00:00.000Z`);
  }
  return new Date(isoDate);
}

function parseDayEnd(isoDate: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return new Date(`${isoDate}T23:59:59.999Z`);
  }
  return new Date(isoDate);
}

function mapAccount(a: {
  id: string;
  isActive: boolean;
  createdAt: Date;
  owner: { id: string; email: string; firstName: string; lastName: string; isActive: boolean } | null;
  tenants: { id: string; name: string; city: string | null; isActive: boolean; subscriptionActive: boolean }[];
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: Date | null;
    plan: {
      id: string;
      name: string;
      priceCents: number;
      currency: string;
      interval: string;
      maxSalons: number;
    } | null;
  } | null;
}) {
  return {
    id: a.id,
    isActive: a.isActive,
    createdAt: a.createdAt,
    owner: a.owner,
    salonCount: a.tenants.length,
    salons: a.tenants,
    subscription: a.subscription
      ? {
          id: a.subscription.id,
          status: a.subscription.status,
          currentPeriodEnd: a.subscription.currentPeriodEnd,
          plan: a.subscription.plan
            ? {
                id: a.subscription.plan.id,
                name: a.subscription.plan.name,
                priceCents: a.subscription.plan.priceCents,
                currency: a.subscription.plan.currency,
                interval: a.subscription.plan.interval,
                maxSalons: a.subscription.plan.maxSalons,
              }
            : null,
        }
      : null,
  };
}

export class SuperAdminService {
  /** Accounts with owner, salons, subscription — searchable / filterable / paginated. */
  async listAccounts(params: ListAccountsParams = {}) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AccountWhereInput = {};

    const q = params.q?.trim();
    if (q) {
      where.OR = [
        { owner: { email: { contains: q, mode: 'insensitive' } } },
        { owner: { firstName: { contains: q, mode: 'insensitive' } } },
        { owner: { lastName: { contains: q, mode: 'insensitive' } } },
        { tenants: { some: { name: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    if (params.planId || params.endsAfter || params.endsBefore) {
      const subWhere: Prisma.SubscriptionWhereInput = {};
      if (params.planId) {
        subWhere.planId = params.planId;
      }
      if (params.endsAfter || params.endsBefore) {
        subWhere.currentPeriodEnd = {};
        if (params.endsAfter) {
          subWhere.currentPeriodEnd.gte = parseDayStart(params.endsAfter);
        }
        if (params.endsBefore) {
          subWhere.currentPeriodEnd.lte = parseDayEnd(params.endsBefore);
        }
      }
      where.subscription = subWhere;
    }

    const include = {
      owner: {
        select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
      },
      tenants: {
        select: { id: true, name: true, city: true, isActive: true, subscriptionActive: true },
        orderBy: { createdAt: 'asc' as const },
      },
      subscription: { include: { plan: true } },
    };

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.account.count({ where }),
    ]);

    return {
      accounts: accounts.map(mapAccount),
      total,
      page,
      limit,
    };
  }

  /**
   * Activate/deactivate an account. Deactivation also hides all its salons
   * from clients; reactivation restores visibility only if the subscription
   * is active.
   *
   * When forcing subscription ACTIVE, callers may pass planId + currentPeriodEnd.
   */
  async updateAccount(accountId: string, data: UpdateAccountData) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { subscription: true },
    });
    if (!account) {
      throw { status: 404, error: 'Account not found', message: 'Compte introuvable' };
    }

    if (typeof data.isActive === 'boolean') {
      await prisma.account.update({ where: { id: accountId }, data: { isActive: data.isActive } });
      await prisma.tenant.updateMany({
        where: { accountId },
        data: { isActive: data.isActive },
      });
    }

    const touchingSub =
      !!data.subscriptionStatus || !!data.planId || data.currentPeriodEnd !== undefined;

    if (touchingSub) {
      const status = data.subscriptionStatus;
      const periodEnd =
        data.currentPeriodEnd === undefined
          ? undefined
          : data.currentPeriodEnd
            ? new Date(data.currentPeriodEnd)
            : null;

      if (data.planId) {
        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: data.planId } });
        if (!plan) {
          throw { status: 404, error: 'Plan not found', message: 'Plan introuvable' };
        }
      }

      if (account.subscription) {
        await prisma.subscription.update({
          where: { id: account.subscription.id },
          data: {
            ...(status ? { status } : {}),
            ...(data.planId ? { planId: data.planId } : {}),
            ...(periodEnd !== undefined ? { currentPeriodEnd: periodEnd } : {}),
          },
        });
      } else {
        let planId = data.planId;
        if (!planId) {
          const basePlan = await prisma.subscriptionPlan.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
          });
          if (!basePlan) {
            throw { status: 404, error: 'Plan not found', message: 'Aucun plan disponible' };
          }
          planId = basePlan.id;
        }
        await prisma.subscription.create({
          data: {
            accountId,
            planId,
            status: status ?? 'ACTIVE',
            currentPeriodEnd: periodEnd ?? null,
          },
        });
      }
    }

    // Re-sync client visibility from the (possibly updated) state
    const updated = await prisma.account.findUnique({
      where: { id: accountId },
      include: { subscription: true },
    });
    const visible = !!updated?.isActive && updated?.subscription?.status === 'ACTIVE';
    await accountService.syncTenantsVisibility(accountId, visible);

    return { success: true };
  }

  async listPlans() {
    const plans = await prisma.subscriptionPlan.findMany({
      include: { _count: { select: { subscriptions: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return {
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        priceCents: p.priceCents,
        currency: p.currency,
        interval: p.interval,
        maxSalons: p.maxSalons,
        stripePriceId: p.stripePriceId,
        isActive: p.isActive,
        subscriberCount: p._count.subscriptions,
      })),
    };
  }

  async createPlan(data: {
    name: string;
    priceCents: number;
    currency?: string;
    interval?: string;
    maxSalons: number;
    stripePriceId?: string;
  }) {
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        priceCents: data.priceCents,
        currency: data.currency ?? 'MAD',
        interval: data.interval ?? 'year',
        maxSalons: data.maxSalons,
        stripePriceId: data.stripePriceId ?? null,
        isActive: true,
      },
    });
    return { plan };
  }

  async updatePlan(
    planId: string,
    data: {
      name?: string;
      priceCents?: number;
      currency?: string;
      interval?: string;
      maxSalons?: number;
      stripePriceId?: string | null;
      isActive?: boolean;
    }
  ) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw { status: 404, error: 'Plan not found', message: 'Plan introuvable' };
    }
    const updated = await prisma.subscriptionPlan.update({ where: { id: planId }, data });
    return { plan: updated };
  }
}

export const superAdminService = new SuperAdminService();
