'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CorbeilleRdvPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/admin/corbeille-rdv/rdv-annules');
  }, [router]);
  
  return null;
}
