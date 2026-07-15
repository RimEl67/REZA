'use client';

import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import PaywallModal from '@/components/PaywallModal';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-zinc-50">
        <Suspense fallback={<div className="w-64 bg-white border-r border-gray-200" />}>
          <Sidebar />
        </Suspense>
        <style>{`
          @media print {
            .sidebar { display: none !important; }
          }
        `}</style>
        {/* pt-28 = fixed Sidebar topbar (h-20) + former p-8 top spacing */}
        <main className="flex-1 px-8 pb-8 pt-28">
          {children}
        </main>
        <PaywallModal />
      </div>
    </ProtectedRoute>
  );
}
