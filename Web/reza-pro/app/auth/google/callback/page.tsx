'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      return;
    }

    const email = searchParams.get('email');
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (error) {
      hasProcessed.current = true;
      // Redirect to login with error
      router.replace('/login?error=google_auth_failed');
      return;
    }

    if (success === 'true' && email) {
      hasProcessed.current = true;
      // For SaaS app, Google auth callback
      // The backend should handle Google authentication and return a token
      // We'll redirect to login with email pre-filled for now
      // If the backend supports automatic login after Google auth, this can be updated
      const handleAuth = async () => {
        try {
          // Wait a bit to ensure the user is fully created in the database
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check if there's a token in the URL (backend might redirect with token)
          const token = searchParams.get('token');
          
          if (token) {
            // If token is provided, save it and redirect to dashboard
            if (typeof window !== 'undefined') {
              localStorage.setItem('token', token);
            }
            // Wait a bit for token to be saved
            await new Promise(resolve => setTimeout(resolve, 100));
            router.replace('/dashboard');
          } else {
            // No token, redirect to login page with email pre-filled
            // User will need to complete login with password or backend handles it differently
            router.replace(`/login?email=${encodeURIComponent(email)}&google_auth=true`);
          }
        } catch (err) {
          console.error('Error authenticating with Google:', err);
          router.replace(`/login?email=${encodeURIComponent(email)}&error=google_auth_failed`);
        }
      };

      handleAuth();
    } else {
      hasProcessed.current = true;
      // No success or email, redirect to login
      router.replace('/login?error=google_auth_failed');
    }
  }, [searchParams, router]);

  return (
    <div className="h-screen flex items-center justify-center bg-[#f6f6ef]">
      <div className="text-center">
        <LoadingOverlay />
        <p className="text-gray-600 mt-4">Connexion en cours...</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-[#f6f6ef]">
        <div className="text-center">
          <LoadingOverlay />
          <p className="text-gray-600 mt-4">Chargement...</p>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}
