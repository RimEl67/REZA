'use client';

import React from 'react';
import { Star, MapPin, Heart } from 'lucide-react';
import Link from 'next/link';

const MOCK_NEW = [
  {
    id: '6',
    name: 'Glow Beauty Lounge',
    rating: 5.0,
    reviews: 12,
    location: 'Palmier, Casablanca',
    distance: '1.5 km',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop',
    tags: ['Nouveau', 'Coiffure', 'Onglerie']
  },
  {
    id: '7',
    name: 'The Gentlemen\'s Club',
    rating: 0,
    reviews: 0,
    location: 'Gauthier, Casablanca',
    distance: '0.9 km',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop',
    tags: ['Nouveau', 'Barbier']
  },
  {
    id: '8',
    name: 'Pure Zen Spa',
    rating: 4.5,
    reviews: 8,
    location: 'CIL, Casablanca',
    distance: '3.2 km',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop',
    tags: ['Nouveau', 'Spa', 'Massages']
  },
  {
    id: '9',
    name: 'Color Studio by S',
    rating: 5.0,
    reviews: 24,
    location: 'Maarif, Casablanca',
    distance: '1.1 km',
    image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=800&auto=format&fit=crop',
    tags: ['Nouveau', 'Coloration']
  },
  {
    id: '10',
    name: 'Le Cercle Beauté',
    rating: 0,
    reviews: 0,
    location: 'Anfa, Casablanca',
    distance: '4.5 km',
    image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?q=80&w=800&auto=format&fit=crop',
    tags: ['Nouveau', 'Esthétique']
  }
];

export default function NewSalonsSection() {
  return (
    <section className="py-12 bg-white dark:bg-black w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#2F2E2C] dark:text-white mb-2">Nouveaux sur Reza</h2>
            <p className="text-gray-600 dark:text-gray-400">Découvrez les dernières pépites beauté et bien-être</p>
          </div>
          <Link href="/search-results" className="text-sm font-semibold text-[#0a0f2c] dark:text-gray-300 hover:underline hidden sm:block">
            Voir tout
          </Link>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 custom-scrollbar snap-x snap-mandatory">
          {MOCK_NEW.map((salon) => (
            <div key={salon.id} className="min-w-[280px] md:min-w-[320px] max-w-[320px] flex-shrink-0 snap-start bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer border border-gray-100 dark:border-gray-800">
              {/* Image Container */}
              <div className="relative h-48 w-full overflow-hidden">
                <img 
                  src={salon.image} 
                  alt={salon.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <button className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
                  <Heart className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate mb-1">
                  {salon.name}
                </h3>
                
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                    {salon.rating > 0 ? salon.rating : 'Nouveau'} {salon.rating > 0 && <Star className="w-3.5 h-3.5 fill-current text-[#0a0f2c] dark:text-white" />}
                  </span>
                  {salon.reviews > 0 && (
                    <>
                      <span className="mx-1.5">•</span>
                      <span>{salon.reviews.toLocaleString()} avis</span>
                    </>
                  )}
                </div>

                <div className="flex items-center text-sm text-gray-500 mb-4 truncate">
                  <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{salon.distance} • {salon.location}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {salon.tags.map(tag => (
                    <span key={tag} className={`px-2 py-1 text-xs font-medium rounded-md ${tag === 'Nouveau' ? 'bg-[#0a0f2c] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
