'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, Clock, Tag, Star, MapPin } from 'lucide-react';
import api from '../lib/api';
import { useRouter } from 'next/navigation';
import { filterCompleteTenants, getImageUrl, getSalonHref } from '../lib/utils';

interface Slide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
}

// Fallback slides (used if API fails)
const defaultSlides: Slide[] = [
  {
    id: 1,
    image: '/prestation/coiffeur.jpeg',
    title: 'Coiffeur',
    subtitle: 'Prestations',
    description: "Envie de changer de style ou simplement de rafraîchir votre coupe ? Nos coiffeurs experts sont là pour révéler votre beauté.",
    accent: '#000000'
  },
  {
    id: 2,
    image: '/prestation/barbier2.jpeg',
    title: 'Barbier',
    subtitle: 'Prestations',
    description: "Nos barbiers professionnels sculptent votre barbe et prennent soin de votre look avec précision et élégance.",
    accent: '#000000'
  },
  {
    id: 3,
    image: '/prestation/beautycenter2.png',
    title: 'Centre de beauté',
    subtitle: 'Prestations',
    description: "Découvrez nos soins du visage et du corps pour une expérience de bien-être complète et personnalisée.",
    accent: '#000000'
  },
  {
    id: 4,
    image: '/prestation/spa.jpeg',
    title: 'Hammam et SPA',
    subtitle: 'Prestations',
    description: "Détendez-vous dans nos hammams et spas, et profitez de rituels traditionnels pour une relaxation absolue.",
    accent: '#000000'
  },
];

// Map category names to images and descriptions
const categoryDefaults: Record<string, { image: string; description: string }> = {
  'Coiffeur': {
    image: '/prestation/coiffeur.jpeg',
    description: "Envie de changer de style ou simplement de rafraîchir votre coupe ? Nos coiffeurs experts sont là pour révéler votre beauté."
  },
  'Barbier': {
    image: '/prestation/barbier2.jpeg',
    description: "Nos barbiers professionnels sculptent votre barbe et prennent soin de votre look avec précision et élégance."
  },
  'Manucure': {
    image: '/prestation/beautycenter2.png',
    description: "Prenez soin de vos mains et pieds avec nos prestations de manucure et pédicure professionnelles."
  },
  'Institut de beauté': {
    image: '/prestation/beautycenter2.png',
    description: "Découvrez nos soins du visage et du corps pour une expérience de bien-être complète et personnalisée."
  },
  'Spa': {
    image: '/prestation/spa.jpeg',
    description: "Détendez-vous dans nos hammams et spas, et profitez de rituels traditionnels pour une relaxation absolue."
  },
  'Massage': {
    image: '/prestation/spa.jpeg',
    description: "Profitez de massages relaxants et thérapeutiques pour libérer les tensions et retrouver votre bien-être."
  },
  'Hammam': {
    image: '/prestation/spa.jpeg',
    description: "Découvrez les bienfaits du hammam traditionnel avec ses rituels de purification et ses soins à l'huile d'argan."
  }
};

const weeklyHighlights = [
  {
    id: 1,
    title: 'Rituel Mains & Pieds',
    image: '/incon/maniandpedi.jpeg',
    establishment: 'Nail Bar Chic',
    location: 'Racine',
    discount: 25,
    timeLeft: '2 jours',
    rating: 4.6,
    reviews: 75,
    badge: 'Beauté',
    description: "Prenez soin de vos mains et pieds avec notre rituel complet incluant bain, gommage et massage."
  },
  {
    id: 2,
    title: "Massage Relaxant",
    image: '/incon/massage.jpeg',
    establishment: 'Zen Spa',
    location: 'Oasis',
    discount: 29,
    timeLeft: '1 jour',
    rating: 4.7,
    reviews: 120,
    badge: 'Bien-être',
    description: "Profitez d'un massage relaxant qui libère les tensions et apporte une sensation de bien-être profond."
  },
  {
    id: 3,
    title: 'Hammam Traditionnel',
    image: '/incon/hammam.jpeg',
    establishment: 'Spa Royal Casablanca',
    location: 'Maarif',
    discount: 29,
    timeLeft: '4 jours',
    rating: 4.9,
    reviews: 98,
    badge: 'Purification',
    description: "Découvrez les bienfaits du hammam traditionnel avec ses rituels de purification et ses soins à l'huile d'argan."
  },
  {
    id: 4,
    image: '/incon/soinvisage.jpeg',
    title: 'Soin du Visage',
    subtitle: 'Prestations',
    description: "Offrez à votre peau un soin du visage personnalisé avec des produits naturels qui hydratent et purifient.",
    accent: '#000000'
  },
  {
    id: 5,
    title: 'Gommage Corporel',
    image: '/incon/gommage.jpeg',
    establishment: 'Spa Royal Casablanca',
    location: 'Maarif',
    discount: 29,
    timeLeft: '4 jours',
    rating: 4.8,
    reviews: 102,
    badge: 'Exfoliation',
    description: "Éliminez les cellules mortes et retrouvez une peau douce et lumineuse grâce à notre gommage corporel."
  },
  {
    id: 6,
    title: 'Enveloppement au Rhassoul',
    image: '/incon/ghassoul.jpeg',
    establishment: 'Spa Royal Casablanca',
    location: 'Maarif',
    discount: 25,
    timeLeft: '2 jours',
    rating: 4.7,
    reviews: 80,
    badge: 'Tradition',
    description: "Cet enveloppement à l'argile naturelle du Maroc purifie la peau en profondeur tout en lui apportant minéraux."
  },
  {
    id: 7,
    title: 'Massage aux Pierres Chaudes',
    image: '/incon/rock.jpeg',
    establishment: 'Zen Spa',
    location: 'Oasis',
    discount: 29,
    timeLeft: '1 jour',
    rating: 4.8,
    reviews: 110,
    badge: 'Thérapie',
    description: "Ressentez la chaleur bienfaisante des pierres volcaniques qui dénoue les tensions musculaires."
  },
  {
    id: 8,
    title: 'Réflexologie Plantaire',
    image: '/incon/refloxologie.jpeg',
    establishment: 'Zen Spa',
    location: 'Oasis',
    discount: 20,
    timeLeft: '3 jours',
    rating: 4.9,
    reviews: 95,
    badge: 'Équilibre',
    description: "Cette technique de massage des pieds stimule les zones réflexes pour un bien-être global."
  },
  {
    id: 9,
    title: 'Rituel Complet Spa',
    image: '/incon/spa.jpeg',
    establishment: 'Spa Royal Casablanca',
    location: 'Maarif',
    discount: 25,
    timeLeft: '2 jours',
    rating: 4.9,
    reviews: 156,
    badge: 'Expérience',
    description: "Offrez-vous une expérience complète avec hammam, gommage, enveloppement et massage pour une détente absolue"
  }
];

export default function BeautyCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [offerIndex, setOfferIndex] = useState(0);
  const [offerAnimating, setOfferAnimating] = useState(false);
  const [offerProgress, setOfferProgress] = useState(0);
  const [weeklyHighlightsData, setWeeklyHighlightsData] = useState<any[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [errorOffers, setErrorOffers] = useState<string | null>(null);
  const [slides, setSlides] = useState<Slide[]>(defaultSlides);
  const [loadingSlides, setLoadingSlides] = useState(true);
  const router = useRouter();
  
  const offersCount = weeklyHighlightsData.length;

  // Fetch categories and create slides dynamically
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingSlides(true);
        
        // Fetch categories from API
        const categoriesResponse = await api.getCategories();
        const fetchedCategories = categoriesResponse.categories || [];
        
        // Map main categories to slides
        const mainCategories = ['Coiffeur', 'Barbier', 'Manucure', 'Institut de beauté'];
        const formattedSlides = mainCategories
          .map((catName, index) => {
            const cat = fetchedCategories.find((c: any) => 
              c.name?.toLowerCase().includes(catName.toLowerCase()) ||
              catName.toLowerCase().includes(c.name?.toLowerCase() || '')
            );
            
            // Get default image and description for category
            const defaults = categoryDefaults[catName] || {
              image: '/prestation/beautycenter2.png',
              description: `Découvrez nos prestations ${catName.toLowerCase()} pour une expérience de qualité.`
            };
            
            // Use category description from API if available, otherwise use default
            const description = cat?.description || defaults.description;
            
            // Try to get image from tenant in this category, or use default
            return {
              id: index + 1,
              image: defaults.image,
              title: catName === 'Institut de beauté' ? 'Centre de beauté' : catName,
              subtitle: 'Prestations',
              description: description,
              accent: '#000000'
            };
          })
          .filter(Boolean) as Slide[];
        
        // If we have slides, use them, otherwise use defaults
        if (formattedSlides.length > 0) {
          setSlides(formattedSlides);
        } else {
          setSlides(defaultSlides);
        }
      } catch (error) {
        console.error('Error fetching categories for slides:', error);
        // Fallback to default slides
        setSlides(defaultSlides);
      } finally {
        setLoadingSlides(false);
      }
    };

    fetchCategories();
  }, []);

  // Calculate time left for offers (in days)
  const calculateTimeLeft = (days: number): string => {
    if (days <= 1) return '1 jour';
    return `${days} jours`;
  };

  // Fetch featured services/tenants for weekly highlights - DYNAMIC
  useEffect(() => {
    const fetchFeaturedServices = async () => {
      try {
        setLoadingOffers(true);
        setErrorOffers(null);
        
        // Fetch tenants with reviews to show featured ones (increased limit for better selection)
        const tenantsResponse = await api.searchTenants(undefined, undefined, undefined, 50);
        // Filter to only show tenants with complete information (all required fields from landing page)
        const completeTenants = filterCompleteTenants(tenantsResponse.tenants || []);
        
        if (completeTenants.length === 0) {
          // If no complete tenants, use fallback data
          setWeeklyHighlightsData(weeklyHighlights.slice(0, 9));
          return;
        }
        
        // Filter and sort tenants by rating (best first) - only from complete tenants
        const featuredTenants = completeTenants
          .filter((t: any) => t.rating && t.rating >= 4.0) // Lower threshold to get more results
          .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 12); // Get more than needed to ensure we have enough
        
        if (featuredTenants.length === 0) {
          // If no high-rated tenants, use any available complete tenants
          const availableTenants = completeTenants.slice(0, 9);
          
          const offersPromises = availableTenants.map(async (tenant: any, index: number) => {
            try {
              const servicesRes = await api.getTenantServices(tenant.id);
              const services = servicesRes.services || [];
              
              // Get first service or use tenant name
              const service = services.length > 0 ? services[0] : null;
              
              // Calculate a pseudo-discount based on tenant data or random
              const discount = tenant.discount || Math.floor(Math.random() * 10) + 20;
              
              // Calculate days left (random between 1-5 days for dynamic feel)
              const daysLeft = Math.floor(Math.random() * 5) + 1;
              
              return {
                id: tenant.id || `tenant-${index}`,
                subdomain: tenant.subdomain,
                domain: tenant.domain,
                title: service?.name || tenant.name || 'Prestation',
                image: getImageUrl(tenant.coverImage || tenant.logo) || weeklyHighlights[index % weeklyHighlights.length]?.image || '/incon/soinvisage.jpeg',
                establishment: tenant.name || 'Établissement',
                location: tenant.city || tenant.address || 'Casablanca',
                discount: discount,
                timeLeft: calculateTimeLeft(daysLeft),
                rating: tenant.rating || 4.5,
                reviews: tenant.reviews || tenant.reviewsCount || Math.floor(Math.random() * 100) + 50,
                badge: tenant.category || tenant.categories?.[0] || 'Beauté',
                description: service?.description || service?.name || tenant.description || 'Découvrez cette prestation de qualité'
              };
            } catch (error) {
              console.error(`Error fetching services for tenant ${tenant.id}:`, error);
              // Return basic offer from tenant data only
              const daysLeft = Math.floor(Math.random() * 5) + 1;
              return {
                id: tenant.id || `tenant-${index}`,
                subdomain: tenant.subdomain,
                domain: tenant.domain,
                title: tenant.name || 'Prestation',
                image: getImageUrl(tenant.coverImage || tenant.logo) || weeklyHighlights[index % weeklyHighlights.length]?.image || '/incon/soinvisage.jpeg',
                establishment: tenant.name || 'Établissement',
                location: tenant.city || tenant.address || 'Casablanca',
                discount: Math.floor(Math.random() * 10) + 20,
                timeLeft: calculateTimeLeft(daysLeft),
                rating: tenant.rating || 4.5,
                reviews: tenant.reviews || tenant.reviewsCount || 50,
                badge: tenant.category || tenant.categories?.[0] || 'Beauté',
                description: tenant.description || 'Découvrez cette prestation de qualité'
              };
            }
          });
          
          const fetchedOffers = await Promise.all(offersPromises);
          const validOffers = fetchedOffers.filter((offer): offer is any => offer !== null && offer.id);
          
          if (validOffers.length > 0) {
            setWeeklyHighlightsData(validOffers.slice(0, 9));
          } else {
            // Fallback to static data if no valid offers
            setWeeklyHighlightsData(weeklyHighlights.slice(0, 9));
          }
          return;
        }
        
        // Process featured tenants with services
        const offersPromises = featuredTenants.map(async (tenant: any, index: number) => {
          try {
            const servicesRes = await api.getTenantServices(tenant.id);
            const services = servicesRes.services || [];
            
            // Get first service or use tenant name
            const service = services.length > 0 ? services[Math.floor(Math.random() * Math.min(services.length, 3))] : null;
            
            // Calculate discount (could be from tenant data or random)
            const discount = tenant.discount || Math.floor(Math.random() * 10) + 20;
            
            // Calculate days left dynamically
            const daysLeft = Math.floor(Math.random() * 5) + 1;
            
            return {
              id: tenant.id || `tenant-${index}`,
                subdomain: tenant.subdomain,
                domain: tenant.domain,
              title: service?.name || tenant.name || 'Prestation',
              image: getImageUrl(tenant.coverImage || tenant.logo) || weeklyHighlights[index % weeklyHighlights.length]?.image || '/incon/soinvisage.jpeg',
              establishment: tenant.name || 'Établissement',
              location: tenant.city || tenant.address || 'Casablanca',
              discount: discount,
              timeLeft: calculateTimeLeft(daysLeft),
              rating: tenant.rating || 4.5,
              reviews: tenant.reviews || tenant.reviewsCount || Math.floor(Math.random() * 100) + 50,
              badge: tenant.category || tenant.categories?.[0] || 'Beauté',
              description: service?.description || service?.name || tenant.description || 'Prestation de qualité'
            };
          } catch (error) {
            console.error(`Error fetching services for tenant ${tenant.id}:`, error);
            // Return basic offer from tenant data only
            const daysLeft = Math.floor(Math.random() * 5) + 1;
            return {
              id: tenant.id || `tenant-${index}`,
                subdomain: tenant.subdomain,
                domain: tenant.domain,
              title: tenant.name || 'Prestation',
              image: getImageUrl(tenant.coverImage || tenant.logo) || weeklyHighlights[index % weeklyHighlights.length]?.image || '/incon/soinvisage.jpeg',
              establishment: tenant.name || 'Établissement',
              location: tenant.city || tenant.address || 'Casablanca',
              discount: Math.floor(Math.random() * 10) + 20,
              timeLeft: calculateTimeLeft(daysLeft),
              rating: tenant.rating || 4.5,
              reviews: tenant.reviews || tenant.reviewsCount || 50,
              badge: tenant.category || tenant.categories?.[0] || 'Beauté',
              description: tenant.description || 'Prestation de qualité'
            };
          }
        });
        
        const fetchedOffers = await Promise.all(offersPromises);
        const validOffers = fetchedOffers.filter((offer): offer is any => offer !== null && offer.id);
        
        if (validOffers.length > 0) {
          // Shuffle and take up to 9 offers for variety
          const shuffled = validOffers.sort(() => Math.random() - 0.5);
          setWeeklyHighlightsData(shuffled.slice(0, 9));
          
          // Reset index if current index is out of bounds
          if (offerIndex >= shuffled.length) {
            setOfferIndex(0);
          }
        } else {
          // Fallback to static data if no valid offers
          setWeeklyHighlightsData(weeklyHighlights.slice(0, 9));
        }
      } catch (error) {
        console.error('Error fetching featured services:', error);
        setErrorOffers('Impossible de charger les offres. Utilisation des données par défaut.');
        // Fallback to static data on error
        setWeeklyHighlightsData(weeklyHighlights.slice(0, 9));
      } finally {
        setLoadingOffers(false);
      }
    };

    fetchFeaturedServices();
    
    // Refresh offers every 5 minutes for dynamic updates
    const refreshInterval = setInterval(() => {
      fetchFeaturedServices();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Reset offer index when data changes
  useEffect(() => {
    if (weeklyHighlightsData.length > 0 && offerIndex >= weeklyHighlightsData.length) {
      setOfferIndex(0);
    }
  }, [weeklyHighlightsData.length, offerIndex]);

  const goToSlide = (index: number, force = false) => {
    if (isAnimating && !force) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setProgress(0);
    setTimeout(() => setIsAnimating(false), 800);
  };

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  };

  const goToNext = (force = false) => {
    const newIndex = currentIndex === slides.length - 1 ? 0 : currentIndex + 1;
    goToSlide(newIndex, force);
  };

  const goToOffer = (index: number, force = false) => {
    if (offerAnimating && !force) return;
    if (index < 0 || index >= weeklyHighlightsData.length) return;
    setOfferAnimating(true);
    setOfferIndex(index);
    setOfferProgress(0);
    setTimeout(() => setOfferAnimating(false), 800);
  };

  const goToPrevOffer = () => {
    const newIndex = offerIndex === 0 ? weeklyHighlightsData.length - 1 : offerIndex - 1;
    goToOffer(newIndex);
  };

  const goToNextOffer = (force = false) => {
    const newIndex = offerIndex === weeklyHighlightsData.length - 1 ? 0 : offerIndex + 1;
    goToOffer(newIndex, force);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goToNext(true);
          return 0;
        }
        return prev + 0.5;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isAnimating]);

  useEffect(() => {
    if (offerAnimating || weeklyHighlightsData.length === 0 || loadingOffers) return;
    const interval = setInterval(() => {
      setOfferProgress(prev => {
        if (prev >= 100) {
          goToNextOffer(true);
          return 0;
        }
        return prev + 0.5;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [offerIndex, offerAnimating, weeklyHighlightsData.length, loadingOffers]);

  useEffect(() => {
    setOfferProgress(0);
  }, [offerIndex]);

  const currentSlide = slides[currentIndex] || slides[0];

  // Show loading state if slides are being fetched
  if (loadingSlides || !currentSlide) {
    return (
      <div className="min-h-screen bg-[#f5f7f3] relative overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des prestations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f3] relative overflow-hidden">
      <div className="absolute inset-0 bg-[#f5f7f3]" />

      {/* Carousel Section */}
      <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center p-4 relative">
        <div className="w-full max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left: Content Section */}
            <div className="order-1 lg:order-1 space-y-8 px-2 pt-6 pb-2 lg:px-0 lg:pt-0 lg:pb-0">
              
              <div className="overflow-hidden">
                <h2
                  key={`subtitle-${currentIndex}`}
                  className="text-sm font-medium uppercase tracking-[0.2em] animate-slideUp text-black"
                >
                  {currentSlide.subtitle}
                </h2>
              </div>

              <div className="overflow-hidden">
                <h1
                  key={`title-${currentIndex}`}
                  className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 leading-tight animate-slideUp"
                  style={{
                    background: 'none',
                    WebkitBackgroundClip: undefined,
                    WebkitTextFillColor: undefined,
                    backgroundClip: undefined,
                  }}
                >
                  {currentSlide.title}
                </h1>
              </div>

              <div className="h-1 rounded-full animate-expand" style={{ background: '#8b7260' }} />

              <div className="overflow-hidden">
                <p
                  key={`desc-${currentIndex}`}
                  className="text-lg md:text-xl text-black/70 leading-relaxed max-w-xl animate-slideUp font-light"
                >
                  {currentSlide.description}
                </p>
              </div>

              <div className="flex items-center gap-6 -mt-6">
                <button 
                  onClick={() => {
                    // Map display title back to API category name
                    let categoryName = currentSlide.title;
                    if (currentSlide.title === 'Centre de beauté') {
                      categoryName = 'Institut de beauté';
                    }
                    router.push(`/search-results?query=${encodeURIComponent(currentSlide.title)}&category=${encodeURIComponent(categoryName)}`);
                  }}
                  className="px-0 py-4 text-black hover:text-black hover:underline font-medium transition-colors cursor-pointer"
                >
                  En savoir plus
                </button>
              </div>

              <div className="flex flex-col gap-2 -mt-2 pb-12 lg:pb-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={goToPrevious}
                    disabled={isAnimating}
                    className="group w-24 h-10 rounded-full bg-black/5 backdrop-blur-xl border border-black/10 flex items-center justify-center hover:bg-black/10 hover:border-black/20 transition-all duration-300 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-6 h-6 text-black group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  
                  <button
                    onClick={() => goToNext()}
                    disabled={isAnimating}
                    className="group w-24 h-10 rounded-full bg-black/5 backdrop-blur-xl border border-black/10 flex items-center justify-center hover:bg-black/10 hover:border-black/20 transition-all duration-300 disabled:opacity-30"
                  >
                    <ChevronRight className="w-6 h-6 text-black group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 mt-2 hidden lg:flex">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      disabled={isAnimating}
                      className="group relative h-3 rounded-xl transition-all duration-300 overflow-hidden"
                      style={{ 
                        width: index === currentIndex ? '48px' : '24px',
                        backgroundColor: index === currentIndex ? 'transparent' : 'rgba(0,0,0,0.08)'
                      }}
                    >
                      {index === currentIndex && (
                        <>
                          <div 
                            className="absolute inset-0 rounded-xl opacity-20"
                            style={{ backgroundColor: '#8b7260' }}
                          />
                          <div 
                            className="absolute inset-0 rounded-xl transition-all duration-100"
                            style={{ 
                              backgroundColor: '#8b7260',
                              width: `${progress}%`,
                            }}
                          />
                        </>
                      )}
                    </button>
                  ))}
                  <div className="text-black/40 text-sm font-light ml-2">
                    <span className="text-black font-medium">{(currentIndex + 1).toString().padStart(2, '0')}</span>
                    {' '}/{' '}
                    <span>{slides.length.toString().padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Image Section */}
            <div className="order-2 lg:order-2 relative h-[320px] md:h-[600px] lg:h-[700px] w-full flex justify-center items-center mt-4 lg:mt-0 mb-24 lg:mb-0">
              <div className="relative h-full flex items-center justify-center">
                {slides.map((slide, index) => {
                  const offset = index - currentIndex;
                  const isActive = offset === 0;
                  
                  return (
                    <div
                      key={slide.id}
                      className="absolute transition-all duration-700 ease-out"
                      style={{
                        transform: `
                          translateX(${offset * 100}%) 
                          scale(${isActive ? 1 : 0.85}) 
                          rotateY(${offset * -15}deg)
                        `,
                        opacity: isActive ? 1 : 0,
                        zIndex: isActive ? 10 : 0,
                        pointerEvents: isActive ? 'auto' : 'none',
                      }}
                    >
                      <div className="relative w-[320px] h-[480px] md:w-[380px] md:h-[560px] lg:w-[540px] lg:h-[440px]">
                        <div className="absolute inset-0 rounded-lg bg-black/5 backdrop-blur-xl">
                          <div className="relative w-full h-full rounded-lg overflow-hidden">
                            <img
                              src={slide.image}
                              alt={slide.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offers Section - Responsive */}
      <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center p-4 relative -mt-0 lg:-mt-32 mb-12 lg:mb-0">
        <div className="w-full max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left: Offers Grid */}
            <div className="order-2 lg:order-1 w-full -mt-6 lg:mt-0">
              <div className="relative overflow-hidden">
                <div
                  className={`grid gap-6 ${offerAnimating ? 'offer-fade-out' : 'offer-fade-in'}`}
                  style={{
                    transition: 'opacity 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1)',
                    opacity: offerAnimating ? 0 : 1,
                    transform: offerAnimating ? 'scale(0.98)' : 'scale(1)',
                  }}
                >
                  {loadingOffers ? (
                    <div className="group relative overflow-hidden rounded-lg bg-black/5 backdrop-blur-xl border border-black/10 flex items-center justify-center"
                      style={{ minHeight: '180px' }}>
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-black"></div>
                        <p className="text-sm text-black/60">Chargement des offres...</p>
                      </div>
                    </div>
                  ) : weeklyHighlightsData.length > 0 && weeklyHighlightsData[offerIndex] ? (
                    <div
                      key={weeklyHighlightsData[offerIndex].id}
                      className="group relative overflow-hidden rounded-lg bg-black/5 backdrop-blur-xl border border-black/10 hover:border-black/20 transition-all duration-400 hover:shadow-xl hover:shadow-black/5 flex"
                      style={{
                        transition: 'opacity 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1)',
                        minHeight: '180px',
                        position: 'relative',
                      }}
                    >
                      {/* Image fills left 30% */}
                      <div className="relative" style={{ width: '30%', minWidth: '120px', height: '100%' }}>
                        <img
                          src={weeklyHighlightsData[offerIndex].image}
                          alt={weeklyHighlightsData[offerIndex].title}
                          className="w-full h-full object-cover rounded-l-lg"
                          style={{ height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      {/* Content fills right 70% */}
                      <div className="flex-1 p-4 flex flex-col justify-between relative">
                        {/* Category pill badge - original size and style */}
                        <div className="mb-2">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-black/90 text-white">
                            {weeklyHighlightsData[offerIndex].badge}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-black group-hover:text-black/80 transition-colors">
                            {weeklyHighlightsData[offerIndex].title}
                          </h3>
                          <p className="text-sm font-medium text-black/70">{weeklyHighlightsData[offerIndex].description}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5" style={{ fill: '#8b7260', color: '#8b7260' }} />
                              <span className="text-sm font-semibold text-black">{weeklyHighlightsData[offerIndex].rating}</span>
                            </div>
                            <span className="text-xs text-black/50">({weeklyHighlightsData[offerIndex].reviews})</span>
                          </div>
                          
                          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/20 border border-black/10">
                            <Clock className="w-3 h-3 text-black/60" />
                            <span className="text-xs font-medium text-black/60">{weeklyHighlightsData[offerIndex].timeLeft}</span>
                          </div>
                        </div>

                        {/* Réserver button responsive position */}
                        {/* Mobile: inline with content, Desktop: absolute bottom right */}
                        <div className="block lg:hidden mt-4">
                          <button 
                            onClick={() => router.push(getSalonHref(weeklyHighlightsData[offerIndex]))}
                            className="px-4 py-2 rounded-full bg-black text-white text-sm font-medium hover:bg-black/90 transition-all duration-300 flex items-center gap-1.5 w-full justify-center"
                          >
                            <span>Réserver</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="hidden lg:block" style={{ position: 'absolute', right: 16, bottom: 10 }}>
                          <button 
                            onClick={() => router.push(getSalonHref(weeklyHighlightsData[offerIndex]))}
                            className="px-4 py-2 rounded-full bg-black text-white text-sm font-medium hover:bg-black/90 transition-all duration-300 flex items-center gap-1.5"
                          >
                            <span>Réserver</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative overflow-hidden rounded-lg bg-black/5 backdrop-blur-xl border border-black/10 flex items-center justify-center"
                      style={{ minHeight: '180px' }}>
                      <div className="text-center p-4">
                        <p className="text-sm text-black/60">Aucune offre disponible pour le moment.</p>
                      </div>
                    </div>
                  )}
                </div>
                {errorOffers && (
                  <div className="mt-2 text-xs text-orange-600/80 text-center">
                    {errorOffers}
                  </div>
                )}
                <div className="flex justify-between mt-6 items-center">
                  {/* Mobile: group left and right arrows together */}
                  <div className="flex gap-2 w-full lg:hidden">
                    <button
                      onClick={goToPrevOffer}
                      disabled={offerAnimating || loadingOffers || weeklyHighlightsData.length === 0}
                      className="group w-24 h-10 rounded-full bg-black/5 backdrop-blur-xl border border-black/10 flex items-center justify-center hover:bg-black/10 hover:border-black/20 transition-all duration-300 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-6 h-6 text-black group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <button
                      onClick={() => goToNextOffer()}
                      disabled={offerAnimating || loadingOffers || weeklyHighlightsData.length === 0}
                      className="group w-24 h-10 rounded-full bg-black/5 backdrop-blur-xl border border-black/10 flex items-center justify-center hover:bg-black/10 hover:border-black/20 transition-all duration-300 disabled:opacity-30"
                    >
                      <ChevronRight className="w-6 h-6 text-black group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                  {/* Desktop: keep arrows at ends */}
                  <button
                    onClick={goToPrevOffer}
                    disabled={offerAnimating || loadingOffers || weeklyHighlightsData.length === 0}
                    className="group w-24 h-10 rounded-full bg-black/5 backdrop-blur-xl border border-black/10 flex items-center justify-center hover:bg-black/10 hover:border-black/20 transition-all duration-300 disabled:opacity-30 hidden lg:flex"
                  >
                    <ChevronLeft className="w-6 h-6 text-black group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  <div className="flex items-center gap-2 relative hidden lg:flex" style={{ minWidth: '60px' }}>
                    {loadingOffers ? (
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-xl bg-black/20 animate-pulse"></div>
                        <span className="ml-2 text-black/40 text-sm font-light">-- / --</span>
                      </div>
                    ) : (
                      weeklyHighlightsData.map((_, idx) => (
                        <button
                          key={idx}
                          disabled={offerAnimating || loadingOffers}
                          onClick={() => goToOffer(idx)}
                          className="group relative h-3 rounded-xl transition-all duration-300 overflow-hidden"
                        style={{
                          width: offerIndex === idx ? '48px' : '24px',
                          backgroundColor: offerIndex === idx ? 'transparent' : 'rgba(0,0,0,0.08)'
                        }}
                      >
                        {offerIndex === idx && (
                          <>
                            <div 
                              className="absolute inset-0 rounded-xl opacity-20"
                              style={{ backgroundColor: '#8b7260' }}
                            />
                            <div 
                              className="absolute inset-0 rounded-xl transition-all duration-100"
                              style={{ 
                                backgroundColor: '#8b7260',
                                width: `${offerProgress}%`,
                              }}
                            />
                          </>
                        )}
                      </button>
                    )))}
                    {!loadingOffers && (
                      <span className="ml-2 text-black/40 text-sm font-light">
                        <span className="text-black font-medium">{(offerIndex + 1).toString().padStart(2, '0')}</span>
                        {' '} / {' '}
                        <span>{offersCount.toString().padStart(2, '0')}</span>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => goToNextOffer()}
                    disabled={offerAnimating || loadingOffers || weeklyHighlightsData.length === 0}
                    className="group w-24 h-10 rounded-full bg-black/5 backdrop-blur-xl border border-black/10 flex items-center justify-center hover:bg-black/10 hover:border-black/20 transition-all duration-300 disabled:opacity-30 hidden lg:flex"
                  >
                    <ChevronRight className="w-6 h-6 text-black group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Content Section */}
            <div className="order-1 lg:order-2 space-y-8 px-2 pt-6 pb-2 lg:px-0 lg:pt-0 lg:pb-0 w-full">
              <div className="overflow-hidden">
                <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-black">
                  Offres Exclusives
                </h2>
              </div>

              <div className="overflow-hidden">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 leading-tight"
                  style={{
                    background: 'none',
                    WebkitBackgroundClip: undefined,
                    WebkitTextFillColor: undefined,
                    backgroundClip: undefined,
                  }}
                >
                  Les incontournables de la semaine
                </h1>
              </div>

              <div className="h-1 rounded-full animate-expand" style={{ background: '#8b7260' }} />

              <div className="overflow-hidden">
                <p className="text-lg md:text-xl text-black/70 leading-relaxed max-w-xl font-light">
                  Offres limitées, expériences inoubliables - ne passez pas à côté !
                </p>
              </div>

              <div className="flex items-center gap-6 -mt-6">
                <button 
                  onClick={() => router.push('/search-results')}
                  className="px-0 py-4 text-black hover:text-black hover:underline font-medium transition-colors"
                >
                  Voir toutes les offres
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes expand {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            width: 128px;
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-expand {
          animation: expand 1s ease-out forwards;
        }

        .offer-fade-in {
          opacity: 1;
          transform: scale(1);
        }
        .offer-fade-out {
          opacity: 0;
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}