import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DbScholar, DbRelationship, DbPlace, DbLocationName, DbBiographicalRelationship, DbTextualRelationship, DbLocation, LocationReason } from '@/hooks/useScholars';
import { LOCATION_REASON_CONFIG } from '@/hooks/useScholars';
import type { CityFilter } from '@/contexts/MapControlsContext';
import { useRelationshipFilters } from '@/contexts/RelationshipFilterContext';
import { cn } from '@/lib/utils';

type ViewMode = 'modern' | 'historical' | 'satellite';

// Extended textual relationship type with scholar IDs
type TextualRelationshipWithScholars = DbTextualRelationship & { 
  from_scholar_id: string | null; 
  to_scholar_id: string | null 
};

interface LeafletMapProps {
  scholars: DbScholar[];
  relationships: DbRelationship[];
  biographicalRelationships?: DbBiographicalRelationship[];
  textualRelationships?: TextualRelationshipWithScholars[];
  places: DbPlace[];
  locationNames: DbLocationName[];
  locations?: DbLocation[];
  selectedScholar: DbScholar | null;
  onSelectScholar: (scholar: DbScholar) => void;
  timeRange: [number, number];
  showConnections: boolean;
  showMigrations: boolean;
  showBoundaries: boolean;
  showBoundaryShading?: boolean;
  showPlaceNamesEnglish: boolean;
  showPlaceNamesHebrew: boolean;
  showScholarNamesEnglish: boolean;
  showScholarNamesHebrew: boolean;
  cityFilter: CityFilter;
  showOnlyScholarCities: boolean;
  showJourneyMarkers?: boolean;
  journeyReasonFilter?: LocationReason[];
  mapRef?: React.MutableRefObject<L.Map | null>;
}

// Tile layer definitions
const TILE_LAYERS = {
  voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  historical: 'https://mapwarper.net/maps/tile/14686/{z}/{x}/{y}.png',
  topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  // Labels overlay for satellite - using dark mode labels for better contrast
  labels: 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
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

// City labels are now loaded from the database via places prop
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
  biographicalRelationships = [],
  textualRelationships = [],
  places,
  locationNames,
  locations = [],
  selectedScholar, 
  onSelectScholar, 
  timeRange,
  showConnections,
  showMigrations,
  showBoundaries,
  showBoundaryShading = true,
  showPlaceNamesEnglish,
  showPlaceNamesHebrew,
  showScholarNamesEnglish,
  showScholarNamesHebrew,
  cityFilter,
  showOnlyScholarCities,
  showJourneyMarkers = false,
  journeyReasonFilter = [],
  mapRef: externalMapRef,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const historicalLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const linesRef = useRef<L.Polyline[]>([]);
  const boundariesRef = useRef<L.Polygon[]>([]);
  const boundaryLabelsRef = useRef<L.Marker[]>([]);
  const migrationLinesRef = useRef<(L.Polyline | L.Marker)[]>([]);
  const cityLabelsRef = useRef<L.Marker[]>([]);
  const journeyMarkersRef = useRef<(L.Marker | L.Polyline)[]>([]);
  
  const [viewMode, setViewMode] = useState<ViewMode>('satellite');
  const [selectedRegion, setSelectedRegion] = useState<RegionKey | null>(null);
  const [zoomLevel, setZoomLevel] = useState(6);

  // Get relationship filters
  const { shouldShowRelationship } = useRelationshipFilters();

  // Alias for internal use
  const showLines = showConnections;
  
  // Get the midpoint of the time range for historical name lookup
  const timeMidpoint = Math.round((timeRange[0] + timeRange[1]) / 2);

  // Helper function to get the best historical name for a place based on time period
  const getHistoricalName = useMemo(() => {
    return (placeId: string, language: 'hebrew' | 'latin' | 'english', defaultName: string | null): string | null => {
      if (!defaultName && language !== 'latin') return null;
      
      // Find all names for this place in the requested language
      const placeNames = locationNames.filter(ln => 
        ln.place_id === placeId && 
        ln.language === language
      );
      
      if (placeNames.length === 0) {
        // For Latin, we might have historical names in other languages
        if (language === 'latin') {
          const latinNames = locationNames.filter(ln => 
            ln.place_id === placeId && 
            ln.language === 'latin'
          );
          const validLatinName = latinNames.find(ln => {
            const validFrom = ln.valid_from ?? 0;
            const validTo = ln.valid_to ?? 9999;
            return timeMidpoint >= validFrom && timeMidpoint <= validTo;
          });
          return validLatinName?.name ?? null;
        }
        return defaultName;
      }
      
      // Find name valid for the current time period
      const validName = placeNames.find(ln => {
        const validFrom = ln.valid_from ?? 0;
        const validTo = ln.valid_to ?? 9999;
        return timeMidpoint >= validFrom && timeMidpoint <= validTo;
      });
      
      // Prefer the valid historical name, then preferred name, then default
      if (validName) return validName.name;
      
      const preferredName = placeNames.find(ln => ln.is_preferred);
      if (preferredName) return preferredName.name;
      
      return defaultName;
    };
  }, [locationNames, timeMidpoint]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || leafletMap.current) return;

    const map = L.map(containerRef.current, {
      center: [48.3, 8.0],
      zoom: 6,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);
    leafletMap.current = map;
    
    // Expose map to parent via ref
    if (externalMapRef) {
      externalMapRef.current = map;
    }

    // Create custom pane for city labels with higher z-index (above markers)
    map.createPane('cityLabelsPane');
    map.getPane('cityLabelsPane')!.style.zIndex = '650';

    // Track zoom level changes
    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

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
      // No labels overlay - scholar markers are the focus
    } else if (viewMode === 'historical') {
      baseLayerRef.current = L.tileLayer(TILE_LAYERS.topo, {
        attribution: '© OpenTopoMap',
        opacity: 0.4,
      }).addTo(leafletMap.current);
      historicalLayerRef.current = L.tileLayer(TILE_LAYERS.historical, {
        attribution: 'Historical Map via NYPL Map Warper',
        opacity: 0.9,
      }).addTo(leafletMap.current);
      // Add clear reference labels on top
      // No labels overlay - scholar markers are the focus
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
      
      // Calculate fill opacity based on shading setting
      const baseFillOpacity = showBoundaryShading ? (isSelected ? 0.25 : 0.1) : 0;
      const hoverFillOpacity = showBoundaryShading ? 0.2 : 0;
      
      const polygon = L.polygon(region.coordinates, {
        color: region.color,
        weight: isSelected ? 4 : 2,
        opacity: isSelected ? 1 : 0.7,
        fillColor: region.color,
        fillOpacity: baseFillOpacity,
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
          polygon.setStyle({ fillOpacity: hoverFillOpacity, weight: 3 });
        }
      });

      polygon.on('mouseout', () => {
        if (!isSelected) {
          polygon.setStyle({ fillOpacity: baseFillOpacity, weight: 2 });
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
  }, [showBoundaries, showBoundaryShading, selectedRegion, timeRange]);

  // Get set of cities where scholars are located
  const scholarCityCoords = useMemo(() => {
    const coords = new Set<string>();
    scholars.forEach(s => {
      if (s.latitude && s.longitude) {
        // Create a key that matches places within ~0.1 degrees (about 11km)
        const latKey = Math.round(s.latitude * 10) / 10;
        const lngKey = Math.round(s.longitude * 10) / 10;
        coords.add(`${latKey},${lngKey}`);
      }
    });
    return coords;
  }, [scholars]);

  // Check if a place has scholars
  const hasScholar = (place: DbPlace): boolean => {
    const latKey = Math.round(place.latitude * 10) / 10;
    const lngKey = Math.round(place.longitude * 10) / 10;
    return scholarCityCoords.has(`${latKey},${lngKey}`);
  };

  // Draw custom city labels from database (crisp HTML text)
  useEffect(() => {
    if (!leafletMap.current) return;

    // Clear existing city labels
    cityLabelsRef.current.forEach(label => label.remove());
    cityLabelsRef.current = [];
    
    // Don't render if both languages are hidden or no places loaded
    if ((!showPlaceNamesEnglish && !showPlaceNamesHebrew) || places.length === 0) return;

    // Adjust text styling based on map mode (modern map is lighter)
    const isLightMap = viewMode === 'modern';
    const textColor = isLightMap ? '#1a1a1a' : '#fff';
    const shadowColor = isLightMap ? 'rgba(255,255,255,0.9)' : '#1a1a1a';
    const glowColor = isLightMap ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.8)';

    // Determine min importance based on cityFilter and zoom level
    let minImportance: number;
    switch (cityFilter) {
      case 'major':
        minImportance = 7;
        break;
      case 'all':
      default:
        // Use zoom-based filtering for 'all' mode
        minImportance = zoomLevel < 5 ? 9 : zoomLevel < 6 ? 7 : zoomLevel < 7 ? 5 : 0;
        break;
    }

    // Filter places by importance and optionally by scholar presence
    let visiblePlaces = places.filter(p => (p.importance ?? 5) >= minImportance);
    
    // If scholar-only filter is enabled, further filter to only cities with scholars
    if (showOnlyScholarCities) {
      visiblePlaces = visiblePlaces.filter(p => hasScholar(p));
    }

    visiblePlaces.forEach(place => {
      const isMajor = (place.importance ?? 5) >= 8;
      const isScholarCity = hasScholar(place);
      
      // Get historical names for this time period
      const hebrewName = getHistoricalName(place.id, 'hebrew', place.name_hebrew);
      const englishName = getHistoricalName(place.id, 'english', place.name_english) || place.name_english;
      const latinName = getHistoricalName(place.id, 'latin', null);
      
      // Use Latin historical name if available and different from English
      const displayEnglishName = latinName && latinName !== englishName 
        ? `${latinName}` 
        : englishName;
      
      // Scholar cities get a subtle accent color
      const cityTextColor = isScholarCity ? (isLightMap ? '#6d28d9' : '#c4b5fd') : textColor;
      
      // Build HTML based on which languages are enabled
      const hebrewHtml = showPlaceNamesHebrew && hebrewName ? `<div style="
        font-family: 'David Libre', 'Times New Roman', serif;
        font-size: ${isMajor ? '16px' : '13px'};
        font-weight: 600;
        color: ${cityTextColor};
        text-shadow: 
          -1px -1px 0 ${shadowColor},
          1px -1px 0 ${shadowColor},
          -1px 1px 0 ${shadowColor},
          1px 1px 0 ${shadowColor},
          0 0 4px ${glowColor};
        direction: rtl;
      ">${hebrewName}</div>` : '';
      
      const englishHtml = showPlaceNamesEnglish ? `<div style="
        font-family: 'Crimson Text', Georgia, serif;
        font-size: ${isMajor ? '14px' : '11px'};
        font-weight: ${isMajor ? '600' : '500'};
        color: ${cityTextColor};
        text-shadow: 
          -1px -1px 0 ${shadowColor},
          1px -1px 0 ${shadowColor},
          -1px 1px 0 ${shadowColor},
          1px 1px 0 ${shadowColor},
          0 0 4px ${glowColor};
        margin-top: ${showPlaceNamesHebrew && hebrewName ? '-2px' : '0'};
      ">${displayEnglishName}</div>` : '';
      
      const label = L.marker([place.latitude, place.longitude], {
        icon: L.divIcon({
          className: 'city-label',
          html: `<div style="
            text-align: center;
            white-space: nowrap;
            pointer-events: none;
          ">
            ${hebrewHtml}
            ${englishHtml}
          </div>`,
          iconSize: [0, 0],
          iconAnchor: [0, -8],
        }),
        interactive: false,
        pane: 'cityLabelsPane',
      });

      label.addTo(leafletMap.current!);
      cityLabelsRef.current.push(label);
    });
  }, [viewMode, leafletMap.current, showPlaceNamesEnglish, showPlaceNamesHebrew, places, zoomLevel, getHistoricalName, cityFilter, showOnlyScholarCities, scholarCityCoords]);

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
      
      // Calculate curved path with more control points for smoother curve
      const midLat = (migration.from.lat + migration.to.lat) / 2;
      const midLng = (migration.from.lng + migration.to.lng) / 2;
      const dx = migration.to.lng - migration.from.lng;
      const dy = migration.to.lat - migration.from.lat;
      
      const curvedPath: L.LatLngExpression[] = [
        fromLatLng,
        [midLat - (dx * 0.15), midLng + (dy * 0.15)],
        toLatLng
      ];

      // Get cause-specific styling - much more distinct from kingdom borders
      const causeStyles = {
        expulsion: { 
          color: '#ef4444', 
          icon: '⚠️',
          label: 'Expulsion',
          glowColor: 'rgba(239, 68, 68, 0.6)'
        },
        persecution: { 
          color: '#f97316', 
          icon: '🔥',
          label: 'Persecution',
          glowColor: 'rgba(249, 115, 22, 0.6)'
        },
        flight: { 
          color: '#eab308', 
          icon: '🏃',
          label: 'Flight',
          glowColor: 'rgba(234, 179, 8, 0.6)'
        },
        opportunity: { 
          color: '#22c55e', 
          icon: '📚',
          label: 'Scholarly Migration',
          glowColor: 'rgba(34, 197, 94, 0.6)'
        },
      };
      
      const style = causeStyles[migration.cause];

      // Create glow/shadow line (behind main line)
      const glowLine = L.polyline(curvedPath, {
        color: style.glowColor,
        weight: 12,
        opacity: 0.4,
        lineCap: 'round',
        lineJoin: 'round',
        smoothFactor: 1,
      });
      glowLine.addTo(leafletMap.current!);
      migrationLinesRef.current.push(glowLine);

      // Create main line - solid, thick, with rounded caps (very different from dashed borders)
      const line = L.polyline(curvedPath, {
        color: style.color,
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        smoothFactor: 1,
      });

      // Click opens a popup with full explanation
      line.bindPopup(
        `<div style="min-width: 250px; font-family: 'Crimson Text', Georgia, serif;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 24px;">${style.icon}</span>
            <div>
              <div style="font-size: 16px; font-weight: 700; color: ${style.color};">${migration.name}</div>
              <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">${style.label}</div>
            </div>
          </div>
          <div style="font-size: 14px; line-height: 1.5; color: #333; margin-bottom: 12px;">
            ${migration.description}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 8px;">
            <div><strong>From:</strong> ${migration.from.name}</div>
            <div><strong>To:</strong> ${migration.to.name}</div>
          </div>
          <div style="font-size: 11px; color: #999; margin-top: 4px; text-align: center;">
            Click anywhere on map to close
          </div>
        </div>`,
        { 
          className: 'migration-popup',
          maxWidth: 320,
        }
      );

      // Hover tooltip for quick info
      line.bindTooltip(
        `<strong>${style.icon} ${migration.name}</strong><br/>
        <span style="font-size:11px; opacity: 0.8;">Click for details</span>`,
        { className: 'historical-tooltip', sticky: true }
      );

      // Hover effects
      line.on('mouseover', () => {
        line.setStyle({ weight: 7, opacity: 1 });
        glowLine.setStyle({ weight: 16, opacity: 0.6 });
      });
      
      line.on('mouseout', () => {
        line.setStyle({ weight: 5, opacity: 0.9 });
        glowLine.setStyle({ weight: 12, opacity: 0.4 });
      });

      line.addTo(leafletMap.current!);
      migrationLinesRef.current.push(line);

      // Add animated arrow marker at destination
      const arrowIcon = L.divIcon({
        className: 'migration-arrow',
        html: `<div style="
          width: 0;
          height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-bottom: 16px solid ${style.color};
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
          transform: rotate(${Math.atan2(
            migration.to.lat - migration.from.lat,
            migration.to.lng - migration.from.lng
          ) * 180 / Math.PI - 90}deg);
        "></div>`,
        iconSize: [20, 16],
        iconAnchor: [10, 8],
      });

      const arrow = L.marker(toLatLng, { icon: arrowIcon, interactive: false });
      arrow.addTo(leafletMap.current!);
      migrationLinesRef.current.push(arrow);

      // Add origin circle marker
      const originIcon = L.divIcon({
        className: 'migration-origin',
        html: `<div style="
          width: 12px;
          height: 12px;
          background: ${style.color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const origin = L.marker(fromLatLng, { icon: originIcon, interactive: false });
      origin.addTo(leafletMap.current!);
      migrationLinesRef.current.push(origin);
    });
  }, [showMigrations]);

  // Draw scholar journey route lines when viewing their journey
  useEffect(() => {
    if (!leafletMap.current) return;

    // Clear existing journey markers
    journeyMarkersRef.current.forEach(item => item.remove());
    journeyMarkersRef.current = [];

    // Only draw journey if: markers are enabled, a scholar is selected, and we have locations
    if (!showJourneyMarkers || !selectedScholar || locations.length === 0) return;

    // Get locations for the selected scholar
    const scholarLocations = locations.filter(loc => loc.scholar_id === selectedScholar.id);
    
    // Filter by journey reason filter if any are selected
    const filteredLocations = journeyReasonFilter.length > 0 
      ? scholarLocations.filter(loc => loc.reason && journeyReasonFilter.includes(loc.reason))
      : scholarLocations;

    // Sort locations chronologically by start_year, then by reason order (birth first, death last)
    const reasonOrder: Record<LocationReason, number> = {
      birth: 0,
      study: 1,
      rabbinate: 2,
      travel: 3,
      exile: 4,
      refuge: 5,
      death: 6,
    };

    const sortedLocations = [...filteredLocations].sort((a, b) => {
      const yearA = a.start_year ?? 0;
      const yearB = b.start_year ?? 0;
      if (yearA !== yearB) return yearA - yearB;
      // If same year, use reason order
      const orderA = a.reason ? reasonOrder[a.reason] : 3;
      const orderB = b.reason ? reasonOrder[b.reason] : 3;
      return orderA - orderB;
    });

    if (sortedLocations.length < 2) return;

    // Get scholar's color for the route
    const scholarColor = getScholarColor(selectedScholar);

    // Draw journey markers at each location
    sortedLocations.forEach((loc, index) => {
      const config = loc.reason ? LOCATION_REASON_CONFIG[loc.reason] : { icon: '📍', color: '#6b7280' };
      const isFirst = index === 0;
      const isLast = index === sortedLocations.length - 1;
      
      const markerIcon = L.divIcon({
        className: 'journey-marker',
        html: `<div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        ">
          <div style="
            width: ${isFirst || isLast ? 28 : 22}px;
            height: ${isFirst || isLast ? 28 : 22}px;
            background: ${config.color};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isFirst || isLast ? 14 : 12}px;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 2px ${config.color}40;
            position: relative;
          ">
            ${config.icon}
            <div style="
              position: absolute;
              top: -8px;
              right: -8px;
              background: #1a1408;
              color: #ffd700;
              font-size: 9px;
              font-weight: bold;
              min-width: 16px;
              height: 16px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid #ffd700;
            ">${index + 1}</div>
          </div>
          <div style="
            background: #1a1408;
            color: #ffd700;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
            white-space: nowrap;
            border: 1px solid ${config.color};
          ">${loc.location_name}${loc.start_year ? ` (${loc.start_year})` : ''}</div>
        </div>`,
        iconSize: [isFirst || isLast ? 100 : 80, 50],
        iconAnchor: [isFirst || isLast ? 50 : 40, 14],
      });

      const marker = L.marker([loc.latitude, loc.longitude], { 
        icon: markerIcon,
        zIndexOffset: 1000 + index,
      });

      // Add tooltip with full journey info
      marker.bindTooltip(
        `<div style="font-family: 'Crimson Text', Georgia, serif;">
          <strong>${config.icon} ${loc.reason ? loc.reason.charAt(0).toUpperCase() + loc.reason.slice(1) : 'Location'}</strong><br/>
          <span style="font-size: 14px; font-weight: 600;">${loc.location_name}</span><br/>
          ${loc.start_year ? `<span style="opacity: 0.8;">Year: ${loc.start_year}${loc.end_year ? ` – ${loc.end_year}` : ''}</span><br/>` : ''}
          ${loc.historical_context ? `<span style="font-size: 11px; opacity: 0.7; font-style: italic;">${loc.historical_context}</span>` : ''}
        </div>`,
        { className: 'historical-tooltip', direction: 'top', offset: [0, -10] }
      );

      marker.addTo(leafletMap.current!);
      journeyMarkersRef.current.push(marker);
    });

    // Draw connecting lines between journey locations
    for (let i = 0; i < sortedLocations.length - 1; i++) {
      const from = sortedLocations[i];
      const to = sortedLocations[i + 1];
      
      const fromLatLng: L.LatLngExpression = [from.latitude, from.longitude];
      const toLatLng: L.LatLngExpression = [to.latitude, to.longitude];
      
      // Calculate a smooth curved path
      const midLat = (from.latitude + to.latitude) / 2;
      const midLng = (from.longitude + to.longitude) / 2;
      const dx = to.longitude - from.longitude;
      const dy = to.latitude - from.latitude;
      
      // Add some curve offset perpendicular to the line
      const curveOffset = Math.sqrt(dx * dx + dy * dy) * 0.15;
      const curvedPath: L.LatLngExpression[] = [
        fromLatLng,
        [midLat + (dx * 0.1), midLng - (dy * 0.1)],
        toLatLng
      ];

      // Draw glow/shadow line
      const glowLine = L.polyline(curvedPath, {
        color: scholarColor,
        weight: 10,
        opacity: 0.25,
        lineCap: 'round',
        lineJoin: 'round',
        smoothFactor: 1,
      });
      glowLine.addTo(leafletMap.current!);
      journeyMarkersRef.current.push(glowLine);

      // Draw main animated line
      const line = L.polyline(curvedPath, {
        color: scholarColor,
        weight: 4,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        smoothFactor: 1,
        dashArray: '8, 12',
        className: 'journey-route-animated',
      });

      // Tooltip shows the transition
      const fromReason = from.reason ? LOCATION_REASON_CONFIG[from.reason] : { icon: '📍' };
      const toReason = to.reason ? LOCATION_REASON_CONFIG[to.reason] : { icon: '📍' };
      
      line.bindTooltip(
        `${fromReason.icon} ${from.location_name} → ${toReason.icon} ${to.location_name}`,
        { className: 'historical-tooltip', sticky: true }
      );

      line.addTo(leafletMap.current!);
      journeyMarkersRef.current.push(line);

      // Add direction arrow at midpoint
      const arrowAngle = Math.atan2(to.latitude - from.latitude, to.longitude - from.longitude) * 180 / Math.PI;
      const arrowIcon = L.divIcon({
        className: 'journey-arrow',
        html: `<div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 12px solid ${scholarColor};
          filter: drop-shadow(0 1px 3px rgba(0,0,0,0.4));
          transform: rotate(${arrowAngle - 90}deg);
        "></div>`,
        iconSize: [16, 12],
        iconAnchor: [8, 6],
      });

      const arrow = L.marker([midLat, midLng], { icon: arrowIcon, interactive: false });
      arrow.addTo(leafletMap.current!);
      journeyMarkersRef.current.push(arrow);
    }

  }, [showJourneyMarkers, selectedScholar, locations, journeyReasonFilter]);

  // Draw relationship lines (legacy + biographical + textual)
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

    // Helper to draw a connection line
    const drawLine = (
      fromCoords: [number, number], 
      toCoords: [number, number], 
      color: string, 
      tooltip: string,
      dashed: boolean = false
    ) => {
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
        dashArray: dashed ? '5, 5' : undefined,
        smoothFactor: 1,
      });

      line.bindTooltip(tooltip, { 
        className: 'historical-tooltip',
        sticky: true 
      });

      line.addTo(leafletMap.current!);
      linesRef.current.push(line);
    };

    // 1. Draw legacy relationships (from 'relationships' table)
    relationships.forEach(rel => {
      // Map legacy relationship types to domains
      const domain = rel.type === 'family' || rel.type === 'educational' 
        ? 'biographical' 
        : rel.type === 'literary' 
          ? 'textual' 
          : 'biographical';
      
      // Check if this relationship should be shown based on filters
      if (!shouldShowRelationship(domain, rel.type, null, null)) return;
      
      const fromCoords = rel.from_scholar_id ? scholarCoords.get(rel.from_scholar_id) : null;
      const toCoords = rel.to_scholar_id ? scholarCoords.get(rel.to_scholar_id) : null;

      if (fromCoords && toCoords) {
        const color = getRelationshipColor(rel.type);
        drawLine(fromCoords, toCoords, color, `${rel.type} relationship`, rel.type === 'literary');
      }
    });

    // 2. Draw biographical relationships (family, educational, etc.)
    biographicalRelationships.forEach(rel => {
      // Check if this relationship should be shown based on filters
      if (!shouldShowRelationship('biographical', rel.relationship_category, rel.relationship_type, rel.certainty)) return;
      
      const fromCoords = scholarCoords.get(rel.scholar_id);
      const toCoords = scholarCoords.get(rel.related_scholar_id);

      if (fromCoords && toCoords) {
        // Color based on category
        let color = '#8b5cf6'; // default purple
        let label = rel.relationship_category;
        let dashed = false;
        
        if (rel.relationship_category === 'family') {
          color = '#f59e0b'; // amber
          label = `Family: ${rel.relationship_type}`;
          // In-law relationships shown as dashed
          if (rel.relationship_type?.includes('in_law') || rel.relationship_type?.includes('in-law')) {
            dashed = true;
          }
        } else if (rel.relationship_category === 'educational' || rel.relationship_category === 'pedagogical') {
          color = '#22c55e'; // green
          label = `Educational: ${rel.relationship_type}`;
        } else if (rel.relationship_category === 'professional') {
          color = '#6366f1'; // indigo
          label = `Professional: ${rel.relationship_type}`;
        } else if (rel.relationship_category === 'social') {
          color = '#ec4899'; // pink
          label = `Social: ${rel.relationship_type}`;
        }
        
        drawLine(fromCoords, toCoords, color, label, dashed);
      }
    });

    // 3. Draw textual relationships (work-to-work mapped to scholar-to-scholar)
    textualRelationships.forEach(rel => {
      // Check if this relationship should be shown based on filters
      if (!shouldShowRelationship('textual', rel.relationship_category, rel.relationship_type, rel.certainty)) return;
      
      if (!rel.from_scholar_id || !rel.to_scholar_id) return;
      
      const fromCoords = scholarCoords.get(rel.from_scholar_id);
      const toCoords = scholarCoords.get(rel.to_scholar_id);

      if (fromCoords && toCoords) {
        // Textual relationships are shown as blue dashed lines
        const label = `Textual: ${rel.relationship_type}`;
        drawLine(fromCoords, toCoords, '#3b82f6', label, true);
      }
    });

  }, [showLines, relationships, biographicalRelationships, textualRelationships, scholars, shouldShowRelationship]);

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

    // Get map instance for coordinate conversions
    const map = leafletMap.current;
    
    // Sort scholars by importance (highest first) so important labels get priority
    const sortedScholars = [...visibleScholars].sort((a, b) => {
      const impA = a.importance ?? 50;
      const impB = b.importance ?? 50;
      // Rashi always first
      if (a.name === 'Rashi') return -1;
      if (b.name === 'Rashi') return 1;
      return impB - impA;
    });

    // Track occupied label rectangles for collision detection
    const occupiedRects: { x: number; y: number; width: number; height: number }[] = [];
    
    // Check if a new label would overlap with existing ones
    const wouldOverlap = (x: number, y: number, width: number, height: number, padding: number = 5): boolean => {
      const newRect = {
        x: x - padding,
        y: y - padding,
        width: width + padding * 2,
        height: height + padding * 2,
      };
      
      for (const rect of occupiedRects) {
        // Check for intersection
        if (!(newRect.x + newRect.width < rect.x ||
              rect.x + rect.width < newRect.x ||
              newRect.y + newRect.height < rect.y ||
              rect.y + rect.height < newRect.y)) {
          return true;
        }
      }
      return false;
    };

    // Scale marker sizes based on zoom
    const zoomScale = Math.max(0.6, Math.min(1.2, zoomLevel / 8));

    // First pass: determine which labels should be shown based on collision detection
    const labelsToShow = new Set<string>();
    
    sortedScholars.forEach(scholar => {
      const importance = scholar.importance ?? 50;
      const isRashi = scholar.name === 'Rashi';
      const isSelected = selectedScholar?.id === scholar.id;
      
      // Get pixel position of scholar
      const point = map.latLngToContainerPoint([scholar.latitude!, scholar.longitude!]);
      
      // Estimate label dimensions based on name length and settings
      const shortName = scholar.name.split(' - ')[0].split(' (')[0];
      const hebrewName = scholar.hebrew_name || '';
      const showEnglish = showScholarNamesEnglish;
      const showHebrew = showScholarNamesHebrew && hebrewName;
      
      if (!showEnglish && !showHebrew) return;
      
      let labelText = '';
      if (showEnglish && showHebrew) {
        labelText = `${shortName} • ${hebrewName}`;
      } else if (showHebrew) {
        labelText = hebrewName;
      } else if (showEnglish) {
        labelText = shortName;
      }
      
      // Estimate label width/height (roughly 7px per character, 20px height)
      const estWidth = Math.min(180, labelText.length * 7 + 20);
      const estHeight = 24;
      
      // Label is positioned below the marker dot
      const rawSize = isRashi ? 24 : Math.max(8, Math.min(20, 8 + (importance / 100) * 12));
      const baseSize = Math.round(rawSize * zoomScale);
      const labelX = point.x - estWidth / 2;
      const labelY = point.y + baseSize / 2 + 4;
      
      // Rashi and selected always show
      if (isRashi || isSelected) {
        labelsToShow.add(scholar.id);
        occupiedRects.push({ x: labelX, y: labelY, width: estWidth, height: estHeight });
        return;
      }
      
      // Check if this label would overlap with any existing labels
      if (!wouldOverlap(labelX, labelY, estWidth, estHeight)) {
        labelsToShow.add(scholar.id);
        occupiedRects.push({ x: labelX, y: labelY, width: estWidth, height: estHeight });
      }
    });

    // Second pass: create markers
    visibleScholars.forEach(scholar => {
      const importance = scholar.importance ?? 50;
      const isRashi = scholar.name === 'Rashi';
      const isSelected = selectedScholar?.id === scholar.id;

      // Check if scholar is in selected region
      const inSelectedRegion = !selectedRegion || 
        isPointInPolygon(scholar.latitude!, scholar.longitude!, HISTORICAL_BOUNDARIES[selectedRegion].coordinates);
      
      const color = getScholarColor(scholar);
      const isDimmed = selectedRegion && !inSelectedRegion;
      
      // Calculate size based on importance and zoom level
      const rawSize = isRashi 
        ? 24 
        : Math.max(8, Math.min(20, 8 + (importance / 100) * 12));
      const baseSize = Math.round(rawSize * zoomScale);
      const borderWidth = baseSize > 14 ? 2.5 : baseSize > 10 ? 2 : 1.5;
      const fontSize = baseSize > 14 ? 11 : baseSize > 10 ? 10 : 9;
      
      // Determine if label should be shown (collision-detected)
      const shouldShowLabel = labelsToShow.has(scholar.id);
      
      // Get a shorter display name (acronym or first part)
      const shortName = scholar.name.split(' - ')[0].split(' (')[0];
      const hebrewName = scholar.hebrew_name || '';
      
      // Build label content based on visibility settings AND collision detection
      const showEnglish = showScholarNamesEnglish && shouldShowLabel;
      const showHebrew = showScholarNamesHebrew && hebrewName && shouldShowLabel;
      const showAnyLabel = showEnglish || showHebrew;
      
      // Build the display text
      let labelText = '';
      if (showEnglish && showHebrew) {
        labelText = `${shortName} • ${hebrewName}`;
      } else if (showHebrew) {
        labelText = hebrewName;
      } else if (showEnglish) {
        labelText = shortName;
      }
      
      // Highlight styling for high-importance scholars
      const isHighImportance = importance >= 80 || isRashi;
      const glowSize = isSelected ? 16 : (isHighImportance ? 12 : 8);
      
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
                width: ${baseSize}px;
                height: ${baseSize}px;
                border-radius: 50%;
                border: ${isRashi ? '2.5px solid #fbbf24' : `${borderWidth}px solid ${isHighImportance ? '#fff' : 'rgba(255,255,255,0.8)'}`};
                box-shadow: 0 0 ${glowSize}px ${color}, 0 1px 4px rgba(0,0,0,0.4);
                transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
                ${isSelected ? 'transform: scale(1.3);' : ''}
                ${isDimmed ? 'opacity: 0.25; filter: grayscale(0.5);' : ''}
              "
            ></div>
            ${showAnyLabel ? `<div class="marker-label" style="
              background: #1a1408;
              color: #ffd700;
              padding: ${isHighImportance ? '4px 10px' : '3px 8px'};
              border-radius: 3px;
              font-size: ${fontSize}px;
              font-weight: ${isHighImportance ? '700' : '600'};
              letter-spacing: 0.3px;
              white-space: nowrap;
              max-width: ${showEnglish && showHebrew ? '180px' : '120px'};
              overflow: hidden;
              text-overflow: ellipsis;
              box-shadow: 0 1px 6px rgba(0,0,0,0.7), 0 0 0 1px #1a1408;
              border: ${isHighImportance ? '2px' : '1.5px'} solid ${isHighImportance ? '#ffd700' : '#c9a961'};
              text-shadow: 0 1px 2px rgba(0,0,0,0.5);
              ${isDimmed ? 'opacity: 0.4;' : ''}
              ${isRashi ? 'background: #c9a961; color: #1a1408; border-color: #ffd700; text-shadow: none;' : ''}
            ">${labelText}</div>` : ''}
          </div>
        `,
        iconSize: isHighImportance ? [140, 70] : [100, 50],
        iconAnchor: isHighImportance ? [70, Math.round(baseSize / 2)] : [50, Math.round(baseSize / 2)],
      });

      const marker = L.marker([scholar.latitude!, scholar.longitude!], { 
        icon,
        zIndexOffset: isDimmed ? -1000 : (importance || 50) // Higher importance = higher z-index
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

    // Note: Removed auto-pan to selected scholar - map only moves on user interaction
  }, [scholars, selectedScholar, timeRange, onSelectScholar, selectedRegion, showScholarNamesEnglish, showScholarNamesHebrew, zoomLevel]);

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={containerRef} className="w-full h-full" />
      
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
