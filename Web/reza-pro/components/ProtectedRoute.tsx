'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect if we're done loading and not authenticated
    if (!loading && !isAuthenticated) {
      // Preserve the current path as redirect parameter
      const currentPath = pathname || window.location.pathname;
      const redirectUrl = currentPath && currentPath !== '/login' 
        ? `/login?redirect=${encodeURIComponent(currentPath)}`
        : '/login';
      router.push(redirectUrl);
    }
    
    // Global superadmins have their own section (no salon dashboard)
    if (!loading && isAuthenticated && user?.role === 'SUPER_ADMIN') {
      const currentPath = pathname || window.location.pathname;
      if (!currentPath.startsWith('/superadmin')) {
        router.push('/superadmin');
        return;
      }
    }

    // Check if user is authenticated but email is not verified
    // Allow access to verify-email page and login page
    if (!loading && isAuthenticated && user && user.emailVerified === false) {
      const currentPath = pathname || window.location.pathname;
      // Don't redirect if already on login or verify-email page
      if (currentPath !== '/login' && currentPath !== '/verify-email' && !currentPath.startsWith('/verify-email')) {
        router.push('/login?unverified=true');
      }
    }
  }, [isAuthenticated, loading, router, pathname, user]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, return null (redirect will happen in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
