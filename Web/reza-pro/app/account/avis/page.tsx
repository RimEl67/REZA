'use client';
import React, { useState } from 'react';
import ReviewsTab from '../ReviewsTab';

const mockReviews = [
  {
    id: 1,
    salon: 'Salon Élégance',
    salonImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80',
    salonLocation: 'Casablanca',
    service: 'Coupe & Brushing',
    rating: 5,
    comment: 'Super expérience, personnel très professionnel et à l’écoute.',
    date: '12/01/2024',
    appointmentDate: '25/12/2024'
  },
  {
    id: 2,
    salon: 'Spa Royal',
    salonImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80',
    salonLocation: 'Casablanca',
    service: 'Massage Relaxant',
    rating: 4,
    comment: 'Moment très relaxant, je recommande!',
    date: '15/01/2024',
    appointmentDate: '28/12/2024'
  }
];

export default function AvisPage() {
  const [reviews] = useState(mockReviews);
  return (
    <div className="min-h-screen bg-[#f5f7f3] px-8 py-12 max-w-4xl mx-auto">
      <ReviewsTab reviews={reviews} />
    </div>
  );
}
