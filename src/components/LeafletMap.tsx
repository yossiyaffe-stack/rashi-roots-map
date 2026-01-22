import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DbScholar } from '@/hooks/useScholars';

type MapStyle = 'dark' | 'manuscript' | 'satellite';

interface LeafletMapProps {
  scholars: DbScholar[];
  selectedScholar: DbScholar | null;
  onSelectScholar: (scholar: DbScholar) => void;
  mapStyle: MapStyle;
  timeRange: [number, number];
}

const TILE_LAYERS: Record<MapStyle, { url: string; options?: L.TileLayerOptions }> = {
  dark: { 
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
  },
  manuscript: { 
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    options: { opacity: 0.7 }
  },
  satellite: { 
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' 
  },
};

const getScholarColor = (scholar: DbScholar): string => {
  if (scholar.name === 'Rashi') return '#e11d48';
  if (scholar.relationship_type === 'supercommentator') return '#3b82f6';
  if (scholar.period === 'Rishonim') return '#f59e0b';
  return '#8b5cf6';
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
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [48.5, 12.0],
      zoom: 5,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);
    leafletMap.current = map;

    // Set initial tile layer
    const layer = TILE_LAYERS[mapStyle];
    tileLayerRef.current = L.tileLayer(layer.url, layer.options).addTo(map);

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
    const layer = TILE_LAYERS[mapStyle];
    tileLayerRef.current = L.tileLayer(layer.url, layer.options).addTo(leafletMap.current);
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
      const color = getScholarColor(scholar);
      const isRashi = scholar.name === 'Rashi';
      const isSelected = selectedScholar?.id === scholar.id;
      
      // Create custom pulsing marker
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div 
            class="marker-pulse ${isRashi ? 'marker-rashi' : ''}" 
            style="
              background: ${color}; 
              box-shadow: 0 0 15px ${color}${isSelected ? ', 0 0 30px ' + color : ''};
              ${isSelected ? 'transform: scale(1.3);' : ''}
              ${isRashi ? 'width: 28px; height: 28px; border: 3px solid #fbbf24;' : ''}
            "
          ></div>
        `,
        iconSize: isRashi ? [28, 28] : [20, 20],
        iconAnchor: isRashi ? [14, 14] : [10, 10],
      });

      const marker = L.marker([scholar.latitude!, scholar.longitude!], { icon });

      marker.bindTooltip(
        `<div style="text-align: center;">
          <strong style="font-size: 14px;">${scholar.name}</strong>
          ${scholar.hebrew_name ? `<br/><span style="color: #fbbf24; font-size: 16px;">${scholar.hebrew_name}</span>` : ''}
          ${scholar.birth_year ? `<br/><span style="color: #94a3b8; font-size: 12px;">${scholar.birth_place || ''} • ${scholar.birth_year}–${scholar.death_year || '?'}</span>` : ''}
        </div>`,
        { 
          className: 'scholar-tooltip',
          direction: 'top',
          offset: [0, -10]
        }
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
