'use client';

import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';

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
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
