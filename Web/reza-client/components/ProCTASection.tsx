'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ProCTASection() {
  return (
    <section className="py-16 md:py-24 bg-[#E8F3EE] dark:bg-[#0f1512] w-full overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          
          {/* Text Content */}
          <div className="flex-1 max-w-2xl text-left lg:pr-12">
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-[#2F2E2C] dark:text-white leading-[1.1] mb-6 tracking-tight">
              Reza pour<br />les professionnels
            </h2>
            
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-10 leading-relaxed font-light">
              Boostez votre activité avec la meilleure plateforme de réservation au monde pour les salons et les spas. Indépendamment voté n° 1 par les professionnels de l'industrie.
            </p>

            <Link 
              href="/pro-info" 
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors"
            >
              En savoir plus
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Image/Mockup */}
          <div className="flex-1 w-full lg:w-1/2 flex justify-end">
            <div className="relative w-full max-w-[600px]">
              {/* Web App Mockup Window */}
              <div className="relative w-full aspect-[4/3] bg-white dark:bg-gray-900 rounded-2xl md:rounded-[32px] border-4 border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden transform md:translate-x-12">
                {/* Mockup Header */}
                <div className="h-12 border-b border-gray-100 dark:border-gray-800 flex items-center px-4 bg-gray-50 dark:bg-gray-900">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="mx-auto font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></span>
                    reza
                  </div>
                </div>
                
                {/* Mockup Body - Calendar placeholder */}
                <div className="flex h-full">
                  {/* Sidebar */}
                  <div className="w-16 border-r border-gray-100 dark:border-gray-800 bg-[#0a0f2c] flex flex-col items-center py-4 gap-6">
                    <div className="w-6 h-6 rounded bg-white/20"></div>
                    <div className="w-6 h-6 rounded bg-white/20"></div>
                    <div className="w-6 h-6 rounded bg-white/20"></div>
                    <div className="w-6 h-6 rounded bg-white/20"></div>
                  </div>
                  {/* Calendar Grid */}
                  <div className="flex-1 p-4 bg-white dark:bg-black">
                    <div className="flex gap-4 mb-4">
                      <div className="w-40 h-8 rounded-full bg-gray-100 dark:bg-gray-800"></div>
                      <div className="w-40 h-8 rounded-full bg-gray-100 dark:bg-gray-800"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 h-[80%]">
                      <div className="border-r border-gray-100 dark:border-gray-800 relative">
                        <div className="absolute top-4 left-2 right-2 h-24 bg-blue-200 dark:bg-blue-900 rounded-md p-2">
                          <div className="w-1/2 h-2 bg-blue-300 dark:bg-blue-800 rounded mb-2"></div>
                          <div className="w-3/4 h-2 bg-blue-300 dark:bg-blue-800 rounded"></div>
                        </div>
                      </div>
                      <div className="border-r border-gray-100 dark:border-gray-800 relative">
                        <div className="absolute top-16 left-2 right-2 h-32 bg-pink-200 dark:bg-pink-900 rounded-md p-2">
                           <div className="w-1/2 h-2 bg-pink-300 dark:bg-pink-800 rounded mb-2"></div>
                           <div className="w-3/4 h-2 bg-pink-300 dark:bg-pink-800 rounded"></div>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute top-2 left-2 right-2 h-20 bg-green-200 dark:bg-green-900 rounded-md p-2">
                           <div className="w-1/2 h-2 bg-green-300 dark:bg-green-800 rounded mb-2"></div>
                           <div className="w-3/4 h-2 bg-green-300 dark:bg-green-800 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-yellow-300/30 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
