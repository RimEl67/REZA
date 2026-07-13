import { X, Check, ArrowRight, CreditCard, Store, Lock, Plus } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Receipt from './Receipt';
import Loading from './Loading';
import GroupParticipantsSection, { GuestParticipant, FamilyMemberOption } from './GroupParticipantsSection';
import AddServiceModal from './AddServiceModal';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { getMoroccoToday, getMoroccoDate, isMoroccoToday, isMoroccoPast, formatMoroccoDate, formatMoroccoTime, formatMoroccoDateTime, createDateFromMoroccoDateTime } from '../../lib/utils';
import {
  clearBookingForProche,
  peekBookingForProche,
} from '../../lib/bookingForProche';

type Service = {
  id?: string;
  name: string;
  duration: string;
  price?: number;
  priceType?: string;
};

type TeamMember = { 
  name: string; 
  initials: string; 
  specialty: string;
};

type BookingData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  notes: string;
  totalPrice: number;
  totalDuration: string;
  paymentMethod?: 'establishment' | 'card';
  cardNumber?: string;
  cardName?: string;
  cardExpiry?: string;
  cardCVV?: string;
};

type BookingModalProps = {
  show: boolean;
  onClose: () => void;
  bookingStep: number;
  setBookingStep: (step: number) => void;
  selectedServices: Service[];
  getTotalDuration: () => string;
  getTotalPrice: () => number;
  bookingData: BookingData;
  setBookingData: (data: BookingData | ((prev: BookingData) => BookingData)) => void;
  timeSlots: string[];
  setSelectedServices: (services: Service[]) => void;
  onAddService?: () => void;
  onSlotServiceIdsChange?: (serviceIds: string[]) => void;
  salonServices: { category: string; items: Service[]; description?: string }[];
  salonId?: string;
  slotsLoading?: boolean;
  slotsError?: string | null;
  lastUpdated?: Date | null;
  /** @deprecated employee selection removed */
  salonTeam?: TeamMember[];
  selectedTeamMember?: TeamMember | null;
  setSelectedTeamMember?: (member: TeamMember | null) => void;
};

// Utility to sum durations
function sumDurations(services: Service[]): string {
  let totalMinutes = 0;
  services.forEach(service => {
    const duration = service.duration.trim();
    let min = 0;
    const hMatch = duration.match(/(\d+)\s*h/);
    const mMatch = duration.match(/(\d+)\s*min/);
    if (hMatch) min += parseInt(hMatch[1], 10) * 60;
    if (mMatch) min += parseInt(mMatch[1], 10);
    if (!hMatch && !mMatch && /^\d+$/.test(duration)) min += parseInt(duration, 10);
    totalMinutes += min;
  });
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return `${hours}h ${minutes} min`;
  if (hours) return `${hours}h`;
  return `${minutes} min`;
}

// Format card number with spaces
const formatCardNumber = (value: string) => {
  const cleaned = value.replace(/\s/g, '');
  const chunks = cleaned.match(/.{1,4}/g);
  return chunks ? chunks.join(' ') : cleaned;
};

// Format expiry date
const formatExpiry = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
  }
  return cleaned;
};

const BookingModal: React.FC<BookingModalProps> = ({
  show,
  onClose,
  bookingStep,
  setBookingStep,
  selectedServices,
  getTotalDuration,
  getTotalPrice,
  bookingData,
  setBookingData,
  timeSlots,
  setSelectedServices,
  onAddService,
  onSlotServiceIdsChange,
  salonServices,
  salonId,
  slotsLoading = false,
  slotsError = null,
  lastUpdated = null,
}) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(getMoroccoToday());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [groupParticipants, setGroupParticipants] = useState<GuestParticipant[]>([]);
  const [includeBooker, setIncludeBooker] = useState(true);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberOption[]>([]);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [receiptSummary, setReceiptSummary] = useState<{
    participants: { name: string; services: Service[]; subtotal: number }[];
    grandTotal: number;
  } | null>(null);
  // Add state for salon data
  const [salonData, setSalonData] = useState<{
    name?: string;
    address?: string;
    city?: string;
    phone?: string;
    ice?: string;
    rc?: string;
    if?: string;
  } | null>(null);
  
  // Add state for client profile data (to check if step 3 should be shown)
  const [clientProfileData, setClientProfileData] = useState<{
    phone?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null>(null);
  
  // Fetch client profile data when modal opens (if authenticated)
  useEffect(() => {
    const fetchClientData = async () => {
      if (isAuthenticated && user?.email && show) {
        try {
          const response = await api.getClientAppointments(user.email, undefined, 1);
          if (response.client) {
            setClientProfileData({
              phone: response.client.phone || '',
              firstName: response.client.firstName || '',
              lastName: response.client.lastName || '',
              email: response.client.email || ''
            });
          }
        } catch (error) {
          console.error('Error fetching client data:', error);
          // Fallback to context user data
          setClientProfileData({
            phone: user.phone || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || ''
          });
        }
      }
    };
    
    fetchClientData();
  }, [isAuthenticated, user?.email, show]);

  // "Réserver pour [proche]" — keep intent until modal closes (Strict Mode safe)
  useEffect(() => {
    if (!show) return;
    const pending = peekBookingForProche();
    if (!pending?.id) return;

    const displayName =
      pending.name.trim() ||
      [pending.firstName, pending.lastName].filter(Boolean).join(' ').trim();
    setIncludeBooker(false);
    setGroupParticipants([
      {
        id: `family-${pending.id}`,
        familyMemberId: pending.id,
        name: displayName,
        sameServicesAsBooker: true,
        serviceIds: [],
      },
    ]);
  }, [show]);

  // Load Mes proches when logged-in client opens booking modal
  useEffect(() => {
    if (!show) return;
    if (!isAuthenticated || !user?.email) {
      setFamilyMembers([]);
      setFamilyLoading(false);
      return;
    }

    let cancelled = false;
    const loadFamily = async () => {
      setFamilyLoading(true);
      try {
        const familyRes = await api.getClientFamilyMembers(user.email);
        if (cancelled) return;
        const formatted: FamilyMemberOption[] = (familyRes.familyMembers || []).map(
          (member: any) => ({
            id: member.id,
            name: `${member.firstName || ''} ${member.lastName || ''}`.trim(),
            firstName: member.firstName,
            lastName: member.lastName,
            relationship: member.relationship,
          })
        );
        setFamilyMembers(formatted);
      } catch (err) {
        console.error('Error fetching family members for booking:', err);
        if (!cancelled) setFamilyMembers([]);
      } finally {
        if (!cancelled) setFamilyLoading(false);
      }
    };

    loadFamily();
    return () => {
      cancelled = true;
    };
  }, [show, isAuthenticated, user?.email]);

  // Reset people selection when modal closes
  useEffect(() => {
    if (!show) {
      clearBookingForProche();
      setGroupParticipants([]);
      setIncludeBooker(true);
    }
  }, [show]);
  
  // Calculate total steps (3 if authenticated and not booking for someone else, 4 otherwise)
  // Check if user has all required info (phone is required)
  // Use clientProfileData if available, otherwise fallback to user from context
  const effectivePhone = clientProfileData?.phone || user?.phone || '';
  const userHasAllInfo = isAuthenticated && effectivePhone && effectivePhone.trim() !== '';
  const shouldShowStep3 = !isAuthenticated || !userHasAllInfo;
  const visibleSteps = shouldShowStep3 ? [1, 2, 3, 4] : [1, 2, 4];
  const totalSteps = visibleSteps.length;

  const flatServices = salonServices.flatMap((c) => c.items);
  const getServicesTotal = (ids: string[]) =>
    flatServices
      .filter((s) => ids.includes((s.id || s.name) as string))
      .reduce((sum, s) => sum + (s.price || 0), 0);

  const getGroupGrandTotal = () => {
    const bookerTotal = getTotalPrice();
    const guestsTotal = groupParticipants.reduce((sum, p) => {
      if (p.sameServicesAsBooker) return sum + bookerTotal;
      return sum + getServicesTotal(p.serviceIds);
    }, 0);
    return (includeBooker ? bookerTotal : 0) + guestsTotal;
  };

  const displayStep = Math.max(1, visibleSteps.indexOf(bookingStep) + 1);

  useEffect(() => {
    const bookerIds = selectedServices.map((s) => s.id).filter(Boolean) as string[];
    const extraIds = groupParticipants.flatMap((p) =>
      p.sameServicesAsBooker ? bookerIds : p.serviceIds
    );
    onSlotServiceIdsChange?.([...new Set([...bookerIds, ...extraIds])]);
  }, [selectedServices, groupParticipants, onSlotServiceIdsChange]);

  // Add state to force re-filter every minute when date is today
  const [filterUpdateKey, setFilterUpdateKey] = useState(0);
  
  React.useEffect(() => {
    // Only set up interval if a date is selected (could be today)
    if (!bookingData.date) return;
    
    const interval = setInterval(() => {
      // Force re-filter by updating state
      setFilterUpdateKey(prev => prev + 1);
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [bookingData.date]);

  // Fetch salon data dynamically
  React.useEffect(() => {
    if (!salonId) return;
    
    const fetchSalonData = async () => {
      try {
        const tenantRes = await api.getTenant(salonId);
        const tenant = tenantRes.tenant;
        
        setSalonData({
          name: tenant?.name,
          address: tenant?.address,
          city: tenant?.city,
          phone: tenant?.phone,
          ice: tenant?.ice || tenant?.settings?.ice,
          rc: tenant?.rc || tenant?.settings?.rc,
          if: tenant?.if || tenant?.settings?.if || tenant?.fiscalId || tenant?.settings?.fiscalId,
        });
      } catch (error) {
        console.error('Error fetching salon data:', error);
        // Keep null state if fetch fails, Receipt will use fallback values
      }
    };
    
    fetchSalonData();
  }, [salonId]);

  // Filter out past time slots if the selected date is today
  // Use getMoroccoDate() directly to get current time each render for accurate filtering
  const filteredTimeSlots = React.useMemo(() => {
    if (!bookingData.date) return timeSlots;
    
    // Check if selected date is today (in Morocco timezone)
    // Parse date string (YYYY-MM-DD format)
    const dateParts = bookingData.date.split('-');
    if (dateParts.length !== 3) return timeSlots;
    
    const selectedYear = parseInt(dateParts[0], 10);
    const selectedMonth = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
    const selectedDay = parseInt(dateParts[2], 10);
    
    // Validate parsed values
    if (isNaN(selectedYear) || isNaN(selectedMonth) || isNaN(selectedDay)) {
      return timeSlots;
    }
    
    // Get today's date in Morocco timezone
    const today = getMoroccoToday();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    
    // Create a Date object from the selected date components for comparison
    const selectedDateObj = new Date(selectedYear, selectedMonth, selectedDay);
    const todayDateObj = new Date(todayYear, todayMonth, todayDay);
    
    // Compare date components directly (more reliable than timestamp comparison)
    const isToday = selectedYear === todayYear && 
                   selectedMonth === todayMonth && 
                   selectedDay === todayDay;
    
    // Check if selected date is in the past (compare Date objects)
    const isPast = selectedDateObj < todayDateObj;
    
    if (isPast) {
      // If date is in the past, return empty array (no slots should be available)
      return [];
    }
    
    if (!isToday) {
      // If not today and not in the past, it's a future date - return all slots without filtering
      return timeSlots;
    }
    
    // If today, filter out past slots using lastUpdated time or current Morocco time
    // IMPORTANT: lastUpdated represents when slots were fetched from the API
    // We should NOT allow slots before lastUpdated time to be selected
    const now = getMoroccoDate();
    const nowHour = now.getHours();
    const nowMinute = now.getMinutes();
    
    let referenceHour = nowHour;
    let referenceMinute = nowMinute;
    
    if (lastUpdated && lastUpdated instanceof Date && !isNaN(lastUpdated.getTime())) {
      // Convert lastUpdated to Morocco timezone to get the hour and minute in Morocco time
      // Use the same method as getMoroccoDate() to ensure consistency
      try {
        const moroccoTimeString = lastUpdated.toLocaleString("en-US", {
          timeZone: 'Africa/Casablanca',
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        });
        
        // Parse: "MM/DD/YYYY, HH:mm:ss"
        const [datePart, timePart] = moroccoTimeString.split(", ");
        if (timePart) {
          const [hours, minutes] = timePart.split(":").map(Number);
          if (!isNaN(hours) && !isNaN(minutes)) {
            const lastUpdatedHour = hours;
            const lastUpdatedMinute = minutes;
            
            // Always use the maximum between lastUpdated and current time
            // This ensures we don't allow slots before lastUpdated AND don't allow past slots
            // Use >= instead of > to prioritize lastUpdated when times are equal
            if (lastUpdatedHour > nowHour || 
                (lastUpdatedHour === nowHour && lastUpdatedMinute >= nowMinute)) {
              // lastUpdated is later than or equal to now - use lastUpdated as reference
              referenceHour = lastUpdatedHour;
              referenceMinute = lastUpdatedMinute;
            }
            // else: now is strictly later than lastUpdated, so we use now (default)
            // This prevents allowing slots that are in the past relative to current time
          }
        }
      } catch (error) {
        console.error('Error converting lastUpdated to Morocco time:', error);
      }
    }
    
    return timeSlots.filter((timeSlot) => {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return true; // Keep invalid slots (shouldn't happen)
      
      // Compare hours first, then minutes using reference time
      // Reference time is the maximum of (lastUpdated, current time) to ensure:
      // - No slots before lastUpdated (if lastUpdated > now) 
      // - No past slots (if now > lastUpdated)
      const slotTimeInMinutes = hours * 60 + minutes;
      const referenceTimeInMinutes = referenceHour * 60 + referenceMinute;
      
      // Keep slot only if it's strictly after reference time
      return slotTimeInMinutes > referenceTimeInMinutes;
    });
  }, [timeSlots, bookingData.date, lastUpdated, filterUpdateKey]); // Add filterUpdateKey to force re-filter every minute

  // Clear selected time if it's in the past (when date is today)
  React.useEffect(() => {
    if (!bookingData.date || !bookingData.time) return;
    
    // Check if selected date is today by comparing date components
    const dateParts = bookingData.date.split('-');
    if (dateParts.length !== 3) return;
    
    const selectedYear = parseInt(dateParts[0], 10);
    const selectedMonth = parseInt(dateParts[1], 10) - 1;
    const selectedDay = parseInt(dateParts[2], 10);
    
    if (isNaN(selectedYear) || isNaN(selectedMonth) || isNaN(selectedDay)) return;
    
    const today = getMoroccoToday();
    const isToday = selectedYear === today.getFullYear() && 
                   selectedMonth === today.getMonth() && 
                   selectedDay === today.getDate();
    
    if (isToday) {
      // Get reference time (lastUpdated or current time in Morocco timezone) fresh each check
      const now = getMoroccoDate();
      const nowHour = now.getHours();
      const nowMinute = now.getMinutes();
      
      let referenceHour = nowHour;
      let referenceMinute = nowMinute;
      
      if (lastUpdated) {
        // Convert lastUpdated to Morocco timezone to get the hour and minute in Morocco time
        // Use the same method as getMoroccoDate() to ensure consistency
        const moroccoTimeString = lastUpdated.toLocaleString("en-US", {
          timeZone: 'Africa/Casablanca',
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        });
        
        // Parse: "MM/DD/YYYY, HH:mm:ss"
        const [datePart, timePart] = moroccoTimeString.split(", ");
        if (timePart) {
          const [hours, minutes] = timePart.split(":").map(Number);
          const lastUpdatedHour = hours;
          const lastUpdatedMinute = minutes;
          
          // Use the maximum between lastUpdated (in Morocco time) and current time (in Morocco time)
          // Compare hour first, then minute to ensure we don't allow slots before lastUpdated time
          // Use >= instead of > to prioritize lastUpdated when times are equal
          if (lastUpdatedHour > nowHour || 
              (lastUpdatedHour === nowHour && lastUpdatedMinute >= nowMinute)) {
            referenceHour = lastUpdatedHour;
            referenceMinute = lastUpdatedMinute;
          }
        }
      }
      const [selectedHours, selectedMinutes] = bookingData.time.split(':').map(Number);
      
      if (isNaN(selectedHours) || isNaN(selectedMinutes)) return;
      
      // Check if selected time is in the past relative to reference time (lastUpdated or current)
      const isPast = selectedHours < referenceHour || 
                     (selectedHours === referenceHour && selectedMinutes <= referenceMinute);
      
      if (isPast) {
        // Clear the selected time
        setBookingData(prev => ({ ...prev, time: '' }));
      }
    }
  }, [bookingData.date, bookingData.time, lastUpdated, setBookingData]); // Add lastUpdated to re-check when slots update

  const daysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const isDateDisabled = (date: Date) => {
    const today = getMoroccoToday();
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const handleDateSelect = (date: Date) => {
    if (!isDateDisabled(date)) {
      setSelectedDate(date);
      // Format date as YYYY-MM-DD using local timezone (not UTC) to avoid date shifting
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setBookingData({...bookingData, date: formattedDate});
      setErrors({...errors, date: false});
    }
  };

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Synchronize selectedDate with bookingData.date when bookingData.date changes
  useEffect(() => {
    if (bookingData.date) {
      const dateParts = bookingData.date.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(dateParts[2], 10);
        
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          const date = new Date(year, month, day);
          // Only update if the date is different to avoid infinite loops
          setSelectedDate(prevDate => {
            if (!prevDate || !isSameDay(date, prevDate)) {
              return date;
            }
            return prevDate;
          });
          // Also update currentMonth to show the selected date
          setCurrentMonth(new Date(year, month, 1));
        }
      }
    } else {
      // If bookingData.date is cleared, also clear selectedDate
      setSelectedDate(null);
    }
  }, [bookingData.date]);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  useEffect(() => {
    const totalPrice = getGroupGrandTotal();
    const totalDuration = sumDurations(selectedServices);
    setBookingData((prev: BookingData) => ({
      ...prev,
      totalPrice,
      totalDuration,
    }));
  }, [selectedServices, groupParticipants, includeBooker]); // group total when guests / Moi change

  // Pre-fill booking data with user info when modal opens or user logs in
  // Use clientProfileData if available (more up-to-date), otherwise fallback to user from context
  useEffect(() => {
    if (isAuthenticated && show) {
      // Prefer clientProfileData over user context (more up-to-date)
      const sourceData = clientProfileData || user;
      if (!sourceData) return;
      
      // Extract firstName and lastName
      let firstName = sourceData.firstName || '';
      let lastName = sourceData.lastName || '';
      
      // If firstName/lastName are not available, try to parse from user.name
      if (!firstName && !lastName && (user?.name)) {
        const nameParts = user.name.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        } else if (nameParts.length === 1) {
          firstName = nameParts[0];
        }
      }
      
      const email = sourceData.email || user?.email || '';
      const phone = sourceData.phone || user?.phone || '';
      
      setBookingData((prev: BookingData) => ({
        ...prev,
        firstName: prev.firstName || firstName || '',
        lastName: prev.lastName || lastName || '',
        email: prev.email || email || '',
        phone: prev.phone || phone || ''
      }));
    }
  }, [isAuthenticated, user, clientProfileData, show]);

  useEffect(() => {
    // Set default payment method to 'establishment' when entering step 4
    if (bookingStep === 4 && !bookingData.paymentMethod) {
      setBookingData((prev: BookingData) => ({ ...prev, paymentMethod: 'establishment' }));
      // Don't generate reference number here - it will be generated after booking is created
    }
  }, [bookingStep]);

  const validate = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    
    if (bookingStep === 2) {
      if (!bookingData.date) newErrors.date = true;
      if (!bookingData.time) newErrors.time = true;
    }
    
    const shouldSkipStep3 = isAuthenticated && userHasAllInfo;
    if (bookingStep === 3 && shouldShowStep3) {
      if (!(bookingData.firstName || '').trim()) newErrors.firstName = true;
      if (!(bookingData.lastName || '').trim()) newErrors.lastName = true;
      if (!(bookingData.phone || '').trim()) newErrors.phone = true;
      if (
        (bookingData.email || '').trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.email || '')
      ) {
        newErrors.email = true;
      }
    }

    if (bookingStep === 4) {
      if (!bookingData.paymentMethod) newErrors.paymentMethod = true;
      // Card payment is coming soon, so only validate establishment payment
      // No need to validate card fields since card option is disabled
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    setError(null); // Clear any previous errors
    
    // Check if online booking is enabled (this should be passed as a prop, but we'll check via API if needed)
    // For now, we rely on the backend validation
    
    if (bookingStep === 1 && selectedServices.length === 0) return;
    if (bookingStep === 1 && !includeBooker && groupParticipants.length === 0) {
      setError('Sélectionnez au moins une personne (Moi ou un proche / invité).');
      return;
    }
    
    // Determine next step based on authentication status and user info
    // Use clientProfileData if available (more up-to-date), otherwise fallback to user from context
    const effectivePhone = clientProfileData?.phone || user?.phone || '';
    const userHasAllInfo = isAuthenticated && effectivePhone && effectivePhone.trim() !== '';
    const shouldSkipStep3 = isAuthenticated && userHasAllInfo;
    const nextStep = shouldSkipStep3 && bookingStep === 2 ? 4 : bookingStep + 1;
    
    // Validate current step (skip step 3 validation if authenticated and has all info)
    if (bookingStep === 3 && shouldSkipStep3) {
      // Skip validation for step 3 if authenticated and has all info
    } else if ((bookingStep === 2 || bookingStep === 3 || bookingStep === 4) && !validate()) {
      return;
    }

    // If we're already at step 4, submit the booking
    if (bookingStep === 4) {
      // Submit booking to API
      if (!salonId) {
        setErrors({ salonId: true });
        setBookingStep(1); // Go back to first step
        return;
      }

      // Ensure all required fields are present before submission
      // Use clientProfileData if available (more up-to-date), otherwise fallback to user from context
      const effectivePhoneForSubmission = clientProfileData?.phone || user?.phone || '';
      const userHasAllInfo = isAuthenticated && effectivePhoneForSubmission && effectivePhoneForSubmission.trim() !== '';
      const shouldSkipStep3 = isAuthenticated && userHasAllInfo;
      
      // Extract firstName and lastName from user.name if firstName/lastName are not available
      let userFirstName = user?.firstName || '';
      let userLastName = user?.lastName || '';
      
      if (isAuthenticated && user && !userFirstName && !userLastName && user.name) {
        const nameParts = user.name.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          userFirstName = nameParts[0];
          userLastName = nameParts.slice(1).join(' ');
        } else if (nameParts.length === 1) {
          userFirstName = nameParts[0];
        }
      }
      
      const finalFirstName = bookingData.firstName?.trim() || (isAuthenticated && user ? userFirstName : '');
      const finalLastName = bookingData.lastName?.trim() || (isAuthenticated && user ? userLastName : '');
      const finalEmail = bookingData.email?.trim() || (isAuthenticated && user?.email ? user.email : '');
      const finalPhone = bookingData.phone?.trim() || (isAuthenticated && user?.phone ? user.phone : '');

      // Validate required fields
      if (!finalFirstName || !finalLastName || !finalPhone) {
        const missingFields = [];
        if (!finalFirstName) missingFields.push('Prénom');
        if (!finalLastName) missingFields.push('Nom');
        if (!finalPhone) missingFields.push('Téléphone');
        
        setError(`Veuillez remplir tous les champs obligatoires : ${missingFields.join(', ')}`);
        if (shouldShowStep3) {
          setBookingStep(3);
        }
        return;
      }

      if (finalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) {
        setError('Veuillez entrer une adresse email valide');
        return;
      }

      const invalidGuest = groupParticipants.find((p) => !p.name.trim());
      if (invalidGuest) {
        setError('Veuillez indiquer le prénom de chaque personne ajoutée.');
        setBookingStep(1);
        return;
      }

      if (!includeBooker && groupParticipants.length === 0) {
        setError('Sélectionnez au moins une personne (Moi ou un proche / invité).');
        setBookingStep(1);
        return;
      }

      setIsLoading(true);
      try {
        const serviceIds = selectedServices.map(s => s.id).filter(Boolean) as string[];
        if (serviceIds.length === 0) {
          throw new Error('Aucun service sélectionné');
        }

        if (!bookingData.date || !bookingData.time) {
          throw new Error('Veuillez sélectionner une date et une heure');
        }

        // Create date in Morocco timezone and convert to UTC for server
        const startDateTime = createDateFromMoroccoDateTime(bookingData.date, bookingData.time);
        const bookingResponse = await api.createBooking({
          tenantId: salonId,
          firstName: finalFirstName.trim(),
          lastName: finalLastName.trim(),
          email: finalEmail.trim() || undefined,
          phone: finalPhone.trim(),
          serviceIds,
          startTime: startDateTime.toISOString(),
          notes: bookingData.notes,
          includeBooker,
          participants: groupParticipants.map((p) => ({
            name: p.name.trim(),
            sameServicesAsBooker: p.sameServicesAsBooker,
            serviceIds: p.sameServicesAsBooker ? undefined : p.serviceIds,
          })),
        });

        const refNum = bookingResponse.appointments?.[0]?.id
          ? `REF${bookingResponse.appointments[0].id.slice(-9).toUpperCase()}`
          : bookingResponse.bookingGroup?.id
          ? `REF${bookingResponse.bookingGroup.id.slice(-9).toUpperCase()}`
          : `REF${Date.now().toString(36).toUpperCase().slice(-9)}`;
        setReferenceNumber(refNum);

        const pricingParticipants = (bookingResponse.pricing?.participants || []).map((p: any) => ({
          name: p.displayName as string,
          subtotal: p.subtotal as number,
          services: flatServices.filter((s) => p.serviceIds?.includes(s.id)),
        }));
        setReceiptSummary({
          participants: pricingParticipants,
          grandTotal: bookingResponse.pricing?.grandTotal ?? getTotalPrice(),
        });

        setIsLoading(false);
        setShowReceipt(true);
      } catch (error: any) {
        console.error('Booking error:', error);
        setIsLoading(false);
        setErrors({ booking: true });
        
        // Check for specific error messages about online booking being closed
        const errorMessage = error.message || '';
        if (errorMessage.includes('Online booking closed') || 
            errorMessage.includes('réservations disabled') ||
            errorMessage.includes('fermée')) {
          setError('La prise de rendez-vous en ligne est actuellement fermée. Veuillez contacter l\'établissement directement.');
        } else {
          setError(errorMessage || 'Erreur lors de la réservation. Veuillez réessayer.');
        }
      }
    } else {
      // Move to next step
      setBookingStep(nextStep);
      // Don't generate reference number here - it will be generated after booking is created
    }
  };

  if (!show) return null;

  if (isLoading) {
    return <Loading />;
  }

  if (showReceipt) {
    return (
      <Receipt
        bookingData={bookingData}
        selectedServices={selectedServices}
        receiptSummary={receiptSummary}
        onClose={() => {
          setShowReceipt(false);
          setIsLoading(true); // Show loading screen when closing receipt
          setTimeout(() => {
            setIsLoading(false);
            onClose();
            setSelectedServices([]);
            setGroupParticipants([]);
            setReceiptSummary(null);
            setBookingStep(1);
            setBookingData({
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              date: '',
              time: '',
              notes: '',
              totalPrice: 0,
              totalDuration: '',
              paymentMethod: undefined,
              cardNumber: '',
              cardName: '',
              cardExpiry: '',
              cardCVV: '',
            });
            setErrors({});
            setError(null);
            setReferenceNumber(null);
            // Redirect to profile page after successful booking
            if (isAuthenticated) {
              router.push('/account');
            }
          }, 1200); // 1.2s loading
        }}
        referenceNumber={referenceNumber || undefined}
        salonName={salonData?.name}
        clientName={`${bookingData.firstName} ${bookingData.lastName}`}
        salonAddress={salonData?.address}
        salonCity={salonData?.city}
        salonPhone={salonData?.phone}
        salonIce={salonData?.ice}
        salonRc={salonData?.rc}
        salonIf={salonData?.if}
      />
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .page-content {
          animation: fadeIn 0.3s ease-out;
        }
        .card-shine {
          background: #000;
          position: relative;
          overflow: hidden;
        }
        .card-shine::before {
          display: none;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .card-3d {
          width: 100%;
          height: 220px;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.7s cubic-bezier(.4,2,.6,1);
        }
        .card-3d.flipped {
          transform: rotateY(180deg);
        }
        .card-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          top: 0; left: 0;
        }
        .card-face.back {
          transform: rotateY(180deg);
        }
        .magnetic-stripe {
          height: 38px;
          background: linear-gradient(90deg, #222 80%, #444 100%);
          margin-top: 24px;
          border-radius: 6px;
        }
        .signature-box {
          background: #fff;
          height: 28px;
          width: 60%;
          margin-top: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          padding: 0 10px;
          font-size: 0.95em;
          letter-spacing: 0.1em;
        }
        .cvv-box {
          background: #f3f3f3;
          height: 28px;
          width: 60px;
          margin-left: 12px;
          margin-top: 24px; /* Added to align with signature box */
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: monospace;
          font-size: 1em;
          color: #222;
          font-weight: bold;
          letter-spacing: 0.2em;
        }
        .card-back-logo {
          position: absolute;
          bottom: 30px; 
          right: 24px;
          opacity: 0.7;
        }
      `}</style>

      {/* Full Page Container */}
      <div className="fixed inset-0 z-50 bg-[#f5f7f3] overflow-y-auto page-content">
        <div className="min-h-screen flex flex-col max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="relative px-8 md:px-12 pt-8 md:pt-10 pb-6 border-b border-gray-100">
            <button 
              onClick={() => {
                setError(null);
                onClose();
              }}
              className="absolute top-6 md:top-8 right-6 md:right-8 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors group"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>

            {/* Step Progress Dots */}
            <div className="flex items-center gap-2 mb-6">
              {/* Show 3 steps if authenticated, 4 if not */}
              {(isAuthenticated && userHasAllInfo ? [1, 2, 4] : [1, 2, 3, 4]).map((step) => {
                const isActive = step === bookingStep;
                const isCompleted =
                  step < bookingStep || (step === 4 && bookingStep > 3 && isAuthenticated && userHasAllInfo);
                return (
                  <div
                    key={step}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      isActive ? 'w-8 bg-[#8b7260]' : isCompleted ? 'w-8 bg-[#8b7260]' : 'w-8 bg-gray-200'
                    }`}
                  />
                );
              })}
            </div>

            <div className="flex items-center">
              <h2 className="text-3xl font-light text-gray-900 tracking-tight">
                {bookingStep === 1 && 'Votre sélection'}
                {bookingStep === 2 && 'Choisir un créneau'}
                {bookingStep === 3 && 'Vos informations'}
                {bookingStep === 4 && 'Paiement'}
              </h2>
              {bookingStep === 1 && (
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(true)}
                  className="ml-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="Ajouter des services"
                >
                  <Plus className="w-5 h-5 text-[#8b7260]" />
                </button>
              )}
            </div>
          </div>
          {/* Content Area */}
          <div className="flex-1 px-8 md:px-12 py-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}
            
            {/* Step 1: Services Review */}
            {bookingStep === 1 && (
              <div>
                <div className="space-y-3 mb-6">
                  {selectedServices.map((service, idx) => (
                    <div 
                      key={idx}
                      className="group flex items-center justify-between py-5 border-b border-gray-300 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex-1 flex items-center justify-between">
                        <p className="px-2 py-0.5 rounded text-gray-900 font-semibold text-lg tracking-wide inline-block">
                          {service.name}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-gray-500 ml-4">
                          <span className="font-mono rounded text-gray-900 font-semibold text-xs tracking-wide">{service.duration}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="font-mono rounded text-gray-900 font-semibold text-xs tracking-wide">{service.price} MAD</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedServices(selectedServices.filter(s => s.name !== service.name))}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 ml-6"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* People to book with — right after services so visible without scroll */}
                <GroupParticipantsSection
                  participants={groupParticipants}
                  onChange={setGroupParticipants}
                  includeBooker={includeBooker}
                  onIncludeBookerChange={setIncludeBooker}
                  bookerTotal={getTotalPrice()}
                  allServices={flatServices}
                  getServicesTotal={getServicesTotal}
                  familyMembers={familyMembers}
                  familyLoading={familyLoading}
                  isAuthenticated={isAuthenticated}
                />

                {/* Total Summary */}
                <div className="pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-800 font-semibold">
                      {groupParticipants.length > 0 ? 'TOTAL GROUPE' : 'TOTAL'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono rounded text-gray-900 font-semibold text-base tracking-wide">
                      {sumDurations(selectedServices)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="font-mono text-gray-900 rounded text-base font-semibold tracking-wide">
                      {getGroupGrandTotal()} MAD
                    </span>
                  </div>
                </div>
              </div>
            )}

            {bookingStep === 2 && (
              <>
                <div className="flex flex-col md:flex-row gap-10">
                  {/* Left: Calendar */}
                  <div className="w-full md:w-1/2 max-w-xs">
                    <label className="block text-sm text-gray-600 mb-4 tracking-wide uppercase text-[11px] font-medium">Date</label>
                    <div className="bg-transparent rounded-2xl border border-gray-300 p-4">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                          className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <div className="text-center">
                          <h3 className="text-base font-light text-gray-900">{monthNames[currentMonth.getMonth()]}</h3>
                          <p className="text-xs text-gray-500">{currentMonth.getFullYear()}</p>
                        </div>
                        <button
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                          className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                      {/* Day Names */}
                      <div className="grid grid-cols-7 gap-1 mb-1">
                        {dayNames.map(day => (
                          <div key={day} className="text-center text-[11px] font-medium text-gray-400 py-1">
                            {day}
                          </div>
                        ))}
                      </div>
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {(() => {
                          const { days, firstDay } = daysInMonth(currentMonth);
                          const cells = [];
                          for (let i = 0; i < firstDay; i++) {
                            cells.push(<div key={`empty-${i}`} />);
                          }
                          for (let day = 1; day <= days; day++) {
                            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                            const disabled = isDateDisabled(date);
                            const selected = selectedDate && isSameDay(date, selectedDate);
                            const today = isSameDay(date, getMoroccoToday());
                            cells.push(
                              <button
                                key={day}
                                onClick={() => handleDateSelect(date)}
                                disabled={disabled}
                                className={`aspect-square w-7 h-7 rounded text-xs font-bold transition-all ${
                                  selected
                                    ? 'bg-[#8b7260] text-white'
                                    : today
                                    ? 'bg-transparent text-[#8b7260] font-bold'
                                    : disabled
                                    ? 'text-gray-300 cursor-not-allowed '
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          }
                          return cells;
                        })()}
                      </div>
                    </div>
                  </div>
                  {/* Time slots — full width (no employee selection) */}
                </div>
                {/* Time Slots */}
                <div className="mt-10">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm text-gray-600 tracking-wide uppercase text-[11px] font-medium">Heure</label>
                    {lastUpdated && (
                      <span className="text-xs text-gray-400">
                        Mis à jour: {formatMoroccoTime(lastUpdated)}
                      </span>
                    )}
                  </div>
                  {slotsLoading && filteredTimeSlots.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8b7260]"></div>
                      <span className="ml-3 text-sm text-gray-500">Chargement des créneaux disponibles...</span>
                    </div>
                  ) : slotsError ? (
                    <div className="text-sm text-red-500 py-4">
                      {slotsError}
                    </div>
                  ) : filteredTimeSlots.length === 0 && timeSlots.length === 0 && !slotsLoading ? (
                    <div className="text-sm text-gray-500 py-4">
                      Aucun créneau disponible pour cette date. Veuillez choisir une autre date.
                    </div>
                  ) : filteredTimeSlots.length === 0 && timeSlots.length > 0 && !slotsLoading ? (
                    <div className="text-sm text-gray-500 py-4">
                      Tous les créneaux disponibles ont déjà été réservés ou ne sont plus disponibles après {lastUpdated ? formatMoroccoTime(lastUpdated) : 'maintenant'}. Veuillez choisir une autre date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {filteredTimeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => {
                            setBookingData({...bookingData, time});
                            setErrors({...errors, time: false});
                          }}
                          className={`py-2 text-sm font-medium rounded-lg transition-all ${
                            bookingData.time === time
                              ? 'bg-[#8b7260] text-white'
                              : 'bg-transparent border border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 3: Contact Info - Show if not authenticated, booking for someone else, or missing phone */}
            {bookingStep === 3 && shouldShowStep3 && (
              <div className="space-y-8">
                <p className="text-sm text-gray-500 -mt-2">
                  Téléphone obligatoire. Email optionnel. Les personnes ajoutées n&apos;ont besoin que de leur prénom.
                </p>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-2 tracking-wide uppercase text-[11px] font-medium">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={bookingData.firstName || ''}
                      onChange={(e) => {
                        setBookingData({...bookingData, firstName: e.target.value});
                        setErrors({...errors, firstName: false});
                      }}
                      className={`w-full px-0 py-3 text-lg border-0 border-b-2 focus:outline-none transition-colors text-gray-900 ${
                        errors.firstName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#8b7260]'
                      } placeholder-gray-400`}
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-2 tracking-wide uppercase text-[11px] font-medium">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={bookingData.lastName || ''}
                      onChange={(e) => {
                        setBookingData({...bookingData, lastName: e.target.value});
                        setErrors({...errors, lastName: false});
                      }}
                      className={`w-full px-0 py-3 text-lg border-0 border-b-2 focus:outline-none transition-colors text-gray-900 ${
                        errors.lastName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#8b7260]'
                      } placeholder-gray-400`}
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-2 tracking-wide uppercase text-[11px] font-medium">
                      Email (optionnel)
                    </label>
                    <input
                      type="email"
                      value={bookingData.email || ''}
                      onChange={(e) => {
                        setBookingData({...bookingData, email: e.target.value});
                        setErrors({...errors, email: false});
                      }}
                      className={`w-full px-0 py-3 text-lg border-0 border-b-2 focus:outline-none transition-colors text-gray-900 ${
                        errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#8b7260]'
                      } placeholder-gray-400`}
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-2 tracking-wide uppercase text-[11px] font-medium">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={bookingData.phone || ''}
                      onChange={(e) => {
                        setBookingData({...bookingData, phone: e.target.value});
                        setErrors({...errors, phone: false});
                      }}
                      className={`w-full px-0 py-3 text-lg border-0 border-b-2 focus:outline-none transition-colors text-gray-900 ${
                        errors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#8b7260]'
                      } placeholder-gray-400`}
                      placeholder="+212 6 00 00 00 00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2 tracking-wide uppercase text-[11px] font-medium">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={bookingData.notes || ''}
                    onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                    className="w-full px-0 py-3 text-lg border-0 border-b-2 border-gray-200 focus:border-[#8b7260] focus:outline-none transition-colors resize-none placeholder-gray-400 text-gray-900"
                    rows={2}
                    placeholder="Informations supplémentaires..."
                  />
                </div>
              </div>
            )}

            {/* Step 4: Payment Method */}
            {bookingStep === 4 && (
              <div className="space-y-8">
                <div className="mb-8">
                  {/* Payment Method Selection - Inline Tabs */}
                  <div className="flex items-center gap-4 mb-8">
                    <label className="text-sm text-gray-600 tracking-wide uppercase text-[11px] font-medium">
                      Méthode de paiement :
                    </label>
                    
                    <div className="flex items-center gap-3">
                      {/* Pay at Establishment Tab */}
                      <button
                        onClick={() => {
                          setBookingData({...bookingData, paymentMethod: 'establishment'});
                          setErrors({...errors, paymentMethod: false});
                          // Don't generate reference number here - it will be generated after booking is created
                        }}
                        className={`text-sm transition-all ${
                          bookingData.paymentMethod === 'establishment'
                            ? 'text-gray-900 font-semibold'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Sur place
                      </button>
                      
                      <span className="text-gray-300">/</span>
                      
                      {/* Pay by Card Tab - Coming Soon */}
                      <button
                        disabled
                        className="text-sm transition-all flex items-center gap-2 text-gray-400 cursor-not-allowed opacity-60"
                        title="Bientôt disponible"
                      >
                        <span>Carte bancaire</span>
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded">Coming soon</span>
                        <img
                          src="/payment/cards.png"
                          alt="Cartes"
                          className="w-10 h-5 object-contain opacity-30"
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pay at Establishment Confirmation */}
                {bookingData.paymentMethod === 'establishment' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-[#8b7260] rounded-2xl p-8">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0">
                          <Check className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2">Paiement sur place confirmé</h3>
                          <p className="text-gray-600 text-white">
                            Vous pourrez régler votre rendez-vous en espèces ou par carte directement à l'établissement.
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#f5f7f3] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-500 uppercase tracking-wider">Numéro de référence</span>
                          <button 
                            onClick={() => {
                              if (referenceNumber) {
                                navigator.clipboard.writeText(referenceNumber);
                              }
                            }}
                            className="text-xs text-[#8b7260] hover:text-[#6d5a4d] font-medium"
                          >
                            Copier
                          </button>
                        </div>
                        <div className="font-mono text-2xl font-bold text-gray-900 tracking-wider">
                          {referenceNumber || 'Généré après confirmation'}
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          {referenceNumber 
                            ? 'Conservez ce numéro pour votre rendez-vous'
                            : 'Le numéro de référence sera généré après la confirmation de votre réservation'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setBookingData({...bookingData, paymentMethod: undefined})}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      Changer de méthode de paiement
                    </button>
                  </div>
                )}

                {/* Card Payment Form */}
                {bookingData.paymentMethod === 'card' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    {/* Flex container for form and card */}
                    <div className="flex flex-col md:flex-row md:items-start md:gap-10">
                      {/* Card Form Fields (left on desktop) */}
                      <div className="flex-1 order-2 md:order-1">
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm text-gray-600 mb-2 tracking-wide uppercase text-[11px] font-medium">
                              Numéro de carte
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={bookingData.cardNumber ? formatCardNumber(bookingData.cardNumber) : ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\s/g, '');
                                  if (/^\d*$/.test(value) && value.length <= 16) {
                                    setBookingData({...bookingData, cardNumber: value});
                                    setErrors({...errors, cardNumber: false});
                                  }
                                }}
                                className={`w-full px-3 py-3 pr-14 text-base border-1 rounded-lg focus:outline-none transition-colors text-gray-900 font-mono ${
                                  errors.cardNumber ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#8b7260]'
                                } placeholder-gray-400`}
                                placeholder="1234 5678 9012 3456"
                              />
                              {bookingData.cardNumber && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  {bookingData.cardNumber.startsWith('4') ? (
                                    <img
                                      src="/payment/visa2.png"
                                      alt="Visa"
                                      className="h-4 w-auto object-contain"
                                    />
                                  ) : bookingData.cardNumber.startsWith('5') ? (
                                    <img
                                      src="/payment/Mastercard.png"
                                      alt="Mastercard"
                                      className="h-6 w-auto object-contain"
                                    />
                                  ) : null}
                                </div>
                              )}
                            </div>
                            {errors.cardNumber && (
                              <p className="text-red-500 text-xs mt-1">Numéro de carte invalide (16 chiffres requis)</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm text-gray-600 mb-2 tracking-wide uppercase text-[11px] font-medium">
                              Nom du titulaire
                            </label>
                            <input
                              type="text"
                              value={bookingData.cardName || ''}
                              onChange={(e) => {
                                setBookingData({...bookingData, cardName: e.target.value.toUpperCase()});
                                setErrors({...errors, cardName: false});
                              }}
                              className={`w-full px-3 py-3 text-sm border-1 rounded-lg focus:outline-none transition-colors text-gray-900 uppercase ${
                                errors.cardName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#8b7260]'
                              } placeholder-gray-400`}
                              placeholder="NOM PRÉNOM"
                            />
                            {errors.cardName && (
                              <p className="text-red-500 text-xs mt-1">Le nom du titulaire est requis</p>
                            )}
                          </div>

                          <div className="flex gap-4">
                            <div className="flex-1">
                              <label className="block text-sm text-gray-600 mb-2 tracking-wide uppercase text-[11px] font-medium">
                                Date d'expiration
                              </label>
                              <input
                                type="text"
                                value={bookingData.cardExpiry || ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '');
                                  if (value.length <= 4) {
                                    const formatted = formatExpiry(value);
                                    setBookingData({...bookingData, cardExpiry: formatted});
                                    setErrors({...errors, cardExpiry: false});
                                  }
                                }}
                                className={`w-full px-3 py-3 text-base border-1 rounded-lg focus:outline-none transition-colors text-gray-900 font-mono ${
                                  errors.cardExpiry ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#8b7260]'
                                } placeholder-gray-400`}
                                placeholder="MM/AA"
                                maxLength={5}
                              />
                              {errors.cardExpiry && (
                                <p className="text-red-500 text-xs mt-1">Format: MM/AA</p>
                              )}
                            </div>

                            <div className="flex-1">
                              <label className="block text-sm text-gray-600 mb-2 tracking-wide uppercase text-[11px] font-medium">
                                CVV
                              </label>
                              <input
                                type="password"
                                value={bookingData.cardCVV || ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '');
                                  if (value.length <= 3) {
                                    setBookingData({...bookingData, cardCVV: value});
                                    setErrors({...errors, cardCVV: false});
                                  }
                                }}
                                onFocus={() => setIsCardFlipped(true)}
                                onBlur={() => setIsCardFlipped(false)}
                                className={`w-full px-3 py-3 text-base border-1 rounded-lg focus:outline-none transition-colors text-gray-900 font-mono ${
                                  errors.cardCVV ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#8b7260]'
                                } placeholder-gray-400`}
                                placeholder="123"
                                maxLength={3}
                              />
                              {errors.cardCVV && (
                                <p className="text-red-500 text-xs mt-1">CVV invalide (3 chiffres)</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* 3D Credit Card Preview (right on desktop) */}
                      <div className="w-full max-w-md mx-auto mt-10 md:mt-0 md:mx-0 md:w-[350px] order-1 md:order-2">
                        <div className="perspective-1000">
                          <div className={`card-3d ${isCardFlipped ? 'flipped' : ''}`}>
                            {/* Front of Card */}
                            <div className="card-face front card-shine rounded-xl p-8 text-white aspect-[1.586/1] flex flex-col justify-between relative overflow-hidden">
                              {/* Card Background Pattern */}
                              {/* (No pattern, solid black) */}
                              <div className="relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                  {/* Use chip image instead of yellow div, smaller size */}
                                  <img
                                    src="/payment/chip.png"
                                    alt="Carte Chip"
                                    className="w-8 h-5 object-contain rounded"
                                    style={{ background: 'rgba(255,255,255,0.15)' }}
                                  />
                                  <div className="flex items-center gap-2">
                                    {/* Visa/Mastercard Logo */}
                                    {bookingData.cardNumber?.startsWith('4') ? (
                                      // Use visa2.png image instead of text
                                      <img
                                        src="/payment/visa.png"
                                        alt="Visa"
                                        className="h-4 w-auto object-contain"
                                      />
                                    ) : bookingData.cardNumber?.startsWith('5') ? (
                                      <div className="flex gap-[-4px]">
                                        <div className="w-8 h-8 rounded-full bg-red-500 opacity-80"></div>
                                        <div className="w-8 h-8 rounded-full bg-yellow-500 opacity-80 -ml-3"></div>
                                      </div>
                                    ) : (
                                      // Move logo image slightly up
                                      <img
                                        src="/payment/logo-transparent.png"
                                        alt="Logo"
                                        className="w-8 h-8 object-contain opacity-80"
                                        style={{ filter: 'brightness(0) invert(1)', marginTop: '-4px' }}
                                      />
                                    )}
                                  </div>
                                </div>
                                
                                <div className="space-y-6">
                                  <div
    className="font-mono tracking-[0.18em]"
    style={{
      fontSize: '1rem', // Reduce font size for card number
      letterSpacing: '0.18em', // Adjust letter spacing for compactness
      whiteSpace: 'nowrap', // Prevent line break
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}
  >
    {bookingData.cardNumber 
      ? formatCardNumber(bookingData.cardNumber) 
      : '•••• •••• •••• ••••'}
  </div>
                                  
                                  <div className="flex justify-between items-end">
                                    <div className="flex-1 mt-3">
                                      <div className="text-[9px] opacity-70 mb-1 uppercase tracking-wider">Titulaire de la carte</div>
                                      <div className="font-medium tracking-wider uppercase text-xs truncate pr-4">
                                        {bookingData.cardName || 'VOTRE NOM'}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-[9px] opacity-70 mb-1 uppercase tracking-wider">Expire fin</div>
                                      <div className="font-mono font-semibold text-xs">
                                        {bookingData.cardExpiry || 'MM/AA'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Back of Card */}
                            <div className="card-face back card-shine rounded-xl p-8 text-white aspect-[1.586/1] flex flex-col justify-between relative overflow-hidden">
                              <div className="magnetic-stripe" />
                              <div className="flex items-center mt-6">
                                <div className="signature-box" style={{ position: 'relative' }}>
                                  {/* Show cardholder name or "Signature" */}
                                  {bookingData.cardName || 'Signature'}
                                  {/* "2026" in the right side of the signature box, next to CVV */}
                                  <span
                                    style={{
                                      position: 'absolute',
                                      right: 12,
                                      color: '#000',
                                      fontWeight: 600,
                                      fontSize: '0.9em',
                                      letterSpacing: '0.1em',
                                    }}
                                  >
                                    2026
                                  </span>
                                </div>
                                <div className="cvv-box ml-2">
                                  {bookingData.cardCVV
                                    ? bookingData.cardCVV.padEnd(3, '•')
                                    : '•••'}
                                </div>
                              </div>
                              <div className="card-back-logo">
                                {/* Show Visa/Mastercard/Logo as on front */}
                                {bookingData.cardNumber?.startsWith('4') ? (
                                  // Use visa2.png image instead of text
                                  <img
                                    src="/payment/visa2.png"
                                    alt="Visa"
                                    className="h-4 w-auto object-contain"
                                  />
                                ) : bookingData.cardNumber?.startsWith('5') ? (
                                  <div className="flex gap-[-4px]">
                                    <div className="w-8 h-8 rounded-full bg-red-500 opacity-80"></div>
                                    <div className="w-8 h-8 rounded-full bg-yellow-500 opacity-80 -ml-3"></div>
                                  </div>
                                ) : (
                                  <img
                                    src="/payment/logo-transparent.png"
                                    alt="Logo"
                                    className="w-8 h-8 object-contain opacity-80"
                                    style={{ filter: 'brightness(0) invert(1)' }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-0 text-xs text-gray-500 rounded-xl mt-4">
                          <Lock className="w-4 h-4 text-slate-600" />
                          <span>Paiement 100% sécurisé et crypté SSL</span>
                        </div>
                      </div>
                    </div>
                    {/* Change payment method button */}
                    <button
                      onClick={() => setBookingData({...bookingData, paymentMethod: undefined})}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      Changer de méthode de paiement
                    </button>
                  </div>
                )}

                {bookingData.paymentMethod && (
                  <div className="mt-12 pt-8 border-t border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Récapitulatif de la réservation</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date & Heure</span>
                        <span className="font-mono text-gray-900 font-medium">
                          {bookingData.date && formatMoroccoDate(bookingData.date, { day: 'numeric', month: 'short' })} à {bookingData.time}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Services</span>
                        <span className="text-gray-900 font-medium">{selectedServices.length} service(s)</span>
                      </div>
                      {(!includeBooker || groupParticipants.length > 0) && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Personnes</span>
                          <span className="text-gray-900 font-medium">
                            {(includeBooker ? 1 : 0) + groupParticipants.length}
                            {!includeBooker ? ' (sans vous)' : groupParticipants.length > 0 ? ` (vous + ${groupParticipants.length})` : ''}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Durée totale</span>
                        <span className="font-mono text-gray-900 font-medium">
                          {sumDurations(selectedServices)}
                        </span>
                      </div>
                      {/* Add separator line above total */}
                      <div className="my-4 border-t border-gray-200" />
                      <div className="flex justify-between pt-3 border-t border-gray-100">
                        <span className="text-gray-900 font-semibold text-base">
                          {bookingData.paymentMethod === 'establishment' ? 'À payer sur place' : 'Total à payer'}
                        </span>
                        <span className="font-mono text-black rounded text-base font-semibold tracking-wide">
                          {getGroupGrandTotal()} MAD
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-8 md:px-12 py-6 md:py-8 border-t border-gray-100 flex items-center justify-between bg-[#f5f7f3]">
            <div className="text-sm text-gray-500">
              Étape {displayStep} sur {totalSteps}
            </div>

            <div className="flex items-center gap-3">
              {bookingStep > 1 && (
                <button
                  onClick={() => {
                    // When going back from step 4, skip step 3 if authenticated
                    const shouldSkipStep3 = isAuthenticated && userHasAllInfo;
                    const prevStep = shouldSkipStep3 && bookingStep === 4 ? 2 : bookingStep - 1;
                    setBookingStep(prevStep);
                    setErrors({});
                  }}
                  className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Retour
                </button>
              )}
              
              <button
                onClick={handleContinue}
                disabled={
                  (bookingStep === 1 && selectedServices.length === 0) ||
                  (bookingStep === 1 && !includeBooker && groupParticipants.length === 0)
                }
                className="px-8 py-3 bg-[#8b7260] text-white rounded-full font-medium hover:bg-[#6d5a4d] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {bookingStep === 4 ? 'Confirmer la réservation' : 'Continuer'}
                {bookingStep < 4 && <ArrowRight className="w-4 h-4" />}
                {bookingStep === 4 && <Check className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Add Service Modal */}
      {showAddServiceModal && (
        <AddServiceModal
          selectedServices={selectedServices}
          setSelectedServices={setSelectedServices}
          onClose={() => setShowAddServiceModal(false)}
          salonServices={salonServices} // <-- Pass correct services
        />
      )}
    </>
  );
};

export default BookingModal;