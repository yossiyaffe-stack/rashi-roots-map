import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, GitBranch, Map as MapIcon, X, Route } from 'lucide-react';
import type { Scholar } from '@/data/scholars';
import { scholars as allScholars } from '@/data/scholars';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface MapViewProps {
  scholars: Scholar[];
  selectedScholar: Scholar | null;
  onSelectScholar: (scholar: Scholar) => void;
}

type RegionKey = keyof typeof historicalBoundaries;

// Migration paths data - showing historical movements of scholars/communities
interface MigrationPath {
  id: string;
  name: string;
  description: string;
  year: number;
  cause: 'expulsion' | 'persecution' | 'opportunity' | 'flight';
  from: { lat: number; lng: number; name: string };
  to: { lat: number; lng: number; name: string };
  color: string;
  scholarIds?: number[]; // Optional: specific scholars who made this journey
}

const migrationPaths: MigrationPath[] = [
  {
    id: 'france-savoy-1394',
    name: 'French Expulsion to Savoy',
    description: 'After the 1394 final expulsion from France, many scholars fled to Savoy and northern Italy',
    year: 1394,
    cause: 'expulsion',
    from: { lat: 48.8566, lng: 2.3522, name: 'Paris' },
    to: { lat: 45.5667, lng: 5.9167, name: 'Chambéry (Savoy)' },
    color: '#3b82f6',
    scholarIds: [21] // Mahariq
  },
  {
    id: 'france-rhineland-1306',
    name: 'French Expulsion to Rhineland',
    description: 'The 1306 expulsion drove French Jews eastward to the Rhineland and German territories',
    year: 1306,
    cause: 'expulsion',
    from: { lat: 48.8566, lng: 2.3522, name: 'Paris' },
    to: { lat: 49.4521, lng: 8.2428, name: 'Mainz (Rhineland)' },
    color: '#3b82f6'
  },
  {
    id: 'bulgaria-vienna-1396',
    name: 'Flight from Bulgaria to Vienna',
    description: 'Dosa "the Greek" fled Bulgaria after the Ottoman conquest in 1396',
    year: 1396,
    cause: 'flight',
    from: { lat: 43.8563, lng: 22.8731, name: 'Vidin (Bulgaria)' },
    to: { lat: 48.2082, lng: 16.3738, name: 'Vienna' },
    color: '#16a34a',
    scholarIds: [14] // Dosa the Greek
  },
  {
    id: 'rhineland-austria-1348',
    name: 'Black Death Flight to Austria',
    description: 'After the Black Death massacres (1348-1349), surviving scholars fled to Austria',
    year: 1348,
    cause: 'persecution',
    from: { lat: 49.4521, lng: 8.2428, name: 'Mainz (Rhineland)' },
    to: { lat: 47.8133, lng: 16.2431, name: 'Wiener-Neustadt' },
    color: '#ef4444'
  },
  {
    id: 'rhineland-italy-training',
    name: 'Rhineland to Italy (Training)',
    description: 'Isaiah di Trani trained in the Rhineland before returning to southern Italy',
    year: 1220,
    cause: 'opportunity',
    from: { lat: 49.4521, lng: 8.2428, name: 'Rhineland' },
    to: { lat: 40.6643, lng: 17.9418, name: 'Trani (Italy)' },
    color: '#f59e0b',
    scholarIds: [13] // Isaiah di Trani
  },
  {
    id: 'austria-moravia',
    name: 'Austrian Scholars to Moravia',
    description: 'Students of Isserlein spread his teachings to Moravia and Bohemia',
    year: 1460,
    cause: 'opportunity',
    from: { lat: 47.8133, lng: 16.2431, name: 'Wiener-Neustadt' },
    to: { lat: 49.1951, lng: 16.6068, name: 'Brünn (Brno)' },
    color: '#9333ea',
    scholarIds: [19] // Israel of Brünn
  },
  {
    id: 'champagne-spread',
    name: "Rashi's Students Spread",
    description: "Rashi's grandchildren and students spread his teachings throughout Champagne",
    year: 1110,
    cause: 'opportunity',
    from: { lat: 48.2973, lng: 4.0744, name: 'Troyes' },
    to: { lat: 48.4637, lng: 3.5669, name: 'Ramerupt' },
    color: '#c9a961',
    scholarIds: [3] // Rabbenu Tam
  },
  {
    id: 'france-constantinople',
    name: 'Western Scholarship to Ottoman Empire',
    description: 'Jewish scholars brought Ashkenazic learning traditions to Constantinople',
    year: 1492,
    cause: 'opportunity',
    from: { lat: 48.8566, lng: 2.3522, name: 'Western Europe' },
    to: { lat: 41.0082, lng: 28.9784, name: 'Constantinople' },
    color: '#16a34a',
    scholarIds: [7] // Mizrachi
  }
];

// Get migration cause icon/label
const getMigrationCauseStyle = (cause: MigrationPath['cause']) => {
  switch (cause) {
    case 'expulsion':
      return { icon: '⚠️', label: 'Expulsion', dashArray: '10, 5' };
    case 'persecution':
      return { icon: '🔥', label: 'Persecution', dashArray: '15, 5, 5, 5' };
    case 'flight':
      return { icon: '🏃', label: 'Flight', dashArray: '8, 4' };
    case 'opportunity':
      return { icon: '📚', label: 'Scholarly Movement', dashArray: '4, 4' };
  }
};

// Historical boundaries (simplified GeoJSON-like coordinates for medieval period ~1200-1500)
const historicalBoundaries = {
  holyRomanEmpire: {
    name: "Holy Roman Empire",
    color: "#dc2626",
    fillColor: "#dc2626",
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
    fillColor: "#3b82f6",
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
    fillColor: "#16a34a",
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
    fillColor: "#9333ea",
    coordinates: [
      [54.5, 14.5], [55.0, 17.0], [56.0, 21.0], [56.5, 24.0],
      [56.0, 28.0], [54.5, 30.0], [52.0, 31.0], [50.0, 28.0],
      [49.0, 24.0], [49.5, 22.0], [50.0, 19.0], [51.0, 17.0],
      [52.0, 15.0], [54.5, 14.5]
    ] as [number, number][]
  },
  champagne: {
    name: "Champagne (Rashi's Region)",
    color: "#c9a961",
    fillColor: "#c9a961",
    coordinates: [
      [49.5, 3.0], [49.8, 4.0], [49.5, 5.0], [48.8, 5.2],
      [48.0, 4.8], [47.8, 4.0], [48.2, 3.2], [49.0, 2.8],
      [49.5, 3.0]
    ] as [number, number][]
  },
  rhineland: {
    name: "Rhineland (ShUM Cities)",
    color: "#f59e0b",
    fillColor: "#f59e0b",
    coordinates: [
      [51.0, 6.0], [51.2, 7.0], [50.8, 8.5], [50.0, 8.8],
      [49.2, 8.5], [49.0, 7.5], [49.5, 6.5], [50.5, 6.0],
      [51.0, 6.0]
    ] as [number, number][]
  }
};

// Point-in-polygon algorithm (ray casting)
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

// Get color based on scholar's period/type
const getScholarColor = (scholar: Scholar): string => {
  if (scholar.id === 1) return '#c9a961';
  if (scholar.period === 'Rishonim (Early Sages)') return '#ea580c';
  if (scholar.period === 'Post-Tosafist France') return '#facc15';
  if (scholar.period?.includes('Post-Black Death')) return '#22c55e';
  if (scholar.commentariesOnRashi) return '#6366f1';
  return '#8b7355';
};

// Create custom icon for scholar
const createScholarIcon = (scholar: Scholar, isHighlighted: boolean = false, isDimmed: boolean = false): L.DivIcon => {
  const size = Math.max(24, scholar.importance / 3.5);
  const color = getScholarColor(scholar);
  
  return L.divIcon({
    className: 'custom-scholar-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid ${isHighlighted ? '#fff' : 'hsl(35 30% 12%)'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: ${isHighlighted ? `0 0 20px ${color}, 0 4px 12px rgba(0,0,0,0.4)` : '0 4px 12px rgba(0,0,0,0.3)'};
        transition: transform 0.2s, box-shadow 0.2s, opacity 0.3s;
        font-family: 'David Libre', serif;
        font-weight: bold;
        color: white;
        font-size: ${size * 0.4}px;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        ${isHighlighted ? 'transform: scale(1.2);' : ''}
        ${isDimmed ? 'opacity: 0.25; filter: grayscale(0.5);' : ''}
        position: relative;
        z-index: ${isDimmed ? 100 : 1000};
      ">
        ${scholar.hebrewName?.[0] || scholar.name[0]}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Build connection data
interface Connection {
  from: Scholar;
  to: Scholar;
  type: 'teacher' | 'student';
}

const buildConnections = (scholars: Scholar[], allScholars: Scholar[]): Connection[] => {
  const connections: Connection[] = [];
  const scholarMap = new Map(allScholars.map(s => [s.id, s]));
  const visibleIds = new Set(scholars.map(s => s.id));

  scholars.forEach(scholar => {
    if (scholar.teachers) {
      scholar.teachers.forEach(teacherId => {
        const teacher = scholarMap.get(teacherId);
        if (teacher && visibleIds.has(teacherId)) {
          connections.push({ from: teacher, to: scholar, type: 'teacher' });
        }
      });
    }
  });

  return connections;
};

export const MapView = ({ scholars, selectedScholar, onSelectScholar }: MapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});
  const linesRef = useRef<L.Polyline[]>([]);
  const migrationLinesRef = useRef<(L.Polyline | L.Marker)[]>([]);
  const boundariesRef = useRef<{ [key: string]: L.Polygon }>({});
  const labelsRef = useRef<L.Marker[]>([]);
  const layersRef = useRef<{ modern?: L.TileLayer; historical?: L.TileLayer }>({});
  
  const [mapStyle, setMapStyle] = useState<'modern' | 'historical'>('modern');
  const [showConnections, setShowConnections] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showMigrations, setShowMigrations] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<RegionKey | null>(null);

  // Filter scholars based on selected region
  const scholarsInRegion = useMemo(() => {
    if (!selectedRegion) return new Set(scholars.map(s => s.id));
    
    const region = historicalBoundaries[selectedRegion];
    const inRegion = new Set<number>();
    
    scholars.forEach(scholar => {
      if (isPointInPolygon(scholar.location.lat, scholar.location.lng, region.coordinates)) {
        inRegion.add(scholar.id);
      }
    });
    
    return inRegion;
  }, [scholars, selectedRegion]);

  const connections = useMemo(() => buildConnections(scholars, allScholars), [scholars]);

  const handleRegionClick = useCallback((regionKey: RegionKey) => {
    setSelectedRegion(prev => prev === regionKey ? null : regionKey);
  }, []);

  const clearRegionFilter = useCallback(() => {
    setSelectedRegion(null);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [49.0, 10.0],
      zoom: 5,
      zoomControl: true,
    });

    mapRef.current = map;

    const modernLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    });
    modernLayer.addTo(map);
    layersRef.current.modern = modernLayer;

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

  // Draw historical boundaries with click handlers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing boundaries and labels
    Object.values(boundariesRef.current).forEach(boundary => {
      mapRef.current?.removeLayer(boundary);
    });
    boundariesRef.current = {};
    
    labelsRef.current.forEach(label => {
      mapRef.current?.removeLayer(label);
    });
    labelsRef.current = [];

    if (!showBoundaries) return;

    (Object.entries(historicalBoundaries) as [RegionKey, typeof historicalBoundaries[RegionKey]][]).forEach(([key, region]) => {
      const latLngs = region.coordinates.map(([lat, lng]) => [lat, lng] as L.LatLngTuple);
      const isSelected = selectedRegion === key;
      
      const polygon = L.polygon(latLngs, {
        color: region.color,
        weight: isSelected ? 4 : 2,
        opacity: isSelected ? 1 : 0.8,
        fillColor: region.fillColor,
        fillOpacity: isSelected ? 0.3 : 0.1,
        dashArray: isSelected ? undefined : '5, 5',
        className: `historical-boundary ${isSelected ? 'selected' : ''}`
      });

      polygon.bindTooltip(`${region.name}${isSelected ? ' (Click to clear filter)' : ' (Click to filter scholars)'}`, {
        permanent: false,
        direction: 'center',
        className: 'boundary-tooltip'
      });

      polygon.on('click', () => {
        handleRegionClick(key);
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

      polygon.addTo(mapRef.current!);
      boundariesRef.current[key] = polygon;

      // Add region label at centroid - use lower zIndexOffset so scholars appear above
      const centroid = polygon.getBounds().getCenter();
      const labelIcon = L.divIcon({
        className: 'region-label',
        html: `
          <div style="
            font-family: 'Playfair Display', serif;
            font-size: ${isSelected ? '13px' : '11px'};
            font-weight: ${isSelected ? '600' : '500'};
            color: ${region.color};
            text-shadow: 
              1px 1px 0 rgba(255,255,255,0.8),
              -1px -1px 0 rgba(255,255,255,0.8),
              1px -1px 0 rgba(255,255,255,0.8),
              -1px 1px 0 rgba(255,255,255,0.8);
            white-space: nowrap;
            pointer-events: none;
            opacity: ${isSelected ? 0.9 : 0.7};
            transition: all 0.3s ease;
          ">
            ${region.name}
            ${isSelected ? ' ✓' : ''}
          </div>
        `,
        iconSize: [180, 20],
        iconAnchor: [90, 10]
      });

      const label = L.marker(centroid, { icon: labelIcon, interactive: false, zIndexOffset: -1000 });
      label.addTo(mapRef.current!);
      labelsRef.current.push(label);
    });
  }, [showBoundaries, selectedRegion, handleRegionClick]);

  // Draw migration paths
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing migration paths
    migrationLinesRef.current.forEach(item => {
      mapRef.current?.removeLayer(item);
    });
    migrationLinesRef.current = [];

    if (!showMigrations) return;

    migrationPaths.forEach(migration => {
      const causeStyle = getMigrationCauseStyle(migration.cause);
      
      // Calculate curved path
      const fromLatLng: L.LatLngExpression = [migration.from.lat, migration.from.lng];
      const toLatLng: L.LatLngExpression = [migration.to.lat, migration.to.lng];
      
      const midLat = (migration.from.lat + migration.to.lat) / 2;
      const midLng = (migration.from.lng + migration.to.lng) / 2;
      const dx = migration.to.lng - migration.from.lng;
      const dy = migration.to.lat - migration.from.lat;
      
      // Create a nice curve offset
      const curveOffset = Math.sqrt(dx * dx + dy * dy) * 0.2;
      const curvedMidLat = midLat - (dx * 0.15);
      const curvedMidLng = midLng + (dy * 0.15);
      
      const curvedPath: L.LatLngExpression[] = [
        fromLatLng,
        [curvedMidLat, curvedMidLng],
        toLatLng
      ];

      // Draw the migration path
      const migrationLine = L.polyline(curvedPath, {
        color: migration.color,
        weight: 4,
        opacity: 0.7,
        smoothFactor: 1,
        dashArray: causeStyle.dashArray,
        className: 'migration-path'
      });

      // Rich tooltip content
      const tooltipContent = `
        <div style="font-family: 'Crimson Text', serif; min-width: 200px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span style="font-size: 16px;">${causeStyle.icon}</span>
            <strong style="font-size: 14px; color: ${migration.color};">${migration.name}</strong>
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
            ${migration.year} • ${causeStyle.label}
          </div>
          <div style="font-size: 12px; margin-bottom: 6px;">
            ${migration.from.name} → ${migration.to.name}
          </div>
          <div style="font-size: 11px; color: #555; line-height: 1.4;">
            ${migration.description}
          </div>
        </div>
      `;

      migrationLine.bindTooltip(tooltipContent, {
        sticky: true,
        className: 'migration-tooltip',
        direction: 'top'
      });

      migrationLine.addTo(mapRef.current!);
      migrationLinesRef.current.push(migrationLine);

      // Add animated arrow at destination
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const arrowIcon = L.divIcon({
        className: 'migration-arrow',
        html: `
          <div style="
            width: 0;
            height: 0;
            border-left: 10px solid ${migration.color};
            border-top: 6px solid transparent;
            border-bottom: 6px solid transparent;
            transform: rotate(${angle}deg);
            filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
          "></div>
        `,
        iconSize: [10, 12],
        iconAnchor: [5, 6]
      });

      // Position arrow slightly before destination
      const arrowLat = migration.to.lat - dy * 0.08;
      const arrowLng = migration.to.lng - dx * 0.08;
      const arrow = L.marker([arrowLat, arrowLng], { icon: arrowIcon, interactive: false });
      arrow.addTo(mapRef.current!);
      migrationLinesRef.current.push(arrow);

      // Add origin marker (small dot)
      const originIcon = L.divIcon({
        className: 'migration-origin',
        html: `
          <div style="
            width: 8px;
            height: 8px;
            background: ${migration.color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [8, 8],
        iconAnchor: [4, 4]
      });
      const originMarker = L.marker(fromLatLng, { icon: originIcon, interactive: false });
      originMarker.addTo(mapRef.current!);
      migrationLinesRef.current.push(originMarker);

      // Add destination marker (slightly larger)
      const destIcon = L.divIcon({
        className: 'migration-dest',
        html: `
          <div style="
            width: 12px;
            height: 12px;
            background: ${migration.color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });
      const destMarker = L.marker(toLatLng, { icon: destIcon, interactive: false });
      destMarker.addTo(mapRef.current!);
      migrationLinesRef.current.push(destMarker);
    });
  }, [showMigrations]);

  // Update connection lines
  useEffect(() => {
    if (!mapRef.current) return;

    linesRef.current.forEach(line => {
      mapRef.current?.removeLayer(line);
    });
    linesRef.current = [];

    if (!showConnections) return;

    connections.forEach((conn) => {
      const isHighlighted = selectedScholar && 
        (conn.from.id === selectedScholar.id || conn.to.id === selectedScholar.id);
      
      // Dim connections if region filter is active and either scholar is outside
      const isDimmed = selectedRegion && 
        (!scholarsInRegion.has(conn.from.id) || !scholarsInRegion.has(conn.to.id));

      if (isDimmed) return; // Skip drawing dimmed connections

      const midLat = (conn.from.location.lat + conn.to.location.lat) / 2;
      const midLng = (conn.from.location.lng + conn.to.location.lng) / 2;
      
      const dx = conn.to.location.lng - conn.from.location.lng;
      const dy = conn.to.location.lat - conn.from.location.lat;
      
      const curvedMidLat = midLat + (dx * 0.1);
      const curvedMidLng = midLng - (dy * 0.1);
      
      const curvedPath: L.LatLngExpression[] = [
        [conn.from.location.lat, conn.from.location.lng],
        [curvedMidLat, curvedMidLng],
        [conn.to.location.lat, conn.to.location.lng]
      ];

      const baseColor = getScholarColor(conn.from);
      
      if (isHighlighted) {
        const glowLine = L.polyline(curvedPath, {
          color: baseColor,
          weight: 8,
          opacity: 0.3,
          smoothFactor: 1,
          className: 'connection-glow'
        });
        glowLine.addTo(mapRef.current!);
        linesRef.current.push(glowLine);
      }

      const line = L.polyline(curvedPath, {
        color: isHighlighted ? baseColor : '#8b7355',
        weight: isHighlighted ? 4 : 2,
        opacity: isHighlighted ? 0.9 : 0.5,
        smoothFactor: 1,
        dashArray: isHighlighted ? undefined : '8, 4',
        className: `connection-line ${isHighlighted ? 'highlighted' : ''}`
      });

      line.bindTooltip(`${conn.from.name.split('(')[0].trim()} → ${conn.to.name.split('(')[0].trim()}`, {
        sticky: true,
        className: 'connection-tooltip'
      });

      line.addTo(mapRef.current!);
      linesRef.current.push(line);

      if (isHighlighted) {
        const arrowIcon = L.divIcon({
          className: 'arrow-marker',
          html: `
            <div style="
              width: 12px;
              height: 12px;
              background: ${baseColor};
              clip-path: polygon(0% 0%, 100% 50%, 0% 100%);
              transform: rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg);
            "></div>
          `,
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });
        
        const arrowLat = conn.to.location.lat - dy * 0.15;
        const arrowLng = conn.to.location.lng - dx * 0.15;
        
        const arrowMarker = L.marker([arrowLat, arrowLng], { icon: arrowIcon, interactive: false });
        arrowMarker.addTo(mapRef.current!);
        linesRef.current.push(arrowMarker as unknown as L.Polyline);
      }
    });
  }, [connections, showConnections, selectedScholar, selectedRegion, scholarsInRegion]);

  // Update markers when scholars change
  useEffect(() => {
    if (!mapRef.current) return;

    Object.values(markersRef.current).forEach(marker => {
      mapRef.current?.removeLayer(marker);
    });
    markersRef.current = {};

    scholars.forEach(scholar => {
      const isHighlighted = selectedScholar && (
        selectedScholar.id === scholar.id ||
        selectedScholar.teachers?.includes(scholar.id) ||
        selectedScholar.students?.includes(scholar.id)
      );
      
      const isDimmed = selectedRegion && !scholarsInRegion.has(scholar.id);

      const marker = L.marker(
        [scholar.location.lat, scholar.location.lng],
        { 
          icon: createScholarIcon(scholar, !!isHighlighted, !!isDimmed), 
          zIndexOffset: isDimmed ? -1000 : (isHighlighted ? 1000 : 500)
        }
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
          ${scholar.teachers && scholar.teachers.length > 0 ? `
            <p style="margin: 8px 0 4px 0; font-size: 12px; color: hsl(35 45% 35%); font-weight: 600;">
              👨‍🏫 Teachers: ${scholar.teachers.map(tid => allScholars.find(s => s.id === tid)?.name.split('(')[0].trim() || '').filter(Boolean).join(', ')}
            </p>
          ` : ''}
          ${scholar.students && scholar.students.length > 0 ? `
            <p style="margin: 4px 0; font-size: 12px; color: hsl(35 45% 35%); font-weight: 600;">
              📚 Students: ${scholar.students.map(sid => allScholars.find(s => s.id === sid)?.name.split('(')[0].trim() || '').filter(Boolean).join(', ')}
            </p>
          ` : ''}
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
  }, [scholars, selectedScholar, onSelectScholar, selectedRegion, scholarsInRegion]);

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

  const selectedRegionData = selectedRegion ? historicalBoundaries[selectedRegion] : null;
  const scholarsInRegionCount = scholarsInRegion.size;

  return (
    <div className="relative h-[600px]">
      <style>{`
        @keyframes dash-flow {
          to {
            stroke-dashoffset: -24;
          }
        }
        
        @keyframes boundary-pulse {
          0%, 100% {
            stroke-opacity: 0.8;
          }
          50% {
            stroke-opacity: 0.4;
          }
        }
        
        .connection-line {
          animation: dash-flow 1s linear infinite;
        }
        
        .connection-line.highlighted {
          animation: none;
          filter: drop-shadow(0 0 4px currentColor);
        }
        
        .connection-glow {
          filter: blur(4px);
        }
        
        .historical-boundary {
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .historical-boundary:not(.selected) {
          animation: boundary-pulse 3s ease-in-out infinite;
        }
        
        .historical-boundary.selected {
          animation: none;
        }
        
        .connection-tooltip,
        .boundary-tooltip {
          background: hsl(35 25% 20%) !important;
          color: hsl(40 30% 90%) !important;
          border: none !important;
          border-radius: 6px !important;
          padding: 6px 10px !important;
          font-family: 'Crimson Text', serif !important;
          font-size: 13px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        }
        
        .boundary-tooltip {
          font-family: 'Playfair Display', serif !important;
          font-weight: 600 !important;
        }
        
        @keyframes migration-flow {
          0% {
            stroke-dashoffset: 30;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        
        .migration-path {
          animation: migration-flow 2s linear infinite;
          cursor: pointer;
        }
        
        .migration-path:hover {
          stroke-opacity: 1 !important;
          stroke-width: 6 !important;
        }
        
        .migration-tooltip {
          background: hsl(35 25% 15%) !important;
          color: hsl(40 30% 90%) !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 10px 12px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;
          max-width: 280px !important;
        }
      `}</style>

      {/* Active Region Filter Banner */}
      {selectedRegion && selectedRegionData && (
        <div 
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] animate-fade-in"
        >
          <div 
            className="flex items-center gap-3 px-4 py-2 rounded-full shadow-elevated backdrop-blur-sm"
            style={{ 
              backgroundColor: `${selectedRegionData.color}20`,
              border: `2px solid ${selectedRegionData.color}`
            }}
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedRegionData.color }}
            />
            <span className="text-sm font-semibold text-foreground">
              {selectedRegionData.name}: {scholarsInRegionCount} scholar{scholarsInRegionCount !== 1 ? 's' : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRegionFilter}
              className="h-6 w-6 p-0 rounded-full hover:bg-foreground/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
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
        
        <label className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 shadow-card cursor-pointer">
          <Checkbox
            checked={showBoundaries}
            onCheckedChange={(checked) => setShowBoundaries(checked as boolean)}
            className="border-secondary data-[state=checked]:bg-secondary"
          />
          <MapIcon className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium text-foreground">Kingdoms</span>
        </label>
        
        <label className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 shadow-card cursor-pointer">
          <Checkbox
            checked={showMigrations}
            onCheckedChange={(checked) => setShowMigrations(checked as boolean)}
            className="border-secondary data-[state=checked]:bg-secondary"
          />
          <Route className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium text-foreground">Migrations</span>
        </label>
        
        <label className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 shadow-card cursor-pointer">
          <Checkbox
            checked={showConnections}
            onCheckedChange={(checked) => setShowConnections(checked as boolean)}
            className="border-secondary data-[state=checked]:bg-secondary"
          />
          <GitBranch className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium text-foreground">Lineages</span>
        </label>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-card/95 backdrop-blur-sm rounded-lg p-4 shadow-card border border-primary/20 max-h-[400px] overflow-y-auto">
        <h4 className="text-sm font-semibold text-foreground mb-2">Scholars</h4>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Rashi (Foundation)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">Rishonim</span>
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
        </div>
        
        {showBoundaries && (
          <>
            <h4 className="text-sm font-semibold text-foreground mt-4 mb-2 pt-2 border-t border-primary/20">
              Kingdoms <span className="font-normal text-muted-foreground">(click to filter)</span>
            </h4>
            <div className="space-y-1.5 text-xs">
              {(Object.entries(historicalBoundaries) as [RegionKey, typeof historicalBoundaries[RegionKey]][]).map(([key, region]) => (
                <button
                  key={key}
                  onClick={() => handleRegionClick(key)}
                  className={`flex items-center gap-2 w-full text-left py-1 px-1 -mx-1 rounded transition-colors ${
                    selectedRegion === key ? 'bg-primary/20' : 'hover:bg-primary/10'
                  }`}
                >
                  <span 
                    className="w-4 h-2 rounded-sm transition-opacity" 
                    style={{ 
                      backgroundColor: region.color, 
                      opacity: selectedRegion === key ? 1 : 0.5 
                    }} 
                  />
                  <span className={`${selectedRegion === key ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {region.name}
                    {selectedRegion === key && ' ✓'}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
        
        {showMigrations && (
          <>
            <h4 className="text-sm font-semibold text-foreground mt-4 mb-2 pt-2 border-t border-primary/20">
              Migration Paths
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-sm">⚠️</span>
                <span className="text-muted-foreground">Expulsion</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">🔥</span>
                <span className="text-muted-foreground">Persecution</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">🏃</span>
                <span className="text-muted-foreground">Flight</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">📚</span>
                <span className="text-muted-foreground">Scholarly Movement</span>
              </div>
            </div>
          </>
        )}
        
        <p className="text-muted-foreground/70 mt-3 pt-2 border-t border-primary/10 text-xs">
          Marker size = Importance
        </p>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-lg border-2 border-primary/30"
      />
    </div>
  );
};
