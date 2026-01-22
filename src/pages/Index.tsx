import { useState, useMemo } from 'react';
import { Clock, ChevronRight, ChevronLeft, Users, Search, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
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
        <button
          onClick={() => setTimelineExpanded(!timelineExpanded)}
          className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/5 transition-colors"
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
            />
            <span className="text-sm text-accent font-medium w-20 text-right">{timeRange[1]} CE</span>
          </div>
          
          {/* Historical Events Row */}
          <TimelineEvents events={historicalEvents} timeRange={timeRange} />
        </div>
      </footer>
    </div>
  );
};

export default Index;
