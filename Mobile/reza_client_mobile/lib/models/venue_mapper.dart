import '../constants.dart';

/// Map Backend tenant JSON → UI-friendly venue map used across screens.
Map<String, dynamic> tenantToVenue(Map<String, dynamic> t) {
  final coords = t['coordinates'];
  double? lat;
  double? lng;
  if (coords is Map) {
    lat = (coords['lat'] as num?)?.toDouble();
    lng = (coords['lng'] as num?)?.toDouble();
  }
  lat ??= (t['latitude'] as num?)?.toDouble();
  lng ??= (t['longitude'] as num?)?.toDouble();

  final rating = (t['rating'] as num?)?.toDouble() ??
      (t['averageRating'] as num?)?.toDouble() ??
      0.0;
  final reviewCount = t['reviewCount'] ?? t['reviewsCount'] ?? 0;

  return {
    'id': t['id']?.toString() ?? '',
    'name': t['name']?.toString() ?? '',
    'image': (t['coverImage'] ?? t['logo'] ?? '').toString(),
    'rating': rating,
    'reviews': reviewCount is int ? reviewCount : int.tryParse('$reviewCount') ?? 0,
    'category': t['category']?.toString() ?? '',
    'location': [
      if ((t['address'] ?? '').toString().isNotEmpty) t['address'],
      if ((t['city'] ?? '').toString().isNotEmpty) t['city'],
    ].join(', '),
    'city': t['city']?.toString() ?? '',
    'distance': t['distanceKm'] != null ? '${t['distanceKm']} km' : '',
    'latitude': lat ?? 33.5731,
    'longitude': lng ?? -7.5898,
    'nextAvailable': t['nextAvailable']?.toString() ?? '',
    'price': t['price']?.toString() ?? '',
    'description': (t['description'] ?? '').toString(),
    'raw': t,
  };
}

ServiceItem serviceFromApi(Map<String, dynamic> s) {
  return ServiceItem(
    id: s['id']?.toString() ?? '',
    name: s['name']?.toString() ?? '',
    durationMin: (s['duration'] as num?)?.toInt() ??
        (s['durationMin'] as num?)?.toInt() ??
        30,
    price: (s['price'] as num?)?.toDouble() ?? 0,
    description: (s['description'] ?? '').toString(),
  );
}

VenueItem venueMapToItem(
  Map<String, dynamic> m, {
  List<ServiceItem> services = const [],
}) {
  return VenueItem(
    id: m['id']?.toString() ?? '',
    name: m['name']?.toString() ?? '',
    image: (m['image'] ?? '').toString().isNotEmpty
        ? m['image'].toString()
        : 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop',
    rating: (m['rating'] as num?)?.toDouble() ?? 0,
    reviews: m['reviews'] is int
        ? m['reviews'] as int
        : int.tryParse('${m['reviews']}') ?? 0,
    category: m['category']?.toString() ?? '',
    location: m['location']?.toString() ?? '',
    distance: (m['distance']?.toString().isNotEmpty == true)
        ? m['distance'].toString()
        : '',
    latitude: (m['latitude'] as num?)?.toDouble() ?? 33.5731,
    longitude: (m['longitude'] as num?)?.toDouble() ?? -7.5898,
    nextAvailable: m['nextAvailable']?.toString() ?? '',
    services: services,
  );
}

VenueItem tenantToVenueItem(
  Map<String, dynamic> t, {
  List<ServiceItem> services = const [],
}) =>
    venueMapToItem(tenantToVenue(t), services: services);

