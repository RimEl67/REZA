'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, Phone, Mail, X, ChevronLeft, ChevronRight, MoreVertical, Plus, CalendarIcon, MapPin, Upload, Image as ImageIcon, Check, UserX, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DatePickerDemo from '@/components/ui/datepicker';
import ReactSelect from 'react-select';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

// API Appointment type
type ApiAppointment = {
  id: string;
  tenantId: string;
  clientId: string;
  serviceId: string;
  employeeId: string | null;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string | null;
  cancelledBy?: string | null;
  services?: Array<{
    id?: string;
    serviceId?: string | null;
    name: string;
    serviceName: string;
    duration: number;
    price: number;
    sortOrder: number;
  }>;
  totalDuration?: number;
  totalPrice?: number;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  service: {
    id: string;
    name: string;
    color?: string;
    duration: number;
    price?: number | null;
    priceFrom?: number | null;
  };
  employee: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

// Frontend Appointment type
type Appointment = {
  id: string;
  clientName: string;
  service: string;
  services?: Array<{
    id?: string;
    serviceId?: string | null;
    name: string;
    duration: number;
    price: number;
    sortOrder: number;
  }>;
  time: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'in_progress' | 'completed' | 'no_show' | string;
  employee: string;
  phone?: string;
  email?: string;
  date: Date;
  notes?: string;
  cancelledByClient?: boolean;
  // API IDs for updates
  clientId?: string;
  serviceId?: string;
  serviceIds?: string[];
  employeeId?: string | null;
  /** Required on create when multi-salon filter is active */
  tenantId?: string;
  /** Catalog price snapshot for caisse */
  servicePrice?: number | null;
  totalDuration?: number;
  totalPrice?: number;
};

type FinalizePaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK';

type FinalizeModalState = {
  appointment: Appointment;
  paymentMethod: FinalizePaymentMethod;
  loading: boolean;
};

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status?: string;
  address?: string;
};

// Transform API appointment to frontend format
const transformApiAppointment = (apiApt: ApiAppointment): Appointment => {
  // Parse UTC date from API
  // The backend stores dates in UTC (e.g., "2024-12-24T15:30:00.000Z" for 16:30 Morocco time)
  const utcDate = new Date(apiApt.startTime);
  
  // Extract UTC time components directly from the stored UTC time
  const utcHours = utcDate.getUTCHours();
  const utcMinutes = utcDate.getUTCMinutes();
  
  // Convert UTC to Morocco time (UTC+1) by adding 1 hour
  let moroccoHours = utcHours + 1;
  const moroccoMinutes = utcMinutes;
  
  // Extract UTC date components
  let utcYear = utcDate.getUTCFullYear();
  let utcMonth = utcDate.getUTCMonth();
  let utcDay = utcDate.getUTCDate();
  
  // Handle hour overflow (e.g., 23:30 UTC + 1 hour = 00:30 next day)
  if (moroccoHours >= 24) {
    moroccoHours = moroccoHours - 24;
    // Move to next day
    const nextDay = new Date(Date.UTC(utcYear, utcMonth, utcDay + 1));
    utcYear = nextDay.getUTCFullYear();
    utcMonth = nextDay.getUTCMonth();
    utcDay = nextDay.getUTCDate();
  }
  
  const time = `${moroccoHours.toString().padStart(2, '0')}:${moroccoMinutes.toString().padStart(2, '0')}`;
  
  // Create date object using UTC components to avoid timezone conversion issues
  // This ensures the date picker shows the correct date regardless of browser timezone
  const date = new Date(Date.UTC(utcYear, utcMonth, utcDay));
  date.setHours(0, 0, 0, 0); // Ensure it's at midnight
  
  // Map API status to frontend status
  const statusMap: Record<string, string> = {
    'PENDING': 'pending',
    'CONFIRMED': 'confirmed',
    'IN_PROGRESS': 'in_progress',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled',
    'NO_SHOW': 'no_show'
  };
  
  const services = (apiApt.services || []).map((service) => ({
    id: service.id,
    serviceId: service.serviceId ?? null,
    name: service.name || service.serviceName,
    duration: service.duration,
    price: service.price,
    sortOrder: service.sortOrder,
  }));

  return {
    id: apiApt.id,
    clientName: `${apiApt.client.firstName} ${apiApt.client.lastName}`,
    service: services.length > 0 ? services[0].name : apiApt.service.name,
    services,
    serviceIds: services.map((service) => service.serviceId ?? service.id ?? '').filter(Boolean),
    time,
    duration: apiApt.totalDuration ?? apiApt.duration,
    status: statusMap[apiApt.status] || apiApt.status.toLowerCase(),
    employee: apiApt.employee ? `${apiApt.employee.firstName} ${apiApt.employee.lastName}` : 'Non assigné',
    phone: apiApt.client.phone || undefined,
    email: apiApt.client.email || undefined,
    date,
    notes: apiApt.notes || undefined,
    cancelledByClient: apiApt.cancelledBy === apiApt.clientId,
    clientId: apiApt.clientId,
    serviceId: apiApt.serviceId,
    employeeId: apiApt.employeeId,
    tenantId: apiApt.tenantId,
    servicePrice: apiApt.service.price ?? apiApt.service.priceFrom ?? null,
    totalDuration: apiApt.totalDuration ?? apiApt.duration,
    totalPrice: apiApt.totalPrice ?? (apiApt.service.price ?? apiApt.service.priceFrom ?? null),
  };
};

// Transform frontend appointment to API format
const transformToApiAppointment = (apt: Appointment, date: Date, time: string): any => {
  // Combine date and time in Morocco timezone (UTC+1), then convert to UTC ISO string
  // The date parameter is a Date object created with UTC components (from transformApiAppointment)
  // So we use UTC methods to extract components
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create date in Morocco timezone (treating the date/time as if it were Morocco local time)
  // We create a UTC date with the Morocco date/time components
  const moroccoDateTime = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
    0
  ));
  
  // Convert Morocco time to UTC by subtracting 1 hour offset
  const moroccoOffset = 1 * 60 * 60 * 1000; // 1 hour in milliseconds
  const utcDateTime = new Date(moroccoDateTime.getTime() - moroccoOffset);
  
  // Convert to ISO string (UTC) for database storage
  const startTimeISO = utcDateTime.toISOString();
  
  // Map frontend status to API status
  const statusMap: Record<string, string> = {
    'pending': 'PENDING',
    'confirmed': 'CONFIRMED',
    'in_progress': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'cancelled': 'CANCELLED',
    'no_show': 'NO_SHOW'
  };
  
  const serviceIds = (apt.serviceIds && apt.serviceIds.length > 0
    ? apt.serviceIds
    : apt.serviceId
      ? [apt.serviceId]
      : []);

  return {
    clientId: apt.clientId!,
    ...(serviceIds.length > 0 ? { serviceIds } : {}),
    ...(apt.serviceId ? { serviceId: apt.serviceId } : {}),
    employeeId: apt.employeeId || undefined,
    startTime: startTimeISO,
    duration: apt.duration,
    notes: apt.notes || undefined,
    status: statusMap[apt.status] || 'CONFIRMED',
    ...(apt.tenantId ? { tenantId: apt.tenantId } : {}),
  };
};

const ACTIVE_APPOINTMENT_STATUSES = new Set(['pending', 'confirmed', 'in_progress']);

const canConfirmStatus = (status: string) => status === 'pending';
const canMarkAbsentOrDone = (status: string) =>
  status === 'pending' || status === 'confirmed' || status === 'in_progress';

const PAYMENT_METHOD_LABELS: Record<FinalizePaymentMethod, string> = {
  CASH: 'Espèces',
  CARD: 'Carte',
  BANK_TRANSFER: 'Virement',
  CHECK: 'Chèque',
};

const getAppointmentWindow = (date: Date, time: string, duration: number) => {
  const [hours, minutes] = time.split(':').map(Number);
  const start = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
    0
  );
  const end = new Date(start.getTime() + duration * 60000);
  return { start, end };
};

const findLocalScheduleConflict = (
  appointments: Appointment[],
  candidate: {
    employeeId?: string | null;
    date: Date;
    time: string;
    duration: number;
    status: string;
    excludeId?: string;
  }
): Appointment | null => {
  if (!candidate.employeeId || !ACTIVE_APPOINTMENT_STATUSES.has(candidate.status)) {
    return null;
  }

  const { start, end } = getAppointmentWindow(candidate.date, candidate.time, candidate.duration);

  return (
    appointments.find((apt) => {
      if (candidate.excludeId && apt.id === candidate.excludeId) return false;
      if (!apt.employeeId || apt.employeeId !== candidate.employeeId) return false;
      if (!ACTIVE_APPOINTMENT_STATUSES.has(apt.status)) return false;
      const aptWindow = getAppointmentWindow(apt.date, apt.time, apt.duration);
      return start < aptWindow.end && end > aptWindow.start;
    }) ?? null
  );
};

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

interface NewAppointmentModalProps {
  onClose: () => void;
  onCreateAppointment: (appointment: Appointment) => void;
  employeesData?: Array<{
    id: string;
    name: string;
    color: string;
    workingHours: any;
    agendaSettings: any;
  }>;
  initialDate?: Date;
  initialTime?: string;
}

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({ onClose, onCreateAppointment, employeesData = [], initialDate, initialTime }) => {
  const { isAuthenticated, salons, isSalonFilterMulti, effectiveSalonIds } = useAuth();
  const router = useRouter();
  const [createTenantId, setCreateTenantId] = useState(() =>
    !isSalonFilterMulti && effectiveSalonIds.length === 1 ? effectiveSalonIds[0] : ''
  );
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [time, setTime] = useState(initialTime || '');
  const [service, setService] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [duration, setDuration] = useState('');
  const [employee, setEmployee] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [notes, setNotes] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Array<{id: string, name: string, duration: number}>>([]);
  const [employees, setEmployees] = useState<Array<{id: string, name: string}>>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Fetch clients, services, and employees from API (scoped to create salon when multi)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (isSalonFilterMulti && !createTenantId) {
      setClients([]);
      setServices([]);
      setEmployees([]);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const scope = createTenantId ? { salonIds: createTenantId } : undefined;
        const [clientsRes, servicesRes, employeesRes] = await Promise.all([
          api.getClients({ limit: 1000 }, scope),
          api.getServices(undefined, scope),
          api.getEmployees({ active: true }, scope)
        ]);
        
        const clientsData = (clientsRes.clients || []).map((c: any) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
          phone: c.phone,
          status: c.status
        }));
        setClients(clientsData);
        
        const servicesData = (servicesRes.services || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          duration: s.duration
        }));
        setServices(servicesData);
        
        const employeesDataMapped = (employeesRes.employees || []).map((e: any) => ({
          id: e.id,
          name: `${e.firstName} ${e.lastName}`
        }));
        setEmployees(employeesDataMapped);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, createTenantId, isSalonFilterMulti]);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(clientSearch.toLowerCase())) ||
    (client.phone && client.phone.includes(clientSearch))
  );

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(client.name);
    setIsNewClient(false);
  };

  const handleClientSearchChange = (value: string) => {
    setClientSearch(value);
    setSelectedClient(null);
    
    // Calculate filtered clients with the new value (not the old state)
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(value.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(value.toLowerCase())) ||
      (client.phone && client.phone.includes(value))
    );
    
    setIsNewClient(value.length > 0 && filtered.length === 0);
  };

  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = () => {
    // Validation
    if (isSalonFilterMulti && !createTenantId) {
      setCreateError('Veuillez sélectionner un salon');
      setTimeout(() => setCreateError(null), 3000);
      return;
    }
    if (!date || !time || serviceIds.length === 0 || !duration || !selectedClient) {
      setCreateError('Veuillez remplir tous les champs obligatoires');
      setTimeout(() => setCreateError(null), 3000);
      return;
    }
    setCreateError(null);

    // Normalize the date to remove time component
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    normalizedDate.setHours(0, 0, 0, 0);

    // Normalize time to HH:mm format
    let normalizedTime = time;
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(time)) {
      normalizedTime = time.slice(0,5);
    } else if (/^\d{1,2}$/.test(time)) {
      normalizedTime = time.padStart(2, '0') + ':00';
    }

    // Get selected services
    const selectedServiceObjects = services.filter(s => serviceIds.includes(s.id));
    const serviceName = selectedServiceObjects.length > 0
      ? selectedServiceObjects.map((s) => s.name).join(', ')
      : service;

    // Get employee name
    const selectedEmployee = employees.find(e => e.id === employeeId);
    const employeeName = selectedEmployee?.name || employee;

    // Create new appointment
    const newAppointment: Appointment = {
      id: '', // Will be set by API
      clientName: selectedClient.name,
      service: serviceName,
      time: normalizedTime,
      duration: parseInt(duration) || selectedService?.duration || 60,
      status: 'pending',
      employee: employeeName || 'Non assigné',
      phone: selectedClient.phone || undefined,
      email: selectedClient.email || undefined,
      date: normalizedDate,
      notes,
      clientId: selectedClient.id,
      serviceId: serviceIds[0] || serviceId,
      serviceIds,
      employeeId: employeeId || null,
      tenantId: createTenantId || undefined,
    };

    onCreateAppointment(newAppointment);
  };
  
  // Helper function to check if employee is available
  const isEmployeeAvailable = (empId: string, date: Date | undefined, time: string): boolean => {
    if (!date || !time || !empId) return true;
    
    const employee = employeesData.find(emp => emp.id === empId);
    if (!employee || !employee.workingHours) return true;
    
    const workingHours = employee.workingHours;
    if (!Array.isArray(workingHours)) return true;
    
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayName = dayNames[date.getDay()];
    
    const daySchedule = workingHours.find((wh: any) => wh.day === dayName);
    if (!daySchedule || !daySchedule.isWorking) return false;
    
    const [timeHours, timeMinutes] = time.split(':').map(Number);
    const timeInMinutes = timeHours * 60 + timeMinutes;
    
    const [startHours, startMinutes] = daySchedule.startTime.split(':').map(Number);
    const startInMinutes = startHours * 60 + startMinutes;
    
    const [endHours, endMinutes] = daySchedule.endTime.split(':').map(Number);
    const endInMinutes = endHours * 60 + endMinutes;
    
    if (timeInMinutes < startInMinutes || timeInMinutes >= endInMinutes) {
      return false;
    }
    
    if (daySchedule.breaks && Array.isArray(daySchedule.breaks)) {
      for (const breakTime of daySchedule.breaks) {
        const [breakStartHours, breakStartMinutes] = breakTime.start.split(':').map(Number);
        const breakStartInMinutes = breakStartHours * 60 + breakStartMinutes;
        
        const [breakEndHours, breakEndMinutes] = breakTime.end.split(':').map(Number);
        const breakEndInMinutes = breakEndHours * 60 + breakEndMinutes;
        
        if (timeInMinutes >= breakStartInMinutes && timeInMinutes < breakEndInMinutes) {
          return false;
        }
      }
    }
    
    return true;
  };
  
  // Get available employees based on selected date/time
  const availableEmployees = date && time 
    ? employees.filter(emp => isEmployeeAvailable(emp.id, date, time))
    : employees;
  
  // Update duration and label when services change
  useEffect(() => {
    const selectedServiceObjects = services.filter((s) => serviceIds.includes(s.id));
    if (selectedServiceObjects.length > 0) {
      const totalDuration = selectedServiceObjects.reduce((sum, s) => sum + s.duration, 0);
      setDuration(totalDuration.toString());
      setService(selectedServiceObjects.map((s) => s.name).join(', '));
      if (serviceId && !selectedServiceObjects.some((s) => s.id === serviceId)) {
        setServiceId(selectedServiceObjects[0].id);
      }
    } else if (serviceId) {
      const selectedService = services.find((s) => s.id === serviceId);
      if (selectedService) {
        setDuration(selectedService.duration.toString());
        setService(selectedService.name);
      }
    }
  }, [serviceId, serviceIds, services]);
  
  // Reset employee selection if selected employee becomes unavailable
  useEffect(() => {
    if (employeeId && date && time && !isEmployeeAvailable(employeeId, date, time)) {
      setEmployeeId('');
      setEmployee('');
    }
  }, [date, time, employeeId]);

  return (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
    <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 z-40">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-light text-gray-900">Nouveau rendez-vous</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className="px-8 py-6 space-y-8">
        {/* Error Message */}
        {createError && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
            {createError}
          </div>
        )}

        {isSalonFilterMulti && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Salon</h3>
            <Select
              value={createTenantId || undefined}
              onValueChange={(id) => {
                setCreateTenantId(id);
                setSelectedClient(null);
                setClientSearch('');
                setServiceId('');
                setServiceIds([]);
                setEmployeeId('');
              }}
            >
              <SelectTrigger className="rounded-full px-4 py-2">
                <SelectValue placeholder="Choisir un salon *" />
              </SelectTrigger>
              <SelectContent>
                {salons
                  .filter((s) => effectiveSalonIds.includes(s.id))
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Client Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Client</h3>
          
          {/* Client Search/Select */}
          <div className="space-y-2">
            <Label>Rechercher un client</Label>
            <ReactSelect
              instanceId="client-select"
              isLoading={loading}
              isDisabled={loading}
              placeholder="Taper le nom, email ou téléphone..."
              noOptionsMessage={() =>"Aucun client trouvé"}
              options={clients.map(c => ({ value: c.id, label: `${c.name} ${c.email ? `- ${c.email}` : ''} ${c.phone ? `- ${c.phone}` : ''}`, client: c }))}
              onChange={(option: any) => {
                if (option) {
                  handleClientSelect(option.client);
                } else {
                  setSelectedClient(null);
                  setClientSearch('');
                }
              }}
              value={selectedClient ? { value: selectedClient.id, label: `${selectedClient.name} ${selectedClient.email ? `- ${selectedClient.email}` : ''} ${selectedClient.phone ? `- ${selectedClient.phone}` : ''}`, client: selectedClient } : null}
              className="mt-2 text-sm"
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: '9999px',
                  padding: '2px 8px',
                  borderColor: '#e5e7eb',
                  boxShadow: 'none',
                  '&:hover': {
                    borderColor: '#d1d5db'
                  }
                })
              }}
              isClearable
            />
          </div>

          {/* Show selected client info or manual entry */}
          {selectedClient ? (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                    <span className="text-white font-medium text-lg">
                      {selectedClient.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedClient.name}</h4>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${
                      selectedClient.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedClient.status}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(null);
                    setClientSearch('');
                  }}
                  className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={14} className="text-gray-400" />
                  <span>{selectedClient.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={14} className="text-gray-400" />
                  <span>{selectedClient.phone}</span>
                </div>
                {selectedClient.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{selectedClient.address}</span>
                  </div>
                )}
              </div>
            </div>
          ) : isNewClient ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input 
                  id="phone"
                  type="tel"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="rounded-full mt-2 px-4 py-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="sophie.m@email.com"
                  className="rounded-full mt-2 px-4 py-2"
                />
              </div>
            </div>
          ) : null}

          {/* Services */}
          <div className="space-y-2">
            <Label htmlFor="service">Services</Label>
            <ReactSelect
              instanceId="service-select"
              isLoading={loading}
              isDisabled={loading || services.length === 0}
              placeholder={loading ? "Chargement..." : "Sélectionner un ou plusieurs services"}
              noOptionsMessage={() =>"Aucun service trouvé"}
              isMulti
              options={services.map((s) => ({ value: s.id, label: `${s.name} (${s.duration} min)`, service: s }))}
              onChange={(options: any) => {
                const nextValues = (options || []).map((option: any) => option.value);
                setServiceIds(nextValues);
                setServiceId(nextValues[0] || '');
              }}
              value={(serviceIds.length > 0 ? serviceIds : serviceId ? [serviceId] : []).map((id) => {
                const selectedService = services.find((s) => s.id === id);
                return selectedService
                  ? { value: selectedService.id, label: `${selectedService.name} (${selectedService.duration} min)`, service: selectedService }
                  : null;
              }).filter(Boolean) as any[]}
              className="mt-2 text-sm"
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: '9999px',
                  padding: '2px 8px',
                  borderColor: '#e5e7eb',
                  boxShadow: 'none',
                  '&:hover': {
                    borderColor: '#d1d5db'
                  }
                })
              }}
              isClearable
            />
          </div>
        </div>

        {/* DateTime */}
        <div className="space-y-4">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Planification</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal rounded-full px-4 py-2 mt-2 h-auto",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="mb-2">Heure</Label>
              <div className='mt-2'>
                <DatePickerDemo  value={time} onChange={setTime} id="rdv-time-picker" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Durée</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="duration" className="rounded-full px-4 py-2 mt-2">
                  <SelectValue placeholder="Sélectionner la durée" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                  <SelectItem value="90">90 min</SelectItem>
                  <SelectItem value="120">120 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Notes</h3>
          <Textarea 
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ajouter des notes..."
            className="rounded-lg px-4 py-2 border-gray-200 focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-4 flex gap-3">
        <button 
          onClick={onClose}
          className="flex-1 px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Annuler
        </button>
        <button 
          onClick={handleCreate}
          className="flex-1 px-6 py-2.5 bg-[#002366] text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
        >
          Créer
        </button>
      </div>
    </div>
  </div>
);
}

interface AppointmentCardProps {
  apt: Appointment;
  isCompact?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, appointment: Appointment) => void;
  onStatusUpdate?: (appointment: Appointment, newStatus: string) => void;
  onShowDetails?: (appointment: Appointment) => void;
  employeeColor?: string;
  serviceColor?: string;
  showColorInRDV?: boolean;
  displayFields?: Array<{ id: string; label: string; visible: boolean; order: number }>;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  apt, 
  isCompact = false, 
  onDragStart,
  onStatusUpdate,
  onShowDetails,
  employeeColor,
  serviceColor,
  showColorInRDV = true,
  displayFields = [
    { id: 'hours', label: 'Horaires', visible: true, order: 1 },
    { id: 'clientName', label: 'Nom du client', visible: true, order: 2 },
    { id: 'services', label: 'Prestation(s)', visible: true, order: 3 },
    { id: 'notes', label: 'Titre ou note', visible: true, order: 4 },
  ]
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const getStatusBg = (status: string) => {
    // If showColorInRDV is false, use status colors
    if (!showColorInRDV) {
      switch (status) {
        case 'confirmed': return 'bg-emerald-50 border-emerald-200 text-emerald-900';
        case 'pending': return 'bg-amber-50 border-amber-200 text-amber-900';
        case 'cancelled': return 'bg-gray-50 border-gray-200 text-gray-500';
        default: return 'bg-gray-50 border-gray-200 text-gray-900';
      }
    }
    
    // If showColorInRDV is true, use employee or service color
    const color = employeeColor || serviceColor || '#3B82F6';
    return '';
  };

  // Generate lighter background and border colors from the main color
  const getLightColorStyle = (color: string) => {
    if (!showColorInRDV) return {};
    
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
      color: color
    };
  };

  const color = employeeColor || serviceColor || '#3B82F6';

  // Get visible fields sorted by order
  const visibleFields = displayFields
    .filter(f => f.visible)
    .sort((a, b) => a.order - b.order);

  // Render field content based on field ID
  const renderField = (field: { id: string; label: string; visible: boolean; order: number }) => {
    switch (field.id) {
      case 'hours':
        return (
          <div key={field.id} className="flex items-center gap-1.5 text-xs opacity-60">
            <Clock size={11} />
            <span>{apt.time} · {apt.duration}min</span>
          </div>
        );
      case 'clientName':
        return (
          <p key={field.id} className="font-medium truncate break-words w-full">{apt.clientName}</p>
        );
      case 'services':
        return (
          <p key={field.id} className="text-xs opacity-60 truncate break-words w-full mt-0.5">
            {apt.services && apt.services.length > 1
              ? `${apt.services.length} services • ${apt.duration} min`
              : apt.service}
          </p>
        );
      case 'notes':
        return apt.notes ? (
          <p key={field.id} className="text-xs opacity-60 truncate break-words w-full mt-0.5">{apt.notes}</p>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, apt)}
      className={`${getStatusBg(apt.status)} rounded-lg p-3 cursor-move hover:shadow-md transition-all border ${
        isCompact ? 'text-xs' : 'text-sm'
      }`}
      style={showColorInRDV ? getLightColorStyle(color) : {}}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          {visibleFields.map(field => renderField(field))}
          {apt.status === 'cancelled' && apt.cancelledByClient && (
            <div className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
              <X size={11} />
              <span>Annulé par le client</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isCompact && canConfirmStatus(apt.status) && onStatusUpdate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate(apt, 'confirmed');
              }}
              className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
              title="Confirmer le rendez-vous"
            >
              Confirmer
            </button>
          )}
          <Popover open={showMenu} onOpenChange={setShowMenu}>
            <PopoverTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(true);
                }}
                className="p-1 opacity-40 hover:opacity-100 transition-opacity"
              >
                <MoreVertical size={isCompact ? 12 : 14} />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-48 p-1" 
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              {canConfirmStatus(apt.status) && onStatusUpdate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusUpdate(apt, 'confirmed');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 rounded transition-colors flex items-center gap-2"
                >
                  <Check size={14} />
                  Confirmer
                </button>
              )}
              {canMarkAbsentOrDone(apt.status) && onStatusUpdate && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusUpdate(apt, 'completed');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded transition-colors flex items-center gap-2"
                  >
                    <Flag size={14} />
                    Terminé
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusUpdate(apt, 'no_show');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-orange-700 hover:bg-orange-50 rounded transition-colors flex items-center gap-2"
                  >
                    <UserX size={14} />
                    Absent
                  </button>
                </>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  if (onShowDetails) {
                    onShowDetails(apt);
                  }
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
              >
                Détails
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {!isCompact && apt.employee && (
        <div className="mt-2 pt-2 border-t border-current/10 text-xs opacity-60">
          <div className="flex items-center gap-1">
            <User size={11} />
            <span className="truncate break-words w-full">{apt.employee}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const RendezVousPage = () => {
  const { isAuthenticated, user, salonFilter, effectiveSalonIds } = useAuth();
  const salonFilterKey = salonFilter === 'all' ? 'all' : effectiveSalonIds.join(',');
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState('week'); // day, week, month
  const [currentDate, setCurrentDate] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNewRDV, setShowNewRDV] = useState(false);
  const [newRdvInitialDate, setNewRdvInitialDate] = useState<Date | undefined>(undefined);
  const [newRdvInitialTime, setNewRdvInitialTime] = useState<string>('');
  const [draggedEvent, setDraggedEvent] = useState<Appointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [finalizeModal, setFinalizeModal] = useState<FinalizeModalState | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [uploadingHeaderImage, setUploadingHeaderImage] = useState(false);
  const canUploadHeaderImage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'STAFF';
  const headerImageFetchedRef = React.useRef(false);
  
  // Load employee agendas and services for colors
  const [employeeAgendas, setEmployeeAgendas] = useState<Array<{id: string, name: string, color: string}>>([]);
  const [services, setServices] = useState<Array<{id: number, name: string, color: string}>>([]);
  const [displaySettings, setDisplaySettings] = useState<{
    showColorInRDV: boolean;
    fields?: Array<{ id: string; label: string; visible: boolean; order: number }>;
  }>({ 
    showColorInRDV: true,
    fields: [
      { id: 'hours', label: 'Horaires', visible: true, order: 1 },
      { id: 'clientName', label: 'Nom du client', visible: true, order: 2 },
      { id: 'services', label: 'Prestation(s)', visible: true, order: 3 },
      { id: 'notes', label: 'Titre ou note', visible: true, order: 4 },
    ]
  });

  // Store full employee data with working hours
  const [employeesData, setEmployeesData] = useState<Array<{
    id: string;
    name: string;
    color: string;
    workingHours: any;
    agendaSettings: any;
  }>>([]);

  // Fetch employees and services from API
  useEffect(() => {
    console.log('[RendezVous] useEffect triggered, isAuthenticated:', isAuthenticated);
    if (!isAuthenticated) {
      console.log('[RendezVous] Not authenticated, skipping data fetch');
      return;
    }
    console.log('[RendezVous] Authenticated, proceeding with data fetch');
    
    const fetchData = async () => {
      try {
        // Fetch employees from API
        const employeesResponse = await api.getEmployees({ active: true });
        const employees = employeesResponse.employees || [];
        
        // Transform employees to extract name, color, and working hours
        const transformedEmployees = employees.map((emp: any) => {
          const agendaSettings = emp.agendaSettings || {};
          const name = `${emp.firstName} ${emp.lastName}`;
          const color = agendaSettings.color || '#3B82F6';
          return { 
            id: emp.id, 
            name, 
            color,
            workingHours: emp.workingHours,
            agendaSettings: agendaSettings
          };
        });
        setEmployeeAgendas(transformedEmployees.map((e: any) => ({ id: e.id, name: e.name, color: e.color })));
        setEmployeesData(transformedEmployees);

        // Fetch services from API
        const servicesResponse = await api.getServices();
        const allServices = servicesResponse.services || [];
        setServices(allServices.map((s: any) => ({ id: s.id, name: s.name, color: s.color })));
      } catch (err) {
        console.error('Error fetching employees/services:', err);
        // Fallback to localStorage if API fails
        if (typeof window !== 'undefined') {
          const storedAgendas = localStorage.getItem('employeeAgendas');
          if (storedAgendas) {
            const agendas = JSON.parse(storedAgendas);
            setEmployeeAgendas(agendas.map((a: any) => ({ id: a.id, name: a.name, color: a.color })));
          }
          const storedServices = localStorage.getItem('services');
          if (storedServices) {
            const servicesData = JSON.parse(storedServices);
            setServices(servicesData.map((s: any) => ({ id: s.id, name: s.name, color: s.color })));
          }
        }
      }
    };

    fetchData();

    // Fetch header image (only on initial load, not after uploads)
    const fetchHeaderImage = async () => {
      console.log('[Header Fetch] Starting to fetch header image...');
      try {
        console.log('[Header Fetch] Calling api.getHeaderImage()...');
        const response = await api.getHeaderImage();
        console.log('[Header Fetch] Header image response received:', response);
        console.log('[Header Fetch] Response type:', typeof response);
        console.log('[Header Fetch] Response.headerImage:', response.headerImage);
        console.log('[Header Fetch] Response.headerImage type:', typeof response.headerImage);
        console.log('[Header Fetch] Response.headerImage truthy?', !!response.headerImage);
        
        if (response && response.headerImage) {
          // Use the API endpoint to serve the image file (avoids CORS issues)
          // This goes through Next.js proxy to /api/tenant/header-image-file
          // Include tenantId as query parameter for authentication
          const tenantId = user?.tenantId;
          
          // SECURITY: Prevent using 'default' as tenantId (data isolation issue)
          if (tenantId === 'default') {
            console.error('[Header Fetch] SECURITY WARNING: User has tenantId="default". This breaks data isolation. Please log out and log back in, or contact support.');
            // Don't set header image if tenantId is 'default' to prevent data leakage
            return;
          }
          
          const imageUrl = tenantId 
            ? `/api/tenant/header-image-file?tenantId=${tenantId}`
            : '/api/tenant/header-image-file';
          console.log('[Header Fetch] Using API endpoint to serve image:', imageUrl);
          setHeaderImage(imageUrl);
          console.log('[Header Fetch] Header image state updated');
        } else {
          console.log('[Header Fetch] No header image found in API response');
          console.log('[Header Fetch] Response object:', JSON.stringify(response, null, 2));
          // Don't clear - might have been just uploaded and not yet saved, or API delay
        }
      } catch (err: any) {
        console.error('[Header Fetch] Error fetching header image:', err);
        // Safely log error details
        const errorDetails: any = {};
        if (err?.message) errorDetails.message = err.message;
        if (err?.status) errorDetails.status = err.status;
        if (err?.statusText) errorDetails.statusText = err.statusText;
        if (err?.stack) errorDetails.stack = err.stack;
        console.error('[Header Fetch] Error details:', errorDetails);
        // Don't clear on error - preserve any existing image
      }
    };

    // Fetch header image on every load (ref resets on component remount)
    console.log('[Header Fetch] useEffect triggered, headerImageFetchedRef.current:', headerImageFetchedRef.current);
    if (!headerImageFetchedRef.current) {
      console.log('[Header Fetch] Setting ref to true and calling fetchHeaderImage');
      headerImageFetchedRef.current = true;
      fetchHeaderImage();
    } else {
      console.log('[Header Fetch] Already fetched, skipping (this should not happen on refresh)');
    }

    // Load display settings from API
    const fetchDisplaySettings = async () => {
      try {
        const response = await api.getAppointmentDisplaySettings();
        const settings = response.settings || {};
        setDisplaySettings({
          showColorInRDV: settings.showColorInRDV !== undefined ? settings.showColorInRDV : true,
          fields: settings.fields || [
            { id: 'hours', label: 'Horaires', visible: true, order: 1 },
            { id: 'clientName', label: 'Nom du client', visible: true, order: 2 },
            { id: 'services', label: 'Prestation(s)', visible: true, order: 3 },
            { id: 'notes', label: 'Titre ou note', visible: true, order: 4 },
          ]
        });
      } catch (err) {
        console.error('Error fetching display settings:', err);
        // Fallback to default settings
        setDisplaySettings({
          showColorInRDV: true,
          fields: [
            { id: 'hours', label: 'Horaires', visible: true, order: 1 },
            { id: 'clientName', label: 'Nom du client', visible: true, order: 2 },
            { id: 'services', label: 'Prestation(s)', visible: true, order: 3 },
            { id: 'notes', label: 'Titre ou note', visible: true, order: 4 },
          ]
        });
      }
    };
    
    fetchDisplaySettings();
  }, [isAuthenticated, salonFilterKey]);

  // Get selected employee's color for calendar background
  const getSelectedEmployeeColor = () => {
    if (selectedEmployee === 'all') return null;
    const employee = employeeAgendas.find(e => e.name === selectedEmployee);
    return employee?.color || null;
  };

  // Generate subtle background color style for calendar cells
  const getCalendarCellStyle = () => {
    if (selectedEmployee === 'all') {
      return {};
    }
    
    const color = getSelectedEmployeeColor();
    if (!color) {
      console.warn('⚠️ No color found for employee:', selectedEmployee, 'Available employees:', employeeAgendas);
      return {};
    }
    
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // More visible when employee is selected
    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
    };
  };

  // Listen for sidebar filter changes and sidebar date changes
  useEffect(() => {
    const handleEmployeeFilter = (event: Event) => {
      const ev = event as CustomEvent<string>;
      setSelectedEmployee(ev.detail);
    };
    const handleStatusFilter = (event: Event) => {
      const ev = event as CustomEvent<string>;
      setFilterStatus(ev.detail);
    };
    const handleSidebarDateChange = (event: Event) => {
      const ev = event as CustomEvent<string>;
      setCurrentDate(new Date(ev.detail));
    };
    window.addEventListener('employeeFilterChange', handleEmployeeFilter as EventListener);
    window.addEventListener('statusFilterChange', handleStatusFilter as EventListener);
    window.addEventListener('sidebarDateChange', handleSidebarDateChange as EventListener);
    return () => {
      window.removeEventListener('employeeFilterChange', handleEmployeeFilter as EventListener);
      window.removeEventListener('statusFilterChange', handleStatusFilter as EventListener);
      window.removeEventListener('sidebarDateChange', handleSidebarDateChange as EventListener);
    };
  }, [employeeAgendas]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearTimeout(t);
      clearInterval(timer);
    };
  }, []);

  // Appointments state - fetched from API
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  
  // Fetch appointments from API based on current view date range
  const fetchAppointments = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoadingAppointments(true);
      
      // Calculate date range based on current view
      let startDate: Date;
      let endDate: Date;
      
      if (view === 'day') {
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (view === 'week') {
        const weekStart = new Date(currentDate);
        const dayOfWeek = weekStart.getDay();
        const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart;
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        endDate = weekEnd;
      } else { // month
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        startDate = monthStart;
        
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        endDate = monthEnd;
      }
      
      const response = await api.getAppointments({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1000 // Get all appointments in range
      });
      
      const apiAppointments = response.appointments || [];
      console.log('[Rendez-vous] Total appointments fetched:', apiAppointments.length);
      console.log('[Rendez-vous] Appointments by status:', apiAppointments.reduce((acc: any, apt: any) => {
        acc[apt.status] = (acc[apt.status] || 0) + 1;
        return acc;
      }, {}));
      const transformed = apiAppointments.map(transformApiAppointment);
      setAppointments(transformed);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };
  
  // Fetch appointments when view, date, or salon filter changes
  useEffect(() => {
    fetchAppointments();
  }, [isAuthenticated, view, currentDate, salonFilterKey]);

  // Filter appointments based on selected employee
  const getFilteredAppointments = () => {
    if (selectedEmployee === 'all') {
      return appointments;
    }
    
    // Find the selected employee
    const selectedEmp = employeeAgendas.find(e => e.name === selectedEmployee);
    
    if (!selectedEmp) {
      console.warn('⚠️ Selected employee not found:', selectedEmployee, 'Available:', employeeAgendas.map(e => e.name));
      // If employee not found in list, try to filter by name (case-insensitive, trim whitespace)
      return appointments.filter(apt => {
        if (!apt.employee || apt.employee === 'Non assigné') return false;
        const aptEmployee = apt.employee.trim().toLowerCase();
        const selected = selectedEmployee.trim().toLowerCase();
        return aptEmployee === selected;
      });
    }
    
    // Filter by name (case-insensitive, trim whitespace)
    const filtered = appointments.filter(apt => {
      if (!apt.employee || apt.employee === 'Non assigné') return false;
      const aptEmployee = apt.employee.trim().toLowerCase();
      const selected = selectedEmployee.trim().toLowerCase();
      return aptEmployee === selected;
    });
    
    return filtered;
  };

  // Helper function to check if employee is available at a given date/time
  const isEmployeeAvailable = (employeeId: string | null, date: Date, time: string): boolean => {
    if (!employeeId) return true; // If no employee selected, consider available
    
    const employee = employeesData.find(emp => emp.id === employeeId);
    if (!employee || !employee.workingHours) return true; // Default to available if no data
    
    const workingHours = employee.workingHours;
    if (!Array.isArray(workingHours)) return true;
    
    // Get day name in French
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayName = dayNames[date.getDay()];
    
    // Find working hours for this day
    const daySchedule = workingHours.find((wh: any) => wh.day === dayName);
    if (!daySchedule || !daySchedule.isWorking) return false;
    
    // Check if time is within working hours
    const [timeHours, timeMinutes] = time.split(':').map(Number);
    const timeInMinutes = timeHours * 60 + timeMinutes;
    
    const [startHours, startMinutes] = daySchedule.startTime.split(':').map(Number);
    const startInMinutes = startHours * 60 + startMinutes;
    
    const [endHours, endMinutes] = daySchedule.endTime.split(':').map(Number);
    const endInMinutes = endHours * 60 + endMinutes;
    
    if (timeInMinutes < startInMinutes || timeInMinutes >= endInMinutes) {
      return false;
    }
    
    // Check if time is during a break
    if (daySchedule.breaks && Array.isArray(daySchedule.breaks)) {
      for (const breakTime of daySchedule.breaks) {
        const [breakStartHours, breakStartMinutes] = breakTime.start.split(':').map(Number);
        const breakStartInMinutes = breakStartHours * 60 + breakStartMinutes;
        
        const [breakEndHours, breakEndMinutes] = breakTime.end.split(':').map(Number);
        const breakEndInMinutes = breakEndHours * 60 + breakEndMinutes;
        
        if (timeInMinutes >= breakStartInMinutes && timeInMinutes < breakEndInMinutes) {
          return false;
        }
      }
    }
    
    return true;
  };
  
  // Get available employees for a given date/time
  const getAvailableEmployees = (date: Date, time: string) => {
    return employeesData.filter(emp => isEmployeeAvailable(emp.id, date, time));
  };

  // Dispatch event when main calendar date changes to sync sidebar
  useEffect(() => {
    if (mounted) {
      window.dispatchEvent(new CustomEvent('mainCalendarDateChange', { detail: currentDate }));
    }
  }, [currentDate, mounted]);

  // Generate time slots with half-hour intervals (09:00, 09:30, 10:00, ..., 23:00, 23:30)
  const timeSlots = Array.from({ length: 30 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  // Get week days - normalized
  const getWeekDays = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      date.setHours(0, 0, 0, 0);
      return date;
    });
  };

  // Get month days - normalized
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    const days = [];
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }
    return days;
  };

  const navigateDate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    newDate.setHours(0, 0, 0, 0);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentDate(today);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, appointment: Appointment) => {
    setDraggedEvent(appointment);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newTime: string, newDate: Date) => {
    e.preventDefault();
    if (!draggedEvent) return;
    
    try {
      const normalizedDate = new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        newDate.getDate()
      );
      normalizedDate.setHours(0, 0, 0, 0);

      const conflict = findLocalScheduleConflict(appointments, {
        employeeId: draggedEvent.employeeId,
        date: normalizedDate,
        time: newTime,
        duration: draggedEvent.duration,
        status: draggedEvent.status,
        excludeId: draggedEvent.id,
      });
      if (conflict) {
        toast.error('Ce collaborateur a déjà un rendez-vous sur ce créneau.');
        setDraggedEvent(null);
        return;
      }
      
      const updateData = transformToApiAppointment(draggedEvent, normalizedDate, newTime);
      await api.updateAppointment(draggedEvent.id, updateData);
      
      await fetchAppointments();
      setDraggedEvent(null);
    } catch (err) {
      console.error('Error updating appointment:', err);
      toast.error(getApiErrorMessage(err, 'Erreur lors de la mise à jour du rendez-vous'));
      setDraggedEvent(null);
    }
  };
  
  const handleCreateAppointment = async (appointment: Appointment) => {
    try {
      const conflict = findLocalScheduleConflict(appointments, {
        employeeId: appointment.employeeId,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration,
        status: appointment.status,
      });
      if (conflict) {
        toast.error('Ce collaborateur a déjà un rendez-vous sur ce créneau.');
        return;
      }

      const createData = transformToApiAppointment(appointment, appointment.date, appointment.time);
      await api.createAppointment(createData);
      
      await fetchAppointments();
      setShowNewRDV(false);
    } catch (err) {
      console.error('Error creating appointment:', err);
      toast.error(getApiErrorMessage(err, 'Erreur lors de la création du rendez-vous'));
    }
  };
  
  const handleUpdateAppointmentStatus = async (
    appointmentOrId: Appointment | string,
    newStatus: string
  ) => {
    const appointment =
      typeof appointmentOrId === 'string'
        ? appointments.find((a) => a.id === appointmentOrId) || null
        : appointmentOrId;
    const appointmentId = typeof appointmentOrId === 'string' ? appointmentOrId : appointmentOrId.id;

    // Terminé → ask caisse first
    if (newStatus === 'completed' && appointment) {
      setFinalizeModal({
        appointment,
        paymentMethod: 'CASH',
        loading: false,
      });
      return;
    }

    try {
      const statusMap: Record<string, string> = {
        'pending': 'PENDING',
        'confirmed': 'CONFIRMED',
        'in_progress': 'IN_PROGRESS',
        'completed': 'COMPLETED',
        'cancelled': 'CANCELLED',
        'no_show': 'NO_SHOW'
      };
      
      const statusLabels: Record<string, string> = {
        'pending': 'En attente',
        'confirmed': 'Confirmé',
        'in_progress': 'En cours',
        'completed': 'Terminé',
        'cancelled': 'Annulé',
        'no_show': 'Absent'
      };
      
      await api.updateAppointment(appointmentId, {
        status: statusMap[newStatus] || 'CONFIRMED'
      });
      
      await fetchAppointments();
      toast.success(`Rendez-vous ${statusLabels[newStatus] || 'confirmé'} avec succès`);
    } catch (err) {
      console.error('Error updating appointment status:', err);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const closeFinalizeModal = () => {
    if (finalizeModal?.loading) return;
    setFinalizeModal(null);
  };

  const markAppointmentCompleted = async (appointmentId: string) => {
    await api.updateAppointment(appointmentId, { status: 'COMPLETED' });
    await fetchAppointments();
  };

  const handleFinalizeWithCaisse = async () => {
    if (!finalizeModal) return;
    const apt = finalizeModal.appointment;

    if (!apt.clientId) {
      toast.error('Client manquant — marquage terminé sans caisse');
      setFinalizeModal({ ...finalizeModal, loading: true });
      try {
        await markAppointmentCompleted(apt.id);
        toast.success('Rendez-vous terminé (sans caisse)');
        setFinalizeModal(null);
        setShowDetailsModal(false);
        setSelectedAppointment(null);
      } catch (err) {
        console.error(err);
        toast.error('Erreur lors de la mise à jour du statut');
        setFinalizeModal((prev) => (prev ? { ...prev, loading: false } : null));
      }
      return;
    }

    const servicesForSale = (apt.services && apt.services.length > 0 ? apt.services : apt.serviceId ? [{ serviceId: apt.serviceId, name: apt.service, duration: apt.duration, price: apt.servicePrice ?? 0, sortOrder: 0 }] : []);
    if (servicesForSale.length === 0) {
      toast.error('Service manquant — impossible d’ajouter à la caisse');
      return;
    }

    const items = servicesForSale
      .map((service) => ({
        serviceId: service.serviceId || '',
        price: service.price > 0 ? service.price : undefined,
        quantity: 1,
      }))
      .filter((item) => item.serviceId && item.price !== undefined);

    if (items.length === 0) {
      toast.error('Prix du service manquant. Mettez à jour le catalogue ou encaissez depuis la Caisse.');
      return;
    }

    setFinalizeModal({ ...finalizeModal, loading: true });
    try {
      await api.createSale({
        clientId: apt.clientId,
        items,
        paymentMethod: finalizeModal.paymentMethod,
        notes: servicesForSale.map((service) => service.name).join(', '),
        appointmentId: apt.id,
        ...(apt.tenantId ? { tenantId: apt.tenantId } : {}),
      });
      await markAppointmentCompleted(apt.id);
      toast.success('Rendez-vous terminé et ajouté à la caisse');
      setFinalizeModal(null);
      setShowDetailsModal(false);
      setSelectedAppointment(null);
    } catch (err: any) {
      console.error('Error finalize with caisse:', err);
      toast.error(getApiErrorMessage(err, 'Erreur lors de l’encaissement'));
      setFinalizeModal((prev) => (prev ? { ...prev, loading: false } : null));
    }
  };

  const handleFinalizeWithoutCaisse = async () => {
    if (!finalizeModal) return;
    setFinalizeModal({ ...finalizeModal, loading: true });
    try {
      await markAppointmentCompleted(finalizeModal.appointment.id);
      toast.success('Rendez-vous terminé');
      setFinalizeModal(null);
      setShowDetailsModal(false);
      setSelectedAppointment(null);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour du statut');
      setFinalizeModal((prev) => (prev ? { ...prev, loading: false } : null));
    }
  };

  const handleShowDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };


  if (!mounted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 h-12 rounded-xl w-1/3"></div>
          <div className="bg-gray-200 h-96 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="min-h-screen p-0 md:p-0">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
      `}</style>

      {/* Header - Ultra Minimalist Premium */}
      <div className="mb-8 animate-slideDown relative">
        {/* Header Image Background */}
        {headerImage && (
          <div className="absolute inset-0 -z-10 overflow-hidden rounded-lg" style={{ height: '100%', minHeight: '120px' }}>
            <img 
              src={headerImage} 
              alt="Header" 
              className="w-full h-full object-cover opacity-10"
              onError={(e) => {
                console.error('[Header Image] Error loading header image:', headerImage);
                console.error('[Header Image] Image element:', e.currentTarget);
                // Don't clear immediately - might be a temporary loading issue
                // Only clear if it's definitely a 404 or access issue
                const img = e.currentTarget;
                setTimeout(() => {
                  // Check if image still can't load after a moment
                  if (img.complete && img.naturalWidth === 0) {
                    console.warn('[Header Image] Image failed to load, but keeping state for retry');
                    // Don't clear - let user retry or check URL
                  }
                }, 1000);
              }}
              onLoad={() => {
                console.log('[Header Image] Image loaded successfully:', headerImage);
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-white"></div>
          </div>
        )}
        
        <div className="flex items-center justify-between relative z-10">
          {/* Left: Date & Time */}
          <div className="flex items-center gap-8">
            {/* Date Block */}
            <div className="flex items-baseline gap-3">
              <h1 className="text-5xl font-light text-gray-900 tracking-tight">
                {currentDate.getDate().toString().padStart(2, '0')}
              </h1>
              <div className="flex flex-col justify-center">
                <span className="text-sm font-medium text-gray-900">
                  {currentDate.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
                </span>
                <span className="text-xs text-gray-400">
                  {currentDate.getFullYear()}
                </span>
              </div>
              <div className="h-12 w-px bg-gray-200 mx-2"></div>
              <div className="flex flex-col justify-center">
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {currentDate.toLocaleDateString('fr-FR', { weekday: 'long' })}
                </span>
                <span className="text-xs text-gray-400">
                  Semaine {Math.ceil((currentDate.getDate() + new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()) / 7)}
                </span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Aujourd&apos;hui
              </button>
              <button
                onClick={() => navigateDate(-1)}
                className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => navigateDate(1)}
                className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-6">
            {/* Selected Employee Indicator */}
            {selectedEmployee !== 'all' && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: getSelectedEmployeeColor() || '#3B82F6' }}
                  ></div>
                  <span className="text-xs font-medium text-gray-700">
                    {selectedEmployee}
                  </span>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
              </>
            )}
            
            {/* Live Time */}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-light text-gray-900 tabular-nums tracking-tight">
                {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-xs text-gray-400 tabular-nums">
                :{currentTime.toLocaleTimeString('fr-FR', { second: '2-digit' })}
              </span>
            </div>

            <div className="h-8 w-px bg-gray-200"></div>

            {/* View Toggle */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setView('day')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === 'day'
                    ? 'text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Jour
              </button>
              <span className="text-gray-300">/</span>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === 'week'
                    ? 'text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Semaine
              </button>
              <span className="text-gray-300">/</span>
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === 'month'
                    ? 'text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Mois
              </button>
            </div>

            <div className="h-8 w-px bg-gray-200"></div>

            {/* CTA */}
            <button
              onClick={() => {
                setNewRdvInitialDate(new Date());
                setNewRdvInitialTime('');
                setShowNewRDV(true);
              }}
              className="px-5 py-2 bg-[#002366] text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
            >
              Nouveau
              <Plus size={16} className="inline-block ml-2 -mt-0.5" />
            </button>

            {/* Header Image Upload (Admin and Staff only) */}
            {canUploadHeaderImage && (
              <>
                <div className="h-8 w-px bg-gray-200"></div>
                <label className="relative inline-block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        console.log('[Header Upload] File selected:', file.name, file.size, file.type);
                        setUploadingHeaderImage(true);
                        try {
                          console.log('[Header Upload] Starting upload...');
                          const result = await api.uploadHeaderImage(file);
                          console.log('[Header Upload] Upload response:', result);
                          
                          // Use the API endpoint to serve the image file (avoids CORS issues)
                          // This goes through Next.js proxy to /api/tenant/header-image-file
                          // Include tenantId as query parameter for authentication
                          const tenantId = user?.tenantId;
                          
                          // SECURITY: Prevent using 'default' as tenantId (data isolation issue)
                          if (tenantId === 'default') {
                            console.error('[Header Upload] SECURITY WARNING: User has tenantId="default". This breaks data isolation. Please log out and log back in, or contact support.');
                            toast.error('Erreur de sécurité: Votre compte nécessite une mise à jour. Veuillez vous déconnecter et vous reconnecter.');
                            return;
                          }
                          
                          const imageUrl = tenantId 
                            ? `/api/tenant/header-image-file?tenantId=${tenantId}`
                            : '/api/tenant/header-image-file';
                          console.log('[Header Upload] Using API endpoint to serve image:', imageUrl);
                          setHeaderImage(imageUrl);
                          console.log('[Header Upload] Header image uploaded successfully:', imageUrl);
                          
                          // Verify the image URL is accessible
                          const testImg = new Image();
                          testImg.onload = () => {
                            console.log('[Header Upload] ✓ Image verified and accessible at:', imageUrl);
                          };
                          testImg.onerror = () => {
                            console.error('[Header Upload] ✗ Image NOT accessible at:', imageUrl);
                            console.error('[Header Upload] Check if the URL is correct and the file exists on the server');
                          };
                          testImg.src = imageUrl;
                        } catch (err: any) {
                          console.error('[Header Upload] Error uploading header image:', err);
                          console.error('[Header Upload] Error details:', {
                            message: err.message,
                            status: err.status,
                            stack: err.stack
                          });
                          toast.error(err.message || 'Erreur lors de l\'upload de l\'image');
                        } finally {
                          setUploadingHeaderImage(false);
                          // Reset input
                          e.target.value = '';
                        }
                      } else {
                        console.warn('[Header Upload] No file selected');
                      }
                    }}
                    disabled={uploadingHeaderImage}
                  />
                  <div
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
                      uploadingHeaderImage
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
                    }`}
                    title="Changer l'image d'en-tête"
                  >
                    {uploadingHeaderImage ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Upload...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon size={16} />
                        <span>Image</span>
                      </>
                    )}
                  </div>
                </label>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Views */}
      <div key={refreshKey} className="overflow-hidden animate-fadeIn">
        {view === 'week' && (
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-100 shadow-sm">
            <div className="min-w-[1000px]">
              {/* Header */}
              <div className="grid grid-cols-8 border-b border-gray-100">
                <div className="p-4 border-r border-gray-100"></div>
                {getWeekDays().map((date, i) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <div key={i} className="p-4 text-center border-r border-gray-100 last:border-r-0">
                      <div className={`text-xs font-medium uppercase tracking-wider mb-2 ${isToday ? 'text-gray-900' : 'text-gray-400'}`}>
                        {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </div>
                      <div className={`text-xl font-light ${
                        isToday 
                          ? 'w-8 h-8 mx-auto rounded-full bg-[#002366] text-white flex items-center justify-center' 
                          : 'text-gray-900'
                      }`}>
                        {date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time slots */}
              {timeSlots.map((time) => (
                <div key={time} className="grid grid-cols-8 border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                  <div className="p-3 border-r border-gray-100 text-xs font-light text-gray-400">
                    {time}
                  </div>
                  {getWeekDays().map((date, i) => {
                    const cellStyle = getCalendarCellStyle();
                    return (
                    <div
                      key={i}
                      className={`p-2 border-r border-gray-100 last:border-r-0 min-h-20 relative group/cell ${
                        selectedEmployee !== 'all' && cellStyle.backgroundColor ? 'transition-colors' : ''
                      }`}
                      style={cellStyle}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, time, date)}
                    >
                      <button
                        onClick={() => {
                          setNewRdvInitialDate(date);
                          setNewRdvInitialTime(time);
                          setShowNewRDV(true);
                        }}
                        className="absolute bottom-1 right-1 w-5 h-5 rounded-md bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-all z-10"
                      >
                        <Plus size={12} />
                      </button>
                      {getFilteredAppointments()
                        .filter(apt => {
                          // Normalize both dates for comparison
                          const aptDate = new Date(apt.date);
                          aptDate.setHours(0, 0, 0, 0);
                          const compareDate = new Date(date);
                          compareDate.setHours(0, 0, 0, 0);
                          
                          const matches = aptDate.getTime() === compareDate.getTime() && 
                            apt.time === time &&
                            (filterStatus === 'all' || apt.status === filterStatus);
                          
                          // Debug logging for this specific time slot
                          if (time === '09:00' && date.getDate() === 11) {
                            console.log(`Week filter - ${time} on ${date.getDate()}:`, {
                              aptName: apt.clientName,
                              aptTime: apt.time,
                              aptDate: aptDate.getTime(),
                              compareDate: compareDate.getTime(),
                              matches
                            });
                          }
                          
                          return matches;
                        })
                        .map(apt => {
                          const employeeColor = employeeAgendas.find(e => e.name === apt.employee)?.color;
                          const serviceColor = services.find(s => s.name === apt.service)?.color;
                          return (
                          <AppointmentCard 
                            key={apt.id} 
                            apt={apt} 
                            isCompact 
                            onDragStart={handleDragStart}
                            onStatusUpdate={handleUpdateAppointmentStatus}
                            onShowDetails={handleShowDetails}
                            employeeColor={employeeColor}
                            serviceColor={serviceColor}
                            showColorInRDV={displaySettings.showColorInRDV}
                            displayFields={displaySettings.fields}
                          />
                          );
                        })
                      }
                    </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'day' && (
          <div className="p-0">
            <div className="space-y-1">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="grid bg-white grid-cols-12 gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50/50 transition-colors group/time relative"
                  style={getCalendarCellStyle()}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, time, currentDate)}
                >
                  <button
                    onClick={() => {
                      setNewRdvInitialDate(currentDate);
                      setNewRdvInitialTime(time);
                      setShowNewRDV(true);
                    }}
                    className="absolute right-3 top-3 w-6 h-6 rounded-md bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 flex items-center justify-center opacity-0 group-hover/time:opacity-100 transition-all z-10"
                  >
                    <Plus size={14} />
                  </button>
                  <div className="col-span-2 text-xs font-light text-gray-400">
                    {time}
                  </div>
                  <div className="col-span-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {getFilteredAppointments()
                      .filter(apt => {
                        // Normalize both dates for comparison
                        const aptDate = new Date(apt.date);
                        aptDate.setHours(0, 0, 0, 0);
                        const compareDate = new Date(currentDate);
                        compareDate.setHours(0, 0, 0, 0);
                        
                        const matches = aptDate.getTime() === compareDate.getTime() && 
                          apt.time === time &&
                          (filterStatus === 'all' || apt.status === filterStatus);
                        
                        // Debug logging
                        if (time === '09:00') {
                          console.log(`Day filter - ${time}:`, {
                            aptName: apt.clientName,
                            aptTime: apt.time,
                            aptDate: aptDate.getTime(),
                            compareDate: compareDate.getTime(),
                            currentDate: currentDate.toString(),
                            matches
                          });
                        }
                        
                        return matches;
                      })
                      .map(apt => {
                        const employeeColor = employeeAgendas.find(e => e.name === apt.employee)?.color;
                        const serviceColor = services.find(s => s.name === apt.service)?.color;
                        return (
                          <AppointmentCard 
                            key={apt.id} 
                            apt={apt}
                            onDragStart={handleDragStart}
                            onStatusUpdate={handleUpdateAppointmentStatus}
                            onShowDetails={handleShowDetails}
                            employeeColor={employeeColor}
                            serviceColor={serviceColor}
                            showColorInRDV={displaySettings.showColorInRDV}
                            displayFields={displaySettings.fields}
                          />
                        );
                      })
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'month' && (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
            {/* Month Header */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider py-4 border-r border-gray-100 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {getMonthDays().map((date, i) => {
                if (!date) return (
                  <div 
                    key={i} 
                    className="min-h-[140px] bg-gray-50/30 border-r border-b border-gray-100"
                  ></div>
                );
                const isToday = date.toDateString() === new Date().toDateString();
                const dayAppointments = getFilteredAppointments().filter(apt => {
                  // Normalize both dates for comparison
                  const aptDate = new Date(apt.date);
                  aptDate.setHours(0, 0, 0, 0);
                  const compareDate = new Date(date);
                  compareDate.setHours(0, 0, 0, 0);
                  return aptDate.getTime() === compareDate.getTime() &&
                    (filterStatus === 'all' || apt.status === filterStatus);
                });
                const confirmedCount = dayAppointments.filter(apt => apt.status === 'confirmed').length;
                const pendingCount = dayAppointments.filter(apt => apt.status === 'pending').length;
                const cancelledCount = dayAppointments.filter(apt => apt.status === 'cancelled').length;
                const cellStyle = getCalendarCellStyle();
                // Blend employee color with today's background if applicable
                const finalStyle = isToday && cellStyle.backgroundColor 
                  ? { 
                      ...cellStyle, 
                      backgroundColor: cellStyle.backgroundColor.replace('0.05', '0.08') // Slightly more opaque for today
                    }
                  : cellStyle;
                return (
                  <div
                    key={i}
                    className={`min-h-[140px] border-r border-b border-gray-100 p-2 hover:bg-gray-50/50 transition-all group/date relative ${
                      isToday && !cellStyle.backgroundColor ? 'bg-gray-50/50' : ''
                    }`}
                    style={finalStyle}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, dayAppointments.length > 0 ? dayAppointments[0].time : '09:00', date)}
                  >
                    <button
                      onClick={() => {
                        setNewRdvInitialDate(date);
                        setNewRdvInitialTime('');
                        setShowNewRDV(true);
                      }}
                      className="absolute bottom-2 right-2 w-5 h-5 rounded-md bg-white border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300 flex items-center justify-center opacity-0 group-hover/date:opacity-100 transition-all z-20 shadow-sm"
                    >
                      <Plus size={12} />
                    </button>
                    {/* Date Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-sm font-light ${
                        isToday 
                          ? 'w-6 h-6 rounded-full bg-[#002366] text-white flex items-center justify-center text-xs font-medium' 
                          : 'text-gray-600'
                      }`}>
                        {date.getDate()}
                      </div>
                      {dayAppointments.length > 0 && (
                        <div className="flex items-center gap-0.5">
                          <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                          <span className="text-[10px] font-medium text-gray-400">
                            {dayAppointments.length}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Appointments - use AppointmentCard for color logic */}
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map(apt => {
                        const employeeColor = employeeAgendas.find(e => e.name === apt.employee)?.color;
                        const serviceColor = services.find(s => s.name === apt.service)?.color;
                        return (
                          <AppointmentCard 
                            key={apt.id} 
                            apt={apt} 
                            isCompact 
                            onDragStart={handleDragStart}
                            onStatusUpdate={handleUpdateAppointmentStatus}
                            onShowDetails={handleShowDetails}
                            employeeColor={employeeColor}
                            serviceColor={serviceColor}
                            showColorInRDV={displaySettings.showColorInRDV}
                            displayFields={displaySettings.fields}
                          />
                        );
                      })}
                      {/* More indicator */}
                      {dayAppointments.length > 3 && (
                        <div className="text-[10px] text-gray-500 font-medium px-1.5 py-1 hover:text-gray-900 transition-colors">
                          +{dayAppointments.length - 3} autre{dayAppointments.length - 3 > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    {/* Status Summary (on hover) */}
                    {dayAppointments.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2 text-[9px] font-medium">
                          {confirmedCount > 0 && (
                            <div className="flex items-center gap-1 text-emerald-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                              <span>{confirmedCount}</span>
                            </div>
                          )}
                          {pendingCount > 0 && (
                            <div className="flex items-center gap-1 text-amber-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                              <span>{pendingCount}</span>
                            </div>
                          )}
                          {cancelledCount > 0 && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                              <span>{cancelledCount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showNewRDV && (
        <NewAppointmentModal 
          onClose={() => setShowNewRDV(false)} 
          onCreateAppointment={handleCreateAppointment}
          employeesData={employeesData}
          initialDate={newRdvInitialDate}
          initialTime={newRdvInitialTime}
        />
      )}

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 z-40 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Détails du rendez-vous</h2>
              <button 
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedAppointment(null);
                }} 
                className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-6 space-y-6">
              {/* Client Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Client</h3>
                <div className="space-y-2">
                  <p className="text-base font-medium text-gray-900">{selectedAppointment.clientName}</p>
                  {selectedAppointment.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={16} />
                      <a href={`tel:${selectedAppointment.phone}`} className="hover:text-gray-900">{selectedAppointment.phone}</a>
                    </div>
                  )}
                  {selectedAppointment.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={16} />
                      <a href={`mailto:${selectedAppointment.email}`} className="hover:text-gray-900">{selectedAppointment.email}</a>
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Rendez-vous</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} />
                    <span>{format(selectedAppointment.date, "EEEE d MMMM yyyy", { locale: fr })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>{selectedAppointment.time} · {selectedAppointment.duration} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={16} />
                    <span>{selectedAppointment.employee || 'Non assigné'}</span>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Services</h3>
                <div className="space-y-2">
                  {(selectedAppointment.services && selectedAppointment.services.length > 0 ? selectedAppointment.services : [{ name: selectedAppointment.service, duration: selectedAppointment.duration, price: selectedAppointment.totalPrice ?? selectedAppointment.servicePrice ?? 0, sortOrder: 0 }]).map((service, index) => (
                    <div key={`${service.name}-${index}`} className="flex items-start justify-between rounded-lg border border-gray-100 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{service.name}</p>
                        <p className="text-xs text-gray-500">{service.duration} min</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{service.price} MAD</p>
                    </div>
                  ))}
                </div>
                {(selectedAppointment.totalDuration || selectedAppointment.totalPrice) && (
                  <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <span>Durée totale</span>
                      <span>{selectedAppointment.totalDuration ?? selectedAppointment.duration} min</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span>Prix total</span>
                      <span>{selectedAppointment.totalPrice ?? selectedAppointment.servicePrice ?? 0} MAD</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Statut</h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  selectedAppointment.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                  selectedAppointment.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                  selectedAppointment.status === 'cancelled' ? 'bg-gray-50 text-gray-500' :
                  selectedAppointment.status === 'completed' ? 'bg-blue-50 text-blue-700' :
                  'bg-gray-50 text-gray-900'
                }`}>
                  {selectedAppointment.status === 'confirmed' ? 'Confirmé' :
                   selectedAppointment.status === 'pending' ? 'En attente' :
                   selectedAppointment.status === 'cancelled' ? 'Annulé' :
                   selectedAppointment.status === 'completed' ? 'Terminé' :
                   selectedAppointment.status === 'in_progress' ? 'En cours' :
                   selectedAppointment.status === 'no_show' ? 'Absent' :
                   selectedAppointment.status}
                </span>
              </div>

              {/* Notes */}
              {selectedAppointment.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Notes</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex flex-wrap gap-3">
              <button 
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedAppointment(null);
                }} 
                className="flex-1 min-w-[100px] px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-full border border-gray-200 hover:border-gray-300"
              >
                Fermer
              </button>
              {canConfirmStatus(selectedAppointment.status) && (
                <button 
                  onClick={async () => {
                    await handleUpdateAppointmentStatus(selectedAppointment, 'confirmed');
                    setShowDetailsModal(false);
                    setSelectedAppointment(null);
                  }} 
                  className="flex-1 min-w-[100px] px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition-colors"
                >
                  Confirmer
                </button>
              )}
              {canMarkAbsentOrDone(selectedAppointment.status) && (
                <>
                  <button
                    onClick={() => {
                      handleUpdateAppointmentStatus(selectedAppointment, 'completed');
                    }}
                    className="flex-1 min-w-[100px] px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Terminé
                  </button>
                  <button
                    onClick={async () => {
                      await handleUpdateAppointmentStatus(selectedAppointment, 'no_show');
                      setShowDetailsModal(false);
                      setSelectedAppointment(null);
                    }}
                    className="flex-1 min-w-[100px] px-6 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 transition-colors"
                  >
                    Absent
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Finaliser RDV → Caisse */}
      {finalizeModal && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4"
          onClick={closeFinalizeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Finaliser le rendez-vous</h2>
              <p className="text-sm text-gray-600 mt-1">
                Voulez-vous ajouter cette prestation à la caisse ?
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {finalizeModal.appointment.clientName} · {finalizeModal.appointment.services && finalizeModal.appointment.services.length > 1
                  ? `${finalizeModal.appointment.services.length} services • ${finalizeModal.appointment.duration} min`
                  : finalizeModal.appointment.service}
                {finalizeModal.appointment.totalPrice
                  ? ` · ${finalizeModal.appointment.totalPrice} MAD`
                  : ''}
              </p>
            </div>
            <div className="px-6 py-4">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Mode de paiement
              </label>
              <select
                value={finalizeModal.paymentMethod}
                disabled={finalizeModal.loading}
                onChange={(e) =>
                  setFinalizeModal((prev) =>
                    prev
                      ? { ...prev, paymentMethod: e.target.value as FinalizePaymentMethod }
                      : null
                  )
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(Object.keys(PAYMENT_METHOD_LABELS) as FinalizePaymentMethod[]).map((key) => (
                  <option key={key} value={key}>
                    {PAYMENT_METHOD_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-2">
              <button
                type="button"
                disabled={finalizeModal.loading}
                onClick={handleFinalizeWithCaisse}
                className="w-full px-4 py-2.5 rounded-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {finalizeModal.loading ? 'Traitement…' : 'Ajouter à la caisse'}
              </button>
              <button
                type="button"
                disabled={finalizeModal.loading}
                onClick={handleFinalizeWithoutCaisse}
                className="w-full px-4 py-2.5 rounded-full text-sm font-medium text-gray-800 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Terminé sans caisse
              </button>
              <button
                type="button"
                disabled={finalizeModal.loading}
                onClick={closeFinalizeModal}
                className="w-full px-4 py-2.5 rounded-full text-sm font-medium text-gray-500 hover:text-gray-800 disabled:opacity-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RendezVousPage;