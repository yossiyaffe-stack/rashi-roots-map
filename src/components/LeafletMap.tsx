import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DbScholar } from '@/hooks/useScholars';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

type MapStyle = 'dark' | 'light' | 'terrain';

interface LeafletMapProps {
  scholars: DbScholar[];
  selectedScholar: DbScholar | null;
  onSelectScholar: (scholar: DbScholar) => void;
  mapStyle: MapStyle;
  timeRange: [number, number];
}

const TILE_LAYERS: Record<MapStyle, string> = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
};

const IMPORTANCE_COLORS: Record<string, string> = {
  foundational_commentator: '#e11d48',
  supercommentator: '#3b82f6',
  default: '#fbbf24',
};

export function LeafletMap({ 
  scholars, 
  selectedScholar, 
  onSelectScholar, 
  mapStyle,
  timeRange 
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [47.0, 15.0],
      zoom: 5,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);
    leafletMap.current = map;

    // Set initial tile layer
    tileLayerRef.current = L.tileLayer(TILE_LAYERS[mapStyle]).addTo(map);

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Update tile layer when style changes
  useEffect(() => {
    if (!leafletMap.current) return;

    if (tileLayerRef.current) {
      leafletMap.current.removeLayer(tileLayerRef.current);
    }
    tileLayerRef.current = L.tileLayer(TILE_LAYERS[mapStyle]).addTo(leafletMap.current);
  }, [mapStyle]);

  // Update markers when scholars or time range changes
  useEffect(() => {
    if (!leafletMap.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Filter scholars by time range and valid coordinates
    const visibleScholars = scholars.filter(s => {
      if (!s.latitude || !s.longitude) return false;
      if (!s.birth_year) return true;
      return s.birth_year >= timeRange[0] && s.birth_year <= timeRange[1];
    });

    // Add markers
    visibleScholars.forEach(scholar => {
      const color = IMPORTANCE_COLORS[scholar.relationship_type || ''] || IMPORTANCE_COLORS.default;
      const radius = Math.max(6, Math.min(15, (scholar.importance || 50) / 10));
      
      const marker = L.circleMarker([scholar.latitude!, scholar.longitude!], {
        radius,
        fillColor: color,
        fillOpacity: selectedScholar?.id === scholar.id ? 1 : 0.7,
        color: selectedScholar?.id === scholar.id ? '#fff' : color,
        weight: selectedScholar?.id === scholar.id ? 3 : 1,
      });

      marker.bindTooltip(
        `<div class="font-sans">
          <strong>${scholar.name}</strong>
          ${scholar.hebrew_name ? `<br/><span class="text-amber-400">${scholar.hebrew_name}</span>` : ''}
          ${scholar.birth_year ? `<br/><span class="text-gray-400">${scholar.birth_year}–${scholar.death_year || '?'}</span>` : ''}
        </div>`,
        { className: 'scholar-tooltip' }
      );

      marker.on('click', () => onSelectScholar(scholar));
      marker.addTo(leafletMap.current!);
      markersRef.current.push(marker);
    });

    // Pan to selected scholar
    if (selectedScholar?.latitude && selectedScholar?.longitude) {
      leafletMap.current.setView([selectedScholar.latitude, selectedScholar.longitude], 6, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [scholars, selectedScholar, timeRange, onSelectScholar]);

  return <div ref={mapRef} className="w-full h-full" />;
}
