import { useState, useMemo } from 'react';
import { Clock, ChevronRight, ChevronLeft, Users, Search, X, Maximize2, Minimize2 } from 'lucide-react';
import { Slider, type SliderMarker } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { LeafletMap } from '@/components/LeafletMap';
import { ScholarDetailPanel } from '@/components/ScholarDetailPanel';
import { useScholarsOverlay } from '@/contexts/ScholarsOverlayContext';

import { useScholars, useRelationships, useHistoricalEvents, type DbScholar } from '@/hooks/useScholars';
import { TimelineEvents } from '@/components/TimelineEvents';
import { useMapControls } from '@/contexts/MapControlsContext';
import { cn } from '@/lib/utils';

const Index = () => {
  const [selectedScholar, setSelectedScholar] = useState<DbScholar | null>(null);
  const [timeRange, setTimeRange] = useState<[number, number]>([1000, 1650]);
  const [timelineExpanded, setTimelineExpanded] = useState(true);
  const [timelineFullscreen, setTimelineFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { isOverlayOpen: scholarsOverlayOpen, setIsOverlayOpen: setScholarsOverlayOpen } = useScholarsOverlay();
  const { 
    showBoundaries, setShowBoundaries,
    showMigrations, setShowMigrations,
    showConnections, setShowConnections 
  } = useMapControls();

  const { data: scholars = [], isLoading } = useScholars();
  const { data: relationships = [] } = useRelationships();
  const { data: historicalEvents = [] } = useHistoricalEvents();

  const filteredScholars = useMemo(() => {
    return scholars.filter(s => {
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

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      {/* Map Content - Full screen behind overlays */}
      <div className="flex-1 relative min-h-0">
        <LeafletMap
          scholars={filteredScholars}
          relationships={relationships}
          selectedScholar={selectedScholar}
          onSelectScholar={setSelectedScholar}
          timeRange={timeRange}
          showConnections={showConnections}
          showMigrations={showMigrations}
          showBoundaries={showBoundaries}
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
              <span className="text-xs uppercase tracking-widest text-accent font-bold">Timeline Filter</span>
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
          
          {/* Expand to full view button */}
          <button
            onClick={() => setTimelineFullscreen(true)}
            className="px-3 py-2 hover:bg-white/5 transition-colors text-white/40 hover:text-white"
            title="Expand timeline"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className={cn(
          "transition-all duration-200 overflow-hidden",
          timelineExpanded ? "max-h-40 px-4 pb-4" : "max-h-0"
        )}>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-sm text-white/50 w-20">{timeRange[0]} CE</span>
            <Slider
              value={timeRange}
              min={1000}
              max={1800}
              step={10}
              onValueChange={([start, end]) => setTimeRange([start, end])}
              className="flex-1"
              showTooltip
              formatValue={(val) => `${val} CE`}
              markers={eventMarkers}
            />
            <span className="text-sm text-accent font-medium w-20 text-right">{timeRange[1]} CE</span>
          </div>
          
          {/* Historical Events Row */}
          <TimelineEvents events={historicalEvents} timeRange={timeRange} />
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
              <span className="text-lg text-white/50 w-24">{timeRange[0]} CE</span>
              <Slider
                value={timeRange}
                min={1000}
                max={1800}
                step={10}
                onValueChange={([start, end]) => setTimeRange([start, end])}
                className="flex-1"
                showTooltip
                formatValue={(val) => `${val} CE`}
                markers={eventMarkers}
              />
              <span className="text-lg text-accent font-medium w-24 text-right">{timeRange[1]} CE</span>
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
