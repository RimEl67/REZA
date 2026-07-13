"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Star, Clock, ArrowRight, SlidersHorizontal, Heart, Navigation, ListFilter } from 'lucide-react';
import ModalFilters from '../../components/ModalFilters';
import RezaNavbar from '../../components/Header';
import Footer from '../../components/Footer';
import { useRouter } from 'next/navigation';

const mockResults = [
	{
		id: 1,
		name: 'Salon Élégance',
		image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
		rating: 4.8,
		reviews: 156,
		category: 'Coiffeur',
		location: 'Maarif, Casablanca',
		distance: '1.2 km',
		price: '$$',
		services: ['Coupe', 'Coloration', 'Brushing'],
		nextAvailable: "Aujourd'hui à 15h",
		coordinates: { lat: 33.5731, lng: -7.6298 }
	},
	{
		id: 2,
		name: 'Barber Studio',
		image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
		rating: 4.9,
		reviews: 203,
		category: 'Barbier',
		location: 'Racine, Casablanca',
		distance: '2.1 km',
		price: '$',
		services: ['Rasage', 'Taille barbe', 'Coupe'],
		nextAvailable: 'Demain à 10h',
		coordinates: { lat: 33.5831, lng: -7.6398 }
	},
	{
		id: 3,
		name: 'Spa Royal Casablanca',
		image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
		rating: 4.7,
		reviews: 98,
		category: 'Spa',
		location: 'Oasis, Casablanca',
		distance: '3.5 km',
		price: '$$$',
		services: ['Hammam', 'Massage', 'Gommage'],
		nextAvailable: "Aujourd'hui à 18h",
		coordinates: { lat: 33.5631, lng: -7.6198 }
	},
	{
		id: 4,
		name: 'Beauty Center Chic',
		// updated image URL (new photo)
		image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=800&q=80',
		rating: 4.6,
		reviews: 124,
		category: 'Centre de beauté',
		location: 'Centre-ville, Casablanca',
		distance: '0.8 km',
		price: '$$',
		services: ['Manucure', 'Pédicure', 'Épilation'],
		nextAvailable: "Aujourd'hui à 14h",
		coordinates: { lat: 33.5931, lng: -7.6098 }
	}
];

const sortOptions = [
	{ key: 'recommended', label: 'Recommandé' },
	{ key: 'rating', label: 'Meilleure note' },
	{ key: 'distance', label: 'Plus proche' },
	{ key: 'price', label: 'Prix' }
];

export default function LuxurySearchResults() {
	const [query, setQuery] = useState('');
	const [location, setLocation] = useState('');
	const [selectedSalon, setSelectedSalon] = useState<number | null>(null);
	const [showFilters, setShowFilters] = useState(false);
	const [sortBy, setSortBy] = useState('recommended');
	const [likedSalons, setLikedSalons] = useState(new Set<number>());
	const [showMobileMap, setShowMobileMap] = useState(false);
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
		const apiKey = 'AIzaSyDMaqTH_mzDvuxbxd7vxeRUFbc_8Y1Meto';

		if (!mapRef.current) return;

		loadGoogleMaps(apiKey)
			.then(() => {
				if (!mounted) return;
				const google = (window as any).google;
				const center = { lat: 33.5731, lng: -7.6298 };
				
				googleMapRef.current = new google.maps.Map(mapRef.current, {
					center,
					zoom: 13,
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

				markersRef.current = mockResults.map((salon) => {
					const marker = new google.maps.Marker({
						position: salon.coordinates,
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

					const content = `
						<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; width: 280px; overflow: hidden; border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,0.12);">
							<div style="position: relative; width: 100%; height: 80px; overflow: hidden;">
								<img src="${salon.image}" alt="${salon.name}" style="width: 100%; height: 100%; object-fit: cover;" />
								<div style="position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 12px;">
									<span style="font-size: 11px; font-weight: 600; color: #1a1a1a;">${salon.category}</span>
								</div>
							</div>
							<div style="padding: 14px; background: white;">
								<div style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; line-height: 1.3;">${salon.name}</div>
								<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
									<div style="display: flex; align-items: center; gap: 3px; background: #fef3e7; padding: 3px 8px; border-radius: 10px;">
										<span style="color: #8b7260; font-weight: 700; font-size: 13px;">★ ${salon.rating}</span>
									</div>
									<span style="color: #999; font-size: 12px;">(${salon.reviews})</span>
									<div style="width: 2px; height: 2px; background: #ddd; border-radius: 50%;"></div>
									<span style="color: #666; font-size: 12px; font-weight: 600;">${salon.price}</span>
								</div>
								<div style="display: flex; align-items: center; gap: 5px; color: #666; font-size: 12px; margin-bottom: 10px;">
									<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
									<span>${salon.location} • <span style="color: #8b7260; font-weight: 600;">${salon.distance}</span></span>
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

					// Replace InfoWindow-driven click handling: set selection and pan only.
					marker.addListener('click', () => {
						// close other info windows (keep them for cleanup) but DO NOT open them;
						markersRef.current.forEach(m => m.infowindow.close());
						// ensure external UI updates
						setSelectedSalon(salon.id);
						// pan to marker
						try {
							const pos = marker.getPosition();
							if (pos && googleMapRef.current) {
								googleMapRef.current.panTo(pos);
								googleMapRef.current.setZoom?.(14);
							}
						} catch (e) {}
						// attach button handler in the DOM if present (keeps reservation button behavior)
						setTimeout(() => {
							const btn = document.getElementById(`gm-btn-${salon.id}`);
							if (btn) {
								btn.onclick = (e) => {
									e.stopPropagation();
									// Navigate to salon detail page
									router.push(`/salon/${salon.id}`);
								};
							}
						}, 100);
					});

					return { marker, infowindow, id: salon.id };
				});
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

	useEffect(() => {
		const google = (window as any).google;
		if (!google || !markersRef.current) return;
		markersRef.current.forEach((m) => {
			if (!m.marker) return;
			if (m.id === selectedSalon) {
				// highlight selected marker only (no InfoWindow opening)
				m.marker.setIcon({
					path: google.maps.SymbolPath.CIRCLE,
					scale: 14,
					fillColor: "#8b7260",
					fillOpacity: 1,
					strokeWeight: 4,
					strokeColor: "#ffffff",
				});
				const pos = m.marker.getPosition();
				if (pos && googleMapRef.current) {
					try {
						googleMapRef.current.panTo(pos);
					} catch (e) {}
				}
			} else {
				m.marker.setIcon({
					path: google.maps.SymbolPath.CIRCLE,
					scale: 10,
					fillColor: "#8b7260",
					fillOpacity: 1,
					strokeWeight: 3,
					strokeColor: "#ffffff",
				});
			}
		});
	}, [selectedSalon]);

	const toggleLike = (id: number) => {
		setLikedSalons(prev => {
			const newLiked = new Set(prev);
			if (newLiked.has(id)) {
				newLiked.delete(id);
			} else {
				newLiked.add(id);
			}
			return newLiked;
		});
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
			`}</style>

			{/* Header - Fixed */}
			<RezaNavbar />

			{/* Main Content */}
			<div className="flex pt-20"> {/* restore padding for header-only layout */}
				{/* Left Side - Results */}
				<div className={`w-full lg:w-[55%] ${showMobileMap ? 'hidden lg:block' : 'block'}`}>
					<div className="max-w-4xl mx-auto px-6 py-8">
						{/* Header with search pills and sort pills on the right */}
						<div className="mb-10">
							<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
								<div>
									{/* Number on its own line, label below */}
									<h1 className="text-4xl font-light text-gray-900 leading-none">{mockResults.length}</h1>
									<span className="block text-lg mt-1" style={{ color: '#8b7260' }}>Salons</span>
									<p className="text-sm text-gray-400 mt-2">Casablanca et environs</p>
								</div>
								{/* Right: Pills (search/location/filter + sort) */}
								<div className="flex flex-col gap-3 items-end">
									<div className="flex items-center gap-3">
										<div className="flex items-center gap-3 bg-[#f5f7f3] rounded-full px-4 py-2 border border-gray-300 hover:border-gray-400 transition-all">
											<Search className="w-4 h-4 text-gray-400" />
											<input
												type="text"
												placeholder="Rechercher un salon ou service"
												className="w-44 outline-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400"
												value={query}
												onChange={(e) => setQuery(e.target.value)}
											/>
										</div>
										<div className="flex items-center gap-3 bg-[#f5f7f3] rounded-full px-4 py-2 border border-gray-300 hover:border-gray-400 transition-all">
											<MapPin className="w-4 h-4 text-gray-400" />
											<input
												type="text"
												placeholder="Casablanca"
												className="w-32 outline-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400"
												value={location}
												onChange={(e) => setLocation(e.target.value)}
											/>
										</div>
										<button
											onClick={() => setShowFilters(true)}
											className="px-4 py-2 rounded-full bg-[#f5f7f3] border border-gray-300 hover:border-gray-400 transition-all flex items-center gap-2 text-sm font-medium"
										>
											<SlidersHorizontal className="w-4 h-4 text-gray-700" />
											<span className="text-gray-700">Filtres</span>
										</button>
									</div>
									<div className="flex gap-2 mt-1 mb-0 overflow-x-auto pb-2 justify-end">
										{sortOptions.map((opt) => (
											<button
												key={opt.key}
												onClick={() => setSortBy(opt.key)}
												className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
													sortBy === opt.key
														? 'bg-[#8b7260] text-white border-[#8b7260]'
														: 'bg-[#f5f7f3] text-gray-600 border-gray-300 hover:border-gray-400'
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
						<div className="space-y-6">
							{mockResults.map((salon, index) => (
								<div
									key={salon.id}
									className="group cursor-pointer animate-fadeInUp"
									style={{ animationDelay: `${index * 100}ms` }}
									onMouseEnter={() => setSelectedSalon(salon.id)}
									onMouseLeave={() => setSelectedSalon(null)}
								>
									<div className="flex gap-6 p-6 rounded-3xl bg-[#f5f7f3] border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-300">
										{/* Image */}
										<div className="relative w-56 h-56 flex-shrink-0 overflow-hidden rounded-2xl">
											<img
												src={salon.image}
												alt={salon.name}
												className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
											/>
											<button
												onClick={(e) => {
													e.stopPropagation();
													toggleLike(salon.id);
												}}
												className="absolute top-4 right-4 w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform"
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
												<h3 className="text-2xl font-medium text-gray-900 mb-3 group-hover:text-[#8b7260] transition-colors">
													{salon.name}
												</h3>
												
												<div className="flex items-center gap-4 mb-4">
													<div className="flex items-center gap-1.5">
														<Star className="w-4 h-4 fill-[#8b7260] text-[#8b7260]" />
														<span className="text-sm font-semibold text-gray-900">{salon.rating}</span>
														<span className="text-sm text-gray-400">({salon.reviews})</span>
													</div>
													<div className="h-1 w-1 rounded-full bg-gray-300" />
													<span className="text-sm font-medium text-gray-600">{salon.price}</span>
												</div>

												<div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
													<MapPin className="w-4 h-4" />
													<span>{salon.location}</span>
													<div className="h-1 w-1 rounded-full bg-gray-300" />
													<span className="text-[#8b7260] font-medium">{salon.distance}</span>
												</div>

												<div className="flex flex-wrap gap-2">
													{salon.services.map((service, idx) => (
														<span
															key={idx}
															className="px-3 py-1.5 rounded-full bg-[#f5f7f3] border border-gray-300 text-xs font-medium text-gray-600"
														>
															{service}
														</span>
													))}
												</div>
											</div>

											<div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
												<div className="flex items-center gap-2">
													<Clock className="w-4 h-4 text-green-600" />
													<span className="text-sm font-medium text-green-600">{salon.nextAvailable}</span>
												</div>
												<button
													className="px-6 py-2.5 rounded-full bg-[#8b7260] text-white text-sm font-medium hover:bg-[#6d5a4d] transition-all flex items-center gap-2 group/btn"
													onClick={() => router.push(`/salon/${salon.id}`)}
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
					</div>
				</div>

				{/* Right Side - Map */}
				<div className={`w-full lg:w-[45%] fixed right-0 top-20 bottom-0 ${showMobileMap ? 'block' : 'hidden lg:block'}`}> {/* align with header height */}
					{/* map container */}
					<div ref={mapRef} className="w-full h-full" />
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