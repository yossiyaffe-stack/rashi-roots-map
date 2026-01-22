import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DbScholar, DbRelationship } from '@/hooks/useScholars';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type ViewMode = 'modern' | 'combined' | 'historical' | 'satellite';

interface LeafletMapProps {
  scholars: DbScholar[];
  relationships: DbRelationship[];
  selectedScholar: DbScholar | null;
  onSelectScholar: (scholar: DbScholar) => void;
  timeRange: [number, number];
}

// Tile layer definitions
const TILE_LAYERS = {
  voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  historical: 'https://mapwarper.net/maps/tile/14686/{z}/{x}/{y}.png',
  topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  // Labels overlay for satellite
  labels: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
};

// Historical kingdom boundaries (medieval period ~1200-1500)
const HISTORICAL_BOUNDARIES = {
  holyRomanEmpire: {
    name: "Holy Roman Empire",
    color: "#dc2626",
    coordinates: [
      [54.5, 6.0], [54.8, 9.5], [54.0, 14.0], [52.5, 14.5], 
      [51.0, 15.0], [50.0, 17.0], [48.0, 17.5], [47.0, 16.5],
      [46.0, 15.0], [45.5, 13.5], [45.8, 11.0], [46.2, 9.5],
      [46.0, 8.0], [47.5, 7.5], [48.5, 6.0], [49.5, 6.0],
      [50.5, 5.5], [52.0, 5.0], [53.5, 5.5], [54.5, 6.0]
    ] as [number, number][]
  },
  kingdomOfFrance: {
    name: "Kingdom of France",
    color: "#3b82f6",
    coordinates: [
      [51.0, 2.5], [50.0, 1.5], [49.5, -1.0], [48.5, -4.5],
      [47.5, -4.0], [46.0, -1.5], [44.0, -1.5], [43.0, -0.5],
      [42.5, 3.0], [43.0, 4.5], [43.5, 7.0], [45.0, 7.0],
      [46.0, 6.5], [47.0, 6.0], [48.0, 6.0], [49.0, 5.5],
      [50.0, 4.0], [51.0, 2.5]
    ] as [number, number][]
  },
  ottomanEmpire: {
    name: "Ottoman Empire",
    color: "#16a34a",
    coordinates: [
      [42.0, 26.0], [41.5, 28.0], [41.0, 29.5], [40.5, 29.0],
      [40.0, 26.5], [39.0, 26.0], [38.0, 27.0], [37.0, 28.0],
      [36.5, 30.0], [37.0, 32.0], [38.0, 34.0], [39.5, 36.0],
      [41.0, 37.0], [42.0, 35.0], [42.5, 32.0], [43.0, 30.0],
      [42.5, 28.0], [42.0, 26.0]
    ] as [number, number][]
  },
  polishLithuanian: {
    name: "Polish-Lithuanian Commonwealth",
    color: "#9333ea",
    coordinates: [
      [54.5, 14.5], [55.0, 17.0], [56.0, 21.0], [56.5, 24.0],
      [56.0, 28.0], [54.5, 30.0], [52.0, 31.0], [50.0, 28.0],
      [49.0, 24.0], [49.5, 22.0], [50.0, 19.0], [51.0, 17.0],
      [52.0, 15.0], [54.5, 14.5]
    ] as [number, number][]
  },
  iberianPeninsula: {
    name: "Iberian Kingdoms",
    color: "#f59e0b",
    coordinates: [
      [43.5, -8.0], [43.0, -3.0], [42.5, 0.0], [42.0, 3.0],
      [40.5, 0.5], [39.0, -0.5], [37.5, -1.0], [36.5, -5.5],
      [37.0, -9.0], [39.0, -9.5], [41.0, -8.5], [43.5, -8.0]
    ] as [number, number][]
  }
};

const getScholarColor = (scholar: DbScholar): string => {
  if (scholar.name === 'Rashi') return '#e11d48';
  if (scholar.relationship_type === 'supercommentator') return '#3b82f6';
  if (scholar.period === 'Rishonim') return '#f59e0b';
  return '#8b5cf6';
};

const getRelationshipColor = (type: string): string => {
  switch (type) {
    case 'educational': return '#22c55e';
    case 'family': return '#f59e0b';
    case 'literary': return '#3b82f6';
    default: return '#8b5cf6';
  }
};

export function LeafletMap({ 
  scholars, 
  relationships,
  selectedScholar, 
  onSelectScholar, 
  timeRange 
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const historicalLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const linesRef = useRef<L.Polyline[]>([]);
  const boundariesRef = useRef<L.Polygon[]>([]);
  const boundaryLabelsRef = useRef<L.Marker[]>([]);
  
  const [viewMode, setViewMode] = useState<ViewMode>('combined');
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [showLines, setShowLines] = useState(false);
  const [showBoundaries, setShowBoundaries] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [48.3, 8.0],
      zoom: 6,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);
    leafletMap.current = map;

    // Add initial base layer
    baseLayerRef.current = L.tileLayer(TILE_LAYERS.satellite, {
      attribution: '© Esri, Maxar, Earthstar Geographics',
    }).addTo(map);

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Update layers based on view mode and opacity
  useEffect(() => {
    if (!leafletMap.current) return;

    // Remove existing layers
    if (baseLayerRef.current) {
      leafletMap.current.removeLayer(baseLayerRef.current);
    }
    if (historicalLayerRef.current) {
      leafletMap.current.removeLayer(historicalLayerRef.current);
    }
    if (labelsLayerRef.current) {
      leafletMap.current.removeLayer(labelsLayerRef.current);
    }

    // Add layers based on mode
    if (viewMode === 'modern') {
      baseLayerRef.current = L.tileLayer(TILE_LAYERS.voyager, {
        attribution: '© OpenStreetMap, © CARTO',
      }).addTo(leafletMap.current);
    } else if (viewMode === 'satellite') {
      baseLayerRef.current = L.tileLayer(TILE_LAYERS.satellite, {
        attribution: '© Esri, Maxar, Earthstar Geographics',
      }).addTo(leafletMap.current);
      // Add labels on top
      labelsLayerRef.current = L.tileLayer(TILE_LAYERS.labels, {
        attribution: '© CARTO',
      }).addTo(leafletMap.current);
    } else if (viewMode === 'historical') {
      baseLayerRef.current = L.tileLayer(TILE_LAYERS.topo, {
        attribution: '© OpenTopoMap',
        opacity: 0.4,
      }).addTo(leafletMap.current);
      historicalLayerRef.current = L.tileLayer(TILE_LAYERS.historical, {
        attribution: 'Historical Map via NYPL Map Warper',
        opacity: 0.9,
      }).addTo(leafletMap.current);
    } else {
      // Combined mode - satellite + historical overlay
      baseLayerRef.current = L.tileLayer(TILE_LAYERS.satellite, {
        attribution: '© Esri, Maxar, Earthstar Geographics',
      }).addTo(leafletMap.current);
      historicalLayerRef.current = L.tileLayer(TILE_LAYERS.historical, {
        attribution: 'Historical Map via NYPL Map Warper',
        opacity: overlayOpacity,
      }).addTo(leafletMap.current);
      // Add labels on top for readability
      labelsLayerRef.current = L.tileLayer(TILE_LAYERS.labels, {
        attribution: '© CARTO',
        opacity: 0.8,
      }).addTo(leafletMap.current);
    }
  }, [viewMode, overlayOpacity]);

  // Draw historical kingdom boundaries
  useEffect(() => {
    if (!leafletMap.current) return;

    // Clear existing boundaries and labels
    boundariesRef.current.forEach(b => b.remove());
    boundariesRef.current = [];
    boundaryLabelsRef.current.forEach(l => l.remove());
    boundaryLabelsRef.current = [];

    if (!showBoundaries) return;

    Object.entries(HISTORICAL_BOUNDARIES).forEach(([key, region]) => {
      const polygon = L.polygon(region.coordinates, {
        color: region.color,
        weight: 2,
        opacity: 0.7,
        fillColor: region.color,
        fillOpacity: 0.1,
        dashArray: '5, 5',
      });

      polygon.bindTooltip(region.name, {
        permanent: false,
        direction: 'center',
        className: 'kingdom-tooltip',
      });

      polygon.addTo(leafletMap.current!);
      boundariesRef.current.push(polygon);

      // Add kingdom label at centroid
      const centroid = polygon.getBounds().getCenter();
      const label = L.marker(centroid, {
        icon: L.divIcon({
          className: 'kingdom-label',
          html: `<div style="
            background: ${region.color}cc;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            white-space: nowrap;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          ">${region.name}</div>`,
          iconSize: [0, 0],
          iconAnchor: [50, 10],
        }),
        interactive: false,
      });
      
      label.addTo(leafletMap.current!);
      boundaryLabelsRef.current.push(label);
    });
  }, [showBoundaries]);

  // Draw relationship lines
  useEffect(() => {
    if (!leafletMap.current) return;

    // Clear existing lines
    linesRef.current.forEach(line => line.remove());
    linesRef.current = [];

    if (!showLines) return;

    // Create a map of scholar IDs to their coordinates
    const scholarCoords = new Map<string, [number, number]>();
    scholars.forEach(s => {
      if (s.latitude && s.longitude) {
        scholarCoords.set(s.id, [s.latitude, s.longitude]);
      }
    });

    // Draw lines for each relationship
    relationships.forEach(rel => {
      const fromCoords = rel.from_scholar_id ? scholarCoords.get(rel.from_scholar_id) : null;
      const toCoords = rel.to_scholar_id ? scholarCoords.get(rel.to_scholar_id) : null;

      if (fromCoords && toCoords) {
        const color = getRelationshipColor(rel.type);
        
        // Create curved line using quadratic bezier approximation
        const midLat = (fromCoords[0] + toCoords[0]) / 2;
        const midLng = (fromCoords[1] + toCoords[1]) / 2;
        const offset = Math.abs(fromCoords[1] - toCoords[1]) * 0.15;
        
        const curvePoints: L.LatLngExpression[] = [
          fromCoords,
          [midLat + offset, midLng],
          toCoords,
        ];

        const line = L.polyline(curvePoints, {
          color,
          weight: 2,
          opacity: 0.6,
          dashArray: rel.type === 'literary' ? '5, 5' : undefined,
          smoothFactor: 1,
        });

        line.bindTooltip(`${rel.type} relationship`, { 
          className: 'historical-tooltip',
          sticky: true 
        });

        line.addTo(leafletMap.current!);
        linesRef.current.push(line);
      }
    });
  }, [showLines, relationships, scholars]);

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
      
      const icon = L.divIcon({
        className: 'historical-marker',
        html: `
          <div 
            class="marker-dot ${isRashi ? 'marker-rashi-dot' : ''}" 
            style="
              background: ${color}; 
              width: ${isRashi ? '22px' : '14px'};
              height: ${isRashi ? '22px' : '14px'};
              border-radius: 50%;
              border: ${isRashi ? '3px solid #fbbf24' : '2px solid #fff'};
              box-shadow: 0 0 ${isSelected ? '20px' : '10px'} ${color}, 0 2px 6px rgba(0,0,0,0.4);
              transition: transform 0.3s ease, box-shadow 0.3s ease;
              ${isSelected ? 'transform: scale(1.4);' : ''}
            "
          ></div>
        `,
        iconSize: isRashi ? [22, 22] : [14, 14],
        iconAnchor: isRashi ? [11, 11] : [7, 7],
      });

      const marker = L.marker([scholar.latitude!, scholar.longitude!], { icon });

      marker.bindTooltip(
        `<div class="historical-tooltip-content">
          <strong>${scholar.name}</strong>
          ${scholar.hebrew_name ? `<span class="hebrew-text">${scholar.hebrew_name}</span>` : ''}
          <span class="scholar-meta">${scholar.birth_place || scholar.period || ''} • ${scholar.birth_year || '?'}–${scholar.death_year || '?'}</span>
        </div>`,
        { 
          className: 'historical-tooltip',
          direction: 'top',
          offset: [0, -8]
        }
      );

      marker.on('click', () => onSelectScholar(scholar));
      marker.addTo(leafletMap.current!);
      markersRef.current.push(marker);
    });

    // Pan to selected scholar
    if (selectedScholar?.latitude && selectedScholar?.longitude) {
      leafletMap.current.setView([selectedScholar.latitude, selectedScholar.longitude], 7, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [scholars, selectedScholar, timeRange, onSelectScholar]);

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />
      
      {/* View Mode Toggle */}
      <div className="absolute top-6 left-6 z-[1000] flex gap-2">
        {(['modern', 'satellite', 'combined', 'historical'] as ViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`
              px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide
              backdrop-blur-md border transition-all duration-200
              ${viewMode === mode 
                ? 'bg-accent text-accent-foreground border-accent shadow-lg' 
                : 'bg-white/90 text-slate-700 border-slate-200 hover:bg-white hover:shadow-md'
              }
            `}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Controls Panel */}
      <div className="absolute top-6 right-20 z-[1000] bg-white/95 backdrop-blur-md rounded-lg p-4 shadow-lg border border-slate-200 w-60 space-y-3">
        {/* Show Kingdoms Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="show-boundaries" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            Show Kingdoms
          </Label>
          <Switch
            id="show-boundaries"
            checked={showBoundaries}
            onCheckedChange={setShowBoundaries}
          />
        </div>

        {/* Show Lines Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="show-lines" className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            Show Connections
          </Label>
          <Switch
            id="show-lines"
            checked={showLines}
            onCheckedChange={setShowLines}
          />
        </div>

        {/* Historical Overlay - Only show in combined mode */}
        {viewMode === 'combined' && (
          <div className="pt-3 border-t border-slate-200">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-3">
              Historical Overlay
            </label>
            <Slider
              value={[overlayOpacity * 100]}
              min={0}
              max={100}
              step={5}
              onValueChange={([val]) => setOverlayOpacity(val / 100)}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
              <span>Satellite</span>
              <span>{Math.round(overlayOpacity * 100)}%</span>
              <span>17th C.</span>
            </div>
          </div>
        )}

        {/* Kingdom Legend - Only show when boundaries are on */}
        {showBoundaries && (
          <div className="pt-3 border-t border-slate-200">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
              Medieval Kingdoms
            </div>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-red-600 opacity-70"></div>
                <span className="text-slate-600">Holy Roman Empire</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-500 opacity-70"></div>
                <span className="text-slate-600">Kingdom of France</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-green-600 opacity-70"></div>
                <span className="text-slate-600">Ottoman Empire</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-purple-600 opacity-70"></div>
                <span className="text-slate-600">Polish-Lithuanian</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-amber-500 opacity-70"></div>
                <span className="text-slate-600">Iberian Kingdoms</span>
              </div>
            </div>
          </div>
        )}

        {/* Connection Legend - Only show when lines are on */}
        {showLines && (
          <div className="pt-3 border-t border-slate-200">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
              Connection Types
            </div>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-green-500"></div>
                <span className="text-slate-600">Educational</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-amber-500"></div>
                <span className="text-slate-600">Family</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-blue-500 border-dashed" style={{ borderTop: '2px dashed #3b82f6', height: 0 }}></div>
                <span className="text-slate-600">Literary</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
