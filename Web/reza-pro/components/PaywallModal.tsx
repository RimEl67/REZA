'use client';

import { useEffect, useState } from 'react';
import { X, CreditCard, Loader2, Building, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const DISMISS_KEY = 'paywall_dismissed';

/**
 * Post-login paywall: shown (blurred backdrop, closeable) when the account
 * has no active subscription. Dismissal lasts for the browser session.
 */
export default function PaywallModal() {
  const { user, loading, isAuthenticated, subscription, subscriptionActive, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !isAuthenticated || !user) return;

    // Returning from Stripe checkout: refresh subscription state
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      refreshUser();
      sessionStorage.removeItem(DISMISS_KEY);
      return;
    }

    // Paywall targets account owners (admins), not staff or superadmin
    if (user.role !== 'ADMIN') return;
    if (subscriptionActive) return;
    if (sessionStorage.getItem(DISMISS_KEY) === '1') return;

    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated, user?.id, subscriptionActive]);

  // Close automatically if the subscription becomes active
  useEffect(() => {
    if (subscriptionActive) setOpen(false);
  }, [subscriptionActive]);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setOpen(false);
  };

  const handleSubscribe = async () => {
    setCheckoutLoading(true);
    setError(null);
    try {
      const { url } = await api.startCheckout();
      if (url) window.location.href = url;
    } catch (e: any) {
      setError(e.message || 'Impossible de démarrer le paiement');
      setCheckoutLoading(false);
    }
  };

  if (!open) return null;

  const planName = subscription?.plan?.name ?? 'Standard';
  const maxSalons = subscription?.plan?.maxSalons ?? 3;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={dismiss}
      />

      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-[#002366]/10 flex items-center justify-center mb-5">
          <CreditCard className="text-[#002366]" size={26} />
        </div>

        <h2 className="text-xl font-bold text-gray-900">Activez votre abonnement</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Sans abonnement actif, vos salons ne sont pas visibles par les clients.
          Abonnez-vous pour être référencé et recevoir des réservations en ligne.
        </p>

        <div className="rounded-2xl border border-gray-200 p-5 mt-6">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-gray-900">Plan {planName}</p>
            <p className="text-lg font-bold text-[#002366]">
              800 DH<span className="text-xs font-medium text-gray-500">/an</span>
            </p>
          </div>
          <ul className="mt-3 space-y-2">
            <li className="flex items-center gap-2 text-xs text-gray-600">
              <Check size={14} className="text-green-600 shrink-0" />
              Jusqu&apos;à {maxSalons} salons sur votre compte
            </li>
            <li className="flex items-center gap-2 text-xs text-gray-600">
              <Building size={14} className="text-[#002366] shrink-0" />
              Salons visibles par les clients (recherche + réservation)
            </li>
          </ul>
        </div>

        {error && (
          <p className="text-xs text-red-600 mt-3">{error}</p>
        )}

        <button
          onClick={handleSubscribe}
          disabled={checkoutLoading}
          className="w-full mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#002366] text-white text-sm font-semibold hover:bg-[#001a4d] transition-all"
        >
          {checkoutLoading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
          S&apos;abonner maintenant
        </button>

        <button
          onClick={dismiss}
          className="w-full mt-3 text-xs font-medium text-gray-400 hover:text-gray-600 transition-all"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
