import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers } from 'lucide-react';
import type { Scholar } from '@/data/scholars';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface MapViewProps {
  scholars: Scholar[];
  selectedScholar: Scholar | null;
  onSelectScholar: (scholar: Scholar) => void;
}

// Get color based on scholar's period/type
const getScholarColor = (scholar: Scholar): string => {
  if (scholar.id === 1) return '#c9a961'; // Rashi - gold
  if (scholar.period === 'Rishonim') return '#ea580c'; // Orange
  if (scholar.period === 'Post-Tosafist France') return '#facc15'; // Yellow
  if (scholar.period?.includes('Post-Black Death')) return '#22c55e'; // Green
  if (scholar.commentariesOnRashi) return '#6366f1'; // Purple for commentators
  return '#8b7355'; // Default sepia
};

// Create custom icon for scholar
const createScholarIcon = (scholar: Scholar): L.DivIcon => {
  const size = Math.max(24, scholar.importance / 3.5);
  const color = getScholarColor(scholar);
  
  return L.divIcon({
    className: 'custom-scholar-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid hsl(35 30% 12%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: transform 0.2s, box-shadow 0.2s;
        font-family: 'David Libre', serif;
        font-weight: bold;
        color: white;
        font-size: ${size * 0.4}px;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      ">
        ${scholar.hebrewName?.[0] || scholar.name[0]}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export const MapView = ({ scholars, selectedScholar, onSelectScholar }: MapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});
  const layersRef = useRef<{ modern?: L.TileLayer; historical?: L.TileLayer }>({});
  const [mapStyle, setMapStyle] = useState<'modern' | 'historical'>('modern');

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [49.0, 10.0],
      zoom: 5,
      zoomControl: true,
    });

    mapRef.current = map;

    // Modern base layer
    const modernLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    });
    modernLayer.addTo(map);
    layersRef.current.modern = modernLayer;

    // Historical-style layer (grayscale)
    const historicalLayer = L.tileLayer('https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
      attribution: 'Historical style',
      maxZoom: 18,
      opacity: 0.8,
    });
    layersRef.current.historical = historicalLayer;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when scholars change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      mapRef.current?.removeLayer(marker);
    });
    markersRef.current = {};

    // Add markers for scholars
    scholars.forEach(scholar => {
      const marker = L.marker(
        [scholar.location.lat, scholar.location.lng],
        { icon: createScholarIcon(scholar) }
      );

      const popupContent = `
        <div style="font-family: 'Crimson Text', serif; padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: bold; color: hsl(35 30% 12%);">
            ${scholar.name}
          </h3>
          <p style="margin: 0 0 8px 0; font-size: 18px; font-family: 'David Libre', serif; direction: rtl; color: hsl(35 45% 35%);">
            ${scholar.hebrewName}
          </p>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: hsl(35 20% 40%);">
            ${scholar.birth}–${scholar.death}
          </p>
          <p style="margin: 0 0 4px 0; font-size: 13px; color: hsl(35 20% 40%);">
            📍 ${scholar.location.city}${scholar.location.historicalContext ? ` (${scholar.location.historicalContext})` : ''}
          </p>
          ${scholar.works ? `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid hsl(40 20% 85%);">
              <strong style="font-size: 12px; color: hsl(35 30% 25%);">Major Works:</strong>
              <ul style="margin: 4px 0 0 16px; padding: 0; font-size: 12px; color: hsl(35 20% 40%);">
                ${scholar.works.slice(0, 2).map(w => `<li>${w}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300 });
      
      marker.on('click', () => {
        onSelectScholar(scholar);
      });

      marker.addTo(mapRef.current!);
      markersRef.current[scholar.id] = marker;
    });
  }, [scholars, onSelectScholar]);

  // Handle selected scholar
  useEffect(() => {
    if (!mapRef.current || !selectedScholar) return;
    
    const marker = markersRef.current[selectedScholar.id];
    if (marker) {
      mapRef.current.setView([selectedScholar.location.lat, selectedScholar.location.lng], 7, {
        animate: true,
      });
      marker.openPopup();
    }
  }, [selectedScholar]);

  // Switch map styles
  useEffect(() => {
    if (!mapRef.current) return;

    Object.values(layersRef.current).forEach(layer => {
      if (layer) mapRef.current?.removeLayer(layer);
    });

    if (mapStyle === 'modern') {
      layersRef.current.modern?.addTo(mapRef.current);
    } else {
      layersRef.current.historical?.addTo(mapRef.current);
    }
  }, [mapStyle]);

  return (
    <div className="relative h-[600px]">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex gap-2">
        <div className="flex bg-card rounded-lg p-1 shadow-card">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMapStyle('modern')}
            className={mapStyle === 'modern' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}
          >
            <Layers className="w-4 h-4 mr-1" />
            Modern
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMapStyle('historical')}
            className={mapStyle === 'historical' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}
          >
            <Layers className="w-4 h-4 mr-1" />
            Historical
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-card/95 backdrop-blur-sm rounded-lg p-4 shadow-card border border-primary/20">
        <h4 className="text-sm font-semibold text-foreground mb-2">Legend</h4>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Rashi (Foundation)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">Rishonim Period</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="text-muted-foreground">Post-Tosafist</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Post-Black Death</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-muted-foreground">Commentators</span>
          </div>
          <p className="text-muted-foreground/70 mt-2 pt-2 border-t border-primary/10">
            Marker size = Importance
          </p>
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-lg border-2 border-primary/30"
      />
    </div>
  );
};
