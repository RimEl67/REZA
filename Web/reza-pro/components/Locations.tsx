'use client';

import React, { useState } from 'react';

// SVG Icon Components
const ScissorsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-scissors"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 7m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M6 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M8.6 8.6l10.4 10.4" /><path d="M8.6 15.4l10.4 -10.4" /></svg>
);

const RazorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-razor-electric"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 3v2" /><path d="M12 3v2" /><path d="M16 3v2" /><path d="M9 12v6a3 3 0 0 0 6 0v-6h-6z" /><path d="M8 5h8l-1 4h-6z" /><path d="M12 17v1" /></svg>
);

const MassageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-massage"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M9 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M4 22l4 -2v-3h12" /><path d="M11 20h9" /><path d="M8 14l3 -2l1 -4c3 1 3 4 3 6" /></svg>
);

const ManucureIcon = () => (
  <img src="/icons/nail-polish.png" alt="Manucure" width={24} height={24} style={{ display: 'inline-block' }} />
);

const Locations = () => {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const cities = [
    'Casablanca',
    'Marrakesh'
  ];

  const categories = [
    {
      title: 'Coiffeur',
      description: 'Nos salons de coiffure.',
      icon: <ScissorsIcon />
    },
    {
      title: 'Barbier',
      description: 'Nos barbiers.',
      icon: <RazorIcon />
    },
    {
      title: 'Manucure',
      description: 'Nos salons de manucure.',
      icon: <ManucureIcon />
    },
    {
      title: 'Institut',
      description: 'Nos instituts de beauté.',
      icon: <MassageIcon />
    }
  ];

  return (
    <div className="min-h-screen bg-[#f5f7f3]">
      {/* Header */}
      <div className="border-b border-gray-200 mt-0 lg:mt-24">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-sm font-medium text-gray-600 tracking-wide uppercase">
            Bientôt dans tous le Maroc
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 leading-tight flex flex-wrap items-center gap-4 mb-20">
          Trouvez votre établissement beauté partout au Maroc
        </h1>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {categories.map((category, idx) => (
            <div key={idx} className="space-y-6">
              {/* Category Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-2xl font-light text-gray-900">
                    {category.title}
                  </h2>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {category.description}
                </p>
              </div>

              {/* City Links */}
              <div className="space-y-0">
                {cities.map((city, cityIdx) => (
                  <div
                    key={cityIdx}
                    className="relative group"
                    onMouseEnter={() => setHoveredCity(`${category.title}-${city}`)}
                    onMouseLeave={() => setHoveredCity(null)}
                  >
                    <a
                      href="#"
                      className="block py-2.5 text-gray-900 transition-all duration-200 relative"
                      onClick={(e) => e.preventDefault()}
                      style={{ position: 'relative', display: 'inline-block' }}
                    >
                      <span className={`relative z-10 transition-colors duration-200 ${
                        hoveredCity === `${category.title}-${city}` 
                          ? 'text-gray-900 font-medium' 
                          : 'text-gray-700'
                      }`} style={{ position: 'relative', display: 'inline-block' }}>
                        {city}
                        {/* Underline Effect - now directly under city name */}
                        <span 
                          className={`absolute left-0 right-0 bottom-0 h-px bg-gray-900 transition-all duration-200 ${
                            hoveredCity === `${category.title}-${city}` 
                              ? 'w-full opacity-100' 
                              : 'w-0 opacity-0'
                          }`}
                          style={{ display: 'block' }}
                        />
                      </span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Spacing */}
      <div className="h-32"></div>

     
    </div>
  );
};

export default Locations;