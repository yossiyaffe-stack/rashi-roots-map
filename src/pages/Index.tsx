import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { LeafletMap } from '@/components/LeafletMap';
import { ScholarDetailPanel } from '@/components/ScholarDetailPanel';
import { MapLegend } from '@/components/MapLegend';

import { useScholars, useRelationships, type DbScholar } from '@/hooks/useScholars';
import { cn } from '@/lib/utils';

const Index = () => {
  const [selectedScholar, setSelectedScholar] = useState<DbScholar | null>(null);
  const [timeRange, setTimeRange] = useState<[number, number]>([1000, 1650]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: scholars = [], isLoading } = useScholars();
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

  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* Collapsible Scholar Sidebar */}
      <aside className={cn(
        "flex flex-col bg-sidebar border-r border-white/10 transition-all duration-300 relative",
        sidebarCollapsed ? "w-0 overflow-hidden" : "w-80"
      )}>
        {/* Search & Content */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <Users className="w-4 h-4 text-accent" />
            <h3 className="text-xs uppercase tracking-widest text-accent font-bold">
              Scholars ({filteredScholars.length})
            </h3>
          </div>

          {/* Search */}
          <div className="relative mb-3">
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
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
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

      {/* Collapse/Expand Toggle Button */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={cn(
          "absolute z-[1000] top-1/2 -translate-y-1/2 bg-sidebar hover:bg-accent/20 border border-white/10 rounded-r-lg p-1.5 transition-all",
          sidebarCollapsed ? "left-0" : "left-80"
        )}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4 text-accent" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-accent" />
        )}
      </button>

      {/* Map Content */}
      <div className="flex-1 relative h-full min-h-0">
        <LeafletMap
          scholars={filteredScholars}
          relationships={relationships}
          selectedScholar={selectedScholar}
          onSelectScholar={setSelectedScholar}
          timeRange={timeRange}
        />

        {/* Legend - Bottom Left of Map */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-sidebar/90 backdrop-blur-md border border-white/10 rounded-lg p-4">
          <MapLegend />
        </div>

        {/* Scholar Detail Panel */}
        {selectedScholar && (
          <ScholarDetailPanel
            scholar={selectedScholar}
            onClose={() => setSelectedScholar(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
