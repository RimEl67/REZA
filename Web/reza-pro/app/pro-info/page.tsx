'use client';

import React, { useState, useRef } from 'react';
import { ArrowRight, Check, ArrowLeft } from 'lucide-react';
import Loading from '../salon/Loading';
import { AnimatePresence, motion } from 'framer-motion';

export default function ProOnboardingPage() {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [hasCommercialLocal, setHasCommercialLocal] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    establishmentName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Création du compte...");
  const [loadingTextKey, setLoadingTextKey] = useState(0); // for animation

  const cities = [
    { value: 'casablanca', label: 'Casablanca', available: true },
    { value: 'marrakech', label: 'Marrakech', available: true },
    { value: 'rabat', label: 'Rabat (Bientôt disponible)', available: false },
    { value: 'tanger', label: 'Tanger (Bientôt disponible)', available: false },
    { value: 'fes', label: 'Fès (Bientôt disponible)', available: false },
  ];

  const handleUserTypeSelection = (type) => {
    setUserType(type);
    if (type === 'client') {
      // Redirect to home page
      window.location.href = '/';
    } else {
      setStep(2);
    }
  };

  const handleBusinessTypeSelection = (type) => {
    setBusinessType(type);
    setStep(3);
  };

  const handleCommercialLocalSelection = (value: string) => {
    setHasCommercialLocal(value);
    setStep(4);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
    setLoading(true);
    setLoadingText("Création du compte...");
    setLoadingTextKey((k) => k + 1);
    setTimeout(() => {
      setLoadingText("Nous créons votre compte...");
      setLoadingTextKey((k) => k + 1);
    }, 900);
    setTimeout(() => {
      setLoadingText("Finalisation...");
      setLoadingTextKey((k) => k + 1);
    }, 1800);
    setTimeout(() => {
      window.location.href = 'https://reza-client.vercel.app/login';
    }, 3000); // 3 seconds total
  };

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(event.target as Node)
      ) {
        setCityDropdownOpen(false);
      }
    }
    if (cityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [cityDropdownOpen]);

  return (
    <div className="min-h-screen [background-color:#f5f7f3] flex flex-col">
      {loading && (
        <Loading
          text={
            <span
              key={loadingTextKey}
              className="inline-block animate-fadein"
              style={{ transition: 'opacity 0.3s' }}
            >
              {loadingText}
            </span>
          }
        />
      )}
      {/* Header */}
      <header className="[background-color:#f5f7f3] border-gray-200 py-6 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logos/logo-2.svg" alt="Reza Logo" className="w-10 h-10" />
            <div className="flex flex-col">
              <span className="font-thin text-xl tracking-[0.3em] text-gray-900">REZA</span>
              <div className="flex items-center gap-2">
                {/* Added line before PRO, matching Header.tsx style */}
                <span className="w-6 h-[1px] bg-gradient-to-r from-[#C57B57] to-transparent" />
                <span className="text-[6px] tracking-[0.4em] uppercase text-gray-500">PRO</span>
              </div>
            </div>
          </div>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          )}
        </div>
      </header>

      {/* Progress Bar */}
      {step > 1 && (
        <div className="bg-[#f5f7f3] border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex gap-2">
              <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-black' : 'bg-gray-200'}`} />
              <div className={`flex-1 h-1 rounded-full ${step >= 3 ? 'bg-black' : 'bg-gray-200'}`} />
              <div className={`flex-1 h-1 rounded-full ${step >= 4 ? 'bg-black' : 'bg-gray-200'}`} />
              <div className={`flex-1 h-1 rounded-full ${step >= 5 ? 'bg-black' : 'bg-gray-200'}`} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: User Type Selection */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="text-center space-y-8 animate-in fade-in duration-500"
              >
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-normal text-gray-900">
                    Devenir partenaire Reza Pro
                  </h1>
                  <p className="text-lg text-gray-600">
                    Soyez visibles auprès de <span className="font-semibold">milliers d'utilisateurs</span>.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-8 py-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-600" />
                    Sans engagement
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-600" />
                    Sans commission
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  {/* Active card: Professional */}
                  <button
                    onClick={() => handleUserTypeSelection('professional')}
                    className="w-full bg-black border-2 border-black rounded-2xl p-6 group transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <img src="/icons/pro.png" alt="Pro Icon" className="w-6 h-6" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-lg font-semibold text-white">
                          Je suis gérant d'un établissement
                        </h3>
                        <p className="text-sm text-gray-200">
                          Coiffure, esthétique, barber, bien-être...
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>

                  {/* Inactive card: Client */}
                  <button
                    onClick={() => handleUserTypeSelection('client')}
                    className="w-full"
                    style={{ backgroundColor: '#f5f7f3' }}
                  >
                    <div className="border-2 border-gray-200 rounded-2xl p-6 hover:bg-gray-50 transition-all duration-200 group flex items-center gap-4">
                      <div className="w-12 h-12 bg-transparent rounded-full flex items-center justify-center">
                        <img src="/icons/calendar.png" alt="Appointment Icon" className="w-6 h-6" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Je ne suis pas un professionnel
                        </h3>
                        <p className="text-sm text-gray-600">
                          Je souhaite prendre un rendez-vous beauté
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Business Type Selection */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="space-y-8 animate-in fade-in duration-500"
              >
                <div className="text-center space-y-4">
                  <h1 className="text-4xl font-normal text-gray-900">
                    Quel établissement souhaitez-vous équiper ?
                  </h1>
                </div>

                <div className="space-y-4 pt-4">
                  <button
                    onClick={() => handleBusinessTypeSelection('salon')}
                    className="w-full bg-[#f5f7f3] border-2 border-gray-200 rounded-2xl p-6 hover:border-black hover:bg-black/5 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-gray-900">
                        Salon de coiffure ou barbershop
                      </span>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>

                  <button
                    onClick={() => handleBusinessTypeSelection('beauty')}
                    className="w-full bg-[#f5f7f3] border-2 border-gray-200 rounded-2xl p-6 hover:border-black hover:bg-black/5 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-gray-900">
                        Institut de beauté ou bar à ongles
                      </span>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>

                  <button
                    onClick={() => handleBusinessTypeSelection('spa')}
                    className="w-full bg-[#f5f7f3] border-2 border-gray-200 rounded-2xl p-6 hover:border-black hover:bg-black/5 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-gray-900">
                        Spa ou centre de bien-être
                      </span>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                </div>

                <div className="text-center pt-8">
                  <p className="text-sm text-gray-600">
                    Je ne suis pas un professionnel de beauté, je souhaite prendre rendez-vous sur{' '}
                    <a href="/" className="underline hover:no-underline font-medium">
                      reza.com
                    </a>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Commercial Local Question */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="space-y-8 animate-in fade-in duration-500"
              >
                <div className="text-center space-y-4">
                  <h1 className="text-4xl font-normal text-gray-900">
                    Exercez-vous dans un local commercial ?
                  </h1>
                </div>
                <div className="flex items-center justify-center gap-8 pt-8">
                  <button
                    onClick={() => handleCommercialLocalSelection('oui')}
                    className={`px-8 py-4 rounded-2xl text-lg font-medium border-2 ${
                      hasCommercialLocal === 'oui'
                        ? 'bg-black text-white border-black'
                        : 'bg-[#f5f7f3] text-gray-900 border-gray-200 hover:border-black hover:bg-black/5'
                    } transition-all duration-200`}
                  >
                    Oui
                  </button>
                  <button
                    onClick={() => handleCommercialLocalSelection('non')}
                    className={`px-8 py-4 rounded-2xl text-lg font-medium border-2 ${
                      hasCommercialLocal === 'non'
                        ? 'bg-black text-white border-black'
                        : 'bg-[#f5f7f3] text-gray-900 border-gray-200 hover:border-black hover:bg-black/5'
                    } transition-all duration-200`}
                  >
                    Non
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Business Information Form */}
            {step === 4 && !loading && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="space-y-8 animate-in fade-in duration-500"
              >
                <div className="text-center space-y-4">
                  <h1 className="text-4xl font-normal text-gray-900">
                    Informations sur votre établissement
                  </h1>
                  <p className="text-gray-600">
                    Remplissez les informations ci-dessous pour créer votre compte professionnel
                  </p>
                </div>

                <div className="bg-[#f5f7f3] rounded-2xl border-1 border-gray-200 p-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom de l'établissement *
                        </label>
                        <input
                          type="text"
                          value={formData.establishmentName}
                          onChange={(e) => handleInputChange('establishmentName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400"
                          placeholder="Ex: Salon Élégance"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom du contact *
                        </label>
                        <input
                          type="text"
                          value={formData.contactName}
                          onChange={(e) => handleInputChange('contactName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400"
                          placeholder="Votre nom complet"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email professionnel *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400"
                          placeholder="votre@email.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Téléphone *
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400"
                          placeholder="+212 6XX XXX XXX"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse complète *
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400"
                        placeholder="Numéro et nom de rue"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ville *
                        </label>
                        {/* Custom Dropdown */}
                        <div className="relative" ref={cityDropdownRef}>
                          <button
                            type="button"
                            className="w-full px-4 py-3 border border-gray-300 rounded-full text-left text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent flex justify-between items-center"
                            style={{ backgroundColor: '#f5f7f3' }}
                            onClick={() => setCityDropdownOpen((open) => !open)}
                          >
                            {formData.city
                              ? cities.find((c) => c.value === formData.city)?.label
                              : 'Sélectionnez une ville'}
                            <svg
                              className={`w-4 h-4 ml-2 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {cityDropdownOpen && (
                            <div
                              className="absolute z-10 mt-2 w-full border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto animate-in fade-in duration-100"
                              style={{ backgroundColor: '#f5f7f3' }}
                            >
                              {cities.map((city) => (
                                <button
                                  key={city.value}
                                  type="button"
                                  disabled={!city.available}
                                  onClick={() => {
                                    if (city.available) {
                                      handleInputChange('city', city.value);
                                      setCityDropdownOpen(false);
                                    }
                                  }}
                                  className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors ${
                                    !city.available
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-gray-900'
                                  } ${formData.city === city.value ? 'bg-gray-100 font-semibold' : ''}`}
                                >
                                  {city.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Code postal
                        </label>
                        <input
                          type="text"
                          value={formData.postalCode}
                          onChange={(e) => handleInputChange('postalCode', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400"
                          placeholder="20000"
                        />
                      </div>
                    </div>

                    <div className="bg-[#f5f7f3]">
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">*Note :</span> Actuellement, nous sommes disponibles uniquement à Casablanca et Marrakech. D'autres villes seront bientôt ajoutées.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.establishmentName || !formData.contactName || !formData.email || !formData.phone || !formData.address || !formData.city}
                    className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-all flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Créer mon compte
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="[background-color:#f5f7f3] border-t border-gray-200 py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-600">
            Des questions ? Contactez-nous à{' '}
            <a href="mailto:pro@reza.ma" className="underline hover:no-underline font-medium">
              pro@reza.ma
            </a>
          </p>
        </div>
      </footer>

      <style jsx global>{`
        .animate-fadein {
          opacity: 0;
          animation: fadein-anim 0.4s forwards;
        }
        @keyframes fadein-anim {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}