'use client';

import React from 'react';
import Image from 'next/image';

export default function AppDownloadSection() {
  return (
    <section className="py-16 md:py-24 bg-white dark:bg-[#0a0a0a] w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-24">
          
          {/* Text Content */}
          <div className="flex-1 max-w-2xl text-left">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Disponible sur</span>
              <div className="flex gap-2">
                <svg viewBox="0 0 384 512" className="h-5 w-5 fill-current text-gray-900 dark:text-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"></path>
                </svg>
                <svg viewBox="0 0 512 512" className="h-5 w-5 fill-current text-gray-900 dark:text-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"></path>
                </svg>
              </div>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-[#2F2E2C] dark:text-white leading-[1.1] mb-6">
              Téléchargez<br />l'app Reza
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed font-light">
              Réservez des expériences beauté et bien-être inoubliables avec l'application mobile Reza
            </p>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* QR Code Placeholder */}
              <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm inline-block">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://reza.com/app" 
                  alt="QR Code" 
                  className="w-32 h-32"
                />
              </div>
              
              <div className="flex flex-col justify-center h-32">
                <p className="text-gray-500 font-medium mb-3 text-center sm:text-left">Ou téléchargez via</p>
                <div className="flex gap-3">
                  <button className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2">
                    App Store
                  </button>
                  <button className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2">
                    Google Play
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Images/Mockup */}
          <div className="flex-1 relative w-full h-[500px] md:h-[600px] flex justify-center lg:justify-end items-end">
            <div className="relative w-full max-w-[600px] lg:max-w-[700px] h-full">
              <div className="absolute bottom-0 left-0 right-0 w-full h-full z-20 flex justify-center lg:justify-end">
                <img 
                  src="/mockupclient.png" 
                  alt="App Mobile Reza" 
                  className="max-w-full max-h-full object-contain object-bottom drop-shadow-2xl"
                />
              </div>

              {/* Decorative blob behind */}
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#C57B57]/20 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
