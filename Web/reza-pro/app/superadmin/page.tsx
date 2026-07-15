'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  CreditCard,
  Building,
  Loader2,
  Plus,
  Pencil,
  Check,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';

interface AccountRow {
  id: string;
  isActive: boolean;
  createdAt: string;
  owner: { id: string; email: string; firstName: string; lastName: string; isActive: boolean } | null;
  salonCount: number;
  salons: { id: string; name: string; city: string | null; isActive: boolean; subscriptionActive: boolean }[];
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: string | null;
    plan: {
      id: string;
      name: string;
      priceCents: number;
      currency: string;
      interval?: string;
      maxSalons: number;
    } | null;
  } | null;
}

interface PlanRow {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  interval: string;
  maxSalons: number;
  stripePriceId: string | null;
  isActive: boolean;
  subscriberCount: number;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Actif', className: 'bg-green-100 text-green-700' },
  NONE: { label: 'Aucun', className: 'bg-gray-100 text-gray-600' },
  PAST_DUE: { label: 'Impayé', className: 'bg-amber-100 text-amber-700' },
  CANCELED: { label: 'Annulé', className: 'bg-red-100 text-red-700' },
};

const PAGE_SIZE = 10;

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addPlanInterval(startIso: string, interval: string): string {
  const d = new Date(`${startIso}T12:00:00`);
  if (interval === 'month') {
    d.setMonth(d.getMonth() + 1);
  } else {
    d.setFullYear(d.getFullYear() + 1);
  }
  return toDateInputValue(d);
}

export default function SuperAdminPage() {
  const [tab, setTab] = useState<'accounts' | 'plans'>('accounts');
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [accountsTotal, setAccountsTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [filterPlanId, setFilterPlanId] = useState('');
  const [endsAfter, setEndsAfter] = useState('');
  const [endsBefore, setEndsBefore] = useState('');

  // Activate abonnement modal
  const [activateTarget, setActivateTarget] = useState<AccountRow | null>(null);
  const [activatePlanId, setActivatePlanId] = useState('');
  const [activateStart, setActivateStart] = useState(toDateInputValue(new Date()));
  const [activateEnd, setActivateEnd] = useState('');
  const [activateSubmitting, setActivateSubmitting] = useState(false);

  // Plan form (create or edit)
  const [planForm, setPlanForm] = useState<{
    id: string | null;
    name: string;
    priceDh: string;
    maxSalons: string;
    interval: 'month' | 'year';
  } | null>(null);
  const [planSubmitting, setPlanSubmitting] = useState(false);

  const activePlans = useMemo(() => plans.filter((p) => p.isActive), [plans]);
  const totalPages = Math.max(1, Math.ceil(accountsTotal / PAGE_SIZE));

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [qDebounced, filterPlanId, endsAfter, endsBefore]);

  const loadPlans = useCallback(async () => {
    const plansRes = await api.superAdminGetPlans();
    setPlans(plansRes.plans);
  }, []);

  const loadAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try {
      const res = await api.superAdminGetAccounts({
        page,
        limit: PAGE_SIZE,
        q: qDebounced || undefined,
        planId: filterPlanId || undefined,
        endsAfter: endsAfter || undefined,
        endsBefore: endsBefore || undefined,
      });
      setAccounts(res.accounts);
      setAccountsTotal(res.total);
    } finally {
      setAccountsLoading(false);
    }
  }, [page, qDebounced, filterPlanId, endsAfter, endsBefore]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadAccounts(), loadPlans()]);
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [loadAccounts, loadPlans]);

  useEffect(() => {
    load();
    // initial + full reload when filters change via loadAccounts dependency — see below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    setError(null);
    loadAccounts().catch((e: any) => setError(e.message || 'Erreur de chargement'));
  }, [loadAccounts, loading]);

  const openActivateModal = (account: AccountRow) => {
    const defaultPlan =
      activePlans.find((p) => p.id === account.subscription?.plan?.id) ?? activePlans[0];
    const start = toDateInputValue(new Date());
    const interval = defaultPlan?.interval ?? 'year';
    setActivateTarget(account);
    setActivatePlanId(defaultPlan?.id ?? '');
    setActivateStart(start);
    setActivateEnd(addPlanInterval(start, interval));
  };

  const onActivateStartChange = (start: string) => {
    setActivateStart(start);
    const plan = plans.find((p) => p.id === activatePlanId);
    if (start && plan) {
      setActivateEnd(addPlanInterval(start, plan.interval));
    }
  };

  const onActivatePlanChange = (planId: string) => {
    setActivatePlanId(planId);
    const plan = plans.find((p) => p.id === planId);
    if (activateStart && plan) {
      setActivateEnd(addPlanInterval(activateStart, plan.interval));
    }
  };

  const confirmActivate = async () => {
    if (!activateTarget || !activatePlanId || !activateEnd) {
      setError('Plan et date de fin requis');
      return;
    }
    setActivateSubmitting(true);
    setBusyId(activateTarget.id);
    setError(null);
    try {
      await api.superAdminUpdateAccount(activateTarget.id, {
        subscriptionStatus: 'ACTIVE',
        planId: activatePlanId,
        currentPeriodEnd: activateEnd,
      });
      setActivateTarget(null);
      await loadAccounts();
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setActivateSubmitting(false);
      setBusyId(null);
    }
  };

  const toggleAccountActive = async (account: AccountRow) => {
    setBusyId(account.id);
    try {
      await api.superAdminUpdateAccount(account.id, { isActive: !account.isActive });
      await loadAccounts();
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const setSubscriptionStatus = async (account: AccountRow, status: 'CANCELED' | 'NONE') => {
    setBusyId(account.id);
    try {
      await api.superAdminUpdateAccount(account.id, { subscriptionStatus: status });
      await loadAccounts();
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const submitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm) return;
    const priceCents = Math.round(parseFloat(planForm.priceDh) * 100);
    const maxSalons = parseInt(planForm.maxSalons, 10);
    if (!planForm.name.trim() || !Number.isFinite(priceCents) || priceCents <= 0 || !maxSalons || maxSalons <= 0) {
      setError('Nom, prix et limite de salons valides requis');
      return;
    }
    setPlanSubmitting(true);
    setError(null);
    try {
      if (planForm.id) {
        await api.superAdminUpdatePlan(planForm.id, {
          name: planForm.name.trim(),
          priceCents,
          maxSalons,
          interval: planForm.interval,
        });
      } else {
        await api.superAdminCreatePlan({
          name: planForm.name.trim(),
          priceCents,
          maxSalons,
          interval: planForm.interval,
        });
      }
      setPlanForm(null);
      await loadPlans();
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setPlanSubmitting(false);
    }
  };

  const togglePlanActive = async (plan: PlanRow) => {
    setBusyId(plan.id);
    try {
      await api.superAdminUpdatePlan(plan.id, { isActive: !plan.isActive });
      await loadPlans();
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin text-[#002366]" size={28} />
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8">
        <button
          onClick={() => setTab('accounts')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
            tab === 'accounts' ? 'bg-[#002366] text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users size={16} />
          Comptes ({accountsTotal})
        </button>
        <button
          onClick={() => setTab('plans')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
            tab === 'plans' ? 'bg-[#002366] text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <CreditCard size={16} />
          Plans ({plans.length})
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-6 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}

      {tab === 'accounts' && (
        <div className="space-y-4">
          {/* Search + filters */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full rounded-full border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002366]/30"
                placeholder="Rechercher propriétaire, email ou salon…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1 px-1">Plan</label>
                <select
                  className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002366]/30"
                  value={filterPlanId}
                  onChange={(e) => setFilterPlanId(e.target.value)}
                >
                  <option value="">Tous les plans</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {!p.isActive ? ' (inactif)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1 px-1">
                  Fin après
                </label>
                <input
                  type="date"
                  className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002366]/30"
                  value={endsAfter}
                  onChange={(e) => setEndsAfter(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1 px-1">
                  Fin avant
                </label>
                <input
                  type="date"
                  className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002366]/30"
                  value={endsBefore}
                  onChange={(e) => setEndsBefore(e.target.value)}
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-400 px-1">
              Dates = fin d&apos;abonnement (après / avant). Laisser vide pour ignorer.
            </p>          </div>

          {accountsLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-[#002366]" size={22} />
            </div>
          )}

          {!accountsLoading &&
            accounts.map((account) => {
              const status = account.subscription?.status ?? 'NONE';
              const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS.NONE;
              return (
                <div key={account.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                        {account.owner
                          ? `${account.owner.firstName} ${account.owner.lastName}`.trim() ||
                            account.owner.email
                          : 'Compte sans propriétaire'}
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusInfo.className}`}
                        >
                          Abonnement : {statusInfo.label}
                        </span>
                        {!account.isActive && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            Compte désactivé
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {account.owner?.email}
                        {account.subscription?.plan &&
                          ` — Plan ${account.subscription.plan.name} (max ${account.subscription.plan.maxSalons} salons)`}
                        {account.subscription?.currentPeriodEnd &&
                          ` — jusqu'au ${new Date(account.subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}`}
                      </p>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {account.salons.map((salon) => (
                          <span
                            key={salon.id}
                            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                              salon.subscriptionActive
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : 'border-gray-200 bg-gray-50 text-gray-600'
                            }`}
                            title={
                              salon.subscriptionActive ? 'Visible clients' : 'Non visible clients'
                            }
                          >
                            <Building size={11} />
                            {salon.name}
                          </span>
                        ))}
                        {account.salonCount === 0 && (
                          <span className="text-[11px] text-gray-400">Aucun salon</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {status !== 'ACTIVE' ? (
                        <button
                          onClick={() => openActivateModal(account)}
                          disabled={busyId === account.id || activePlans.length === 0}
                          className="px-3.5 py-2 rounded-full text-xs font-semibold border border-green-300 text-green-700 hover:bg-green-50 transition-all disabled:opacity-50"
                        >
                          Activer abonnement
                        </button>
                      ) : (
                        <button
                          onClick={() => setSubscriptionStatus(account, 'CANCELED')}
                          disabled={busyId === account.id}
                          className="px-3.5 py-2 rounded-full text-xs font-semibold border border-amber-300 text-amber-700 hover:bg-amber-50 transition-all"
                        >
                          Annuler abonnement
                        </button>
                      )}
                      <button
                        onClick={() => toggleAccountActive(account)}
                        disabled={busyId === account.id}
                        className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${
                          account.isActive
                            ? 'border-red-300 text-red-600 hover:bg-red-50'
                            : 'border-green-300 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {busyId === account.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : account.isActive ? (
                          'Désactiver compte'
                        ) : (
                          'Réactiver compte'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

          {!accountsLoading && accounts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
              Aucun compte.
            </div>
          )}

          {/* Pagination */}
          {accountsTotal > 0 && (
            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-xs text-gray-500">
                {accountsTotal} compte{accountsTotal > 1 ? 's' : ''} — page {page}/{totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || accountsLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft size={14} />
                  Préc.
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || accountsLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all"
                >
                  Suiv.
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'plans' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() =>
                setPlanForm({ id: null, name: '', priceDh: '', maxSalons: '3', interval: 'year' })
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#002366] text-white text-sm font-semibold hover:bg-[#001a4d] transition-all"
            >
              <Plus size={16} />
              Nouveau plan
            </button>
          </div>

          {planForm && (
            <form onSubmit={submitPlan} className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                {planForm.id ? 'Modifier le plan' : 'Nouveau plan'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002366]/30"
                  placeholder="Nom du plan *"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                />
                <input
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002366]/30"
                  placeholder="Prix (DH) *"
                  type="number"
                  min="1"
                  step="0.01"
                  value={planForm.priceDh}
                  onChange={(e) => setPlanForm({ ...planForm, priceDh: e.target.value })}
                />
                <input
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002366]/30"
                  placeholder="Salons max *"
                  type="number"
                  min="1"
                  value={planForm.maxSalons}
                  onChange={(e) => setPlanForm({ ...planForm, maxSalons: e.target.value })}
                />
                <select
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002366]/30"
                  value={planForm.interval}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, interval: e.target.value as 'month' | 'year' })
                  }
                >
                  <option value="year">Par an</option>
                  <option value="month">Par mois</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setPlanForm(null)}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={planSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#002366] text-white text-sm font-semibold hover:bg-[#001a4d] transition-all"
                >
                  {planSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {planForm.id ? 'Enregistrer' : 'Créer le plan'}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    {plan.name}
                    {plan.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        <Check size={11} /> Actif
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        Inactif
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(plan.priceCents / 100).toLocaleString('fr-FR')} {plan.currency}/
                    {plan.interval === 'year' ? 'an' : 'mois'} — max {plan.maxSalons} salon
                    {plan.maxSalons > 1 ? 's' : ''} — {plan.subscriberCount} abonné
                    {plan.subscriberCount > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      setPlanForm({
                        id: plan.id,
                        name: plan.name,
                        priceDh: String(plan.priceCents / 100),
                        maxSalons: String(plan.maxSalons),
                        interval: plan.interval === 'month' ? 'month' : 'year',
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    <Pencil size={12} />
                    Modifier
                  </button>
                  <button
                    onClick={() => togglePlanActive(plan)}
                    disabled={busyId === plan.id}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${
                      plan.isActive
                        ? 'border-red-300 text-red-600 hover:bg-red-50'
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {plan.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activate subscription modal */}
      {activateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Activer l&apos;abonnement</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {activateTarget.owner
                    ? `${activateTarget.owner.firstName} ${activateTarget.owner.lastName}`.trim() ||
                      activateTarget.owner.email
                    : activateTarget.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivateTarget(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Plan</label>
                <select
                  className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002366]/30"
                  value={activatePlanId}
                  onChange={(e) => onActivatePlanChange(e.target.value)}
                >
                  {activePlans.length === 0 && <option value="">Aucun plan actif</option>}
                  {activePlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.interval === 'month' ? 'mois' : 'an'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Date de début
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002366]/30"
                    value={activateStart}
                    onChange={(e) => onActivateStartChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#002366]/30"
                    value={activateEnd}
                    onChange={(e) => setActivateEnd(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-400">
                Fin = début + durée du plan par défaut. Modifiable librement.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setActivateTarget(null)}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={activateSubmitting || !activatePlanId || !activateEnd}
                onClick={confirmActivate}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#002366] text-white text-sm font-semibold hover:bg-[#001a4d] transition-all disabled:opacity-50"
              >
                {activateSubmitting && <Loader2 size={16} className="animate-spin" />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
