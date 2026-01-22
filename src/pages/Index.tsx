import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Users } from 'lucide-react';
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
  const [scholarsExpanded, setScholarsExpanded] = useState(true);

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
      {/* Scholar Sidebar */}
      <aside className="w-80 flex flex-col bg-sidebar border-r border-white/10">
        {/* Search & Content */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          {/* Collapsible Scholar Section */}
          <div className={cn(
            "flex flex-col transition-all duration-300",
            scholarsExpanded ? "flex-1" : "flex-none"
          )}>
            {/* Header - Always visible */}
            <button
              onClick={() => setScholarsExpanded(!scholarsExpanded)}
              className="flex items-center justify-between w-full mb-3 px-1 group"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <h3 className="text-xs uppercase tracking-widest text-accent font-bold">
                  Scholars ({filteredScholars.length})
                </h3>
              </div>
              {scholarsExpanded ? (
                <ChevronUp className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              )}
            </button>

            {/* Expandable content */}
            {scholarsExpanded && (
              <>
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
              </>
            )}
          </div>

          {/* Legend */}
          <div className="pt-4 border-t border-white/10 mt-4">
            <MapLegend />
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

      {/* Map Content */}
      <div className="flex-1 relative">
        <LeafletMap
          scholars={filteredScholars}
          relationships={relationships}
          selectedScholar={selectedScholar}
          onSelectScholar={setSelectedScholar}
          timeRange={timeRange}
        />

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
