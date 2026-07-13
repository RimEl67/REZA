'use client';

import React, { useState } from 'react';
import { Search, MapPin, Scissors, HandMetal, Sparkles, Paintbrush, User, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const ScissorsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 7m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M6 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M8.6 8.6l10.4 10.4" /><path d="M8.6 15.4l10.4 -10.4" /></svg>
);

const RazorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 3v2" /><path d="M12 3v2" /><path d="M16 3v2" /><path d="M9 12v6a3 3 0 0 0 6 0v-6h-6z" /><path d="M8 5h8l-1 4h-6z" /><path d="M12 17v1" /></svg>
);

const MassageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M9 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M4 22l4 -2v-3h12" /><path d="M11 20h9" /><path d="M8 14l3 -2l1 -4c3 1 3 4 3 6" /></svg>
);

const ManucureIcon = () => (
  <img src="/icons/nail-polish.png" alt="Manucure" width={24} height={24} style={{ display: 'inline-block' }} />
);

export default function HeroAbout() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const router = useRouter();

  const popularSearches = [
    { icon: <ScissorsIcon />, title: 'Coupe de cheveux', subtitle: 'Femme & Homme' },
    { icon: <RazorIcon />, title: 'Barbier', subtitle: 'Rasage, taille de barbe' },
    { icon: <ManucureIcon />, title: 'Manucure', subtitle: 'Gel, vernis semi-permanent' },
    { icon: <MassageIcon />, title: 'Massage', subtitle: 'Relaxation & bien-être' },
  ];

  const popularLocations = [
    { city: 'Casablanca', district: 'Centre-ville', count: '156 salons' },
    { city: 'Rabat', district: 'Agdal', count: '89 salons' },
    { city: 'Marrakech', district: 'Guéliz', count: '124 salons' },
    { city: 'Tanger', district: 'Malabata', count: '67 salons' },
    { city: 'Fès', district: 'Ville Nouvelle', count: '52 salons' },
  ];

  return (
    <section
      id="about"
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/hero2.jpg"
          alt="Hero Background"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/20" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-12 py-20">
        {/* Header Content */}
        <div className="text-center mb-12 space-y-6">
         
          
          <h1 className="text-5xl md:text-7xl font-thin text-[#f5f7f3] mb-6 tracking-tight mt-28">
           Votre beauté, notre passion
          </h1>
           <p className="text-xl md:text-2xl text-white/90 font-light max-w-2xl mx-auto">
            Découvrez les meilleurs salons près de chez vous et prenez rendez-vous en ligne en quelques secondes.
          </p>
         
        </div>

        {/* Search Card */}
        <div className="max-w-full md:max-w-4xl mx-auto px-2 md:px-0">
          <div className="bg-[#f5f7f3] rounded-lg md:rounded-full shadow-2xl p-4 md:p-3 backdrop-blur-xl w-full">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Input */}
              <div className="flex-1 relative w-full mb-2 md:mb-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                <input
                  type="text"
                  placeholder="Nom du salon, prestations (coupe...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                  className="w-full pl-12 pr-4 py-3 rounded-full focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-gray-800 placeholder-gray-500 text-base"
                />
                
                {/* Search Dropdown */}
                {showSearchDropdown && (
                  <div className="absolute bottom-full left-0 right-0 mt-2 bg-[#f5f7f3] rounded-2xl shadow-sm border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                        Recherches populaires
                      </p>
                      <div className="space-y-1">
                        {popularSearches.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSearchQuery(item.title);
                              setShowSearchDropdown(false);
                            }}
                            className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                          >
                            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl text-xl group-hover:scale-110 transition-transform duration-200">
                              {item.icon}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                              <p className="text-xs text-gray-500">{item.subtitle}</p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Search className="w-4 h-4 text-gray-400" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Separator Line */}
              <div className="hidden md:flex items-center">
                <div className="w-px h-10 bg-gray-200" />
              </div>

              {/* Location Input */}
              <div className="flex-1 relative w-full mb-2 md:mb-0">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                <input
                  type="text"
                  placeholder="Adresse, ville..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onFocus={() => setShowLocationDropdown(true)}
                  onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                  className="w-full pl-12 pr-4 py-3 rounded-full focus:border-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-gray-800 placeholder-gray-500 text-base"
                />
                
                {/* Location Dropdown */}
                {showLocationDropdown && (
                  <div className="absolute bottom-full left-0 right-0 mt-2 bg-[#f5f7f3] rounded-2xl shadow-sm border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                        Villes populaires
                      </p>
                      <div className="space-y-1">
                        {popularLocations.filter(loc => loc.city === 'Casablanca' || loc.city === 'Marrakech').map((loc, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setLocation(loc.city);
                              setShowLocationDropdown(false);
                            }}
                            className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                          >
                            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-black/5 to-black/10 rounded-xl group-hover:scale-110 transition-transform duration-200">
                              <MapPin className="w-5 h-5 text-gray-700" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-gray-900 text-sm">{loc.city}</p>
                              <p className="text-xs text-gray-500">{loc.district} • {loc.count}</p>
                            </div>
                            <div className="text-xs font-medium text-gray-400 group-hover:text-gray-600 transition-colors flex items-center">
                              <MapPin className="w-4 h-4" />
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="pt-2 text-[11px] text-gray-400 text-center">Bientôt disponible dans d'autres villes...</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Button */}
              <button
                className="bg-[#171717] text-white px-8 py-3 rounded-full font-medium hover:bg-gray-900 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 w-full md:w-auto text-base"
                onClick={() => {
                  router.push(`/search-results?query=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}`);
                }}
              >
                <Search className="w-5 h-5" />
                <span className="hidden md:inline">Rechercher</span>
                <span className="md:hidden">Rechercher</span>
              </button>
            </div>
          </div>
          {/* Popular Categories */}
          {/* Removed Populaire and category buttons */}
        </div>

      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent" />
    </section>
  );
}