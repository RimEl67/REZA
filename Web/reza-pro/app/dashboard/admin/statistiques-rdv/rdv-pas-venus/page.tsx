'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Calendar, DollarSign, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function RdvPasVenusPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Statistics data state
  const [statsData, setStatsData] = useState({
    dailyData: [] as any[],
    totals: {
      totalRdv: 0,
      pasVenus: 0,
      totalTauxPasVenus: '0%'
    }
  });

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, [timeFilter, selectedMonth, selectedYear]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getRdvPasVenusStats({
        period: timeFilter,
        month: selectedMonth,
        year: selectedYear
      });
      
      setStatsData({
        dailyData: data.dailyData || [],
        totals: data.totals || {
          totalRdv: 0,
          pasVenus: 0,
          totalTauxPasVenus: '0%'
        }
      });
    } catch (err: any) {
      console.error('Error fetching RDV Pas Venus stats:', err);
      toast.error(err.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#002366] w-8 h-8 mb-4" />
          <span className="text-gray-600">Chargement des statistiques...</span>
        </div>
      </div>
    );
  }

  const dailyData = statsData.dailyData;
  const totals = statsData.totals;

  return (
    <div className="min-h-screen">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
        .accent-color { color: #002366; }
      `}</style>

      {/* Header */}
      <div className="mb-12 pt-20 animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-light text-gray-900 tracking-tight mb-2">RDV Pas Venus</h1>
            <p className="text-sm text-gray-400">Statistiques des rendez-vous non honorés</p>
          </div>
          <div className="flex items-center gap-6">
            {/* Date Navigation - same design as vue-ensemble */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (selectedMonth === 0) {
                    setSelectedMonth(11);
                    setSelectedYear(prev => prev - 1);
                  } else {
                    setSelectedMonth(prev => prev - 1);
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-lg font-light text-gray-900 min-w-[180px] text-center">
                {monthNames[selectedMonth]} {selectedYear}
              </span>
              <button
                onClick={() => {
                  if (selectedMonth === 11) {
                    setSelectedMonth(0);
                    setSelectedYear(prev => prev + 1);
                  } else {
                    setSelectedMonth(prev => prev + 1);
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => {
                  setSelectedMonth(new Date().getMonth());
                  setSelectedYear(new Date().getFullYear());
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Aujourd'hui
              </button>
            </div>
            <div className="flex items-center gap-2">
              {(['week', 'month', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeFilter(period)}
                  className={`px-4 py-2 text-xs font-medium transition-all ${
                    timeFilter === period 
                      ? 'accent-color' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {period === 'week' ? '7j' : period === 'month' ? '30j' : '1an'}
                </button>
              ))}
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <button className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <Download size={14} />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8 animate-fadeIn">
        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all group">
          <div className="flex items-start justify-between mb-6">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center transition-colors">
              <Calendar size={20} className="text-gray-400" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={12} />
              <span className="text-[10px] font-medium">+8%</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">Total Prestations</p>
            <p className="text-3xl font-light text-gray-900">{totals.totalRdv}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all group">
          <div className="flex items-start justify-between mb-6">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center transition-colors">
              <Users size={20} className="text-gray-400" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={12} />
              <span className="text-[10px] font-medium">+5%</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">Pas Venus</p>
            <p className="text-3xl font-light text-gray-900">{totals.pasVenus}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all group">
          <div className="flex items-start justify-between mb-6">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center transition-colors">
              <DollarSign size={20} className="text-gray-400" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={12} />
              <span className="text-[10px] font-medium">+2%</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">Taux Pas Venus</p>
            <p className="text-3xl font-light text-gray-900">{totals.totalTauxPasVenus}</p>
          </div>
        </div>
      </div>

      {/* Daily Statistics Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-fadeIn">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL PRESTATIONS</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">PAS VENUS</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">VENUS</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">TAUX PAS VENUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dailyData.length > 0 ? (
                dailyData.map((day, index) => (
                  <tr key={index} className={`hover:bg-gray-50 transition-colors ${day.totalRdv === 0 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{day.date}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">{day.totalRdv}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-medium ${day.pasVenus > 0 ? 'text-red-600' : 'text-gray-900'}`}>{day.pasVenus}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">{day.totalRdv - day.pasVenus}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {day.totalRdv > 0 ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500" style={{ width: day.tauxPasVenus }} />
                          </div>
                          <span className="text-sm font-medium text-gray-900 min-w-[50px]">{day.tauxPasVenus}</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <span className="text-sm font-medium text-gray-400">0%</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    Aucune donnée disponible pour cette période
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Footer Notes */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">
            <strong>Attention:</strong> Les rendez-vous pas venus représentent les absences ou annulations non signalées.
          </p>
          <p className="text-xs text-gray-500">
            <strong>À noter:</strong> Les statistiques sont calculées toutes les nuits. Les actions d'aujourd'hui seront prises en compte le lendemain.
          </p>
        </div>
      </div>
    </div>
  );
}
