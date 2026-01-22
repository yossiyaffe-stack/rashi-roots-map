import { useState, useMemo } from 'react';
import { Search, Grape, Map as MapIcon, History, Users, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { LeafletMap } from '@/components/LeafletMap';
import { ScholarListItem } from '@/components/ScholarListItem';
import { ScholarDetailPanel } from '@/components/ScholarDetailPanel';
import { useScholars, type DbScholar } from '@/hooks/useScholars';
import { cn } from '@/lib/utils';



const Index = () => {
  const [selectedScholar, setSelectedScholar] = useState<DbScholar | null>(null);
  const [timeRange, setTimeRange] = useState<[number, number]>([1000, 1650]);
  
  const [searchTerm, setSearchTerm] = useState('');

  const { data: scholars = [], isLoading } = useScholars();

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
    <div className="w-screen h-screen flex overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-96 flex flex-col z-[1001] bg-sidebar border-r border-white/10 shadow-2xl">
        {/* Header */}
        <header className="p-8 bg-gradient-to-b from-[hsl(245_50%_28%)] to-sidebar">
          <div className="flex items-center gap-3 mb-4">
            <Grape className="w-7 h-7 text-accent" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-accent/80 font-bold">
              The Vine of Wisdom
            </span>
          </div>
          <h1 className="text-3xl font-black leading-tight italic">
            Rashi <span className="text-accent">Map</span>
          </h1>
        </header>

        {/* Search & Content */}
        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative mb-6">
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
            <h3 className="text-xs uppercase tracking-widest text-accent font-bold mb-4 px-2">
              Key Commentators ({filteredScholars.length})
            </h3>
            <ScrollArea className="h-[calc(100%-2rem)]">
              <div className="space-y-2 pr-2">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-xl bg-white/5" />
                  ))
                ) : (
                  filteredScholars.map(scholar => (
                    <div
                      key={scholar.id}
                      onClick={() => setSelectedScholar(scholar)}
                      className={cn(
                        "group p-4 rounded-xl cursor-pointer transition-all border",
                        selectedScholar?.id === scholar.id
                          ? "bg-white/10 border-accent"
                          : "bg-transparent border-transparent hover:bg-white/5"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold group-hover:text-accent transition-colors">
                            {scholar.name}
                          </h4>
                          <p className="text-xs text-white/50">
                            {scholar.birth_place || scholar.period} • {scholar.birth_year || '?'}–{scholar.death_year || '?'}
                          </p>
                        </div>
                        {scholar.hebrew_name && (
                          <span className="text-lg font-hebrew text-accent/80">
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
        <footer className="p-6 bg-[hsl(245_50%_12%)] border-t border-white/10">
          <div className="flex justify-between text-sm mb-3">
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

      {/* Map View */}
      <main className="flex-1 relative">
        <LeafletMap
          scholars={filteredScholars}
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
      </main>
    </div>
  );
};

export default Index;
