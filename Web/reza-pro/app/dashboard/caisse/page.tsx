'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DollarSign, CreditCard, RefreshCcw, Download, Plus, Search, Filter, Calendar, Users, X, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Wallet, Receipt, Clock, BarChart3, PieChart, Eye, Printer, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { generateCaissePDF } from '@/components/CaissePrintDocument';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface Transaction {
  id: string;
  type: 'Vente' | 'Remboursement' | 'Dépôt' | 'Retrait';
  amount: number;
  method: 'Espèces' | 'Carte' | 'Virement' | 'Chèque';
  client?: string;
  employee?: string;
  date: Date;
  note?: string;
  category?: string;
  invoiceId?: string; // Link to invoice if applicable
}

// API Invoice type
type ApiInvoice = {
  id: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  total: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'ONLINE' | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  appointment: {
    id: string;
    startTime: string;
    service: {
      name: string;
    };
    employee: {
      firstName: string;
      lastName: string;
    } | null;
  } | null;
};

interface CaissePageProps {
  methodFilter?: 'all' | 'Espèces' | 'Carte' | 'Virement' | 'Chèque';
  typeFilter?: 'all' | 'Vente' | 'Remboursement' | 'Dépôt' | 'Retrait';
  selectedPeriod?: 'day' | 'week' | 'month' | 'all';
  setMethodFilter?: (filter: 'all' | 'Espèces' | 'Carte' | 'Virement' | 'Chèque') => void;
  setTypeFilter?: (filter: 'all' | 'Vente' | 'Remboursement' | 'Dépôt' | 'Retrait') => void;
  setSelectedPeriod?: (period: 'day' | 'week' | 'month' | 'all') => void;
}

function CaissePageContent({
  methodFilter: propMethodFilter,
  typeFilter: propTypeFilter,
  selectedPeriod: propSelectedPeriod,
  setMethodFilter: propSetMethodFilter,
  setTypeFilter: propSetTypeFilter,
  setSelectedPeriod: propSetSelectedPeriod,
}: CaissePageProps = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  // Initialize filters from URL params or props or default to 'all'
  const [internalMethodFilter, setInternalMethodFilter] = useState<'all' | 'Espèces' | 'Carte' | 'Virement' | 'Chèque'>(() => {
    return (searchParams?.get('method') as any) || 'all';
  });
  const [internalTypeFilter, setInternalTypeFilter] = useState<'all' | 'Vente' | 'Remboursement' | 'Dépôt' | 'Retrait'>(() => {
    return (searchParams?.get('type') as any) || 'all';
  });
  const [internalSelectedPeriod, setInternalSelectedPeriod] = useState<'day' | 'week' | 'month' | 'all'>(() => {
    return (searchParams?.get('period') as any) || 'all';
  });
  
  // Sync filters from URL when searchParams change
  useEffect(() => {
    const method = searchParams?.get('method') || 'all';
    const type = searchParams?.get('type') || 'all';
    const period = searchParams?.get('period') || 'all';
    if (method !== internalMethodFilter) setInternalMethodFilter(method as any);
    if (type !== internalTypeFilter) setInternalTypeFilter(type as any);
    if (period !== internalSelectedPeriod) setInternalSelectedPeriod(period as any);
  }, [searchParams]);
  
  // Use props if provided, otherwise use internal state
  const methodFilter = propMethodFilter ?? internalMethodFilter;
  const typeFilter = propTypeFilter ?? internalTypeFilter;
  const selectedPeriod = propSelectedPeriod ?? internalSelectedPeriod;
  const setMethodFilter = propSetMethodFilter ?? setInternalMethodFilter;
  const setTypeFilter = propSetTypeFilter ?? setInternalTypeFilter;
  const setSelectedPeriod = propSetSelectedPeriod ?? setInternalSelectedPeriod;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Vente' as Transaction['type'],
    amount: 0,
    method: 'Espèces' as Transaction['method'],
    clientId: '',
    employeeId: '',
    note: '',
    appointmentId: '' // Optional: link to appointment
  });
  const printRef = useRef<HTMLDivElement>(null);

  // Transform API invoice to Transaction
  const transformInvoiceToTransaction = (invoice: ApiInvoice): Transaction => {
    const paymentMethodMap: Record<string, 'Espèces' | 'Carte' | 'Virement' | 'Chèque'> = {
      'CASH': 'Espèces',
      'CARD': 'Carte',
      'BANK_TRANSFER': 'Virement',
      'CHECK': 'Chèque',
      'ONLINE': 'Virement'
    };

    let type: Transaction['type'] = 'Vente';
    let amount = invoice.total;
    
    if (invoice.status === 'REFUNDED') {
      type = 'Remboursement';
      amount = -invoice.total;
    } else if (invoice.status === 'PAID') {
      type = 'Vente';
      amount = invoice.total;
    }

    // Extract client name
    let clientName: string | undefined;
    if (invoice.client) {
      const firstName = invoice.client.firstName?.trim() || '';
      const lastName = invoice.client.lastName?.trim() || '';
      clientName = `${firstName} ${lastName}`.trim() || undefined;
    }

    // Extract employee name
    let employeeName: string | undefined;
    if (invoice.appointment?.employee) {
      const firstName = invoice.appointment.employee.firstName?.trim() || '';
      const lastName = invoice.appointment.employee.lastName?.trim() || '';
      employeeName = `${firstName} ${lastName}`.trim() || undefined;
    }

    return {
      id: invoice.id,
      type,
      amount,
      method: invoice.paymentMethod ? paymentMethodMap[invoice.paymentMethod] || 'Espèces' : 'Espèces',
      client: clientName,
      employee: employeeName,
      date: new Date(invoice.paidAt || invoice.createdAt),
      note: invoice.notes || invoice.appointment?.service?.name || undefined,
      category: invoice.appointment?.service?.name || undefined,
      invoiceId: invoice.id
    };
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Load data from API
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchData();
    }
  }, [isAuthenticated, authLoading]);

  const fetchData = async () => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      return;
    }

    try {
      setLoading(true);
      toast.loading('Chargement des transactions...', { id: 'loading-transactions' });
      
      // Fetch invoices
      const invoicesResponse = await api.getInvoices({ 
        limit: 1000 // Get all invoices for now
      });
      const invoices = invoicesResponse.invoices || [];
      
      // Transform invoices to transactions
      let sampleLogged = false;
      const invoiceTransactions = invoices
        .filter((inv: ApiInvoice) => inv.status === 'PAID' || inv.status === 'REFUNDED')
        .map((inv: ApiInvoice) => {
          try {
            const tx = transformInvoiceToTransaction(inv);
            // Debug log for first transaction to check data
            if (!sampleLogged && invoices.length > 0) {
              console.log('Sample invoice transformation:', {
                invoiceId: inv.id,
                hasClient: !!inv.client,
                client: inv.client,
                hasAppointment: !!inv.appointment,
                appointment: inv.appointment,
                hasEmployee: !!inv.appointment?.employee,
                employee: inv.appointment?.employee,
                employeeFirstName: inv.appointment?.employee?.firstName,
                employeeLastName: inv.appointment?.employee?.lastName,
                transformedClient: tx.client,
                transformedEmployee: tx.employee,
                employeeValue: tx.employee || 'NULL/UNDEFINED'
              });
              sampleLogged = true;
            }
            return tx;
          } catch (err) {
            console.error('Error transforming invoice to transaction:', err, inv);
            return null;
          }
        })
        .filter((tx: Transaction | null): tx is Transaction => tx !== null && tx !== undefined);
      
      // Fetch cash transactions (deposits/withdrawals)
      let cashTransactions: any[] = [];
      try {
        const cashTransactionsResponse = await api.getCashTransactions({ 
          limit: 1000 
        });
        cashTransactions = cashTransactionsResponse.transactions || [];
      } catch (cashError) {
        console.warn('Error fetching cash transactions (may not be available yet):', cashError);
        // Continue without cash transactions if API is not ready
      }
      
      // Transform cash transactions to Transaction format
      const transformedCashTransactions: Transaction[] = cashTransactions
        .map((ct: any): Transaction | null => {
          try {
            const paymentMethodMap: Record<string, 'Espèces' | 'Carte' | 'Virement' | 'Chèque'> = {
              'CASH': 'Espèces',
              'CARD': 'Carte',
              'BANK_TRANSFER': 'Virement',
              'CHECK': 'Chèque',
              'ONLINE': 'Virement'
            };

            // Extract employee name from createdBy
            let employeeName: string | undefined;
            if (ct.createdBy) {
              const firstName = ct.createdBy.firstName?.trim() || '';
              const lastName = ct.createdBy.lastName?.trim() || '';
              employeeName = `${firstName} ${lastName}`.trim() || undefined;
            }

            return {
              id: ct.id,
              type: ct.type === 'DEPOSIT' ? 'Dépôt' : 'Retrait',
              amount: ct.type === 'WITHDRAWAL' ? -ct.amount : ct.amount,
              method: paymentMethodMap[ct.paymentMethod] || 'Espèces',
              client: undefined, // Cash transactions don't have clients
              employee: employeeName,
              date: new Date(ct.createdAt),
              note: ct.notes || undefined,
            };
          } catch (err) {
            console.error('Error transforming cash transaction:', err, ct);
            return null;
          }
        })
        .filter((tx): tx is Transaction => tx !== null && tx !== undefined);
      
      // Combine all transactions and sort by date (newest first)
      const allTransactions = [...invoiceTransactions, ...transformedCashTransactions]
        .filter(tx => tx !== null && tx !== undefined); // Ensure no null transactions
      allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      console.log('Fetched transactions:', {
        invoices: invoices.length,
        invoiceTransactions: invoiceTransactions.length,
        cashTransactions: cashTransactions.length,
        transformedCashTransactions: transformedCashTransactions.length,
        totalTransactions: allTransactions.length
      });
      
      setTransactions(allTransactions);
      
      if (allTransactions.length > 0) {
        toast.success(`${allTransactions.length} transaction(s) chargée(s)`, { id: 'loading-transactions' });
      } else {
        toast.success('Aucune transaction trouvée', { id: 'loading-transactions' });
      }

      // Fetch clients
      const clientsResponse = await api.getClients();
      const clientsData = clientsResponse.clients || [];
      setClients(clientsData.map((c: any) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`
      })));

      // Fetch employees
      const employeesResponse = await api.getEmployees({ active: true });
      const employeesData = employeesResponse.employees || [];
      setEmployees(employeesData.map((e: any) => ({
        id: e.id,
        name: `${e.firstName} ${e.lastName}`
      })));
    } catch (err: any) {
      console.error('Error fetching caisse data:', err);
      
      // Handle 401 errors by redirecting to login
      if ((err as any)?.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.', { id: 'loading-transactions' });
        router.push('/login');
        return;
      }
      
      toast.error(err.message || 'Erreur lors du chargement des données', { id: 'loading-transactions' });
      setTransactions([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Filtering
  const filteredTransactions = transactions.filter(tx => {
    if (!tx || !tx.date) {
      console.warn('Invalid transaction found:', tx);
      return false;
    }

    // Search filter - only apply if searchTerm is not empty
    const matchesSearch = !searchTerm || searchTerm.trim() === '' || 
      (tx.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       tx.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       tx.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       tx.method.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMethod = methodFilter === 'all' || tx.method === methodFilter;
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    
    // Period filter
    let matchesPeriod = true;
    if (selectedPeriod !== 'all') {
      const now = new Date();
      const txDate = new Date(tx.date);
      
      // Validate date
      if (isNaN(txDate.getTime())) {
        console.warn('Invalid transaction date:', tx.date, tx);
        return false;
      }

      const startOfPeriod = new Date();
      
      switch (selectedPeriod) {
        case 'day':
          startOfPeriod.setHours(0, 0, 0, 0);
          startOfPeriod.setMinutes(0, 0, 0);
          matchesPeriod = txDate >= startOfPeriod && txDate <= now;
          break;
        case 'week':
          startOfPeriod.setDate(now.getDate() - 7);
          startOfPeriod.setHours(0, 0, 0, 0);
          startOfPeriod.setMinutes(0, 0, 0);
          matchesPeriod = txDate >= startOfPeriod && txDate <= now;
          break;
        case 'month':
          startOfPeriod.setMonth(now.getMonth() - 1);
          startOfPeriod.setDate(now.getDate());
          startOfPeriod.setHours(0, 0, 0, 0);
          startOfPeriod.setMinutes(0, 0, 0);
          matchesPeriod = txDate >= startOfPeriod && txDate <= now;
          break;
      }
    }
    
    return matchesSearch && matchesMethod && matchesType && matchesPeriod;
  });

  // Debug logging
  useEffect(() => {
    if (transactions.length > 0) {
      console.log('Transactions state:', {
        total: transactions.length,
        filtered: filteredTransactions.length,
        filters: { methodFilter, typeFilter, selectedPeriod, searchTerm }
      });
    }
  }, [transactions, filteredTransactions, methodFilter, typeFilter, selectedPeriod, searchTerm]);

  // Stats - use all transactions for overall stats, filtered for display
  const totalSales = transactions.filter(t => t.type === 'Vente').reduce((sum, t) => sum + t.amount, 0);
  const totalCash = transactions.filter(t => t.method === 'Espèces' && t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalCard = transactions.filter(t => t.method === 'Carte' && t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalRefunds = Math.abs(transactions.filter(t => t.type === 'Remboursement').reduce((sum, t) => sum + t.amount, 0));
  const totalDeposits = transactions.filter(t => t.type === 'Dépôt').reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = Math.abs(transactions.filter(t => t.type === 'Retrait').reduce((sum, t) => sum + t.amount, 0));

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Type', 'Montant', 'Méthode', 'Client', 'Employé', 'Date', 'Note'];
    const rows = filteredTransactions.map(tx => [
      tx.type,
      tx.amount,
      tx.method,
      tx.client || '',
      tx.employee || '',
      tx.date.toLocaleString('fr-FR'),
      tx.note || ''
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions-caisse.csv';
    a.click();
  };

  // Add transaction
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId && formData.type === 'Vente') {
      toast.error('Veuillez sélectionner un client pour une vente');
      return;
    }

    try {
      const loadingToast = toast.loading('Création de la transaction...');

      const paymentMethodMap: Record<string, 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'ONLINE'> = {
        'Espèces': 'CASH',
        'Carte': 'CARD',
        'Virement': 'BANK_TRANSFER',
        'Chèque': 'CHECK'
      };

      if (formData.type === 'Vente') {
        // Create invoice for sale
        const invoiceData = {
          clientId: formData.clientId,
          appointmentId: formData.appointmentId || undefined,
          amount: Number(formData.amount),
          tax: 0,
          paymentMethod: paymentMethodMap[formData.method] || 'CASH',
          notes: formData.note || undefined
        };

        const invoice = await api.createInvoice(invoiceData);
        
        // Mark as paid immediately
        await api.updateInvoice(invoice.invoice.id, {
          status: 'PAID',
          paymentMethod: paymentMethodMap[formData.method] || 'CASH',
          paidAt: new Date().toISOString()
        });

        toast.dismiss(loadingToast);
        toast.success('Transaction créée avec succès');
      } else if (formData.type === 'Remboursement') {
        // For refunds, we need an existing invoice to refund
        // For now, create a negative invoice (this is a workaround)
        if (!formData.clientId) {
          toast.dismiss(loadingToast);
          toast.error('Veuillez sélectionner un client pour un remboursement');
          return;
        }

        const invoiceData = {
          clientId: formData.clientId,
          amount: Number(formData.amount),
          tax: 0,
          paymentMethod: paymentMethodMap[formData.method] || 'CASH',
          notes: `Remboursement: ${formData.note || ''}`
        };

        const invoice = await api.createInvoice(invoiceData);
        
        // Mark as refunded
        await api.updateInvoice(invoice.invoice.id, {
          status: 'REFUNDED',
          paymentMethod: paymentMethodMap[formData.method] || 'CASH'
        });

        toast.dismiss(loadingToast);
        toast.success('Remboursement créé avec succès');
      } else if (formData.type === 'Dépôt' || formData.type === 'Retrait') {
        // Create cash transaction
        const paymentMethodMap: Record<string, 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'ONLINE'> = {
          'Espèces': 'CASH',
          'Carte': 'CARD',
          'Virement': 'BANK_TRANSFER',
          'Chèque': 'CHECK'
        };

        await api.createCashTransaction({
          type: formData.type === 'Dépôt' ? 'DEPOSIT' : 'WITHDRAWAL',
          amount: formData.amount,
          paymentMethod: paymentMethodMap[formData.method] || 'CASH',
          notes: formData.note || undefined,
        });

        toast.dismiss(loadingToast);
        toast.success(`${formData.type === 'Dépôt' ? 'Dépôt' : 'Retrait'} créé avec succès`);
      } else {
        toast.dismiss(loadingToast);
        toast.error('Type de transaction non supporté');
        return;
      }

      // Refresh data
      await fetchData();
      setShowModal(false);
      setFormData({ 
        type: 'Vente', 
        amount: 0, 
        method: 'Espèces', 
        clientId: '', 
        employeeId: '', 
        note: '',
        appointmentId: ''
      });
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      toast.error(err.message || 'Erreur lors de la création de la transaction');
    }
  };

  // Print handler
  const handlePrint = () => {
    const now = new Date();
    const startDate = now.toLocaleDateString('fr-FR');
    const endDate = now.toLocaleDateString('fr-FR');
    const balance = totalSales + totalDeposits - totalRefunds - totalWithdrawals;
    
    generateCaissePDF({
      totalSales,
      totalRefunds,
      balance,
      startDate,
      endDate,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-0">
        <div className="animate-pulse space-y-4 pt-20">
          <div className="bg-gray-200 h-12 rounded-xl w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
          <div className="bg-gray-200 h-96 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

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
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .accent-bg { background-color: #002366 !important; }
        .accent-text { color: #002366 !important; }
        /* Hide number input arrows for montant field */
        input[type=number].no-arrows {
          appearance: textfield;
        }
        input[type=number].no-arrows::-webkit-inner-spin-button,
        input[type=number].no-arrows::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number].no-arrows {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* Header */}
      <div className="mb-8 pt-20 animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-light text-gray-900 tracking-tight mb-2">Caisse</h1>
            <p className="text-sm text-gray-400">Gestion des transactions et flux financiers</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="px-5 py-2 bg-[#002366] text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              Exporter
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 animate-fadeIn">
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-gray-400" size={18} />
            <span className="text-xs text-gray-400">Ventes</span>
          </div>
          <p className="text-2xl font-light text-gray-900">{totalSales} MAD</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-gray-400" size={18} />
            <span className="text-xs text-gray-400">Espèces</span>
          </div>
          <p className="text-2xl font-light text-gray-900">{totalCash} MAD</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="text-gray-400" size={18} />
            <span className="text-xs text-gray-400">Carte</span>
          </div>
          <p className="text-2xl font-light text-gray-900">{totalCard} MAD</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCcw className="text-gray-400" size={18} />
            <span className="text-xs text-gray-400">Remboursements</span>
          </div>
          <p className="text-2xl font-light text-gray-900">{totalRefunds} MAD</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-gray-400" size={18} />
            <span className="text-xs text-gray-400">Dépôts</span>
          </div>
          <p className="text-2xl font-light text-gray-900">{totalDeposits} MAD</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-gray-400" size={18} />
            <span className="text-xs text-gray-400">Retraits</span>
          </div>
          <p className="text-2xl font-light text-gray-900">{totalWithdrawals} MAD</p>
        </div>
      </div>

      {/* Search & Quick Actions */}
      <div className="mb-6 animate-fadeIn">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher une transaction..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={() => { setFormData({ ...formData, type: 'Vente' }); setShowModal(true); }}
            className="px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={14} />
            Nouvelle vente
          </button>
          <button
            onClick={() => { setFormData({ ...formData, type: 'Remboursement' }); setShowModal(true); }}
            className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-full text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <RefreshCcw size={14} />
            Remboursement
          </button>
          <button
            onClick={() => { setFormData({ ...formData, type: 'Dépôt' }); setShowModal(true); }}
            className="px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Wallet size={14} />
            Dépôt
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-xs font-medium transition-colors flex items-center gap-2"
            title="Imprimer le rapport"
          >
            <Printer size={14} />
          </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 animate-fadeIn">
        {/* Daily Summary */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-medium text-gray-900">Résumé du jour</h3>
            <Calendar className="text-gray-400" size={18} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="text-emerald-600" size={16} />
                <span className="text-xs text-emerald-700 font-medium">Entrées</span>
              </div>
              <p className="text-2xl font-light text-emerald-900">{totalSales + totalDeposits} MAD</p>
              <p className="text-xs text-emerald-600 mt-1">{transactions.filter(t => t.amount > 0).length} transactions</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="text-red-600" size={16} />
                <span className="text-xs text-red-700 font-medium">Sorties</span>
              </div>
              <p className="text-2xl font-light text-red-900">{Math.abs(totalRefunds + totalWithdrawals)} MAD</p>
              <p className="text-xs text-red-600 mt-1">{transactions.filter(t => t.amount < 0).length} transactions</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Solde net</span>
              <span className="text-xl font-medium text-gray-900">
                {totalSales + totalDeposits - totalRefunds - totalWithdrawals} MAD
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-medium text-gray-900">Répartition paiements</h3>
            <Wallet className="text-gray-400" size={18} />
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Espèces</span>
                <span className="text-sm font-medium text-gray-900">{totalCash} MAD</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(totalCash / totalSales) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Carte</span>
                <span className="text-sm font-medium text-gray-900">{totalCard} MAD</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(totalCard / totalSales) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Virement</span>
                <span className="text-sm font-medium text-gray-900">
                  {transactions.filter(t => t.method === 'Virement').reduce((sum, t) => sum + t.amount, 0)} MAD
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${(transactions.filter(t => t.method === 'Virement').reduce((sum, t) => sum + t.amount, 0) / totalSales) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden animate-fadeIn">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-900">Toutes les transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-full table-auto">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Montant</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Méthode</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">Client</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">Employé</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        tx.type === 'Vente' ? 'bg-emerald-50 text-emerald-700' :
                        tx.type === 'Remboursement' ? 'bg-red-50 text-red-700' :
                        tx.type === 'Dépôt' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-light text-lg ${tx.amount < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} MAD
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {tx.method === 'Espèces' && <Wallet size={14} className="text-gray-400" />}
                        {tx.method === 'Carte' && <CreditCard size={14} className="text-gray-400" />}
                        <span className="text-sm text-gray-600">{tx.method}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {tx.client || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {tx.employee && tx.employee.trim() ? tx.employee : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">{tx.date.toLocaleString('fr-FR')}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tx.note || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Receipt className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500">Aucune transaction trouvée</p>
                    {transactions.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        {transactions.length} transaction(s) au total, mais aucune ne correspond aux filtres
                      </p>
                    )}
                    {transactions.length === 0 && !loading && (
                      <p className="text-xs text-gray-400 mt-2">
                        Commencez par ajouter une transaction
                      </p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Transaction */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between">
              <h2 className="text-2xl font-light text-gray-900">Nouvelle transaction</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTransaction} className="px-8 py-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v as any })}>
                      <SelectTrigger className="w-full px-4 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-sm mt-2">
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vente">Vente</SelectItem>
                        <SelectItem value="Remboursement">Remboursement</SelectItem>
                        <SelectItem value="Dépôt">Dépôt</SelectItem>
                        <SelectItem value="Retrait">Retrait</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                        onClick={() => setFormData({ ...formData, amount: Math.max(0, Number(formData.amount) - 10) })}
                        aria-label="Diminuer le montant"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                        className="w-full px-4 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-center no-arrows"
                        required
                        placeholder="Montant en MAD"
                        min={0}
                      />
                      <button
                        type="button"
                        className="px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                        onClick={() => setFormData({ ...formData, amount: Number(formData.amount) + 10 })}
                        aria-label="Augmenter le montant"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Méthode</label>
                    <Select value={formData.method} onValueChange={v => setFormData({ ...formData, method: v as any })}>
                      <SelectTrigger className="w-full px-4 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-sm mt-2">
                        <SelectValue placeholder="Sélectionner la méthode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Espèces">Espèces</SelectItem>
                        <SelectItem value="Carte">Carte</SelectItem>
                        <SelectItem value="Virement">Virement</SelectItem>
                        <SelectItem value="Chèque">Chèque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client {formData.type === 'Vente' || formData.type === 'Remboursement' ? <span className="text-red-500">*</span> : ''}
                    </label>
                    <Select 
                      value={formData.clientId} 
                      onValueChange={v => setFormData({ ...formData, clientId: v })}
                    >
                      <SelectTrigger className="w-full px-4 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-sm mt-2">
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employé</label>
                    <Select 
                      value={formData.employeeId || 'none'} 
                      onValueChange={v => setFormData({ ...formData, employeeId: v === 'none' ? '' : v })}
                    >
                      <SelectTrigger className="w-full px-4 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-sm mt-2">
                        <SelectValue placeholder="Sélectionner un employé (optionnel)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        {employees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                    <input type="text" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="w-full px-4 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-sm" placeholder="Ajouter une note (optionnel)" />
                  </div>
                </div>
              </div>
              <div className="sticky bottom-0 bg-white border-t border-gray-100 -mx-8 px-8 py-4 mt-6 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Annuler</button>
                <button type="submit" className="flex-1 px-6 py-2.5 bg-[#002366] text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CaissePage(props: CaissePageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CaissePageContent {...props} />
    </Suspense>
  );
}
