import { useState, useMemo, useRef } from 'react';
import L from 'leaflet';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Clock, ChevronRight, ChevronLeft, Users, Search, X, Maximize2, Minimize2 } from 'lucide-react';
import { Slider, type SliderMarker } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { LeafletMap } from '@/components/LeafletMap';
import { ScholarDetailPanel } from '@/components/ScholarDetailPanel';
import { UnifiedSearch } from '@/components/UnifiedSearch';
import { CircleFilterPanel } from '@/components/CircleFilterPanel';
import { useScholarsOverlay } from '@/contexts/ScholarsOverlayContext';
import { useCircleFilter } from '@/contexts/CircleFilterContext';

import { useScholars, useRelationships, useHistoricalEvents, usePlaces, useLocationNames, useLocations, useBiographicalRelationships, useTextualRelationships, type DbScholar } from '@/hooks/useScholars';
import { useWorksWithLocations, type WorkWithLocation } from '@/hooks/useWorks';
import { TimelineEvents } from '@/components/TimelineEvents';
import { useMapControls } from '@/contexts/MapControlsContext';
import { cn } from '@/lib/utils';

// Helper to format year with BCE/CE
const formatYear = (year: number): string => {
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
};

const Index = () => {
  const { selectedScholar, setSelectedScholar } = useScholarsOverlay();
  const [timeRange, setTimeRange] = useState<[number, number]>([-200, 1650]);
  const [timelineExpanded, setTimelineExpanded] = useState(true);
  const [timelineFullscreen, setTimelineFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSecularHistory, setShowSecularHistory] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  
  const { isOverlayOpen: scholarsOverlayOpen, setIsOverlayOpen: setScholarsOverlayOpen } = useScholarsOverlay();
  const { circleFilter, isDrawingCircle, setCircleFilter, setIsDrawingCircle } = useCircleFilter();
  const { 
    showBoundaries, setShowBoundaries,
    showBoundaryShading,
    showMigrations, setShowMigrations,
    showConnections, setShowConnections,
    showPlaceNamesEnglish,
    showPlaceNamesHebrew,
    showScholarNamesEnglish,
    showScholarNamesHebrew,
    cityFilter,
    showOnlyScholarCities,
    showJourneyMarkers,
    journeyReasonFilter,
    mapEntityMode,
  } = useMapControls();

  const { data: scholars = [], isLoading } = useScholars();
  const { data: relationships = [] } = useRelationships();
  const { data: historicalEvents = [] } = useHistoricalEvents();
  const { data: places = [] } = usePlaces();
  const { data: locationNames = [] } = useLocationNames();
  const { data: locations = [] } = useLocations();
  const { data: biographicalRelationships = [] } = useBiographicalRelationships();
  const { data: textualRelationships = [] } = useTextualRelationships();
  const { data: works = [] } = useWorksWithLocations();
  const [selectedWork, setSelectedWork] = useState<WorkWithLocation | null>(null);

  const filteredScholars = useMemo(() => {
    return scholars.filter(s => {
      // Filter out anonymous manuscript entries (these are works, not scholars)
      if (s.period === 'Anonymous Work') return false;
      
      const matchesSearch = searchTerm === '' ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.hebrew_name && s.hebrew_name.includes(searchTerm));
      
      const inTimeRange = !s.birth_year || 
        (s.birth_year >= timeRange[0] && s.birth_year <= timeRange[1]);
      
      return matchesSearch && inTimeRange;
    });
  }, [scholars, searchTerm, timeRange]);

  // Create markers from historical events for the timeline slider
  const eventMarkers: SliderMarker[] = useMemo(() => {
    const importanceColors: Record<string, string> = {
      critical: 'bg-red-500',
      major: 'bg-amber-500',
      foundational: 'bg-accent',
      scholarly: 'bg-blue-500',
    };
    
    return historicalEvents.map(event => ({
      position: event.year,
      color: importanceColors[event.importance] || 'bg-blue-500',
      label: `${event.year}: ${event.name}`,
    }));
  }, [historicalEvents]);

  // Handle place selection from search
  const handlePlaceSelect = (latitude: number, longitude: number, placeName: string) => {
    if (mapRef.current) {
      mapRef.current.flyTo([latitude, longitude], 10, { duration: 1.5 });
    }
  };

  // Handle scholar selection from search
  const handleScholarSelect = (scholar: DbScholar) => {
    setSelectedScholar(scholar);
    if (scholar.latitude && scholar.longitude && mapRef.current) {
      mapRef.current.flyTo([scholar.latitude, scholar.longitude], 8, { duration: 1.5 });
    }
  };

  // Handle work selection from search
  const handleWorkSelectFromSearch = (work: WorkWithLocation) => {
    setSelectedWork(work);
    // If work has location events with coordinates, fly to the first one
    const firstLocation = work.location_events?.find(e => e.place?.latitude && e.place?.longitude);
    if (firstLocation?.place && mapRef.current) {
      mapRef.current.flyTo([firstLocation.place.latitude, firstLocation.place.longitude], 8, { duration: 1.5 });
    } else if (work.latitude && work.longitude && mapRef.current) {
      // Fall back to author's location
      mapRef.current.flyTo([work.latitude, work.longitude], 8, { duration: 1.5 });
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      {/* Map Content - Full screen behind overlays */}
      <div className="flex-1 relative min-h-0">
        <LeafletMap
          scholars={filteredScholars}
          relationships={relationships}
          biographicalRelationships={biographicalRelationships}
          textualRelationships={textualRelationships}
          places={places}
          locationNames={locationNames}
          selectedScholar={selectedScholar}
          onSelectScholar={setSelectedScholar}
          timeRange={timeRange}
          showConnections={showConnections}
          showMigrations={showMigrations}
          showBoundaries={showBoundaries}
          showBoundaryShading={showBoundaryShading}
          showPlaceNamesEnglish={showPlaceNamesEnglish}
          showPlaceNamesHebrew={showPlaceNamesHebrew}
          showScholarNamesEnglish={showScholarNamesEnglish}
          showScholarNamesHebrew={showScholarNamesHebrew}
          cityFilter={cityFilter}
          showOnlyScholarCities={showOnlyScholarCities}
          locations={locations}
          showJourneyMarkers={showJourneyMarkers}
          journeyReasonFilter={journeyReasonFilter}
          mapRef={mapRef}
          isDrawingCircle={isDrawingCircle}
          onCircleDrawn={(center, radius) => {
            setCircleFilter({ center, radius });
            setIsDrawingCircle(false);
          }}
          circleFilter={circleFilter}
          works={works}
          selectedWork={selectedWork}
          onSelectWork={setSelectedWork}
          mapEntityMode={mapEntityMode}
        />

        {/* Search Controls - Top Right */}
        <div className="absolute top-6 right-6 z-[1000]">
          <UnifiedSearch
            onScholarSelect={handleScholarSelect}
            onWorkSelect={handleWorkSelectFromSearch}
            onPlaceSelect={handlePlaceSelect}
          />
        </div>

        {/* Circle Filter Panel */}
        <CircleFilterPanel
          scholars={scholars}
          timeRange={timeRange}
          onSelectScholar={handleScholarSelect}
          selectedScholar={selectedScholar}
        />

        {/* Scholars Overlay Panel - Left side */}
        <div className={cn(
          "absolute top-0 left-0 h-full z-[1000] transition-all duration-300 flex",
          scholarsOverlayOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {/* Panel Content */}
          <div className="w-80 h-full bg-sidebar/95 backdrop-blur-md border-r border-white/10 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <h3 className="text-xs uppercase tracking-widest text-accent font-bold">
                  Scholars ({filteredScholars.length})
                </h3>
              </div>
              <button
                onClick={() => setScholarsOverlayOpen(false)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Search */}
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type="text"
                  placeholder="Search scholars..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-foreground placeholder:text-white/40"
                />
              </div>
            </div>

            {/* Scholar List */}
            <ScrollArea className="flex-1">
              <div className="p-3 pt-0 space-y-1.5">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl bg-white/5" />
                  ))
                ) : (
                  filteredScholars.map(scholar => (
                    <div
                      key={scholar.id}
                      onClick={() => setSelectedScholar(scholar)}
                      className={cn(
                        "group p-3 rounded-lg cursor-pointer transition-all border",
                        selectedScholar?.id === scholar.id
                          ? "bg-white/10 border-accent"
                          : "bg-transparent border-transparent hover:bg-white/5"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm group-hover:text-accent transition-colors truncate">
                            {scholar.name}
                          </h4>
                          <p className="text-[11px] text-white/50 truncate">
                            {scholar.birth_place || scholar.period} • {scholar.birth_year || '?'}–{scholar.death_year || '?'}
                          </p>
                        </div>
                        {scholar.hebrew_name && (
                          <span className="text-sm font-hebrew text-accent/80 shrink-0 ml-2">
                            {scholar.hebrew_name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>


        {/* Scholar Detail Panel */}
        {selectedScholar && (
          <ScholarDetailPanel
            scholar={selectedScholar}
            onClose={() => setSelectedScholar(null)}
            onFlyToLocation={(lat, lng) => {
              if (mapRef.current) {
                mapRef.current.flyTo([lat, lng], 10, { duration: 1.5 });
              }
            }}
          />
        )}
      </div>

      {/* Timeline Footer - Bottom of Map */}
      <footer className="bg-sidebar/95 backdrop-blur-md border-t border-white/10 z-[1000]">
        <div className="flex items-center">
          <button
            onClick={() => setTimelineExpanded(!timelineExpanded)}
            className="flex-1 px-4 py-2 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <span className="text-xs uppercase tracking-widest text-accent font-bold">Time Frame Filter</span>
              <span className="text-xs text-muted-foreground ml-2">
                {timeRange[0]} – {timeRange[1]} CE
              </span>
            </div>
            {timelineExpanded ? (
              <ChevronLeft className="w-4 h-4 text-white/40" />
            ) : (
              <ChevronRight className="w-4 h-4 text-white/40" />
            )}
          </button>
        </div>
        
        <div className={cn(
          "transition-all duration-200 overflow-hidden",
          timelineExpanded ? "max-h-40 px-4 pb-4" : "max-h-0"
        )}>
          <div className="flex items-center gap-2 mb-3">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={() => {
                  // Zoom out: expand range by 50 years on each side
                  const newStart = Math.max(-2000, timeRange[0] - 50);
                  const newEnd = Math.min(2026, timeRange[1] + 50);
                  setTimeRange([newStart, newEnd]);
                }}
                className="p-1.5 rounded hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                title="Zoom out (expand range)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  // Zoom in: shrink range by 50 years on each side (min 50 year span)
                  const currentSpan = timeRange[1] - timeRange[0];
                  if (currentSpan > 50) {
                    const shrinkAmount = Math.min(50, (currentSpan - 50) / 2);
                    setTimeRange([
                      Math.round(timeRange[0] + shrinkAmount),
                      Math.round(timeRange[1] - shrinkAmount)
                    ]);
                  }
                }}
                disabled={(timeRange[1] - timeRange[0]) <= 50}
                className="p-1.5 rounded hover:bg-white/10 transition-colors text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom in (narrow range)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTimeRange([-200, 1650])}
                className="p-1.5 rounded hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                title="Reset to default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Manual Year Input - Start */}
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={timeRange[0]}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || -2000;
                  const clamped = Math.max(-2000, Math.min(timeRange[1] - 10, val));
                  setTimeRange([clamped, timeRange[1]]);
                }}
                className="w-20 h-7 text-xs bg-white/5 border-white/10 text-center"
                min={-2000}
                max={timeRange[1] - 10}
              />
              <span className="text-xs text-white/40">
                {timeRange[0] < 0 ? 'BCE' : 'CE'}
              </span>
            </div>
            
            <Slider
              value={timeRange}
              min={-2000}
              max={2026}
              step={10}
              onValueChange={([start, end]) => setTimeRange([start, end])}
              className="flex-1"
              showTooltip
              formatValue={(val) => formatYear(val)}
            />
            
            {/* Manual Year Input - End */}
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={timeRange[1]}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 2026;
                  const clamped = Math.min(2026, Math.max(timeRange[0] + 10, val));
                  setTimeRange([timeRange[0], clamped]);
                }}
                className="w-20 h-7 text-xs bg-white/5 border-white/10 text-center"
                min={timeRange[0] + 10}
                max={2026}
              />
              <span className="text-xs text-white/40">CE</span>
            </div>
            
            {/* Current span indicator */}
            <span className="text-xs text-white/40 ml-2 w-20 text-right">
              {timeRange[1] - timeRange[0]} yrs
            </span>
          </div>
          
          {/* Historical Events Row */}
          <TimelineEvents 
            events={historicalEvents} 
            scholars={filteredScholars}
            timeRange={timeRange} 
            mapRef={mapRef}
            onSelectScholar={setSelectedScholar}
            showSecularHistory={showSecularHistory}
            onToggleSecularHistory={setShowSecularHistory}
          />
        </div>
      </footer>

      {/* Fullscreen Timeline Sheet */}
      <Sheet open={timelineFullscreen} onOpenChange={setTimelineFullscreen}>
        <SheetContent side="bottom" className="h-[60vh] bg-sidebar border-t border-white/10">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-accent">
                <Clock className="w-5 h-5" />
                Historical Timeline
              </SheetTitle>
              <button
                onClick={() => setTimelineFullscreen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </SheetHeader>
          
          <div className="space-y-6 h-full overflow-hidden flex flex-col">
            {/* Large Slider */}
            <div className="flex items-center gap-4">
              <span className="text-lg text-white/50 w-28">{formatYear(timeRange[0])}</span>
              <Slider
                value={timeRange}
                min={-2000}
                max={2026}
                step={10}
                onValueChange={([start, end]) => setTimeRange([start, end])}
                className="flex-1"
                showTooltip
                formatValue={(val) => formatYear(val)}
                markers={eventMarkers}
              />
              <span className="text-lg text-accent font-medium w-28 text-right">{formatYear(timeRange[1])}</span>
            </div>
            
            {/* Expanded Events Grid */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
                  {historicalEvents
                    .filter(e => e.year >= timeRange[0] && e.year <= timeRange[1])
                    .sort((a, b) => a.year - b.year)
                    .map((event) => {
                      const importanceColors: Record<string, string> = {
                        critical: 'bg-red-500',
                        major: 'bg-amber-500',
                        foundational: 'bg-accent',
                        scholarly: 'bg-blue-500',
                      };
                      return (
                        <div
                          key={event.id}
                          className="p-3 rounded-lg border bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn("w-2.5 h-2.5 rounded-full", importanceColors[event.importance] || 'bg-blue-500')} />
                            <span className="text-sm font-semibold text-white">{event.year} CE</span>
                          </div>
                          <h4 className="text-sm font-medium text-white/90 mb-1">{event.name}</h4>
                          {event.description && (
                            <p className="text-xs text-white/50 line-clamp-3">{event.description}</p>
                          )}
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Index;
