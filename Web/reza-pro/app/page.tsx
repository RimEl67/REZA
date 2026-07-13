'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to dashboard
        router.push('/dashboard/rendez-vous');
      } else {
        // User is not authenticated, redirect to login
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    </div>
  );
}
