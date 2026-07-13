'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FichierClientPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/clients/fichier-client/gestion');
  }, [router]);
  
  return null;
}
