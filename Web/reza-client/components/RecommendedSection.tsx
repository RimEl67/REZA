'use client';

import React from 'react';
import { Star, MapPin, Heart } from 'lucide-react';
import Link from 'next/link';

const MOCK_RECOMMENDED = [
  {
    id: '1',
    name: 'Maison de Beauté Rive Droite',
    rating: 4.9,
    reviews: 842,
    location: 'Maarif, Casablanca',
    distance: '1.2 km',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop',
    tags: ['Coupe', 'Coloration', 'Soin Visage']
  },
  {
    id: '2',
    name: 'L\'Atelier du Barbier',
    rating: 4.8,
    reviews: 1205,
    location: 'Gauthier, Casablanca',
    distance: '0.8 km',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop',
    tags: ['Barbe', 'Coupe Homme']
  },
  {
    id: '3',
    name: 'Oasis Spa & Bien-être',
    rating: 5.0,
    reviews: 430,
    location: 'Racine, Casablanca',
    distance: '2.5 km',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop',
    tags: ['Massage', 'Hammam', 'Spa']
  },
  {
    id: '4',
    name: 'Nail Bar Signature',
    rating: 4.7,
    reviews: 650,
    location: 'Bourgogne, Casablanca',
    distance: '3.1 km',
    image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=800&auto=format&fit=crop',
    tags: ['Manucure', 'Pédicure']
  },
  {
    id: '5',
    name: 'Institut Lumière',
    rating: 4.9,
    reviews: 320,
    location: 'Anfa, Casablanca',
    distance: '4.0 km',
    image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?q=80&w=800&auto=format&fit=crop',
    tags: ['Épilation', 'Soin Visage']
  }
];

export default function RecommendedSection() {
  return (
    <section className="py-12 bg-white dark:bg-black w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#2F2E2C] dark:text-white mb-2">Recommandés</h2>
            <p className="text-gray-600 dark:text-gray-400">Les meilleurs salons et spas sélectionnés pour vous</p>
          </div>
          <Link href="/search-results" className="text-sm font-semibold text-[#0a0f2c] dark:text-gray-300 hover:underline hidden sm:block">
            Voir tout
          </Link>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 custom-scrollbar snap-x snap-mandatory">
          {MOCK_RECOMMENDED.map((salon) => (
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
                    {salon.rating} <Star className="w-3.5 h-3.5 fill-current text-[#0a0f2c] dark:text-white" />
                  </span>
                  <span className="mx-1.5">•</span>
                  <span>{salon.reviews.toLocaleString()} avis</span>
                </div>

                <div className="flex items-center text-sm text-gray-500 mb-4 truncate">
                  <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{salon.distance} • {salon.location}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {salon.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-md">
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
