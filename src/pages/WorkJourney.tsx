import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useWorks, useAllWorkLocations } from '@/hooks/useWorks';
import { usePlaces, useScholars } from '@/hooks/useScholars';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { BookOpen, Printer, ScrollText, PenTool, Languages, ExternalLink, Play, Pause, Map, Layers, ChevronLeft, ChevronRight } from 'lucide-react';

// Work location type icons and colors
const locationTypeConfig: Record<string, { icon: string; color: string; label: string; LucideIcon: typeof BookOpen }> = {
  composition: { icon: '✍️', color: '#8B5CF6', label: 'Composition', LucideIcon: PenTool },
  first_print: { icon: '🖨️', color: '#10B981', label: 'First Printing', LucideIcon: Printer },
  reprint: { icon: '📖', color: '#3B82F6', label: 'Reprint', LucideIcon: BookOpen },
  manuscript_copy: { icon: '📜', color: '#F59E0B', label: 'Manuscript', LucideIcon: ScrollText },
  translation: { icon: '🌐', color: '#EC4899', label: 'Translation', LucideIcon: Languages },
};

// Time period definitions for heatmap
const timePeriods = [
  { label: 'Early (1050-1200)', start: 1050, end: 1200 },
  { label: 'Medieval (1200-1400)', start: 1200, end: 1400 },
  { label: 'Print Era (1400-1550)', start: 1400, end: 1550 },
  { label: 'Expansion (1550-1700)', start: 1550, end: 1700 },
  { label: 'Modern (1700-1900)', start: 1700, end: 1900 },
  { label: 'Digital (1900-2100)', start: 1900, end: 2100 },
];

// Create custom marker icon for work locations
const createWorkLocationIcon = (locationType: string, index: number, isActive = true) => {
  const config = locationTypeConfig[locationType] || locationTypeConfig.composition;
  const opacity = isActive ? 1 : 0.4;
  
  return L.divIcon({
    className: 'custom-work-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: ${opacity};
        transition: opacity 0.3s;
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

// Create heatmap circle for region density
const createHeatmapCircle = (count: number, maxCount: number) => {
  const intensity = Math.min(count / maxCount, 1);
  const radius = 30000 + intensity * 100000; // 30-130km radius
  const opacity = 0.3 + intensity * 0.5;
  
  return { radius, opacity };
};

// Generate curved path between points
function generateCurvedPath(start: [number, number], end: [number, number]): [number, number][] {
  if (!start || !end || 
      !Number.isFinite(start[0]) || !Number.isFinite(start[1]) ||
      !Number.isFinite(end[0]) || !Number.isFinite(end[1])) {
    return [];
  }
  
  const points: [number, number][] = [];
  const midLat = (start[0] + end[0]) / 2;
  const midLng = (start[1] + end[1]) / 2;
  
  const dx = end[1] - start[1];
  const dy = end[0] - start[0];
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < 0.001) {
    return [start, end];
  }
  
  const offset = dist * 0.15;
  
  const controlLat = midLat + (dx / dist) * offset;
  const controlLng = midLng - (dy / dist) * offset;
  
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
  const [filterByType, setFilterByType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'journey' | 'heatmap'>('journey');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  
  // Animation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(2000); // ms per step
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylinesRef = useRef<L.Polyline[]>([]);
  const heatmapCirclesRef = useRef<L.Circle[]>([]);
  
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

  // Heatmap data by region
  const heatmapData = useMemo(() => {
    if (!selectedWorkId) return [];
    
    const regionCounts: Record<string, { lat: number; lng: number; count: number; country: string }> = {};
    
    selectedWorkLocations.forEach(loc => {
      if (!loc.place) return;
      const country = loc.place.modern_country || 'Unknown';
      if (!regionCounts[country]) {
        regionCounts[country] = { lat: loc.lat!, lng: loc.lng!, count: 0, country };
      }
      regionCounts[country].count++;
      // Average position for the region
      regionCounts[country].lat = (regionCounts[country].lat + loc.lat!) / 2;
      regionCounts[country].lng = (regionCounts[country].lng + loc.lng!) / 2;
    });
    
    return Object.values(regionCounts);
  }, [selectedWorkId, selectedWorkLocations]);

  // Animation logic
  const playAnimation = useCallback(() => {
    if (selectedWorkLocations.length === 0) return;
    
    setIsPlaying(true);
    setCurrentStep(0);
  }, [selectedWorkLocations]);

  const stopAnimation = useCallback(() => {
    setIsPlaying(false);
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  // Animation step effect
  useEffect(() => {
    if (!isPlaying) return;
    
    if (currentStep >= selectedWorkLocations.length) {
      stopAnimation();
      return;
    }

    const map = mapRef.current;
    const currentLoc = selectedWorkLocations[currentStep];
    
    if (map && currentLoc?.lat && currentLoc?.lng) {
      map.flyTo([currentLoc.lat, currentLoc.lng], 7, {
        duration: animationSpeed / 1000 * 0.6,
      });
      
      // Open popup for current marker
      const marker = markersRef.current[currentStep];
      if (marker) {
        setTimeout(() => marker.openPopup(), animationSpeed * 0.4);
      }
    }
    
    animationRef.current = setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, animationSpeed);

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [isPlaying, currentStep, selectedWorkLocations, animationSpeed, stopAnimation]);

  // Reset animation when work changes
  useEffect(() => {
    stopAnimation();
    setCurrentStep(0);
  }, [selectedWorkId, stopAnimation]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [48.5, 9],
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers and polylines
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers, polylines, and heatmap circles
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    polylinesRef.current.forEach(p => p.remove());
    polylinesRef.current = [];
    heatmapCirclesRef.current.forEach(c => c.remove());
    heatmapCirclesRef.current = [];

    if (viewMode === 'heatmap') {
      // Render heatmap circles
      const maxCount = Math.max(...heatmapData.map(d => d.count), 1);
      
      heatmapData.forEach(region => {
        const { radius, opacity } = createHeatmapCircle(region.count, maxCount);
        
        const circle = L.circle([region.lat, region.lng], {
          radius,
          color: '#8B5CF6',
          fillColor: '#8B5CF6',
          fillOpacity: opacity,
          weight: 2,
        }).addTo(map);
        
        circle.bindPopup(`
          <div style="text-align: center;">
            <p style="font-weight: 600; margin: 0;">${region.country}</p>
            <p style="font-size: 14px; margin: 4px 0;">${region.count} location${region.count > 1 ? 's' : ''}</p>
          </div>
        `);
        
        heatmapCirclesRef.current.push(circle);
      });
    } else {
      // Add markers for each location
      selectedWorkLocations.forEach((loc, index) => {
        if (!loc.lat || !loc.lng) return;

        const isActive = !isPlaying || index <= currentStep;
        
        const marker = L.marker([loc.lat, loc.lng], {
          icon: createWorkLocationIcon(loc.location_type, index, isActive),
        }).addTo(map);

        const config = locationTypeConfig[loc.location_type] || locationTypeConfig.composition;
        marker.bindPopup(`
          <div style="min-width: 200px;">
            <p style="font-weight: 600; margin: 0; font-size: 14px;">${loc.place?.name_english || 'Unknown'}</p>
            <p style="font-size: 12px; color: #888; margin: 4px 0;">
              ${config.icon} ${config.label}
            </p>
            ${loc.year ? `<p style="font-size: 12px; margin: 4px 0;"><strong>Year:</strong> ${loc.circa ? 'c. ' : ''}${loc.year}</p>` : ''}
            ${loc.printer_publisher ? `<p style="font-size: 12px; margin: 4px 0;"><strong>Publisher:</strong> ${loc.printer_publisher}</p>` : ''}
            ${loc.manuscript_significance ? `<p style="font-size: 12px; margin: 4px 0;"><strong>Significance:</strong> ${loc.manuscript_significance}</p>` : ''}
            ${loc.notes ? `<p style="font-size: 11px; color: #666; margin-top: 8px; border-top: 1px solid #eee; padding-top: 8px;">${loc.notes}</p>` : ''}
          </div>
        `);

        markersRef.current.push(marker);
      });

      // Add connection polylines (only show up to current step during animation)
      const pathsToShow = isPlaying 
        ? connectionPaths.slice(0, currentStep)
        : connectionPaths;
        
      pathsToShow.forEach(connection => {
        if (!connection.path || connection.path.length < 2) return;
        
        const polyline = L.polyline(connection.path, {
          color: locationTypeConfig[connection.toType]?.color || '#8B5CF6',
          weight: 2,
          opacity: 0.7,
          dashArray: '8, 8',
        }).addTo(map);

        polylinesRef.current.push(polyline);
      });
    }

    // Fit bounds if we have positions (and not during animation)
    if (positions.length > 0 && !isPlaying) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
    }
  }, [selectedWorkLocations, connectionPaths, positions, viewMode, heatmapData, isPlaying, currentStep]);

  const handleWorkChange = (value: string) => {
    setSelectedWorkId(value);
  };

  const handleTypeFilterChange = (value: string) => {
    setFilterByType(value);
  };
  
  return (
    <div className="h-full flex relative">
      {/* Left Panel */}
      <div className={`${isPanelOpen ? 'w-80' : 'w-0'} border-r border-border bg-card flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className="w-80 h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold mb-3">Work Journey</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Track how a text traveled from composition through printings and manuscript copies.
          </p>
          
          {/* Work Selector */}
          <div className="space-y-3">
            <Label>Select Work</Label>
            <Select value={selectedWorkId || ''} onValueChange={handleWorkChange}>
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

        {/* Animation Controls */}
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-semibold">Play Journey</Label>
            <Button
              size="sm"
              variant={isPlaying ? "destructive" : "default"}
              onClick={isPlaying ? stopAnimation : playAnimation}
              disabled={selectedWorkLocations.length === 0}
              className="gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Play
                </>
              )}
            </Button>
          </div>
          
          {isPlaying && (
            <div className="text-sm text-muted-foreground text-center">
              Step {currentStep + 1} of {selectedWorkLocations.length}
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Speed</Label>
              <span className="text-xs text-muted-foreground">{animationSpeed / 1000}s</span>
            </div>
            <Slider
              value={[animationSpeed]}
              onValueChange={([value]) => setAnimationSpeed(value)}
              min={1000}
              max={5000}
              step={500}
              disabled={isPlaying}
            />
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="p-4 border-b border-border">
          <Label className="mb-3 block font-semibold">View Mode</Label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'journey' ? 'default' : 'outline'}
              onClick={() => setViewMode('journey')}
              className="flex-1 gap-2"
            >
              <Map className="w-4 h-4" />
              Journey
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'heatmap' ? 'default' : 'outline'}
              onClick={() => setViewMode('heatmap')}
              className="flex-1 gap-2"
            >
              <Layers className="w-4 h-4" />
              Heatmap
            </Button>
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
            <Select value={filterByType} onValueChange={handleTypeFilterChange}>
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
                  const isCurrentStep = isPlaying && index === currentStep;
                  const isPastStep = !isPlaying || index <= currentStep;
                  
                  return (
                    <Card 
                      key={loc.id} 
                      className={`p-3 transition-all ${isCurrentStep ? 'ring-2 ring-primary' : ''} ${!isPastStep ? 'opacity-40' : ''}`}
                    >
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
      </div>
      
      {/* Panel Toggle Button */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="absolute top-4 z-10 bg-card border border-border rounded-r-lg p-2 hover:bg-muted transition-all shadow-lg"
        style={{ left: isPanelOpen ? '320px' : '0px', transition: 'left 0.3s' }}
        aria-label={isPanelOpen ? 'Close panel' : 'Open panel'}
      >
        {isPanelOpen ? (
          <ChevronLeft className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </button>
      
      {/* Map */}
      <div className="flex-1 relative">
        <div 
          ref={mapContainerRef}
          className="h-full w-full"
          style={{ background: '#1a1a2e' }}
        />
        
        {/* Heatmap Legend */}
        {viewMode === 'heatmap' && heatmapData.length > 0 && (
          <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
            <p className="text-sm font-semibold mb-2">Regional Density</p>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary/30" />
              <span className="text-xs">Low</span>
              <div className="w-4 h-4 rounded-full bg-primary/60" />
              <span className="text-xs">Medium</span>
              <div className="w-4 h-4 rounded-full bg-primary/90" />
              <span className="text-xs">High</span>
            </div>
          </div>
        )}
        
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
