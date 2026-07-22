'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';
import { MOROCCAN_CITIES, filterCompleteTenants } from '../lib/utils';

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
  const [categories, setCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [cityCounts, setCityCounts] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [cityPageByCategory, setCityPageByCategory] = useState<Record<string, number>>({});
  const router = useRouter();
  const CITIES_PER_PAGE = 10;

  // Icon mapping for categories
  const getCategoryIcon = (categoryTitle: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      'Coiffeur': <ScissorsIcon />,
      'Barbier': <RazorIcon />,
      'Manucure': <ManucureIcon />,
      'Institut': <MassageIcon />,
      'Institut de beauté': <MassageIcon />,
    };
    return iconMap[categoryTitle] || <ScissorsIcon />;
  };

  // Fetch categories and cities from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const categoriesResponse = await api.getCategories();
        const fetchedCategories = categoriesResponse.categories || [];
        
        // Map to our format, only include main categories
        const mainCategories = ['Coiffeur', 'Barbier', 'Manucure', 'Institut de beauté'];
        const formattedCategories = mainCategories.map(catName => {
          const cat = fetchedCategories.find((c: any) => 
            c.name?.toLowerCase().includes(catName.toLowerCase()) ||
            catName.toLowerCase().includes(c.name?.toLowerCase() || '')
          );
          
          return {
            title: catName === 'Institut de beauté' ? 'Institut' : catName,
            description: cat?.description || `Nos ${catName.toLowerCase()}s.`,
            icon: getCategoryIcon(catName),
            apiName: catName
          };
        });
        
        setCategories(formattedCategories);

        // Fetch all tenants to get counts per city and category
        const tenantsResponse = await api.searchTenants(undefined, undefined, undefined, 1000);
        // Filter to only count tenants with complete information (all required fields from landing page)
        const completeTenants = filterCompleteTenants(tenantsResponse.tenants || []);
        
        // Use all Moroccan cities (excluding "Autre" for display purposes)
        const allMoroccanCities = MOROCCAN_CITIES.filter(city => city !== 'Autre');
        
        // Sort cities: Casablanca and Marrakech first, then alphabetically
        const priorityCities = ['Casablanca', 'Marrakech'];
        const otherCities = allMoroccanCities
          .filter(city => !priorityCities.some(priority => 
            city.toLowerCase() === priority.toLowerCase()
          ))
          .sort((a, b) => a.localeCompare(b, 'fr'));
        
        // Combine: priority cities first, then others
        const sortedCities = [
          ...priorityCities.filter(priority => 
            allMoroccanCities.some(city => city.toLowerCase() === priority.toLowerCase())
          ),
          ...otherCities
        ];
        
        setCities(sortedCities);

        // Count tenants per category per city (only complete tenants)
        const counts: Record<string, Record<string, number>> = {};
        formattedCategories.forEach(cat => {
          counts[cat.apiName] = {};
          sortedCities.forEach(city => {
            const count = completeTenants.filter((tenant: any) => {
              const tenantCity = (tenant.city?.trim() || '').toLowerCase();
              const tenantCategory = (tenant.category?.toLowerCase() || '');
              const cityMatch = city.toLowerCase() === tenantCity;
              const categoryMatch = cat.apiName.toLowerCase() === tenantCategory || 
                                   tenantCategory.includes(cat.apiName.toLowerCase());
              return cityMatch && categoryMatch;
            }).length;
            counts[cat.apiName][city] = count;
          });
        });
        
        setCityCounts(counts);
      } catch (error) {
        console.error('Error fetching locations data:', error);
        // Fallback to default data
        setCategories([
          { title: 'Coiffeur', description: 'Nos coiffeurs.', icon: <ScissorsIcon />, apiName: 'Coiffeur' },
          { title: 'Barbier', description: 'Nos barbiers.', icon: <RazorIcon />, apiName: 'Barbier' },
          { title: 'Manucure', description: 'Nos manucures.', icon: <ManucureIcon />, apiName: 'Manucure' },
          { title: 'Institut', description: 'Nos institut de beautés.', icon: <MassageIcon />, apiName: 'Institut de beauté' }
        ]);
        // Fallback: use all Moroccan cities sorted with priority
        const fallbackCities = MOROCCAN_CITIES.filter(city => city !== 'Autre');
        const priorityCities = ['Casablanca', 'Marrakech'];
        const otherCities = fallbackCities
          .filter(city => !priorityCities.some(priority => 
            city.toLowerCase() === priority.toLowerCase()
          ))
          .sort((a, b) => a.localeCompare(b, 'fr'));
        setCities([...priorityCities, ...otherCities]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCityClick = (city: string, category: string) => {
    router.push(`/search-results?query=${encodeURIComponent(category)}&location=${encodeURIComponent(city)}&category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="min-h-screen bg-white">
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
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-0">
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
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

              {/* City Links — paginated, no long scroll */}
              <div className="space-y-0">
                {loading ? (
                  <div className="py-2.5 text-gray-500">Chargement...</div>
                ) : cities.length > 0 ? (
                  (() => {
                    const page = cityPageByCategory[category.title] || 0;
                    const totalPages = Math.max(1, Math.ceil(cities.length / CITIES_PER_PAGE));
                    const safePage = Math.min(page, totalPages - 1);
                    const pageCities = cities.slice(
                      safePage * CITIES_PER_PAGE,
                      safePage * CITIES_PER_PAGE + CITIES_PER_PAGE
                    );
                    return (
                      <>
                        {pageCities.map((city, cityIdx) => {
                          const count = cityCounts[category.apiName]?.[city] || 0;
                          return (
                            <div
                              key={cityIdx}
                              className="relative group"
                              onMouseEnter={() => setHoveredCity(`${category.title}-${city}`)}
                              onMouseLeave={() => setHoveredCity(null)}
                            >
                              <button
                                onClick={() => handleCityClick(city, category.apiName)}
                                className="block py-2.5 text-gray-900 transition-all duration-200 relative text-left w-full"
                                style={{ position: 'relative', display: 'inline-block' }}
                              >
                                <span className={`relative z-10 transition-colors duration-200 flex items-center gap-2 ${
                                  hoveredCity === `${category.title}-${city}` 
                                    ? 'text-gray-900 font-medium' 
                                    : 'text-gray-700'
                                }`} style={{ position: 'relative', display: 'inline-block' }}>
                                  {city}
                                  {count > 0 && (
                                    <span className="text-xs text-gray-400">({count})</span>
                                  )}
                                  <span 
                                    className={`absolute left-0 right-0 bottom-0 h-px bg-gray-900 transition-all duration-200 ${
                                      hoveredCity === `${category.title}-${city}` 
                                        ? 'w-full opacity-100' 
                                        : 'w-0 opacity-0'
                                    }`}
                                    style={{ display: 'block' }}
                                  />
                                </span>
                              </button>
                            </div>
                          );
                        })}
                        {totalPages > 1 && (
                          <div className="flex items-center gap-2 pt-3 text-xs text-gray-500">
                            <button
                              type="button"
                              disabled={safePage === 0}
                              onClick={() =>
                                setCityPageByCategory((prev) => ({
                                  ...prev,
                                  [category.title]: Math.max(0, safePage - 1),
                                }))
                              }
                              className="underline disabled:no-underline disabled:opacity-40"
                            >
                              Préc.
                            </button>
                            <span className="tabular-nums">
                              {safePage + 1}/{totalPages}
                            </span>
                            <button
                              type="button"
                              disabled={safePage >= totalPages - 1}
                              onClick={() =>
                                setCityPageByCategory((prev) => ({
                                  ...prev,
                                  [category.title]: Math.min(totalPages - 1, safePage + 1),
                                }))
                              }
                              className="underline disabled:no-underline disabled:opacity-40"
                            >
                              Suiv.
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()
                ) : (
                  <div className="py-2.5 text-gray-500">Aucune ville disponible</div>
                )}
              </div>
            </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Spacing */}
      <div className="h-32"></div>

     
    </div>
  );
};

export default Locations;