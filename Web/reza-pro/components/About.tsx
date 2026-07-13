'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, Clock, Tag, Star, MapPin } from 'lucide-react';

interface Slide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
}

const slides: Slide[] = [
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
  const offersCount = weeklyHighlights.length;

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
    setOfferAnimating(true);
    setOfferIndex(index);
    setOfferProgress(0);
    setTimeout(() => setOfferAnimating(false), 800);
  };

  const goToPrevOffer = () => {
    const newIndex = offerIndex === 0 ? offersCount - 1 : offerIndex - 1;
    goToOffer(newIndex);
  };

  const goToNextOffer = (force = false) => {
    const newIndex = offerIndex === offersCount - 1 ? 0 : offerIndex + 1;
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
    if (offerAnimating) return;
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
  }, [offerIndex, offerAnimating]);

  useEffect(() => {
    setOfferProgress(0);
  }, [offerIndex]);

  const currentSlide = slides[currentIndex];

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
                <button className="px-0 py-4 text-black hover:text-black hover:underline font-medium transition-colors">
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
                  {[weeklyHighlights[offerIndex]].map((offer) => (
                    <div
                      key={offer.id}
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
                          src={offer.image}
                          alt={offer.title}
                          className="w-full h-full object-cover rounded-l-lg"
                          style={{ height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      {/* Content fills right 70% */}
                      <div className="flex-1 p-4 flex flex-col justify-between relative">
                        {/* Category pill badge - original size and style */}
                        <div className="mb-2">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-black/90 text-white">
                            {offer.badge}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-black group-hover:text-black/80 transition-colors">
                            {offer.title}
                          </h3>
                          <p className="text-sm font-medium text-black/70">{offer.description}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5" style={{ fill: '#8b7260', color: '#8b7260' }} />
                              <span className="text-sm font-semibold text-black">{offer.rating}</span>
                            </div>
                            <span className="text-xs text-black/50">({offer.reviews})</span>
                          </div>
                          
                          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/20 border border-black/10">
                            <Clock className="w-3 h-3 text-black/60" />
                            <span className="text-xs font-medium text-black/60">{offer.timeLeft}</span>
                          </div>
                        </div>

                        {/* Réserver button responsive position */}
                        {/* Mobile: inline with content, Desktop: absolute bottom right */}
                        <div className="block lg:hidden mt-4">
                          <button className="px-4 py-2 rounded-full bg-black text-white text-sm font-medium hover:bg-black/90 transition-all duration-300 flex items-center gap-1.5 w-full justify-center">
                            <span>Réserver</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="hidden lg:block" style={{ position: 'absolute', right: 16, bottom: 10 }}>
                          <button className="px-4 py-2 rounded-full bg-black text-white text-sm font-medium hover:bg-black/90 transition-all duration-300 flex items-center gap-1.5">
                            <span>Réserver</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-6 items-center">
                  {/* Mobile: group left and right arrows together */}
                  <div className="flex gap-2 w-full lg:hidden">
                    <button
                      onClick={goToPrevOffer}
                      disabled={offerAnimating}
                      className="group w-24 h-10 rounded-full bg-black/5 backdrop-blur-xl border border-black/10 flex items-center justify-center hover:bg-black/10 hover:border-black/20 transition-all duration-300 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-6 h-6 text-black group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <button
                      onClick={() => goToNextOffer()}
                      disabled={offerAnimating}
                      className="group w-24 h-10 rounded-full bg-black/5 backdrop-blur-xl border border-black/10 flex items-center justify-center hover:bg-black/10 hover:border-black/20 transition-all duration-300 disabled:opacity-30"
                    >
                      <ChevronRight className="w-6 h-6 text-black group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                  {/* Desktop: keep arrows at ends */}
                  <button
                    onClick={goToPrevOffer}
                    disabled={offerAnimating}
                    className="group w-24 h-10 rounded-full bg-black/5 backdrop-blur-xl border border-black/10 flex items-center justify-center hover:bg-black/10 hover:border-black/20 transition-all duration-300 disabled:opacity-30 hidden lg:flex"
                  >
                    <ChevronLeft className="w-6 h-6 text-black group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  <div className="flex items-center gap-2 relative hidden lg:flex" style={{ minWidth: '60px' }}>
                    {weeklyHighlights.map((_, idx) => (
                      <button
                        key={idx}
                        disabled={offerAnimating}
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
                    ))}
                    <span className="ml-2 text-black/40 text-sm font-light">
                      <span className="text-black font-medium">{(offerIndex + 1).toString().padStart(2, '0')}</span>
                      {' '} / {' '}
                      <span>{offersCount.toString().padStart(2, '0')}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => goToNextOffer()}
                    disabled={offerAnimating}
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
                <button className="px-0 py-4 text-black hover:text-black hover:underline font-medium transition-colors">
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