import { X, Check, ArrowRight, CreditCard, Store, Lock, Plus } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Receipt from './Receipt';
import Loading from './Loading';
import AddServiceModal from './AddServiceModal';
import { Checkbox } from "@/components/ui/checkbox";

type Service = {
  name: string;
  duration: string;
  price?: number;
  priceType?: string;
};

type TeamMember = { 
  name: string; 
  initials: string; 
  specialty: string;
  rating: number;
  experience: string;
};

export type BookingData = {
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
  salonTeam: TeamMember[];
  selectedTeamMember: TeamMember | null;
  setSelectedTeamMember: (member: TeamMember | null) => void;
  setSelectedServices: (services: Service[]) => void;
  onAddService?: () => void;
  salonServices: { category: string; items: Service[]; description?: string }[]; // <-- Add this prop
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
  salonTeam,
  selectedTeamMember,
  setSelectedTeamMember,
  setSelectedServices,
  onAddService,
  salonServices, // <-- Add here
}) => {
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  // Add state for "proche" mode
  const [forProche, setForProche] = useState(false);
  // Add state for proche consent
  const [procheConsent, setProcheConsent] = useState(false);

  const daysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const handleDateSelect = (date: Date) => {
    if (!isDateDisabled(date)) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0];
      setBookingData({...bookingData, date: formattedDate});
      setErrors({...errors, date: false});
    }
  };

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

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
    setBookingData((prev) => ({
      ...prev,
      totalPrice: getTotalPrice(),
      totalDuration: sumDurations(selectedServices),
    }));
  }, [selectedServices]);

  useEffect(() => {
    // Set default payment method to 'card' when entering step 4
    if (bookingStep === 4 && !bookingData.paymentMethod) {
      setBookingData(prev => ({ ...prev, paymentMethod: 'card' }));
    }
  }, [bookingStep]);

  const validate = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    
    if (bookingStep === 2) {
      if (!bookingData.date) newErrors.date = true;
      if (!bookingData.time) newErrors.time = true;
    }
    
    if (bookingStep === 3) {
      if (!(bookingData.firstName || '').trim()) newErrors.firstName = true;
      if (!(bookingData.lastName || '').trim()) newErrors.lastName = true;
      if (!(bookingData.email || '').trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.email || '')) newErrors.email = true;
      if (!(bookingData.phone || '').trim()) newErrors.phone = true;
      // If forProche, require consent
      if (forProche && !procheConsent) newErrors.procheConsent = true;
    }

    if (bookingStep === 4) {
      if (!bookingData.paymentMethod) newErrors.paymentMethod = true;
      if (bookingData.paymentMethod === 'card') {
        if (!(bookingData.cardNumber || '').replace(/\s/g, '').match(/^\d{16}$/)) newErrors.cardNumber = true;
        if (!(bookingData.cardName || '').trim()) newErrors.cardName = true;
        if (!(bookingData.cardExpiry || '').match(/^\d{2}\/\d{2}$/)) newErrors.cardExpiry = true;
        if (!(bookingData.cardCVV || '').match(/^\d{3}$/)) newErrors.cardCVV = true;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (bookingStep === 1 && selectedServices.length === 0) return;
    if ((bookingStep === 2 || bookingStep === 3 || bookingStep === 4) && !validate()) return;

    if (bookingStep < 4) {
      setBookingStep(bookingStep + 1);
      // Generate reference number if moving to payment step and payment method is establishment
      if (bookingStep === 3 && bookingData.paymentMethod === 'establishment') {
        const refNum = `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        setReferenceNumber(refNum);
      }
    } else {
      // Show loading, then receipt
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setShowReceipt(true);
        // Reset booking states if needed after receipt is closed
      }, 1800); // 1.8s loading
    }
  };

  if (!show) return null;

  if (isLoading) {
    return <Loading />;
  }

  const salonName = "Salon Élégance";
  const salonAddress = "12 Rue Ibnou Rochd, Maarif";
  const salonCity = "Casablanca, Maroc";
  const salonPhone = "+212 522 123 456";

  if (showReceipt) {
    return (
      <Receipt
        bookingData={bookingData}
        selectedServices={selectedServices}
        selectedTeamMember={selectedTeamMember}
        onClose={() => {
          setShowReceipt(false);
          setIsLoading(true); // Show loading screen when closing receipt
          setTimeout(() => {
            setIsLoading(false);
            onClose();
            setSelectedServices([]);
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
            setSelectedTeamMember(null);
            setErrors({});
            setReferenceNumber(null);
          }, 1200); // 1.2s loading
        }}
        referenceNumber={referenceNumber || undefined}
        salonName={salonName}
        clientName={`${bookingData.firstName} ${bookingData.lastName}`}
        salonAddress={salonAddress}
        salonCity={salonCity}
        salonPhone={salonPhone}
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
              onClick={onClose}
              className="absolute top-6 md:top-8 right-6 md:right-8 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors group"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>

            {/* Step Progress Dots */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    step === bookingStep ? 'w-8 bg-[#8b7260]' : step < bookingStep ? 'w-8 bg-[#8b7260]' : 'w-8 bg-gray-200'
                  }`}
                />
              ))}
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

                {/* Total Summary */}
                <div className="pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-800 font-semibold">TOTAL</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono rounded text-gray-900 font-semibold text-base tracking-wide">
                      {sumDurations(selectedServices)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="font-mono text-gray-900 rounded text-base font-semibold tracking-wide">
                      {getTotalPrice()} MAD
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
                            const today = isSameDay(date, new Date());
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
                  {/* Right: Team Member Selection */}
                  <div className="w-full md:w-1/2">
                    <label className="block text-sm text-gray-600 mb-4 tracking-wide uppercase text-[11px] font-medium">Professionnel (optionnel)</label>
                    <div className="flex flex-col gap-2">
                      {salonTeam.map((member, idx) => {
                        const isActive = selectedTeamMember?.name === member.name;
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedTeamMember(isActive ? null : member)}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left w-full ${
                              isActive
                                ? 'bg-[#8b7260] text-white'
                                : 'bg-white border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium ${
                              isActive ? 'bg-white text-[#8b7260]' : 'bg-[#8b7260] text-white'
                            }`}>
                              {member.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
                                {member.name}
                              </p>
                              <p className={`text-xs truncate ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                                {member.specialty}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {/* Time Slots */}
                <div className="mt-10">
                  <label className="block text-sm text-gray-600 mb-3 tracking-wide uppercase text-[11px] font-medium">Heure</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {[
                      ...timeSlots,
                      ...["19:00", "19:30", "20:00", "20:30"].filter(
                        t => !timeSlots.includes(t)
                      ),
                    ].map((time) => (
                      <button
                        key={time}
                        onClick={() => {
                          setBookingData({...bookingData, time});
                          setErrors({...errors, time: false});
                        }}
                        className={`py-2 text-sm font-medium rounded-lg transition-all ${
                          bookingData.time === time
                            ? 'bg-[#8b7260] text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Contact Info */}
            {bookingStep === 3 && (
              <div className="space-y-8">
                {/* Add toggle for "proche" mode */}
                <div className="flex -mt-6 mb-8 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForProche((v) => !v)}
                    className={`text-sm underline font-medium transition-colors ${
                      forProche
                        ? 'text-gray-700 border-[#8b7260]'
                        : 'text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {forProche ? 'Pour un proche (activé)' : 'Je prends rendez-vous pour un proche'}
                  </button>
                  {forProche && (
                    <span className="text-xs text-[#8b7260] mt-1 font-medium">Les informations ci-dessous concernent votre proche</span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-2 tracking-wide uppercase text-[11px] font-medium">
                      Prénom{forProche && " du proche"}
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
                      placeholder={forProche ? "Prénom du proche" : "Votre prénom"}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-2 tracking-wide uppercase text-[11px] font-medium">
                      Nom{forProche && " du proche"}
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
                      placeholder={forProche ? "Nom du proche" : "Votre nom"}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-2 tracking-wide uppercase text-[11px] font-medium">
                      Email{forProche && " du proche"}
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
                      placeholder={forProche ? "Email du proche" : "votre@email.com"}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-2 tracking-wide uppercase text-[11px] font-medium">
                      Téléphone{forProche && " du proche"}
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
                      placeholder={forProche ? "+212 6 00 00 00 00 (proche)" : "+212 6 00 00 00 00"}
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
                    placeholder={forProche ? "Informations supplémentaires pour le proche..." : "Informations supplémentaires..."}
                  />
                </div>
                {/* Proche consent section */}
                {forProche && (
                  <div className="mt-6 flex items-start gap-3">
                    <Checkbox
                      id="proche-consent"
                      checked={procheConsent}
                      onCheckedChange={v => setProcheConsent(!!v)}
                      className={`mt-1 ${errors.procheConsent ? "border-red-400 ring-2 ring-red-200" : " w-4 h-4 border-gray-300"} `}
                    />
                    <label htmlFor="proche-consent" className="text-sm text-gray-700 select-none">
                      J’atteste avoir le droit de prendre rendez-vous pour ce proche et d’utiliser ses informations personnelles pour cette réservation.
                    </label>
                  </div>
                )}
                {forProche && errors.procheConsent && (
                  <div className="text-xs text-red-500 mt-1 ml-7">
                    Vous devez confirmer avoir le droit de réserver pour ce proche.
                  </div>
                )}
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
                          const refNum = `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                          setReferenceNumber(refNum);
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
                      
                      {/* Pay by Card Tab */}
                      <button
                        onClick={() => {
                          setBookingData({...bookingData, paymentMethod: 'card'});
                          setErrors({...errors, paymentMethod: false});
                        }}
                        className={`text-sm transition-all flex items-center gap-2 ${
                          bookingData.paymentMethod === 'card'
                            ? 'text-gray-900 font-semibold'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <span>Carte bancaire</span>
                        <img
                          src="/payment/cards.png"
                          alt="Cartes"
                          className="w-10 h-5 object-contain opacity-70"
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
                          {referenceNumber}
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          Conservez ce numéro pour votre rendez-vous
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
                          {bookingData.date && new Date(bookingData.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {bookingData.time}
                        </span>
                      </div>
                      {selectedTeamMember && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Professionnel</span>
                          <span className="text-gray-900 font-medium">{selectedTeamMember.name}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Services</span>
                        <span className="text-gray-900 font-medium">{selectedServices.length} service(s)</span>
                      </div>
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
                          {bookingData.totalPrice} MAD
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
              Étape {bookingStep} sur 4
            </div>

            <div className="flex items-center gap-3">
              {bookingStep > 1 && (
                <button
                  onClick={() => {
                    setBookingStep(bookingStep - 1);
                    setErrors({});
                  }}
                  className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Retour
                </button>
              )}
              
              <button
                onClick={handleContinue}
                disabled={bookingStep === 1 && selectedServices.length === 0}
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