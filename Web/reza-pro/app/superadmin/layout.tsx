'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const dynamic = 'force-dynamic';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push('/login?redirect=%2Fsuperadmin');
      return;
    }
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard/rendez-vous');
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || !isAuthenticated || user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40">
        <div className="h-full px-8 flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#002366] flex items-center justify-center">
              <ShieldCheck className="text-white" size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">Reza Superadmin</p>
              <p className="text-xs text-gray-500 leading-tight">{user.email}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={16} />
            Se déconnecter
          </button>
        </div>
      </header>
      <main className="pt-24 pb-16 px-8 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
