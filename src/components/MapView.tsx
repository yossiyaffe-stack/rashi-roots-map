import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, GitBranch } from 'lucide-react';
import type { Scholar } from '@/data/scholars';
import { scholars as allScholars } from '@/data/scholars';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface MapViewProps {
  scholars: Scholar[];
  selectedScholar: Scholar | null;
  onSelectScholar: (scholar: Scholar) => void;
}

// Get color based on scholar's period/type
const getScholarColor = (scholar: Scholar): string => {
  if (scholar.id === 1) return '#c9a961'; // Rashi - gold
  if (scholar.period === 'Rishonim (Early Sages)') return '#ea580c'; // Orange
  if (scholar.period === 'Post-Tosafist France') return '#facc15'; // Yellow
  if (scholar.period?.includes('Post-Black Death')) return '#22c55e'; // Green
  if (scholar.commentariesOnRashi) return '#6366f1'; // Purple for commentators
  return '#8b7355'; // Default sepia
};

// Create custom icon for scholar
const createScholarIcon = (scholar: Scholar, isHighlighted: boolean = false): L.DivIcon => {
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
        transition: transform 0.2s, box-shadow 0.2s;
        font-family: 'David Libre', serif;
        font-weight: bold;
        color: white;
        font-size: ${size * 0.4}px;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        ${isHighlighted ? 'transform: scale(1.2);' : ''}
      ">
        ${scholar.hebrewName?.[0] || scholar.name[0]}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Build connection data from teacher-student relationships
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
    // Add connections from teachers
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
  const layersRef = useRef<{ modern?: L.TileLayer; historical?: L.TileLayer }>({});
  const [mapStyle, setMapStyle] = useState<'modern' | 'historical'>('modern');
  const [showConnections, setShowConnections] = useState(true);

  const connections = useMemo(() => buildConnections(scholars, allScholars), [scholars]);

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

  // Update connection lines
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing lines
    linesRef.current.forEach(line => {
      mapRef.current?.removeLayer(line);
    });
    linesRef.current = [];

    if (!showConnections) return;

    // Draw connection lines with animation
    connections.forEach((conn, index) => {
      const fromLatLng: L.LatLngExpression = [conn.from.location.lat, conn.from.location.lng];
      const toLatLng: L.LatLngExpression = [conn.to.location.lat, conn.to.location.lng];
      
      // Determine if this connection involves selected scholar
      const isHighlighted = selectedScholar && 
        (conn.from.id === selectedScholar.id || conn.to.id === selectedScholar.id);

      // Create curved path using quadratic bezier approximation
      const midLat = (conn.from.location.lat + conn.to.location.lat) / 2;
      const midLng = (conn.from.location.lng + conn.to.location.lng) / 2;
      
      // Offset the midpoint for curve effect
      const dx = conn.to.location.lng - conn.from.location.lng;
      const dy = conn.to.location.lat - conn.from.location.lat;
      const offset = Math.sqrt(dx * dx + dy * dy) * 0.15;
      
      const curvedMidLat = midLat + (dx * 0.1);
      const curvedMidLng = midLng - (dy * 0.1);
      
      const curvedPath: L.LatLngExpression[] = [
        fromLatLng,
        [curvedMidLat, curvedMidLng],
        toLatLng
      ];

      const baseColor = getScholarColor(conn.from);
      
      // Background glow line (for highlighted connections)
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

      // Main connection line
      const line = L.polyline(curvedPath, {
        color: isHighlighted ? baseColor : '#8b7355',
        weight: isHighlighted ? 4 : 2,
        opacity: isHighlighted ? 0.9 : 0.5,
        smoothFactor: 1,
        dashArray: isHighlighted ? undefined : '8, 4',
        className: `connection-line ${isHighlighted ? 'highlighted' : ''}`
      });

      // Add tooltip to line
      line.bindTooltip(`${conn.from.name.split('(')[0].trim()} → ${conn.to.name.split('(')[0].trim()}`, {
        sticky: true,
        className: 'connection-tooltip'
      });

      line.addTo(mapRef.current!);
      linesRef.current.push(line);

      // Add animated arrow marker at the end
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
              animation: pulse-arrow 1.5s ease-in-out infinite;
            "></div>
          `,
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });
        
        // Place arrow near the destination
        const arrowLat = conn.to.location.lat - dy * 0.15;
        const arrowLng = conn.to.location.lng - dx * 0.15;
        
        const arrowMarker = L.marker([arrowLat, arrowLng], { icon: arrowIcon, interactive: false });
        arrowMarker.addTo(mapRef.current!);
        // Store in lines ref for cleanup (it's a marker but we clean it the same way)
        linesRef.current.push(arrowMarker as unknown as L.Polyline);
      }
    });
  }, [connections, showConnections, selectedScholar]);

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
      const isHighlighted = selectedScholar && (
        selectedScholar.id === scholar.id ||
        selectedScholar.teachers?.includes(scholar.id) ||
        selectedScholar.students?.includes(scholar.id)
      );

      const marker = L.marker(
        [scholar.location.lat, scholar.location.lng],
        { icon: createScholarIcon(scholar, !!isHighlighted), zIndexOffset: isHighlighted ? 1000 : 0 }
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
  }, [scholars, selectedScholar, onSelectScholar]);

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
      {/* CSS for animations */}
      <style>{`
        @keyframes dash-flow {
          to {
            stroke-dashoffset: -24;
          }
        }
        
        @keyframes pulse-arrow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
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
        
        .connection-tooltip {
          background: hsl(35 25% 20%) !important;
          color: hsl(40 30% 90%) !important;
          border: none !important;
          border-radius: 6px !important;
          padding: 6px 10px !important;
          font-family: 'Crimson Text', serif !important;
          font-size: 13px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        }
        
        .connection-tooltip::before {
          border-top-color: hsl(35 25% 20%) !important;
        }
        
        .arrow-marker div {
          animation: pulse-arrow 1.5s ease-in-out infinite;
        }
      `}</style>

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
            checked={showConnections}
            onCheckedChange={(checked) => setShowConnections(checked as boolean)}
            className="border-secondary data-[state=checked]:bg-secondary"
          />
          <GitBranch className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium text-foreground">Show Lineages</span>
        </label>
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
          
          {showConnections && (
            <>
              <div className="border-t border-primary/20 my-2 pt-2">
                <span className="text-muted-foreground font-medium">Connections</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-0.5 bg-secondary" style={{ backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0, currentColor 4px, transparent 4px, transparent 8px)' }} />
                <span className="text-muted-foreground">Teacher → Student</span>
              </div>
            </>
          )}
          
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
