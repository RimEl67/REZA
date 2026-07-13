'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ParamEtablissementPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/admin/param-etablissement/informations-landing-page');
  }, [router]);
  
  return null;
}
