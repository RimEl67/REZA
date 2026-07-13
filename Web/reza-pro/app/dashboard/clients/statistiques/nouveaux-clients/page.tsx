'use client';

import { useEffect, useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type NewClient = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  createdAt: string;
  appointmentCount: number;
};

export default function NouveauxClientsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'year' | 'week' | 'all'>('year');
  const [clients, setClients] = useState<NewClient[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getNewClientsStats({ period });
        setClients(data.clients || []);
        setTotal(data.total || 0);
      } catch (err: any) {
        toast.error(err.message || 'Erreur lors du chargement');
        setClients([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Nouveaux clients</h1>
          <p className="text-sm text-gray-500 mt-1">Clients créés sur la période sélectionnée</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-40 rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">7 derniers jours</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
            <SelectItem value="all">Tout le temps</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total nouveaux</p>
          <p className="text-3xl font-light text-gray-900 mt-1">{total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Avec RDV</p>
          <p className="text-3xl font-light text-gray-900 mt-1">
            {clients.filter((c) => c.appointmentCount > 0).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Sans RDV</p>
          <p className="text-3xl font-light text-gray-900 mt-1">
            {clients.filter((c) => c.appointmentCount === 0).length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Chargement...
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <UserPlus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">Aucun nouveau client sur cette période.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Inscrit le</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">RDV</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {client.firstName} {client.lastName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {client.email || client.phone || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {format(new Date(client.createdAt), 'd MMM yyyy', { locale: fr })}
                  </td>
                  <td className="px-4 py-3 text-right">{client.appointmentCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
