"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { Search, MapPin, Star, Clock, ArrowRight, SlidersHorizontal, Heart, Navigation, ListFilter } from 'lucide-react';
import ModalFilters from '../../components/ModalFilters';
import RezaNavbar from '../../components/Header';
import Footer from '../../components/Footer';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { filterCompleteTenants, formatTimeForDisplay, getImageUrl, getSalonHref } from '../../lib/utils';
import LocationAutocomplete from '../../components/LocationAutocomplete';

// Mock data removed - all data now comes from API

const sortOptions = [
	{ key: 'recommended', label: 'Recommandé' },
	{ key: 'rating', label: 'Meilleure note' },
	{ key: 'distance', label: 'Plus proche' },
	{ key: 'price', label: 'Prix' }
];

// Helper function to extract coordinates from Google Maps URL
const extractCoordinatesFromGoogleMapsUrl = async (url: string): Promise<{ lat: number; lng: number } | null> => {
	try {
		let finalUrl = url;
		
		// For short URLs like https://maps.app.goo.gl/..., we need to follow redirects
		if (url.includes('maps.app.goo.gl') || url.includes('goo.gl')) {
			try {
				// Try to fetch the redirect URL (may fail due to CORS)
				const response = await fetch(url, { 
					method: 'HEAD', 
					redirect: 'follow',
					mode: 'no-cors' // Use no-cors to avoid CORS issues, but we won't get the final URL
				});
				// Note: With no-cors, we can't access response.url, so we'll try to parse the original URL
				// or use a proxy service
			} catch (fetchError) {
				console.warn('[Search Results] Could not follow redirect for short URL, coordinates may not be extracted');
			}
		}
		
		// Try to extract coordinates from URL patterns
		// Pattern 1: @lat,lng (most common in Google Maps URLs)
		const atMatch = finalUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
		if (atMatch) {
			return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
		}
		
		// Pattern 2: ?q=lat,lng or &q=lat,lng
		const coordMatch = finalUrl.match(/[?&]q=([^&]+)/);
		if (coordMatch) {
			const query = decodeURIComponent(coordMatch[1]);
			const latLngMatch = query.match(/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
			if (latLngMatch) {
				return { lat: parseFloat(latLngMatch[1]), lng: parseFloat(latLngMatch[2]) };
			}
		}
		
		// Pattern 3: /place/.../@lat,lng
		const placeMatch = finalUrl.match(/\/place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
		if (placeMatch) {
			return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
		}
	} catch (error) {
		console.warn('[Search Results] Error extracting coordinates from Google Maps URL:', error);
	}
	return null;
};

function LuxurySearchResultsContent() {
	const searchParams = useSearchParams();
	const [query, setQuery] = useState(searchParams?.get('query') || searchParams?.get('q') || '');
	const [location, setLocation] = useState(searchParams?.get('location') || '');
	const [categoryFromUrl, setCategoryFromUrl] = useState(searchParams?.get('category') || '');
	const [results, setResults] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedSalon, setSelectedSalon] = useState<string | null>(null);
	const [showFilters, setShowFilters] = useState(false);
	const [sortBy, setSortBy] = useState('recommended');
	const [likedSalons, setLikedSalons] = useState(new Set<string>());
	const [favoritesMap, setFavoritesMap] = useState<Map<string, string>>(new Map()); // Map of tenantId -> favoriteId
	const [showMobileMap, setShowMobileMap] = useState(false);
	const { user, isAuthenticated } = useAuth();
	const [filterValues, setFilterValues] = useState({
		availability: '',
		selectedDate: null as Date | null,
		selectedTime: null as string | null,
		rating: null as number | null,
		priceRange: [0, 1000] as [number, number],
		categories: [] as string[],
		distance: 10,
		bestPro: false,
	});

	const mapRef = useRef<HTMLDivElement | null>(null);
	const googleMapRef = useRef<any>(null);
	const markersRef = useRef<any[]>([]);
	const router = useRouter();
	const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
	const [geoLoading, setGeoLoading] = useState(false);

	const requestUserLocation = () => {
		if (!navigator.geolocation) {
			setUserLocation({ lat: 33.5731, lng: -7.6298 });
			return;
		}
		setGeoLoading(true);
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setUserLocation({
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				});
				setGeoLoading(false);
			},
			(error) => {
				console.warn('Geolocation error:', error);
				setUserLocation({ lat: 33.5731, lng: -7.6298 });
				setGeoLoading(false);
			},
			{ timeout: 5000, enableHighAccuracy: false }
		);
	};

	// Calculate distance between two coordinates using Haversine formula
	const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
		const R = 6371; // Radius of the Earth in kilometers
		const dLat = (lat2 - lat1) * Math.PI / 180;
		const dLon = (lon2 - lon1) * Math.PI / 180;
		const a = 
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
			Math.sin(dLon / 2) * Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c; // Distance in kilometers
	};

	// Update state when URL params change
	useEffect(() => {
		const urlCategory = searchParams?.get('category') || '';
		if (urlCategory !== categoryFromUrl) {
			setCategoryFromUrl(urlCategory);
		}
		const urlQuery = searchParams?.get('query') || searchParams?.get('q') || '';
		if (urlQuery !== query) {
			setQuery(urlQuery);
		}
		const urlLocation = searchParams?.get('location') || '';
		if (urlLocation !== location) {
			setLocation(urlLocation);
		}
	}, [searchParams]);

	// Get user's location on mount
	useEffect(() => {
		requestUserLocation();
	}, []);

	// Fetch tenants from API
	useEffect(() => {
		const fetchTenants = async () => {
			try {
				setLoading(true);
				// Use category from URL if available, otherwise use filter categories
				const categoryToUse = categoryFromUrl || filterValues.categories[0] || undefined;
				// Only pass query if it's not empty (trim whitespace)
				const searchQuery = query && query.trim() ? query.trim() : undefined;
				const geo =
					userLocation != null
						? {
								lat: userLocation.lat,
								lng: userLocation.lng,
								radiusKm: filterValues.distance,
							}
						: undefined;
				const response = await api.searchTenants(
					searchQuery,
					categoryToUse,
					location && location.trim() ? location.trim() : undefined,
					50,
					geo
				);
				console.log('Search API response:', response);
				console.log('Total tenants from API:', response.tenants?.length || 0);
				// Filter to only show tenants with complete information (all required fields from landing page)
				const completeTenants = filterCompleteTenants(response.tenants || []);
				console.log('Complete tenants after filter:', completeTenants.length);
				
				// Extract coordinates from googleMapsLink if coordinates are not set
				const tenantsWithCoords = await Promise.all(
					completeTenants.map(async (tenant: any) => {
						// If coordinates are already set and valid, use them
						if (tenant.coordinates && tenant.coordinates.lat && tenant.coordinates.lng) {
							return tenant;
						}
						
						// If googleMapsLink is set but no coordinates, try to extract from URL
						if (tenant.googleMapsLink) {
							try {
								const coords = await extractCoordinatesFromGoogleMapsUrl(tenant.googleMapsLink);
								if (coords) {
									return { ...tenant, coordinates: coords };
								}
							} catch (err) {
								console.warn(`Failed to extract coordinates from ${tenant.googleMapsLink}:`, err);
							}
						}
						
						return tenant;
					})
				);
				
				setResults(tenantsWithCoords);
			} catch (error) {
				console.error('Error fetching tenants:', error);
				setResults([]);
			} finally {
				setLoading(false);
			}
		};

		fetchTenants();
	}, [query, location, categoryFromUrl, filterValues.categories, filterValues.distance, userLocation]);

	// Filter results based on filter values
	const getFilteredResults = () => {
		let filtered = [...results];

		// Filter by rating
		if (filterValues.rating !== null && filterValues.rating > 0) {
			filtered = filtered.filter(salon => {
				const rating = salon.rating || 0;
				return rating >= filterValues.rating!;
			});
		}

		// Filter by price range
		if (filterValues.priceRange && (filterValues.priceRange[0] > 0 || filterValues.priceRange[1] < 1000)) {
			filtered = filtered.filter(salon => {
				// Extract price from price range if available
				if (salon.priceRange) {
					const avgPrice = salon.priceRange.avg || salon.priceRange.min || 0;
					return avgPrice >= filterValues.priceRange[0] && avgPrice <= filterValues.priceRange[1];
				}
				// If no priceRange, include it (to not exclude salons without price data)
				return true;
			});
		}

		// Filter by categories (multiple categories)
		if (filterValues.categories && filterValues.categories.length > 0) {
			filtered = filtered.filter(salon => {
				const salonCategory = salon.category || '';
				return filterValues.categories.some(cat => 
					salonCategory.toLowerCase().includes(cat.toLowerCase()) ||
					cat.toLowerCase().includes(salonCategory.toLowerCase())
				);
			});
		}

		// Filter by distance radius (client-side fallback)
		if (userLocation && filterValues.distance > 0) {
			filtered = filtered.filter((salon) => {
				if (salon.distanceKm != null) {
					return salon.distanceKm <= filterValues.distance;
				}
				if (!salon.coordinates?.lat || !salon.coordinates?.lng) return true;
				return (
					calculateDistance(
						userLocation.lat,
						userLocation.lng,
						salon.coordinates.lat,
						salon.coordinates.lng
					) <= filterValues.distance
				);
			});
		}

		// Note: Availability filters
		// checking actual salon availability, which needs API calls or availability data
		// This is typically handled at the API level or requires real-time availability checks

		// Sort results
		switch (sortBy) {
			case 'rating':
				filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
				break;
			case 'distance':
				// Sort by distance calculated from coordinates
				if (userLocation) {
					// Map salons with calculated distances
					const salonsWithDistance = filtered.map(salon => {
						if (!salon.coordinates || !salon.coordinates.lat || !salon.coordinates.lng) {
							return { ...salon, _calculatedDistance: Infinity };
						}
						const distance = calculateDistance(
							userLocation.lat,
							userLocation.lng,
							salon.coordinates.lat,
							salon.coordinates.lng
						);
						const distanceDisplay = distance < 1 
							? `${Math.round(distance * 1000)} m` 
							: `${distance.toFixed(1)} km`;
						return { 
							...salon, 
							_calculatedDistance: distance,
							distance: distanceDisplay 
						};
					});
					
					// Sort by calculated distance
					salonsWithDistance.sort((a, b) => a._calculatedDistance - b._calculatedDistance);
					
					// Remove the temporary _calculatedDistance property
					filtered = salonsWithDistance.map(({ _calculatedDistance, ...salon }) => salon);
				} else {
					// Fallback: try to use existing distance property if available
					filtered.sort((a, b) => {
						const distA = a.distance 
							? parseFloat((a.distance || '999').toString().replace(' km', '').replace(' m', '').replace(',', '.')) || 999
							: 999;
						const distB = b.distance
							? parseFloat((b.distance || '999').toString().replace(' km', '').replace(' m', '').replace(',', '.')) || 999
							: 999;
						return distA - distB;
					});
				}
				break;
			case 'price':
				filtered.sort((a, b) => {
					const priceA = a.priceRange?.avg || a.priceRange?.min || 0;
					const priceB = b.priceRange?.avg || b.priceRange?.min || 0;
					return priceA - priceB;
				});
				break;
			default: // 'recommended'
				// If bestPro is enabled, prioritize high-rated salons
				if (filterValues.bestPro) {
					filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
				}
				// Otherwise keep original order (already sorted by API)
				break;
		}

		return filtered;
	};

	const filteredResults = getFilteredResults();

	// Helper function to get distance for display
	const getDistanceForDisplay = (salon: any): string | null => {
		if (salon.distanceKm != null) {
			const distance = salon.distanceKm as number;
			return distance < 1
				? `${Math.round(distance * 1000)} m`
				: `${distance.toFixed(1)} km`;
		}

		if (!userLocation || !salon.coordinates || !salon.coordinates.lat || !salon.coordinates.lng) {
			return salon.distance || null;
		}

		const distance = calculateDistance(
			userLocation.lat,
			userLocation.lng,
			salon.coordinates.lat,
			salon.coordinates.lng
		);

		return distance < 1
			? `${Math.round(distance * 1000)} m`
			: `${distance.toFixed(1)} km`;
	};

	// Helper function to get today's hours for a salon
	const getTodayHours = (salon: any): string | null => {
		if (!salon.settings?.businessHours) return null;
		
		const businessHours = salon.settings.businessHours;
		const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
		const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
		const dayKey = days[today];
		
		if (businessHours[dayKey] && businessHours[dayKey].open && businessHours[dayKey].close) {
			const openTime = formatTimeForDisplay(businessHours[dayKey].open);
			const closeTime = formatTimeForDisplay(businessHours[dayKey].close);
			return `${openTime} - ${closeTime}`;
		}
		
		return 'Fermé';
	};

	// Load user's favorites on mount and when user changes
	useEffect(() => {
		if (!isAuthenticated || !user?.email) return;

		const loadFavorites = async () => {
			try {
				const response = await api.getClientFavorites(user.email);
				const favorites = response.favorites || [];
				
				// Create a Set of favorite tenant IDs and a Map of tenantId -> favoriteId
				// Use tenant.id (database ID) as the key
				const likedSet = new Set<string>();
				const favoritesMapData = new Map<string, string>();
				
				favorites.forEach((fav: any) => {
					// Use tenant.id (database ID) as the primary identifier
					const tenantDbId = fav.tenant?.id || fav.tenantId;
					if (tenantDbId) {
						likedSet.add(tenantDbId);
						if (fav.id) {
							favoritesMapData.set(tenantDbId, fav.id);
						}
					}
				});
				
				setLikedSalons(likedSet);
				setFavoritesMap(favoritesMapData);
			} catch (error) {
				console.error('Error loading favorites:', error);
			}
		};

		loadFavorites();
	}, [isAuthenticated, user?.email]);

	const loadGoogleMaps = (apiKey?: string) =>
		new Promise<void>((resolve, reject) => {
			if (!apiKey) {
				reject(new Error('Missing Google Maps API key'));
				return;
			}
			if ((window as any).google && (window as any).google.maps) {
				resolve();
				return;
			}
			if (document.querySelector(`script[data-google-maps]`)) {
				const checkInterval = setInterval(() => {
					if ((window as any).google && (window as any).google.maps) {
						clearInterval(checkInterval);
						resolve();
					}
				}, 100);
				return;
			}
			const script = document.createElement('script');
			script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
			script.async = true;
			script.defer = true;
			script.setAttribute('data-google-maps', 'true');
			script.onload = () => resolve();
			script.onerror = (err) => reject(err);
			document.head.appendChild(script);
		});

	useEffect(() => {
		let mounted = true;
		const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

		if (!mapRef.current || !apiKey) {
			console.warn('Google Maps API key not found. Map features will be disabled.');
			return;
		}

		loadGoogleMaps(apiKey)
			.then(() => {
				if (!mounted) return;
				const google = (window as any).google;
				
				// Calculate center from results or use default (Casablanca)
				let center = { lat: 33.5731, lng: -7.6298 };
				if (results.length > 0) {
					const validCoords = results.filter(r => r.coordinates && r.coordinates.lat && r.coordinates.lng);
					if (validCoords.length > 0) {
						const avgLat = validCoords.reduce((sum, r) => sum + r.coordinates.lat, 0) / validCoords.length;
						const avgLng = validCoords.reduce((sum, r) => sum + r.coordinates.lng, 0) / validCoords.length;
						center = { lat: avgLat, lng: avgLng };
					}
				}
				
				googleMapRef.current = new google.maps.Map(mapRef.current, {
					center,
					zoom: results.length > 0 ? 12 : 13,
					disableDefaultUI: true,
					styles: [
						{ elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
						{ elementType: "labels.icon", stylers: [{ visibility: "off" }] },
						{ elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
						{ elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
						{ featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
						{ featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
						{ featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
						{ featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
						{ featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
						{ featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
						{ featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
						{ featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
						{ featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
						{ featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
						{ featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
						{ featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
						{ featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
						{ featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] }
					],
				});

				// Initial markers will be set by the filteredResults effect
			})
			.catch(() => {});

		return () => {
			mounted = false;
			if (markersRef.current.length) {
				markersRef.current.forEach((m) => {
					if (m.marker) m.marker.setMap(null);
					if (m.infowindow) m.infowindow.close();
				});
				markersRef.current = [];
			}
			googleMapRef.current = null;
		};
	}, []);

	// Update map markers when filtered results change
	useEffect(() => {
		const google = (window as any).google;
		if (!google || !googleMapRef.current || loading) return;

		// Clear existing markers
		markersRef.current.forEach((m) => {
			if (m.marker) m.marker.setMap(null);
			if (m.infowindow) m.infowindow.close();
		});
		markersRef.current = [];

		// Add new markers from filtered results
		markersRef.current = filteredResults.map((salon) => {
			// Use default center if no coordinates available
			const defaultCenter = { lat: 33.5731, lng: -7.6298 };
			const coords = salon.coordinates || defaultCenter;
			const marker = new google.maps.Marker({
				position: coords,
				map: googleMapRef.current,
				title: salon.name,
				icon: {
					path: google.maps.SymbolPath.CIRCLE,
					scale: 10,
					fillColor: "#8b7260",
					fillOpacity: 1,
					strokeWeight: 3,
					strokeColor: "#ffffff",
				}
			});

			// Add hover listeners to marker
			marker.addListener('mouseover', () => {
				setSelectedSalon(salon.id);
			});
			marker.addListener('mouseout', () => {
				setSelectedSalon(null);
			});

			const imageUrl = getImageUrl(salon.coverImage || salon.logo) || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80';
			const category = salon.category || 'Établissement';
			const rating = salon.rating || 0;
			const reviews = salon.reviews || 0;
			const price = salon.price || null;
			const address = salon.address || salon.city || 'Casablanca';
			const priceDisplay = price ? `<div style="width: 2px; height: 2px; background: #ddd; border-radius: 50%;"></div><span style="color: #666; font-size: 12px; font-weight: 600;">${price}</span>` : '';
			const content = `
				<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; width: 280px; overflow: hidden; border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,0.12);">
					<div style="position: relative; width: 100%; height: 80px; overflow: hidden;">
						<img src="${imageUrl}" alt="${salon.name}" style="width: 100%; height: 100%; object-fit: cover;" />
						<div style="position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 12px;">
							<span style="font-size: 11px; font-weight: 600; color: #1a1a1a;">${category}</span>
						</div>
					</div>
					<div style="padding: 14px; background: white;">
						<div style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; line-height: 1.3;">${salon.name}</div>
						<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
							<div style="display: flex; align-items: center; gap: 3px; background: #fef3e7; padding: 3px 8px; border-radius: 10px;">
								<span style="color: #8b7260; font-weight: 700; font-size: 13px;">★ ${rating.toFixed(1)}</span>
							</div>
							<span style="color: #999; font-size: 12px;">(${reviews})</span>
							${priceDisplay}
						</div>
						<div style="display: flex; align-items: center; gap: 5px; color: #666; font-size: 12px; margin-bottom: 10px;">
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
							<span>${address}</span>
						</div>
						<div style="display: inline-block; width: 100%; padding: 10px 0; background: linear-gradient(135deg, #8b7260 0%, #6d5a4d 100%); color: white; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; text-align: center; box-shadow: 0 3px 10px rgba(139,114,96,0.3);" id="gm-btn-${salon.id}">
							Réserver
						</div>
					</div>
				</div>
			`;
			const infowindow = new google.maps.InfoWindow({ 
				content,
				maxWidth: 280,
				pixelOffset: new google.maps.Size(0, -10)
			});

			marker.addListener('click', () => {
				markersRef.current.forEach(m => m.infowindow.close());
				setSelectedSalon(salon.id);
				try {
					const pos = marker.getPosition();
					if (pos && googleMapRef.current) {
						googleMapRef.current.panTo(pos);
						googleMapRef.current.setZoom?.(14);
					}
				} catch (e) {}
				setTimeout(() => {
					const btn = document.getElementById(`gm-btn-${salon.id}`);
					if (btn) {
						btn.onclick = (e) => {
							e.stopPropagation();
							router.push(getSalonHref(salon));
						};
					}
				}, 100);
			});

			return { marker, infowindow, id: salon.id };
		});
	}, [filteredResults, loading]);

	useEffect(() => {
		const google = (window as any).google;
		if (!google || !markersRef.current) return;
		markersRef.current.forEach((m) => {
			if (!m.marker) return;
			if (m.id === selectedSalon) {
				// highlight selected marker only (no InfoWindow opening)
				m.marker.setIcon({
					path: google.maps.SymbolPath.CIRCLE,
					scale: 16,
					fillColor: "#8b7260",
					fillOpacity: 1,
					strokeWeight: 5,
					strokeColor: "#ffffff",
					zIndex: 1000,
				});
				const pos = m.marker.getPosition();
				if (pos && googleMapRef.current) {
					try {
						// Smoothly pan to the marker position
						googleMapRef.current.panTo(pos);
						// Optionally zoom in slightly for better visibility
						const currentZoom = googleMapRef.current.getZoom();
						if (currentZoom && currentZoom < 15) {
							googleMapRef.current.setZoom(15);
						}
					} catch (e) {}
				}
			} else {
				m.marker.setIcon({
					path: google.maps.SymbolPath.CIRCLE,
					scale: 10,
					fillColor: "#8b7260",
					fillOpacity: 0.7,
					strokeWeight: 2,
					strokeColor: "#ffffff",
					zIndex: 1,
				});
			}
		});
	}, [selectedSalon]);

	const toggleLike = async (salon: any) => {
		if (!isAuthenticated || !user?.email) {
			// Redirect to login if not authenticated
			router.push('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
			return;
		}

		// Use salon.id (database ID) as the primary identifier
		const tenantDbId = salon.id;
		if (!tenantDbId) return;

		const isCurrentlyLiked = likedSalons.has(tenantDbId);
		
		try {
			if (isCurrentlyLiked) {
				// Remove from favorites
				const favoriteId = favoritesMap.get(tenantDbId);
				if (favoriteId) {
					await api.removeFavorite(favoriteId, user.email);
					
					// Update local state
					setLikedSalons(prev => {
						const newLiked = new Set(prev);
						newLiked.delete(tenantDbId);
						return newLiked;
					});
					
					setFavoritesMap(prev => {
						const newMap = new Map(prev);
						newMap.delete(tenantDbId);
						return newMap;
					});
				}
			} else {
				// Add to favorites - use salon.id (database ID)
				const response = await api.addFavorite(user.email, tenantDbId);
				
				// Update local state - use tenant.id from response if available
				const responseTenantId = response.favorite?.tenant?.id || response.favorite?.tenantId || tenantDbId;
				if (response.favorite?.id && responseTenantId) {
					setLikedSalons(prev => new Set(prev).add(responseTenantId));
					setFavoritesMap(prev => {
						const newMap = new Map(prev);
						newMap.set(responseTenantId, response.favorite.id);
						return newMap;
					});
				}
			}
		} catch (error: any) {
			console.error('Error toggling favorite:', error);
			// Optionally show a toast/notification here
			alert(error.message || 'Erreur lors de la sauvegarde du favori');
		}
	};

	return (
		<div className="min-h-screen bg-[#f5f7f3]">
			<style jsx global>{`
				* {
					-webkit-font-smoothing: antialiased;
					-moz-osx-font-smoothing: grayscale;
				}
				
				::-webkit-scrollbar {
					width: 6px;
				}
				
				::-webkit-scrollbar-track {
					background: transparent;
				}
				
				::-webkit-scrollbar-thumb {
					background: rgba(139, 114, 96, 0.2);
					border-radius: 3px;
				}
				
				::-webkit-scrollbar-thumb:hover {
					background: rgba(139, 114, 96, 0.4);
				}

				@keyframes fadeInUp {
					from {
						opacity: 0;
						transform: translateY(20px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				.animate-fadeInUp {
					animation: fadeInUp 0.5s ease-out forwards;
				}
				
				/* Hide scrollbar for Chrome, Safari and Opera */
				.scrollbar-hide::-webkit-scrollbar {
					display: none;
				}
				
				/* Hide scrollbar for IE, Edge and Firefox */
				.scrollbar-hide {
					-ms-overflow-style: none;  /* IE and Edge */
					scrollbar-width: none;  /* Firefox */
				}
			`}</style>

			{/* Header - Fixed */}
			<RezaNavbar />

			{/* Main Content */}
			<div className="flex pt-20 relative z-10"> {/* restore padding for header-only layout */}
				{/* Left Side - Results */}
				<div className={`w-full lg:w-[55%] ${showMobileMap ? 'hidden lg:block' : 'block'} relative z-10 bg-[#f5f7f3] min-h-screen`}>
					<div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 relative z-10">
						{/* Header with search pills and sort pills on the right */}
						<div className="mb-6 sm:mb-8 lg:mb-10">
							<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6">
								<div className="flex-shrink-0">
									{/* Number on its own line, label below */}
									<h1 className="text-3xl sm:text-4xl font-light text-gray-900 leading-none">{loading ? '...' : filteredResults.length}</h1>
									<span className="block text-base sm:text-lg mt-1" style={{ color: '#8b7260' }}>Salons</span>
									<p className="text-xs sm:text-sm text-gray-400 mt-2">{location || 'Casablanca et environs'}</p>
								</div>
								{/* Right: Pills (search/location/filter + sort) */}
								<div className="flex flex-col gap-3 w-full lg:w-auto lg:max-w-lg relative z-[100]">
									<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
										<div className="flex items-center gap-2 sm:gap-3 bg-white rounded-full px-3 sm:px-4 py-2.5 border border-gray-300 hover:border-gray-400 transition-all flex-1 sm:flex-initial relative z-[100] shadow-sm">
											<Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
											<input
												type="text"
												placeholder="Rechercher un salon ou service"
												className="flex-1 min-w-0 outline-none bg-transparent text-xs sm:text-sm text-gray-900 placeholder:text-gray-400"
												value={query}
												onChange={(e) => setQuery(e.target.value)}
											/>
										</div>
										<div className="flex items-center gap-2 sm:gap-3 bg-white rounded-full px-3 sm:px-4 py-1 border border-gray-300 hover:border-gray-400 transition-all flex-1 sm:flex-initial relative z-[100] shadow-sm min-w-0">
											<div className="flex-1 min-w-0">
												<LocationAutocomplete
													value={location}
													onChange={setLocation}
													placeholder="Ville ou quartier"
													inputClassName="w-full pl-10 pr-2 py-2 rounded-full border-0 focus:outline-none bg-transparent text-xs sm:text-sm text-gray-900 placeholder:text-gray-400"
												/>
											</div>
											<button
												type="button"
												onClick={requestUserLocation}
												disabled={geoLoading}
												className="p-1 rounded-full hover:bg-gray-100 text-[#8b7260] disabled:opacity-50 flex-shrink-0"
												title="Utiliser ma position"
												aria-label="Utiliser ma position"
											>
												<Navigation className={`w-4 h-4 ${geoLoading ? 'animate-pulse' : ''}`} />
											</button>
										</div>
										<button
											onClick={() => setShowFilters(true)}
											className="px-4 py-2.5 rounded-full bg-white border border-gray-300 hover:border-gray-400 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-medium whitespace-nowrap relative z-[100] shadow-sm h-fit"
										>
											<SlidersHorizontal className="w-4 h-4 text-gray-700" />
											<span className="text-gray-700">Filtres</span>
										</button>
									</div>
									<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 sm:-mx-6 px-4 sm:px-6 lg:px-0 lg:mx-0 lg:justify-end relative z-[100] mt-0">
										{sortOptions.map((opt) => (
											<button
												key={opt.key}
												onClick={() => setSortBy(opt.key)}
												className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border relative z-[100] shadow-sm flex-shrink-0 ${
													sortBy === opt.key
														? 'bg-[#8b7260] text-white border-[#8b7260]'
														: 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
												}`}
											>
												{opt.label}
											</button>
										))}
									</div>
								</div>
							</div>
						</div>

						{/* Results */}
						{loading ? (
							<div className="flex items-center justify-center py-20">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b7260]"></div>
							</div>
						) : filteredResults.length === 0 ? (
							<div className="text-center py-20">
								<p className="text-gray-500">Aucun salon trouvé</p>
							</div>
						) : (
						<div className="space-y-6">
							{filteredResults.map((salon, index) => (
								<div
									key={salon.id}
									className={`group cursor-pointer animate-fadeInUp relative z-[50] ${
										selectedSalon === salon.id ? 'ring-2 ring-[#8b7260] ring-opacity-50' : ''
									}`}
									style={{ animationDelay: `${index * 100}ms` }}
									onMouseEnter={() => setSelectedSalon(salon.id)}
									onMouseLeave={() => setSelectedSalon(null)}
									onClick={() => router.push(getSalonHref(salon))}
								>
									<div className={`flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border transition-all duration-300 relative z-[50] ${
										selectedSalon === salon.id 
											? 'border-[#8b7260] shadow-lg scale-[1.02]' 
											: 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
									}`}>
										{/* Image */}
										<div className="relative w-full sm:w-56 h-48 sm:h-56 flex-shrink-0 overflow-hidden rounded-xl sm:rounded-2xl">
											<img
												src={getImageUrl(salon.coverImage || salon.logo) || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80'}
												alt={salon.name}
												className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
											/>
											<button
												onClick={(e) => {
													e.stopPropagation();
													toggleLike(salon);
												}}
												className="absolute top-4 right-4 w-9 h-9 rounded-full backdrop-blur-sm bg-white/90 flex items-center justify-center hover:scale-110 transition-transform z-[100] shadow-sm"
											>
												<Heart
													className={`w-4 h-4 transition-all ${
														likedSalons.has(salon.id)
															? 'fill-red-500 text-red-500'
															: 'text-gray-600'
													}`}
												/>
											</button>
										</div>

										{/* Content */}
										<div className="flex-1 flex flex-col justify-between py-1">
											<div>
												<h3 className="text-xl sm:text-2xl font-medium text-gray-900 mb-2 sm:mb-3 group-hover:text-[#8b7260] transition-colors">
													{salon.name}
												</h3>
												
												<div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
													<div className="flex items-center gap-1.5">
														<Star className="w-4 h-4 fill-[#8b7260] text-[#8b7260]" />
														<span className="text-xs sm:text-sm font-semibold text-gray-900">{(salon.rating || 0).toFixed(1)}</span>
														<span className="text-xs sm:text-sm text-gray-400">({salon.reviews || 0})</span>
													</div>
													{salon.priceRange && (
														<>
															<div className="h-1 w-1 rounded-full bg-gray-300" />
															<span className="text-xs sm:text-sm font-medium text-gray-600">
																{salon.priceRange.min !== null && salon.priceRange.min !== undefined && salon.priceRange.max !== null && salon.priceRange.max !== undefined
																	? `${Math.round(salon.priceRange.min)}-${Math.round(salon.priceRange.max)} MAD`
																	: salon.priceRange.avg !== null && salon.priceRange.avg !== undefined
																	? `${Math.round(salon.priceRange.avg)} MAD`
																	: salon.priceRange.min !== null && salon.priceRange.min !== undefined
																	? `À partir de ${Math.round(salon.priceRange.min)} MAD`
																	: salon.price || ''
																}
															</span>
														</>
													)}
													{!salon.priceRange && salon.price && (
														<>
															<div className="h-1 w-1 rounded-full bg-gray-300" />
															<span className="text-xs sm:text-sm font-medium text-gray-600">{salon.price}</span>
														</>
													)}
												</div>

												<div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
													<MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
													<span>{salon.address || salon.city || 'Casablanca'}</span>
													{(() => {
														const distance = getDistanceForDisplay(salon);
														return distance ? (
															<span className="text-[10px] sm:text-xs text-gray-400">• {distance}</span>
														) : null;
													})()}
												</div>

												{(() => {
													const todayHours = getTodayHours(salon);
													return todayHours ? (
														<div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
															<Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8b7260]" />
															<span className="font-medium">
																{todayHours === 'Fermé' ? (
																	<span className="text-red-500">{todayHours}</span>
																) : (
																	<span>Aujourd'hui: {todayHours}</span>
																)}
															</span>
														</div>
													) : null;
												})()}

												{salon.services && salon.services.length > 0 && (
													<div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-0">
														{salon.services.slice(0, 3).map((service: string, idx: number) => (
															<span
																key={idx}
																className="px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs text-gray-600 bg-white rounded-full border border-gray-200"
															>
																{service}
															</span>
														))}
													</div>
												)}
											</div>

											<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 mt-4 border-t border-gray-100 gap-3 sm:gap-0">
												{salon.nextAvailable && (
													<div className="flex items-center gap-2">
														<Clock className="w-4 h-4 text-green-600" />
														<span className="text-xs sm:text-sm font-medium text-green-600">{salon.nextAvailable}</span>
													</div>
												)}
												<button
													className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#8b7260] text-white text-xs sm:text-sm font-medium hover:bg-[#6d5a4d] transition-all flex items-center justify-center gap-2 group/btn relative z-[100] shadow-sm"
													onClick={(e) => {
														e.stopPropagation(); // Prevent card onClick from firing
														router.push(getSalonHref(salon));
													}}
												>
													<span>Réserver</span>
													<ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
												</button>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
						)}
					</div>
				</div>

				{/* Right Side - Map */}
				<div className={`w-full lg:w-[45%] fixed right-0 top-20 bottom-0 z-[1] ${showMobileMap ? 'block' : 'hidden lg:block'}`}> {/* align with header height */}
					{/* map container */}
					<div ref={mapRef} className="w-full h-full" style={{ zIndex: 1 }} />
				</div>

				{/* Mobile Map Toggle */}
				<button
					onClick={() => setShowMobileMap(!showMobileMap)}
					className="lg:hidden fixed bottom-8 right-6 z-50 px-6 py-4 rounded-full bg-[#8b7260] text-white shadow-2xl flex items-center gap-3 font-medium hover:bg-[#6d5a4d] transition-all"
				>
					{showMobileMap ? (
						<>
							<ListFilter className="w-5 h-5" />
							<span>Liste</span>
						</>
					) : (
						<>
							<Navigation className="w-5 h-5" />
							<span>Carte</span>
						</>
					)}
				</button>
			</div>

			{/* External Filter Modal */}
			<ModalFilters
				open={showFilters}
				filterValues={{
					availability: filterValues.availability,
					selectedDate: filterValues.selectedDate,
					selectedTime: filterValues.selectedTime,
					rating: filterValues.rating,
					bestPro: filterValues.bestPro,
				}}
				setFilterValues={(vals: any) => setFilterValues({ ...filterValues, ...vals })}
				onClose={() => setShowFilters(false)}
			/>

		{/* Added shared Footer component */}
		<Footer />
	</div>
	);
}

export default function LuxurySearchResults() {
	return (
		<Suspense fallback={
			<div className="min-h-screen flex items-center justify-center bg-[#f6f6ef]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002366] mx-auto mb-4"></div>
					<p className="text-gray-600">Chargement...</p>
				</div>
			</div>
		}>
			<LuxurySearchResultsContent />
		</Suspense>
	);
}