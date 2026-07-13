'use client';

import React, { useState, useEffect } from 'react';
import { User, Menu, X } from 'lucide-react';
import dynamic from 'next/dynamic';

const LoadingOverlay = dynamic(() => import('@/components/ui/LoadingOverlay'), { ssr: false });

const RezaNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navLoading, setNavLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Coiffeur', path: '/coiffeur' },
    { name: 'Barbier', path: '/barbier' },
    { name: 'Manucure', path: '/manucure' },
    { name: 'Institut de beauté', path: '/institut-de-beaute' },
  ];

  return (
    <>
      {/* Main Navigation */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#f5f7f3] backdrop-blur-xl'
            : 'bg-[#f5f7f3] backdrop-blur-xl'
        }`}
        style={{ top: isScrolled ? 0 : 0 }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <a 
              href="/" 
              className="flex-shrink-0 transition-transform duration-200 hover:scale-105 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                {/* Logo Icon */}
                <div className="relative w-12 h-12 group">
                  {/* Logo Image */}
                  <img
                    src="/logos/logo-2.svg"
                    alt="Reza Logo"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>

                {/* Brand Text */}
                <div className="flex flex-col">
                  <span className={`font-thin text-[28px] tracking-[0.35em] leading-none transition-colors duration-300 ${
                    isScrolled ? 'text-[#2F2E2C]' : 'text-[#2F2E2C]'
                  }`}>
                    REZA
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-6 h-[1px] transition-colors duration-300 ${
                      isScrolled ? 'bg-gradient-to-r from-[#C57B57] to-transparent' : 'bg-gradient-to-r from-[#C57B57] to-transparent'
                    }`} />
                    <span className={`text-[7px] tracking-[0.5em] uppercase transition-colors duration-300 ${
                      isScrolled ? 'text-[#8B7260] opacity-50' : 'text-[#8B7260] opacity-50'
                    }`}>
                      BEAUTY
                    </span>
                  </div>
                </div>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.path}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                    isScrolled
                      ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </a>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Global Pill Container - Desktop */}
              <div className={`hidden lg:flex items-center gap-3 px-3 py-2 rounded-full transition-all duration-200 ${
                isScrolled 
                  ? 'bg-transparent' 
                  : 'bg-transparent'
              }`}>
                {/* Professional Pill */}
                <a
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    setNavLoading(true);
                    setTimeout(() => {
                      window.location.href = "/pro-info";
                    }, 2200);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                    isScrolled
                      ? 'hover:underline text-gray-900'
                      : 'hover:underline text-black'
                  }`}
                >
                  <span className="text-sm font-medium">
                    Je suis un professionnel de beauté
                  </span>
                </a>

                {/* Account Pill */}
                <a
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    setNavLoading(true);
                    setTimeout(() => {
                      window.location.href = "/login";
                    }, 2200);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                    isScrolled
                      ? 'bg-[#171717] hover:bg-gray-800 text-white'
                      : 'bg-[#171717] hover:bg-gray-800 text-white'
                  }`}
                >
                  <User size={16} strokeWidth={2} />
                  <span className="text-sm font-medium">
                    Mon Compte
                  </span>
                </a>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isScrolled 
                    ? 'bg-gray-100 hover:bg-gray-200' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {isMobileMenuOpen ? (
                  <X className={`h-5 w-5 ${isScrolled ? 'text-gray-900' : 'text-black'}`} />
                ) : (
                  <Menu className={`h-5 w-5 ${isScrolled ? 'text-gray-900' : 'text-black'}`} />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[#f5f7f3]"
            style={{
              animation: 'slideInRight 0.3s ease-out'
            }}
          >
            <div className="flex flex-col h-full p-8 pt-24">
              {/* Navigation Items */}
              <div className="flex-1 space-y-2">
                {navItems.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-lg font-medium text-gray-900 hover:text-gray-600 transition-colors py-3 px-4 rounded-full hover:bg-gray-50"
                  >
                    {item.name}
                  </a>
                ))}

                {/* Pro Link */}
                <a
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    setNavLoading(true);
                    setTimeout(() => {
                      window.location.href = "/pro-info";
                    }, 2200);
                  }}
                  className="block text-lg font-medium py-3 px-4 transition-colors mt-4"
                >
                  <span className="text-[#000] underline">Espace Professionnel</span>
                </a>
              </div>

              {/* Account CTA */}
              <a
                href="#"
                onClick={e => {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  setNavLoading(true);
                  setTimeout(() => {
                    window.location.href = "/login";
                  }, 2200);
                }}
                className="flex items-center justify-center gap-3 py-4 rounded-full bg-black hover:bg-gray-800 transition-all group"
              >
                <User size={18} className="text-white" strokeWidth={2} />
                <span className="text-sm font-semibold text-white">
                  Mon Compte
                </span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="transition-transform group-hover:translate-x-1 text-white"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {navLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#f5f7f3]">
          <LoadingOverlay />
        </div>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};

export default RezaNavbar;