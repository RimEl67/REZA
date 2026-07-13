'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StatistiquesRdvPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/admin/statistiques-rdv/indicateurs-cles');
  }, [router]);
  
  return null;
}
