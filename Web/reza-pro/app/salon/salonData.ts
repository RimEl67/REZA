const salonData = {
  id: 1,
  name: 'Salon Élégance',
  address: '12 Rue Ibnou Rochd, Maarif, Casablanca',
  rating: 4.8,
  reviewCount: 156,
  priceLevel: 'MAD $$',
  images: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80',
    'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&q=80',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80',
    'https://images.unsplash.com/photo-1552693673-1bf958298935?w=800&q=80'
  ],
  description: "Salon Élégance vous accueille au cœur de Casablanca, dans le quartier Maarif. Notre équipe marocaine vous propose des prestations de qualité pour sublimer votre beauté.",
  hours: {
    'Lundi': '09:00 - 20:00',
    'Mardi': '09:00 - 20:00',
    'Mercredi': '09:00 - 20:00',
    'Jeudi': '09:00 - 20:00',
    'Vendredi': '09:00 - 20:00',
    'Samedi': '09:00 - 20:00',
    'Dimanche': 'Fermé'
  },
  reviews: {
    accueil: 4.7,
    proprete: 4.8,
    cadre: 4.6,
    qualite: 4.9
  },
  team: [
    { name: 'Yassine El Amrani', initials: 'YA', specialty: 'Coiffeur' },
    { name: 'Fatima Zahra', initials: 'FZ', specialty: 'Coloriste' },
    { name: 'Omar Benali', initials: 'OB', specialty: 'Barbier' },
    { name: 'Samira Bouzid', initials: 'SB', specialty: 'Esthéticienne' }
  ],
  services: [
    {
      category: 'Coiffure',
      items: [
        { name: 'Coupe homme', duration: '20min', price: 50, priceType: undefined },
        { name: 'Coupe femme', duration: '30min', price: 80, priceType: undefined },
        { name: 'Brushing', duration: '25min', price: 60, priceType: undefined },
        { name: 'Soin capillaire marocain', duration: '40min', price: 120, priceType: undefined }
      ]
    },
    {
      category: 'Coloration',
      description: 'Les tarifs sont pour une coloration racine. Pour une coloration complète, un devis sera proposé sur place.',
      items: [
        { name: 'Coloration racines', duration: '1h', price: 150, priceType: undefined },
        { name: 'Coloration complète', duration: '1h 30min', price: 250, priceType: undefined }
      ]
    },
    {
      category: 'Barbier',
      items: [
        { name: 'Rasage traditionnel', duration: '20min', price: 40, priceType: undefined },
        { name: 'Taille de barbe', duration: '15min', price: 35, priceType: undefined }
      ]
    }
  ]
};

export default salonData;
