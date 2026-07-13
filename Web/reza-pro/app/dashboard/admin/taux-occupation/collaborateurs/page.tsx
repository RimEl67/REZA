'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Users, Calendar, DollarSign, Download, Printer, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AnalyticsDashboard() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [compareMode, setCompareMode] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');

  // Statistics data state
  const [statsData, setStatsData] = useState({
    collaborators: [] as any[],
    totals: {
      occupationRate: 0,
      workedHours: 0,
      revenue: 0
    }
  });

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  const detailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showDetails && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showDetails]);

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, [timeFilter, selectedMonth, selectedYear]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getOccupationCollaborateurs({
        period: timeFilter,
        month: selectedMonth,
        year: selectedYear
      });
      
      setStatsData({
        collaborators: data.collaborators || [],
        totals: data.totals || {
          occupationRate: 0,
          workedHours: 0,
          revenue: 0
        }
      });
    } catch (err: any) {
      console.error('Error fetching occupation collaborateurs stats:', err);
      toast.error(err.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(prev => prev - 1);
      } else {
        setSelectedMonth(prev => prev - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(prev => prev + 1);
      } else {
        setSelectedMonth(prev => prev + 1);
      }
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

  const collaborators = statsData.collaborators;
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
            <h1 className="text-5xl font-light text-gray-900 tracking-tight mb-2">Statistiques</h1>
            <p className="text-sm text-gray-400">Analyse détaillée des performances par collaborateur</p>
          </div>
          <div className="flex items-center gap-6">
            {/* Date Navigation - same design as vue-ensemble */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-lg font-light text-gray-900 min-w-[180px] text-center">
                {monthNames[selectedMonth]} {selectedYear}
              </span>
              <button
                onClick={() => navigateMonth('next')}
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
            {/* Time Filter */}
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
            {/* Export Button */}
            <button className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <Download size={14} />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8 animate-fadeIn">
        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all group">
          <div className="flex items-start justify-between mb-6">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center transition-colors">
              <Calendar size={20} className="text-gray-400" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={12} />
              <span className="text-[10px] font-medium">+18%</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">Taux d'occupation moyen</p>
            <p className="text-3xl font-light text-gray-900">{totals.occupationRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all group">
          <div className="flex items-start justify-between mb-6">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center transition-colors">
              <Users size={20} className="text-gray-400" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={12} />
              <span className="text-[10px] font-medium">+12%</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">Total heures travaillées</p>
            <p className="text-3xl font-light text-gray-900">{totals.workedHours} h</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all group">
          <div className="flex items-start justify-between mb-6">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center transition-colors">
              <TrendingUp size={20} className="text-gray-400" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={12} />
              <span className="text-[10px] font-medium">+24%</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">Total des RDV</p>
            <p className="text-3xl font-light text-gray-900">{totals.revenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all group">
          <div className="flex items-start justify-between mb-6">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center transition-colors">
              <DollarSign size={20} className="text-gray-400" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={12} />
              <span className="text-[10px] font-medium">+15%</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 font-medium">Collaborateurs actifs</p>
            <p className="text-3xl font-light text-gray-900">{collaborators.length}</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-fadeIn">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collaborateur
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TAUX D&apos;OCCUPATION*
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  HEURES TRAVAILLÉES*
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total des RDV*
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {collaborators.length > 0 ? (
                collaborators.map((collab) => (
                  <tr key={collab.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{background: collab.color}}>
                          <span className="text-sm font-medium text-white">
                            {collab.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-900 font-medium">{collab.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">{collab.occupationRate.toFixed(1)} %</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">{collab.workedHours} h</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {collab.revenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    Aucun collaborateur actif avec des données pour cette période
                  </td>
                </tr>
              )}

              {/* Total Row */}
              <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900 uppercase tracking-wide">Total</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm text-gray-900">{totals.occupationRate.toFixed(1)} %</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm text-gray-900">{totals.workedHours} h</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm text-gray-900">
                    {totals.revenue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Notes */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">
            <strong>Attention:</strong> ceci n'est pas le chiffre d'affaire comptable, il s'agit de la somme des prix indiqués dans l'agenda.
          </p>
          <p className="text-xs text-gray-500">
            <strong>À noter:</strong> les statistiques sont calculées toutes les nuits. Par conséquent, les actions effectuées aujourd'hui seront prises en compte le lendemain.
          </p>
        </div>
      </div>
    </div>
  );
}