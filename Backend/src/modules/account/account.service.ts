import { prisma } from '../../lib/prisma';

/** Salon limit when the account has no subscription plan yet. */
export const DEFAULT_MAX_SALONS = 3;

export interface SalonSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  category: string | null;
  shortDescription: string | null;
  coverImage: string | null;
  subscriptionActive: boolean;
  latitude: number | null;
  longitude: number | null;
}

export interface AccountContext {
  account: { id: string; isActive: boolean } | null;
  salons: SalonSummary[];
  subscription: {
    status: string;
    currentPeriodEnd: Date | null;
    plan: { id: string; name: string; priceCents: number; currency: string; interval: string; maxSalons: number } | null;
  } | null;
  salonLimit: number;
}

export class AccountService {
  /**
   * Load the account owned by a user (owner-based multi-salon context).
   * Returns null account for non-owner users (staff, superadmin).
   */
  async getContextForUser(userId: string): Promise<AccountContext> {
    const account = await prisma.account.findUnique({
      where: { ownerUserId: userId },
      include: {
        tenants: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            category: true,
            shortDescription: true,
            coverImage: true,
            subscriptionActive: true,
            latitude: true,
            longitude: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        subscription: { include: { plan: true } },
      },
    });

    if (!account) {
      return { account: null, salons: [], subscription: null, salonLimit: DEFAULT_MAX_SALONS };
    }

    const sub = account.subscription;
    const salonLimit =
      sub && sub.status === 'ACTIVE' && sub.plan ? sub.plan.maxSalons : DEFAULT_MAX_SALONS;

    return {
      account: { id: account.id, isActive: account.isActive },
      salons: account.tenants,
      subscription: sub
        ? {
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd,
            plan: sub.plan
              ? {
                  id: sub.plan.id,
                  name: sub.plan.name,
                  priceCents: sub.plan.priceCents,
                  currency: sub.plan.currency,
                  interval: sub.plan.interval,
                  maxSalons: sub.plan.maxSalons,
                }
              : null,
          }
        : null,
      salonLimit,
    };
  }

  /** Ensure the user owns an account; create one if missing (for ADMIN owners). */
  async ensureAccountForOwner(userId: string) {
    let account = await prisma.account.findUnique({ where: { ownerUserId: userId } });
    if (!account) {
      account = await prisma.account.create({ data: { ownerUserId: userId, isActive: true } });
    }
    return account;
  }

  /** True if the tenant belongs to the account owned by the user. */
  async userOwnsTenant(userId: string, tenantId: string): Promise<boolean> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { account: { select: { ownerUserId: true } } },
    });
    return tenant?.account?.ownerUserId === userId;
  }

  /**
   * Sync all tenants of an account with the subscription status:
   * client visibility (Tenant.subscriptionActive) is on only when subscription is ACTIVE.
   */
  async syncTenantsVisibility(accountId: string, subscriptionActive: boolean) {
    // Never re-activate soft-deleted salons
    await prisma.tenant.updateMany({
      where: { accountId, isActive: true },
      data: { subscriptionActive },
    });
  }
}

export const accountService = new AccountService();
