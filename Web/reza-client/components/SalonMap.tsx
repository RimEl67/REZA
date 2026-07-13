'use client';

type SalonMapProps = {
  lat: number;
  lng: number;
  className?: string;
};

/** OpenStreetMap embed — no API key. */
export default function SalonMap({ lat, lng, className }: SalonMapProps) {
  const delta = 0.012;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;
  const openSrc = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

  return (
    <div className={className}>
      <iframe
        title="Carte OpenStreetMap"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={embedSrc}
      />
      <a
        href={openSrc}
        target="_blank"
        rel="noopener noreferrer"
        className="sr-only"
      >
        Agrandir la carte
      </a>
    </div>
  );
}
