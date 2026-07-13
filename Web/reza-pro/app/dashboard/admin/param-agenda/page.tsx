'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ParamAgendaRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/admin/param-agenda/gestion-de-prestations');
  }, [router]);

  return null;
}
