'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StatistiquesClientsPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/clients/statistiques/meilleurs-clients');
  }, [router]);
  
  return null;
}
