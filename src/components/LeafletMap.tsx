import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DbScholar, DbRelationship } from '@/hooks/useScholars';
import { cn } from '@/lib/utils';

type ViewMode = 'modern' | 'historical' | 'satellite';

interface LeafletMapProps {
  scholars: DbScholar[];
  relationships: DbRelationship[];
  selectedScholar: DbScholar | null;
  onSelectScholar: (scholar: DbScholar) => void;
  timeRange: [number, number];
  showConnections: boolean;
  showMigrations: boolean;
  showBoundaries: boolean;
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
    years: "962–1806",
    startYear: 962,
    endYear: 1806,
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
    years: "987–1792",
    startYear: 987,
    endYear: 1792,
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
    years: "1299–1922",
    startYear: 1299,
    endYear: 1922,
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
    years: "1569–1795",
    startYear: 1569,
    endYear: 1795,
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
    years: "c. 1000–1492",
    startYear: 1000,
    endYear: 1492,
    color: "#f59e0b",
    coordinates: [
      [43.5, -8.0], [43.0, -3.0], [42.5, 0.0], [42.0, 3.0],
      [40.5, 0.5], [39.0, -0.5], [37.5, -1.0], [36.5, -5.5],
      [37.0, -9.0], [39.0, -9.5], [41.0, -8.5], [43.5, -8.0]
    ] as [number, number][]
  },
  // Sub-regions
  champagne: {
    name: "Champagne",
    years: "Rashi era: 1040–1105",
    startYear: 1040,
    endYear: 1105,
    color: "#c9a961",
    coordinates: [
      [49.5, 3.0], [49.8, 4.0], [49.5, 5.0], [48.8, 5.2],
      [48.0, 4.8], [47.8, 4.0], [48.2, 3.2], [49.0, 2.8],
      [49.5, 3.0]
    ] as [number, number][]
  },
  rhineland: {
    name: "Rhineland (ShUM)",
    years: "c. 900–1350",
    startYear: 900,
    endYear: 1350,
    color: "#ea580c",
    coordinates: [
      [51.0, 6.0], [51.2, 7.0], [50.8, 8.5], [50.0, 8.8],
      [49.2, 8.5], [49.0, 7.5], [49.5, 6.5], [50.5, 6.0],
      [51.0, 6.0]
    ] as [number, number][]
  }
};

type RegionKey = keyof typeof HISTORICAL_BOUNDARIES;

// Historical city names by region/period
const HISTORICAL_CITY_NAMES: Record<string, { modern: string; historical: string; region?: RegionKey; period?: string }[]> = {
  // Ottoman Empire names
  'Constantinople': [
    { modern: 'Constantinople, Ottoman Empire', historical: 'Konstantiniyye', region: 'ottomanEmpire' },
    { modern: 'Constantinople', historical: 'Konstantiniyye', region: 'ottomanEmpire' },
  ],
  'Istanbul': [
    { modern: 'Istanbul', historical: 'Konstantiniyye', region: 'ottomanEmpire' },
  ],
  // Polish-Lithuanian names  
  'Vilna': [
    { modern: 'Vilna, Lithuania', historical: 'Wilno', region: 'polishLithuanian' },
    { modern: 'Vilna', historical: 'Wilno', region: 'polishLithuanian' },
  ],
  'Vilnius': [
    { modern: 'Vilnius', historical: 'Wilno', region: 'polishLithuanian' },
  ],
  'Kalisz': [
    { modern: 'Kalisz, Poland', historical: 'Kalisch', region: 'polishLithuanian' },
    { modern: 'Kalisz', historical: 'Kalisch', region: 'polishLithuanian' },
  ],
  'Brest-Litovsk': [
    { modern: 'Brest-Litovsk, Poland', historical: 'Brisk', region: 'polishLithuanian' },
    { modern: 'Brest-Litovsk', historical: 'Brisk', region: 'polishLithuanian' },
  ],
  'Lublin': [
    { modern: 'Lublin, Poland', historical: 'Lublin', region: 'polishLithuanian' },
  ],
  'Ludmir': [
    { modern: 'Ludmir, Poland', historical: 'Wladimir-Wolyński', region: 'polishLithuanian' },
  ],
  'Warsaw': [
    { modern: 'Warsaw, Poland', historical: 'Warschau', region: 'polishLithuanian' },
    { modern: 'Warsaw', historical: 'Warschau', region: 'polishLithuanian' },
  ],
  'Volozhin': [
    { modern: 'Volozhin, Belarus', historical: 'Wołożyn', region: 'polishLithuanian' },
    { modern: 'Volozhin', historical: 'Wołożyn', region: 'polishLithuanian' },
  ],
  // Holy Roman Empire names
  'Prague': [
    { modern: 'Prague, Bohemia', historical: 'Prag', region: 'holyRomanEmpire' },
    { modern: 'Prague, Czech Republic', historical: 'Prag', region: 'holyRomanEmpire' },
    { modern: 'Prague', historical: 'Prag', region: 'holyRomanEmpire' },
  ],
  'Vienna': [
    { modern: 'Vienna, Austria', historical: 'Wien', region: 'holyRomanEmpire' },
    { modern: 'Vienna', historical: 'Wien', region: 'holyRomanEmpire' },
  ],
  'Mainz': [
    { modern: 'Mainz, Germany', historical: 'Magenza (מגנצא)', region: 'rhineland' },
    { modern: 'Mainz', historical: 'Magenza (מגנצא)', region: 'rhineland' },
  ],
  'Worms': [
    { modern: 'Worms, Germany', historical: 'Warmaisa (ורמייזא)', region: 'rhineland' },
    { modern: 'Worms', historical: 'Warmaisa (ורמייזא)', region: 'rhineland' },
  ],
  'Speyer': [
    { modern: 'Speyer, Germany', historical: 'Shpira (שפירא)', region: 'rhineland' },
    { modern: 'Speyer', historical: 'Shpira (שפירא)', region: 'rhineland' },
  ],
  'Cologne': [
    { modern: 'Cologne, Germany', historical: 'Köln', region: 'holyRomanEmpire' },
    { modern: 'Cologne', historical: 'Köln', region: 'holyRomanEmpire' },
  ],
  'Leipzig': [
    { modern: 'Leipzig, Germany', historical: 'Leipzig', region: 'holyRomanEmpire' },
  ],
  // Kingdom of France names
  'Troyes': [
    { modern: 'Troyes, France', historical: 'Troyes, Champagne', region: 'champagne' },
    { modern: 'Troyes, Champagne', historical: 'Troyes, Comté de Champagne', region: 'champagne' },
    { modern: 'Troyes', historical: 'Troyes, Champagne', region: 'kingdomOfFrance' },
  ],
  'Paris': [
    { modern: 'Paris, France', historical: 'Paris, Île-de-France', region: 'kingdomOfFrance' },
    { modern: 'Paris', historical: 'Paris, Royaume de France', region: 'kingdomOfFrance' },
  ],
  'Ramerupt': [
    { modern: 'Ramerupt, France', historical: 'Ramerupt, Champagne', region: 'champagne' },
    { modern: 'Ramerupt', historical: 'Ramerupt, Champagne', region: 'champagne' },
  ],
  'Dampierre': [
    { modern: 'Dampierre, France', historical: 'Dampierre, Champagne', region: 'champagne' },
    { modern: 'Dampierre', historical: 'Dampierre, Champagne', region: 'champagne' },
  ],
  'Narbonne': [
    { modern: 'Narbonne, Provence', historical: 'Narbonne, Languedoc', region: 'kingdomOfFrance' },
    { modern: 'Narbonne', historical: 'Narbona', region: 'kingdomOfFrance' },
  ],
  // Iberian names
  'Girona': [
    { modern: 'Girona, Catalonia', historical: 'Gerona, Corona d\'Aragón', region: 'iberianPeninsula' },
    { modern: 'Girona, Spain', historical: 'Gerona, Corona d\'Aragón', region: 'iberianPeninsula' },
    { modern: 'Girona', historical: 'Gerona', region: 'iberianPeninsula' },
  ],
  'Toledo': [
    { modern: 'Toledo, Spain', historical: 'Toledo, Castilla', region: 'iberianPeninsula' },
    { modern: 'Toledo', historical: 'Tulaytulah (طليطلة)', region: 'iberianPeninsula' },
  ],
  'Tudela': [
    { modern: 'Tudela, Spain', historical: 'Tudela, Navarra', region: 'iberianPeninsula' },
    { modern: 'Tudela', historical: 'Tutila', region: 'iberianPeninsula' },
  ],
  // Italian cities
  'Venice': [
    { modern: 'Venice, Italy', historical: 'Venezia, Repubblica di Venezia', region: 'holyRomanEmpire' },
    { modern: 'Venice', historical: 'Venezia', region: 'holyRomanEmpire' },
  ],
  'Bologna': [
    { modern: 'Bologna, Italy', historical: 'Bologna, Stato Pontificio', region: 'holyRomanEmpire' },
    { modern: 'Bologna', historical: 'Bologna', region: 'holyRomanEmpire' },
  ],
  'Mantua': [
    { modern: 'Mantua, Italy', historical: 'Mantova, Ducato di Mantova', region: 'holyRomanEmpire' },
    { modern: 'Mantua', historical: 'Mantova', region: 'holyRomanEmpire' },
  ],
  'Trani': [
    { modern: 'Trani, Italy', historical: 'Trani, Regno di Sicilia', region: 'holyRomanEmpire' },
    { modern: 'Trani', historical: 'Trani', region: 'holyRomanEmpire' },
  ],
};

// Get historical city name based on selected region
const getHistoricalCityName = (placeName: string | null, selectedRegion: RegionKey | null): string => {
  if (!placeName) return '';
  if (!selectedRegion) return placeName;
  
  // Check each city mapping
  for (const [city, mappings] of Object.entries(HISTORICAL_CITY_NAMES)) {
    for (const mapping of mappings) {
      if (placeName.includes(city) || placeName === mapping.modern) {
        if (mapping.region === selectedRegion) {
          return mapping.historical;
        }
      }
    }
  }
  
  return placeName;
};

// Migration paths data
interface MigrationPath {
  id: string;
  name: string;
  description: string;
  year: number;
  cause: 'expulsion' | 'persecution' | 'opportunity' | 'flight';
  from: { lat: number; lng: number; name: string };
  to: { lat: number; lng: number; name: string };
  color: string;
}

const MIGRATION_PATHS: MigrationPath[] = [
  {
    id: 'france-rhineland-1306',
    name: 'French Expulsion to Rhineland (1306)',
    description: 'The 1306 expulsion drove French Jews eastward to the Rhineland',
    year: 1306,
    cause: 'expulsion',
    from: { lat: 48.8566, lng: 2.3522, name: 'Paris' },
    to: { lat: 49.4521, lng: 8.2428, name: 'Mainz' },
    color: '#3b82f6'
  },
  {
    id: 'france-savoy-1394',
    name: 'French Expulsion to Savoy (1394)',
    description: 'Final expulsion from France, scholars fled to Savoy and Italy',
    year: 1394,
    cause: 'expulsion',
    from: { lat: 48.8566, lng: 2.3522, name: 'Paris' },
    to: { lat: 45.5667, lng: 5.9167, name: 'Chambéry' },
    color: '#3b82f6'
  },
  {
    id: 'rhineland-austria-1348',
    name: 'Black Death Flight (1348)',
    description: 'Surviving scholars fled to Austria after the massacres',
    year: 1348,
    cause: 'persecution',
    from: { lat: 49.4521, lng: 8.2428, name: 'Mainz' },
    to: { lat: 47.8133, lng: 16.2431, name: 'Wiener-Neustadt' },
    color: '#ef4444'
  },
  {
    id: 'bulgaria-vienna-1396',
    name: 'Ottoman Conquest Flight (1396)',
    description: 'Scholars fled Bulgaria after Ottoman conquest',
    year: 1396,
    cause: 'flight',
    from: { lat: 43.9900, lng: 22.8800, name: 'Vidin' },
    to: { lat: 48.2082, lng: 16.3738, name: 'Vienna' },
    color: '#16a34a'
  },
  {
    id: 'champagne-spread',
    name: "Rashi's Students Spread (c. 1110)",
    description: "Rashi's grandchildren spread teachings throughout Champagne",
    year: 1110,
    cause: 'opportunity',
    from: { lat: 48.2973, lng: 4.0744, name: 'Troyes' },
    to: { lat: 48.4637, lng: 3.5669, name: 'Ramerupt' },
    color: '#c9a961'
  },
  {
    id: 'spain-ottoman-1492',
    name: 'Spanish Expulsion to Ottoman (1492)',
    description: 'Spanish Jews brought Sephardic traditions to Constantinople',
    year: 1492,
    cause: 'expulsion',
    from: { lat: 40.4168, lng: -3.7038, name: 'Toledo' },
    to: { lat: 41.0082, lng: 28.9784, name: 'Constantinople' },
    color: '#f59e0b'
  }
];

// Point-in-polygon algorithm
const isPointInPolygon = (lat: number, lng: number, polygon: [number, number][]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
};

const getScholarColor = (scholar: DbScholar): string => {
  if (scholar.name === 'Rashi') return '#c9a961'; // Gold for Rashi
  if (scholar.relationship_type === 'grandson') return '#ea580c'; // Orange for grandsons
  if (scholar.relationship_type === 'student') return '#facc15'; // Yellow for direct students
  if (scholar.period === 'Rishonim') return '#f59e0b'; // Amber for Rishonim
  if (scholar.period === 'Acharonim') return '#22c55e'; // Green for Acharonim
  if (scholar.period?.includes('Post-Black Death') || scholar.period?.includes('Post-Expulsion')) return '#16a34a';
  if (scholar.relationship_type === 'supercommentator') return '#6366f1'; // Indigo for supercommentators
  return '#8b7355'; // Sepia for others
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
  timeRange,
  showConnections,
  showMigrations,
  showBoundaries,
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
  const migrationLinesRef = useRef<(L.Polyline | L.Marker)[]>([]);
  
  const [viewMode, setViewMode] = useState<ViewMode>('satellite');
  const [selectedRegion, setSelectedRegion] = useState<RegionKey | null>(null);

  // Alias for internal use
  const showLines = showConnections;

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
    }
  }, [viewMode]);

  // Draw historical kingdom boundaries with click-to-filter
  useEffect(() => {
    if (!leafletMap.current) return;

    // Clear existing boundaries and labels
    boundariesRef.current.forEach(b => b.remove());
    boundariesRef.current = [];
    boundaryLabelsRef.current.forEach(l => l.remove());
    boundaryLabelsRef.current = [];

    if (!showBoundaries) return;

    const currentYear = timeRange[1]; // Use the end of the time range as "current" viewing year

    (Object.entries(HISTORICAL_BOUNDARIES) as [RegionKey, typeof HISTORICAL_BOUNDARIES[RegionKey]][]).forEach(([key, region]) => {
      // Check if this kingdom/region existed during the selected time period
      const existedDuringPeriod = currentYear >= region.startYear && currentYear <= region.endYear;
      
      if (!existedDuringPeriod) return; // Skip regions that didn't exist yet or have ended

      const isSelected = selectedRegion === key;
      const polygon = L.polygon(region.coordinates, {
        color: region.color,
        weight: isSelected ? 4 : 2,
        opacity: isSelected ? 1 : 0.7,
        fillColor: region.color,
        fillOpacity: isSelected ? 0.25 : 0.1,
        dashArray: isSelected ? undefined : '5, 5',
      });

      polygon.bindTooltip(
        `${region.name} (${region.years})${isSelected ? ' (Click to clear filter)' : ' (Click to filter)'}`, 
        {
          permanent: false,
          direction: 'center',
          className: 'kingdom-tooltip',
        }
      );

      polygon.on('click', () => {
        setSelectedRegion(prev => prev === key ? null : key);
      });

      polygon.on('mouseover', () => {
        if (!isSelected) {
          polygon.setStyle({ fillOpacity: 0.2, weight: 3 });
        }
      });

      polygon.on('mouseout', () => {
        if (!isSelected) {
          polygon.setStyle({ fillOpacity: 0.1, weight: 2 });
        }
      });

      polygon.addTo(leafletMap.current!);
      boundariesRef.current.push(polygon);

      // Add kingdom label at centroid
      const centroid = polygon.getBounds().getCenter();
      const label = L.marker(centroid, {
        icon: L.divIcon({
          className: 'kingdom-label',
          html: `<div style="
            background: ${region.color}${isSelected ? '' : 'cc'};
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: ${isSelected ? '12px' : '10px'};
            font-weight: bold;
            white-space: nowrap;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            ${isSelected ? 'box-shadow: 0 0 10px ' + region.color + ';' : ''}
          ">${region.name}${isSelected ? ' ✓' : ''}</div>`,
          iconSize: [0, 0],
          iconAnchor: [50, 10],
        }),
        interactive: false,
      });
      
      label.addTo(leafletMap.current!);
      boundaryLabelsRef.current.push(label);
    });
  }, [showBoundaries, selectedRegion, timeRange]);

  // Draw migration paths
  useEffect(() => {
    if (!leafletMap.current) return;

    // Clear existing migration lines
    migrationLinesRef.current.forEach(item => item.remove());
    migrationLinesRef.current = [];

    if (!showMigrations) return;

    MIGRATION_PATHS.forEach(migration => {
      const fromLatLng: L.LatLngExpression = [migration.from.lat, migration.from.lng];
      const toLatLng: L.LatLngExpression = [migration.to.lat, migration.to.lng];
      
      // Calculate curved path
      const midLat = (migration.from.lat + migration.to.lat) / 2;
      const midLng = (migration.from.lng + migration.to.lng) / 2;
      const dx = migration.to.lng - migration.from.lng;
      const dy = migration.to.lat - migration.from.lat;
      const curveOffset = Math.sqrt(dx * dx + dy * dy) * 0.15;
      
      const curvedPath: L.LatLngExpression[] = [
        fromLatLng,
        [midLat - (dx * 0.1), midLng + (dy * 0.1)],
        toLatLng
      ];

      // Get dash pattern based on cause
      const dashArray = migration.cause === 'expulsion' ? '10, 5' 
        : migration.cause === 'persecution' ? '15, 5, 5, 5'
        : migration.cause === 'flight' ? '8, 4'
        : '4, 4';

      const line = L.polyline(curvedPath, {
        color: migration.color,
        weight: 4,
        opacity: 0.7,
        dashArray,
        smoothFactor: 1,
      });

      const causeIcon = migration.cause === 'expulsion' ? '⚠️'
        : migration.cause === 'persecution' ? '🔥'
        : migration.cause === 'flight' ? '🏃'
        : '📚';

      line.bindTooltip(
        `<strong>${causeIcon} ${migration.name}</strong><br/>
        <span style="font-size:11px">${migration.description}</span>`,
        { className: 'historical-tooltip', sticky: true }
      );

      line.addTo(leafletMap.current!);
      migrationLinesRef.current.push(line);

      // Add arrow marker at destination
      const arrowIcon = L.divIcon({
        className: 'migration-arrow',
        html: `<div style="
          font-size: 14px;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
        ">➤</div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const arrow = L.marker(toLatLng, { icon: arrowIcon, interactive: false });
      arrow.addTo(leafletMap.current!);
      migrationLinesRef.current.push(arrow);
    });
  }, [showMigrations]);

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

  // Update markers when scholars or time range or region filter changes
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
      // Check if scholar is in selected region
      const inSelectedRegion = !selectedRegion || 
        isPointInPolygon(scholar.latitude!, scholar.longitude!, HISTORICAL_BOUNDARIES[selectedRegion].coordinates);
      
      const color = getScholarColor(scholar);
      const isRashi = scholar.name === 'Rashi';
      const isSelected = selectedScholar?.id === scholar.id;
      const isDimmed = selectedRegion && !inSelectedRegion;
      
      // Get a shorter display name (acronym or first part)
      const shortName = scholar.name.split(' - ')[0].split(' (')[0];
      
      const icon = L.divIcon({
        className: 'historical-marker',
        html: `
          <div class="marker-container" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
          ">
            <div 
              class="marker-dot ${isRashi ? 'marker-rashi-dot' : ''}" 
              style="
                background: ${color}; 
                width: ${isRashi ? '22px' : '14px'};
                height: ${isRashi ? '22px' : '14px'};
                border-radius: 50%;
                border: ${isRashi ? '3px solid #fbbf24' : '2px solid #fff'};
                box-shadow: 0 0 ${isSelected ? '20px' : '10px'} ${color}, 0 2px 6px rgba(0,0,0,0.4);
                transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
                ${isSelected ? 'transform: scale(1.4);' : ''}
                ${isDimmed ? 'opacity: 0.25; filter: grayscale(0.5);' : ''}
              "
            ></div>
            <div class="marker-label" style="
              background: linear-gradient(135deg, #2d1f0f, #1a1408);
              color: #f4e4c1;
              padding: 4px 10px;
              border-radius: 4px;
              font-size: ${isRashi ? '13px' : '11px'};
              font-weight: 600;
              letter-spacing: 0.3px;
              white-space: nowrap;
              max-width: 140px;
              overflow: hidden;
              text-overflow: ellipsis;
              box-shadow: 0 2px 8px rgba(0,0,0,0.6);
              border: 1px solid rgba(201,169,97,0.4);
              ${isDimmed ? 'opacity: 0.4;' : ''}
              ${isRashi ? 'background: linear-gradient(135deg, #d4af37, #b8963e); color: #1a1408; font-weight: 700;' : ''}
            ">${shortName}</div>
          </div>
        `,
        iconSize: isRashi ? [120, 60] : [100, 50],
        iconAnchor: isRashi ? [60, 11] : [50, 7],
      });

      const marker = L.marker([scholar.latitude!, scholar.longitude!], { 
        icon,
        zIndexOffset: isDimmed ? -1000 : 0 
      });

      // Get historical place name if region is selected
      const displayPlace = getHistoricalCityName(scholar.birth_place, selectedRegion);
      
      marker.bindTooltip(
        `<div class="historical-tooltip-content">
          <strong>${scholar.name}</strong>
          ${scholar.hebrew_name ? `<span class="hebrew-text">${scholar.hebrew_name}</span>` : ''}
          <span class="scholar-meta">${displayPlace || scholar.period || ''} • ${scholar.birth_year || '?'}–${scholar.death_year || '?'}</span>
          ${selectedRegion && displayPlace !== scholar.birth_place ? `<span class="scholar-modern-name">(Modern: ${scholar.birth_place})</span>` : ''}
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
  }, [scholars, selectedScholar, timeRange, onSelectScholar, selectedRegion]);

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />
      
      {/* View Mode Toggle */}
      <div className="absolute top-6 left-6 z-[1000] flex gap-2">
        {(['modern', 'satellite', 'historical'] as ViewMode[]).map(mode => (
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

      {/* Selected Region Banner */}
      {selectedRegion && (
        <div className="absolute top-20 left-6 z-[1000] bg-white/95 backdrop-blur-md rounded-lg px-4 py-2 shadow-lg border border-slate-200 flex items-center gap-3">
          <div 
            className="w-3 h-3 rounded-sm" 
            style={{ backgroundColor: HISTORICAL_BOUNDARIES[selectedRegion].color }}
          />
          <span className="text-sm font-medium text-slate-700">
            Filtering: {HISTORICAL_BOUNDARIES[selectedRegion].name}
          </span>
          <button 
            onClick={() => setSelectedRegion(null)}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

    </div>
  );
}
