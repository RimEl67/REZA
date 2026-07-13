'use client';

import React, { useState, useEffect } from 'react';
import { Download, Printer, FileText, CreditCard, Calendar, TrendingUp, Filter, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function InvoicesDashboard() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.getInvoices({ limit: 100 });
      const invoicesData = (response.invoices || []).map((inv: any) => {
        const paymentMethod = inv.paymentMethod || 'UNKNOWN';
        const paymentText = paymentMethod === 'BANK_TRANSFER' 
          ? 'Prélèvement automatique' 
          : paymentMethod === 'CARD'
          ? 'Carte bancaire'
          : paymentMethod === 'CASH'
          ? 'Espèces'
          : paymentMethod === 'CHECK'
          ? 'Chèque'
          : paymentMethod === 'ONLINE'
          ? 'En ligne'
          : inv.status === 'PENDING'
          ? 'En attente'
          : 'N/A';

        return {
          id: inv.invoiceNumber,
          date: new Date(inv.createdAt).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          }),
          amount: inv.total || inv.amount || 0,
          status: inv.status === 'PAID' ? 'paid' : inv.status === 'PENDING' ? 'pending' : 'cancelled',
          payment: paymentText,
          invoice: inv
        };
      });

      setInvoices(invoicesData);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      toast.error(err.message || 'Erreur lors du chargement des factures');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = filterStatus === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.status === filterStatus);

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidCount = invoices.filter(inv => inv.status === 'paid').length;
  const pendingCount = invoices.filter(inv => inv.status === 'pending').length;

  const exportData = () => {
    const csvContent = [
      ['Numéro', 'Date', 'Montant TTC', 'Statut', 'Conditions de paiement'].join(','),
      ...filteredInvoices.map(inv => 
        [
          inv.id,
          inv.date,
          `${inv.amount.toFixed(2)} MAD`,
          inv.status === 'paid' ? 'Payée' : 'En attente',
          inv.payment
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factures-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const printReport = () => {
    window.print();
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) {
        toast.error('Facture introuvable');
        return;
      }

      // Fetch full invoice details
      const invoiceNumber = invoice.invoice?.id || invoiceId;
      const response = await api.getInvoice(invoiceNumber);
      
      // For now, just show a toast. In production, you'd generate and download a PDF
      toast.success(`Téléchargement de la facture ${invoiceId}`);
      console.log('Invoice data:', response.invoice);
    } catch (err: any) {
      console.error('Error downloading invoice:', err);
      toast.error(err.message || 'Erreur lors du téléchargement');
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen p-0 md:p-0">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#002366] w-8 h-8 mb-4" />
          <span className="text-gray-600">Chargement des factures...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-0 md:p-0">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="mb-8 animate-slideDown pt-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-5xl font-light text-gray-900 tracking-tight">
                Factures
              </h1>
              <p className="text-base text-gray-400 mt-2">Gérez et consultez toutes vos factures</p>
            </div>
          </div>

          <div className="flex items-center gap-4 no-print">
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Download size={16} />
              Exporter
            </button>
            <button
              onClick={printReport}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Printer size={16} />
              Imprimer
            </button>
          </div>
        </div>

        {/* Stats Cards (KPI) - Redesigned to match taux-occupation/collaborateurs style */}
        <div className="grid grid-cols-3 gap-4 mb-8 animate-fadeIn">
          <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center transition-colors">
                <FileText size={20} className="text-gray-400" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <TrendingUp size={12} />
                <span className="text-[10px] font-medium">+2%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">Total des factures</p>
              <p className="text-3xl font-light text-gray-900">{invoices.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center transition-colors">
                <CreditCard size={20} className="text-gray-400" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <TrendingUp size={12} />
                <span className="text-[10px] font-medium">+1%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">Montant total</p>
              <p className="text-3xl font-light text-gray-900">{totalAmount.toFixed(2)} MAD</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center transition-colors">
                <Calendar size={20} className="text-gray-400" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <TrendingUp size={12} />
                <span className="text-[10px] font-medium">+0%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">Factures payées</p>
              <p className="text-3xl font-light text-gray-900">{paidCount}/{invoices.length}</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4 mb-6 no-print justify-end">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter size={16} />
            <span>Filtrer par statut:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 text-sm rounded-full transition-all ${
                filterStatus === 'all'
                  ? 'bg-[#002366] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-4 py-2 text-sm rounded-full transition-all ${
                filterStatus === 'paid'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Payées
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 text-sm rounded-full transition-all ${
                filterStatus === 'pending'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              En attente
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden animate-slideUp">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant TTC
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conditions de paiement
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((invoice, index) => (
                <tr 
                  key={invoice.id} 
                  className="hover:bg-gray-50/30 transition-colors"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{invoice.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">
                      {invoice.date}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">{invoice.amount.toFixed(2)} MAD</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{invoice.payment}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => downloadInvoice(invoice.id)}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors underline"
                    >
                      Télécharger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucune facture trouvée</p>
          </div>
        )}
      </div>

      {/* Footer Summary */}
      <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200 no-print">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Affichage de <span className="font-semibold text-gray-900">{filteredInvoices.length}</span> facture(s)
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total affiché</div>
            <div className="text-2xl font-semibold text-gray-900">
              {filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)} MAD
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}