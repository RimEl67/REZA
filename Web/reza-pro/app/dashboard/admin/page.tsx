'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/admin/param-etablissement/informations-landing-page');
  }, [router]);
  
  return null;
}
