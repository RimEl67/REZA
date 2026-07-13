'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, TrendingUp, Calendar } from 'lucide-react';

export default function StatistiquesRdvPrestationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, [timeFilter, selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await api.getPrestationsStats({
        period: timeFilter,
        month: selectedMonth,
        year: selectedYear
      });
      setData(result);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#002366] w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Statistiques par prestations</h1>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as 'week' | 'month' | 'year')}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="week">Semaine</option>
          <option value="month">Mois</option>
          <option value="year">Année</option>
        </select>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Période: {timeFilter === 'week' ? 'Semaine' : timeFilter === 'month' ? 'Mois' : 'Année'}</span>
          </div>
        </div>
        {data ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">Statistiques détaillées par prestation</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.prestations && data.prestations.length > 0 ? (
                data.prestations.map((prestation: any, index: number) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">{prestation.name}</h3>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#002366]" />
                      <span className="text-sm text-gray-600">{prestation.count || 0} rendez-vous</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-sm text-gray-500">Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Aucune donnée disponible</p>
          </div>
        )}
      </div>
    </div>
  );
}
