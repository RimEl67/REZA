'use client';

import React, { useState, useEffect } from 'react';
import { QrCode } from 'lucide-react';

export default function StatsBanner() {
  const [count, setCount] = useState(512400);
  const targetCount = 512501;

  useEffect(() => {
    let startTimestamp: number;
    const duration = 2000; // 2 seconds

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function for smooth deceleration
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setCount(Math.floor(512400 + (101 * easeOutQuart)));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, []);

  // Format number with spaces (e.g. "512 501")
  const formattedCount = count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return (
    <div className="w-full bg-gradient-to-r from-[#EAE2F8] to-[#FBE4F8] py-8 border-y border-[#F3E8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-center md:text-left">
        
        {/* Animated Counter */}
        <div className="flex items-center justify-center gap-2">
          <span className="font-mono text-4xl md:text-5xl font-bold text-[#111827] tracking-tight w-[180px] md:w-[220px] text-right">
            {formattedCount}
          </span>
          <span className="text-xl md:text-2xl text-gray-800 font-light tracking-wide">
            rendez-vous pris aujourd&apos;hui
          </span>
        </div>

        {/* Download App Button */}
        <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-[#111827] px-6 py-3 rounded-full font-semibold shadow-sm transition-all active:scale-[0.98] border border-gray-100">
          <span>Télécharger l&apos;app</span>
          <QrCode className="w-5 h-5 text-gray-800" />
        </button>

      </div>
    </div>
  );
}
