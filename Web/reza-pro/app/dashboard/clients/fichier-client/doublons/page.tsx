'use client';

import { useEffect, useState } from 'react';
import { Loader2, Merge, Users } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

type ClientRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  reason?: string;
};

type DuplicateGroup = ClientRow & {
  duplicates: ClientRow[];
};

export default function DoublonsPage() {
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState<string | null>(null);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const data = await api.getDuplicateClients();
      setGroups(data.duplicates || []);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la détection');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const handleMerge = async (primary: DuplicateGroup) => {
    const duplicateIds = primary.duplicates.map((d) => d.id);
    if (duplicateIds.length === 0) return;

    try {
      setMerging(primary.id);
      await api.mergeClients(primary.id, duplicateIds);
      toast.success('Doublons fusionnés');
      await fetchDuplicates();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la fusion');
    } finally {
      setMerging(null);
    }
  };

  const renderClient = (client: ClientRow, reason?: string) => (
    <div key={client.id} className="text-sm">
      <p className="font-medium text-gray-900">
        {client.firstName} {client.lastName}
      </p>
      <p className="text-gray-500">{client.email || '—'} · {client.phone || '—'}</p>
      {reason && <p className="text-xs text-amber-600 mt-1">{reason}</p>}
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Gestion des doublons</h1>
        <p className="text-sm text-gray-500 mt-1">
          Détection par email, téléphone ou nom similaire
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Analyse en cours...
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">Aucun doublon détecté.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-4 flex-1">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Client principal</p>
                    {renderClient(group)}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                      Doublons ({group.duplicates.length})
                    </p>
                    <div className="space-y-3 pl-3 border-l-2 border-amber-200">
                      {group.duplicates.map((dup) => renderClient(dup, dup.reason))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleMerge(group)}
                  disabled={merging === group.id}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#002366] text-white text-sm hover:bg-[#001a4d] disabled:opacity-50"
                >
                  {merging === group.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Merge className="w-4 h-4" />
                  )}
                  Fusionner
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
