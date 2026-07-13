'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MesAvisPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/clients/mes-avis/statistiques-avis');
  }, [router]);
  
  return null;
}
