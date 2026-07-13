'use client';

import { useEffect, useState } from 'react';
import { Loader2, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FrequencyBucket = {
  type: string;
  desc: string;
  count: number;
  color: string;
};

export default function FrequencesGlobalesPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'year' | 'month' | 'all'>('year');
  const [buckets, setBuckets] = useState<FrequencyBucket[]>([]);
  const [stats, setStats] = useState({
    clientsWithVisits: 0,
    clientsWithoutVisits: 0,
    totalClients: 0,
    avgVisits: 0,
    totalVisits: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getClientFrequencyStats({ period });
        setBuckets(data.frequencyBuckets || []);
        setStats(data.stats || stats);
      } catch (err: any) {
        toast.error(err.message || 'Erreur lors du chargement');
        setBuckets([]);
        setStats({
          clientsWithVisits: 0,
          clientsWithoutVisits: 0,
          totalClients: 0,
          avgVisits: 0,
          totalVisits: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Fréquences globales</h1>
          <p className="text-sm text-gray-500 mt-1">Répartition des clients par fréquence de visite</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-40 rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
            <SelectItem value="all">Tout le temps</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Clients actifs', value: stats.clientsWithVisits },
          { label: 'Sans visite', value: stats.clientsWithoutVisits },
          { label: 'Visites totales', value: stats.totalVisits },
          { label: 'Moy. visites / client', value: stats.avgVisits },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</p>
            <p className="text-3xl font-light text-gray-900 mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Chargement...
        </div>
      ) : buckets.every((b) => b.count === 0) ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">Pas assez de données sur cette période.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
          {buckets.map((bucket) => (
            <div key={bucket.type}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-gray-900">{bucket.type}</span>
                  <span className="text-sm text-gray-500 ml-2">{bucket.desc}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{bucket.count}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(bucket.count / maxCount) * 100}%`,
                    backgroundColor: bucket.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
