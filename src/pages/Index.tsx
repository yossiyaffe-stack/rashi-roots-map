import { useState, useMemo } from 'react';
import { Search, Grape, Map as MapIcon, History, Users, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeafletMap } from '@/components/LeafletMap';
import { TimelineView } from '@/components/TimelineView';
import { NetworkView } from '@/components/NetworkView';
import { ScholarDetailPanel } from '@/components/ScholarDetailPanel';
import { MapLegend } from '@/components/MapLegend';
import { HistoricalEventsList } from '@/components/HistoricalEventsList';

import { useScholars, useHistoricalEvents, useRelationships, type DbScholar } from '@/hooks/useScholars';
import { cn } from '@/lib/utils';

type ViewMode = 'map' | 'timeline' | 'network';

const Index = () => {
  const [selectedScholar, setSelectedScholar] = useState<DbScholar | null>(null);
  const [timeRange, setTimeRange] = useState<[number, number]>([1000, 1650]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('map');

  const { data: scholars = [], isLoading: scholarsLoading } = useScholars();
  const { data: historicalEvents = [], isLoading: eventsLoading } = useHistoricalEvents();
  const { data: relationships = [] } = useRelationships();

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

  const isLoading = scholarsLoading || eventsLoading;

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-96 flex flex-col z-[1001] bg-sidebar border-r border-white/10 shadow-2xl">
        {/* Header */}
        <header className="p-6 bg-gradient-to-b from-[hsl(245_50%_28%)] to-sidebar">
          <div className="flex items-center gap-3 mb-3">
            <Grape className="w-6 h-6 text-accent" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-accent/80 font-bold">
              The Vine of Wisdom
            </span>
          </div>
          <h1 className="text-2xl font-black leading-tight italic">
            Rashi <span className="text-accent">Map</span>
          </h1>
        </header>

        {/* View Mode Tabs */}
        <div className="px-6 py-3 border-b border-white/10">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="w-full bg-white/5 border border-white/10">
              <TabsTrigger 
                value="map" 
                className="flex-1 gap-1.5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              >
                <MapIcon className="w-3.5 h-3.5" />
                Map
              </TabsTrigger>
              <TabsTrigger 
                value="timeline" 
                className="flex-1 gap-1.5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              >
                <History className="w-3.5 h-3.5" />
                Timeline
              </TabsTrigger>
              <TabsTrigger 
                value="network" 
                className="flex-1 gap-1.5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              >
                <Users className="w-3.5 h-3.5" />
                Network
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search & Content */}
        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type="text"
              placeholder="Search scholars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-foreground placeholder:text-white/40 focus:border-accent focus:ring-accent/20"
            />
          </div>

          {/* Scholar List */}
          <div className="flex-1 overflow-hidden mb-4">
            <h3 className="text-xs uppercase tracking-widest text-accent font-bold mb-3 px-1">
              Scholars ({filteredScholars.length})
            </h3>
            <ScrollArea className="h-[calc(100%-1.5rem)]">
              <div className="space-y-1.5 pr-2">
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

          {/* Legend & Events */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <MapLegend />
            <HistoricalEventsList events={historicalEvents} timeRange={timeRange} />
          </div>
        </div>

        {/* Timeline Footer */}
        <footer className="p-4 bg-[hsl(245_50%_12%)] border-t border-white/10">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-white/50">{timeRange[0]} CE</span>
            <span className="text-accent font-medium">{timeRange[1]} CE</span>
          </div>
          <Slider
            value={[timeRange[1]]}
            min={1000}
            max={1800}
            step={10}
            onValueChange={([val]) => setTimeRange([timeRange[0], val])}
            className="w-full"
          />
        </footer>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative bg-background">
        {viewMode === 'map' && (
          <LeafletMap
            scholars={filteredScholars}
            relationships={relationships}
            selectedScholar={selectedScholar}
            onSelectScholar={setSelectedScholar}
            timeRange={timeRange}
          />
        )}
        
        {viewMode === 'timeline' && (
          <TimelineView
            scholars={filteredScholars}
            selectedScholar={selectedScholar}
            onSelectScholar={setSelectedScholar}
            historicalEvents={historicalEvents}
            timeRange={timeRange}
          />
        )}
        
        {viewMode === 'network' && (
          <NetworkView
            scholars={filteredScholars}
            relationships={relationships}
            selectedScholar={selectedScholar}
            onSelectScholar={setSelectedScholar}
          />
        )}

        {/* Scholar Detail Panel */}
        {selectedScholar && (
          <ScholarDetailPanel
            scholar={selectedScholar}
            onClose={() => setSelectedScholar(null)}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
