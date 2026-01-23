import { useState, useEffect, useMemo } from 'react';
import { useWorks, useAllWorkLocations } from '@/hooks/useWorks';
import { usePlaces, useScholars } from '@/hooks/useScholars';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Printer, ScrollText, PenTool, Languages, ExternalLink } from 'lucide-react';

// Fix for default markers
import 'leaflet/dist/leaflet.css';

// Work location type icons and colors
const locationTypeConfig: Record<string, { icon: string; color: string; label: string; LucideIcon: typeof BookOpen }> = {
  composition: { icon: '✍️', color: '#8B5CF6', label: 'Composition', LucideIcon: PenTool },
  first_print: { icon: '🖨️', color: '#10B981', label: 'First Printing', LucideIcon: Printer },
  reprint: { icon: '📖', color: '#3B82F6', label: 'Reprint', LucideIcon: BookOpen },
  manuscript_copy: { icon: '📜', color: '#F59E0B', label: 'Manuscript', LucideIcon: ScrollText },
  translation: { icon: '🌐', color: '#EC4899', label: 'Translation', LucideIcon: Languages },
};

// Create custom marker icon for work locations
const createWorkLocationIcon = (locationType: string, index: number) => {
  const config = locationTypeConfig[locationType] || locationTypeConfig.composition;
  
  return L.divIcon({
    className: 'custom-work-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 32px;
          height: 32px;
          background: ${config.color};
          border: 2px solid white;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          ${config.icon}
        </div>
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          color: ${config.color};
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        ">
          ${index + 1}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Component to fit bounds when work changes
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
    }
  }, [positions, map]);
  
  return null;
}

// Generate curved path between points
function generateCurvedPath(start: [number, number], end: [number, number]): [number, number][] {
  const points: [number, number][] = [];
  const midLat = (start[0] + end[0]) / 2;
  const midLng = (start[1] + end[1]) / 2;
  
  // Calculate perpendicular offset for curve
  const dx = end[1] - start[1];
  const dy = end[0] - start[0];
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = dist * 0.15;
  
  const controlLat = midLat + (dx / dist) * offset;
  const controlLng = midLng - (dy / dist) * offset;
  
  // Generate bezier curve points
  for (let t = 0; t <= 1; t += 0.05) {
    const lat = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * controlLat + t * t * end[0];
    const lng = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * controlLng + t * t * end[1];
    points.push([lat, lng]);
  }
  
  return points;
}

export default function WorkJourney() {
  const { data: works = [] } = useWorks();
  const { data: workLocations = [] } = useAllWorkLocations();
  const { data: places = [] } = usePlaces();
  const { data: scholars = [] } = useScholars();
  
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [showConnections, setShowConnections] = useState(true);
  const [filterByType, setFilterByType] = useState<string | 'all'>('all');
  
  // Get works that have location data
  const worksWithLocations = useMemo(() => {
    const workIdsWithLocations = new Set(workLocations.map(wl => wl.work_id));
    return works.filter(w => workIdsWithLocations.has(w.id));
  }, [works, workLocations]);
  
  // Auto-select first work with locations
  useEffect(() => {
    if (!selectedWorkId && worksWithLocations.length > 0) {
      setSelectedWorkId(worksWithLocations[0].id);
    }
  }, [worksWithLocations, selectedWorkId]);
  
  const selectedWork = works.find(w => w.id === selectedWorkId);
  const selectedScholar = selectedWork ? scholars.find(s => s.id === selectedWork.scholar_id) : null;
  
  // Get locations for selected work
  const selectedWorkLocations = useMemo(() => {
    if (!selectedWorkId) return [];
    
    return workLocations
      .filter(wl => wl.work_id === selectedWorkId)
      .filter(wl => filterByType === 'all' || wl.location_type === filterByType)
      .map(wl => {
        const place = wl.place || places.find(p => p.id === wl.place_id);
        return {
          ...wl,
          place,
          lat: place?.latitude,
          lng: place?.longitude,
        };
      })
      .filter(wl => wl.lat && wl.lng)
      .sort((a, b) => (a.year || 0) - (b.year || 0));
  }, [selectedWorkId, workLocations, places, filterByType]);
  
  // Get positions for map bounds
  const positions = useMemo(() => {
    return selectedWorkLocations
      .filter(wl => wl.lat && wl.lng)
      .map(wl => [wl.lat!, wl.lng!] as [number, number]);
  }, [selectedWorkLocations]);
  
  // Generate connection lines between chronological locations
  const connectionPaths = useMemo(() => {
    if (!showConnections || positions.length < 2) return [];
    
    const paths: { path: [number, number][]; fromType: string; toType: string }[] = [];
    for (let i = 0; i < positions.length - 1; i++) {
      paths.push({
        path: generateCurvedPath(positions[i], positions[i + 1]),
        fromType: selectedWorkLocations[i].location_type,
        toType: selectedWorkLocations[i + 1].location_type,
      });
    }
    return paths;
  }, [positions, showConnections, selectedWorkLocations]);
  
  return (
    <div className="h-full flex">
      {/* Left Panel */}
      <div className="w-80 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold mb-3">Work Journey</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Track how a text traveled from composition through printings and manuscript copies.
          </p>
          
          {/* Work Selector */}
          <div className="space-y-3">
            <Label>Select Work</Label>
            <Select value={selectedWorkId || ''} onValueChange={setSelectedWorkId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a work..." />
              </SelectTrigger>
              <SelectContent>
                {worksWithLocations.map(work => {
                  const scholar = scholars.find(s => s.id === work.scholar_id);
                  return (
                    <SelectItem key={work.id} value={work.id}>
                      <span className="font-medium">{work.title}</span>
                      {scholar && (
                        <span className="text-muted-foreground ml-2">
                          — {scholar.name}
                        </span>
                      )}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Filters */}
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-connections">Show Journey Lines</Label>
            <Switch 
              id="show-connections" 
              checked={showConnections}
              onCheckedChange={setShowConnections}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Filter by Type</Label>
            <Select value={filterByType} onValueChange={setFilterByType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(locationTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Legend */}
        <div className="p-4 border-b border-border">
          <Label className="mb-3 block">Location Types</Label>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(locationTypeConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-6 h-6 rounded flex items-center justify-center text-sm"
                  style={{ backgroundColor: config.color }}
                >
                  {config.icon}
                </div>
                <span>{config.label}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Journey Timeline */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <Label className="mb-3 block">Journey Timeline</Label>
            {selectedWorkLocations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {selectedWork 
                  ? 'No location data available for this work.'
                  : 'Select a work to see its journey.'}
              </p>
            ) : (
              <div className="space-y-3">
                {selectedWorkLocations.map((loc, index) => {
                  const config = locationTypeConfig[loc.location_type] || locationTypeConfig.composition;
                  return (
                    <Card key={loc.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-8 h-8 rounded flex items-center justify-center text-lg shrink-0"
                          style={{ backgroundColor: config.color }}
                        >
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {index + 1}
                            </Badge>
                            <span className="text-sm font-medium">{config.label}</span>
                          </div>
                          <p className="text-sm font-semibold truncate">
                            {loc.place?.name_english || 'Unknown'}
                          </p>
                          {loc.year && (
                            <p className="text-xs text-muted-foreground">
                              {loc.circa && 'c. '}{loc.year}
                            </p>
                          )}
                          {loc.printer_publisher && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Publisher: {loc.printer_publisher}
                            </p>
                          )}
                          {loc.manuscript_significance && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {loc.manuscript_significance}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Selected Work Info */}
        {selectedWork && (
          <div className="p-4 border-t border-border bg-muted/30">
            <h3 className="font-semibold text-sm mb-1">{selectedWork.title}</h3>
            {selectedWork.hebrew_title && (
              <p className="text-sm text-muted-foreground mb-1" dir="rtl">
                {selectedWork.hebrew_title}
              </p>
            )}
            {selectedScholar && (
              <p className="text-xs text-muted-foreground">
                by {selectedScholar.name}
              </p>
            )}
            {selectedWork.manuscript_url && (
              <a 
                href={selectedWork.manuscript_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
              >
                <ExternalLink className="w-3 h-3" />
                View Manuscript
              </a>
            )}
          </div>
        )}
      </div>
      
      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[48.5, 9]}
          zoom={5}
          className="h-full w-full"
          style={{ background: '#1a1a2e' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {/* Fit bounds when work changes */}
          {positions.length > 0 && <FitBounds positions={positions} />}
          
          {/* Connection lines */}
          {connectionPaths.map((connection, index) => (
            <Polyline
              key={index}
              positions={connection.path}
              pathOptions={{
                color: locationTypeConfig[connection.toType]?.color || '#8B5CF6',
                weight: 2,
                opacity: 0.7,
                dashArray: '8, 8',
              }}
            />
          ))}
          
          {/* Location markers */}
          {selectedWorkLocations.map((loc, index) => (
            loc.lat && loc.lng && (
              <Marker
                key={loc.id}
                position={[loc.lat, loc.lng]}
                icon={createWorkLocationIcon(loc.location_type, index)}
              >
                <Popup>
                  <div className="min-w-48">
                    <p className="font-semibold">{loc.place?.name_english || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">
                      {locationTypeConfig[loc.location_type]?.label || loc.location_type}
                    </p>
                    {loc.year && (
                      <p className="text-sm">
                        Year: {loc.circa && 'c. '}{loc.year}
                      </p>
                    )}
                    {loc.printer_publisher && (
                      <p className="text-sm">Publisher: {loc.printer_publisher}</p>
                    )}
                    {loc.notes && (
                      <p className="text-xs mt-2 text-muted-foreground">{loc.notes}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
        
        {/* Empty state overlay */}
        {worksWithLocations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <Card className="p-6 text-center max-w-md">
              <ScrollText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No Work Location Data</h3>
              <p className="text-sm text-muted-foreground">
                Add location data to works to see their geographic journey from composition through printings and manuscripts.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
