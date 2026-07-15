'use client';

import { useEffect, useRef, useState } from 'react';
import { Crosshair, Loader2, MapPin, Search } from 'lucide-react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type LatLng = { lat: number; lng: number };

type SalonLocationPickerProps = {
  value: LatLng | null;
  onChange: (coords: LatLng) => void;
  onAddressSuggest?: (suggestion: { address?: string; city?: string }) => void;
  className?: string;
};

const DEFAULT_CENTER: LatLng = { lat: 33.5731, lng: -7.5898 };

async function reverseGeocode(lat: number, lng: number): Promise<{ address?: string; city?: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address || {};
    const city =
      addr.city || addr.town || addr.village || addr.municipality || addr.county || undefined;
    const road = addr.road || addr.neighbourhood || addr.suburb;
    const house = addr.house_number;
    const address = road ? (house ? `${house} ${road}` : road) : data?.display_name?.split(',')[0];
    return { address, city };
  } catch {
    return null;
  }
}

async function searchPlace(query: string): Promise<LatLng | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

export default function SalonLocationPicker({
  value,
  onChange,
  onAddressSuggest,
  className,
}: SalonLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const reverseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReverseAt = useRef(0);
  const onChangeRef = useRef(onChange);
  const onAddressSuggestRef = useRef(onAddressSuggest);
  const valueRef = useRef(value);

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  onChangeRef.current = onChange;
  onAddressSuggestRef.current = onAddressSuggest;
  valueRef.current = value;

  const suggestFromCoords = (coords: LatLng) => {
    if (!onAddressSuggestRef.current) return;
    if (reverseTimer.current) clearTimeout(reverseTimer.current);
    reverseTimer.current = setTimeout(async () => {
      const now = Date.now();
      if (now - lastReverseAt.current < 1100) return;
      lastReverseAt.current = now;
      const suggestion = await reverseGeocode(coords.lat, coords.lng);
      if (suggestion) onAddressSuggestRef.current?.(suggestion);
    }, 400);
  };

  const placeMarker = (coords: LatLng, fly = false) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([coords.lat, coords.lng]);
    } else {
      markerRef.current = L.marker([coords.lat, coords.lng], { draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current?.getLatLng();
        if (!pos) return;
        const next = { lat: pos.lat, lng: pos.lng };
        onChangeRef.current(next);
        suggestFromCoords(next);
      });
    }

    if (fly) {
      map.flyTo([coords.lat, coords.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
    } else {
      map.setView([coords.lat, coords.lng], Math.max(map.getZoom(), 14));
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!containerRef.current || mapRef.current) return;
      const L = await import('leaflet');

      // Fix default marker icons in bundlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (cancelled || !containerRef.current) return;

      leafletRef.current = L;
      const initial = valueRef.current || DEFAULT_CENTER;
      const map = L.map(containerRef.current, {
        center: [initial.lat, initial.lng],
        zoom: valueRef.current ? 15 : 12,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      map.on('click', (e) => {
        const next = { lat: e.latlng.lat, lng: e.latlng.lng };
        onChangeRef.current(next);
        placeMarker(next);
        suggestFromCoords(next);
      });

      mapRef.current = map;
      if (valueRef.current) placeMarker(valueRef.current);
      setMapReady(true);
      setTimeout(() => map.invalidateSize(), 100);
    }

    void init();

    return () => {
      cancelled = true;
      if (reverseTimer.current) clearTimeout(reverseTimer.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapReady || !value) return;
    const current = markerRef.current?.getLatLng();
    if (
      current &&
      Math.abs(current.lat - value.lat) < 1e-7 &&
      Math.abs(current.lng - value.lng) < 1e-7
    ) {
      return;
    }
    placeMarker(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mapReady]);

  const applyCoords = (found: LatLng) => {
    onChangeRef.current(found);
    placeMarker(found, true);
    suggestFromCoords(found);
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setError(null);
    const found = await searchPlace(q);
    setSearching(false);
    if (!found) {
      setError('Lieu introuvable. Essayez une autre recherche.');
      return;
    }
    applyCoords(found);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Géolocalisation non disponible sur cet appareil');
      return;
    }
    setGeoLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => {
        setError("Impossible d'obtenir votre position");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Emplacement sur la carte *
      </label>
      <p className="text-xs text-gray-500 mb-2">
        Cliquez sur la carte ou recherchez un lieu pour positionner le salon (requis pour la distance
        côté client).
      </p>

      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleSearch();
                }
              }}
              placeholder="Rechercher un lieu (ex. Racine, Casablanca)"
              className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#002366]/30"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={searching || !searchQuery.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:border-[#002366] hover:text-[#002366] disabled:opacity-50"
          >
            {searching ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
            Chercher
          </button>
        </div>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={geoLoading}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:border-[#002366] hover:text-[#002366] disabled:opacity-50"
          title="Utiliser ma position (optionnel)"
        >
          {geoLoading ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
          Ma position
        </button>
      </div>

      <div
        ref={containerRef}
        className="w-full h-56 sm:h-64 rounded-xl border border-gray-200 overflow-hidden z-0"
      />

      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        {value ? (
          <>
            <span className="font-mono text-gray-700">
              lat {value.lat.toFixed(6)} · lng {value.lng.toFixed(6)}
            </span>
            <span className="text-green-700">Pin défini</span>
          </>
        ) : (
          <span className="text-amber-700">Aucun pin — cliquez sur la carte pour en placer un</span>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
