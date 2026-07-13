'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TauxOccupationPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/admin/taux-occupation/vue-ensemble');
  }, [router]);
  
  return null;
}
