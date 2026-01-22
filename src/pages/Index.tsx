import { useState, useMemo } from 'react';
import { Search, Grape, Layers, Calendar, Users, MapPin } from 'lucide-react';
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

type MapStyle = 'dark' | 'light' | 'terrain';
type ViewMode = 'map' | 'timeline' | 'network';

const Index = () => {
  const [selectedScholar, setSelectedScholar] = useState<DbScholar | null>(null);
  const [timeRange, setTimeRange] = useState<[number, number]>([1000, 1650]);
  const [mapStyle, setMapStyle] = useState<MapStyle>('dark');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('map');

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
    <div className="w-screen h-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[400px] flex flex-col z-50 gradient-sidebar shadow-2xl border-r border-sidebar-border">
        {/* Header */}
        <header className="p-8 bg-gradient-to-b from-[hsl(245_50%_25%)] to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <Grape className="w-8 h-8 text-accent" />
            <span className="text-xs tracking-[3px] uppercase text-muted-foreground">
              The Vine of Wisdom
            </span>
          </div>
          <h1 className="text-3xl font-extrabold leading-tight">
            Rashi <span className="gradient-gold">Intellectual</span> History
          </h1>
        </header>

        {/* Search */}
        <div className="px-8 pb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
            <Input
              type="text"
              placeholder="Search the lineage..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-accent/20"
            />
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="px-8 pb-4">
          <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
            {[
              { id: 'map' as ViewMode, icon: MapPin, label: 'Map' },
              { id: 'timeline' as ViewMode, icon: Calendar, label: 'Timeline' },
              { id: 'network' as ViewMode, icon: Users, label: 'Network' },
            ].map(({ id, icon: Icon, label }) => (
              <Button
                key={id}
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(id)}
                className={cn(
                  "flex-1 gap-2 text-xs",
                  viewMode === id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Scholar List */}
        <div className="flex-1 px-8 overflow-hidden">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-accent mb-3">
            Scholars ({filteredScholars.length})
          </h3>
          <ScrollArea className="h-[calc(100%-2rem)]">
            <div className="flex flex-col gap-2 pr-4 pb-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl bg-white/5" />
                ))
              ) : (
                filteredScholars.map(scholar => (
                  <ScholarListItem
                    key={scholar.id}
                    scholar={scholar}
                    isSelected={selectedScholar?.id === scholar.id}
                    onClick={() => setSelectedScholar(scholar)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Timeline Slider Footer */}
        <footer className="p-6 bg-[hsl(245_50%_12%)] border-t border-sidebar-border">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-muted-foreground">{timeRange[0]} CE</span>
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

      {/* Main Map Area */}
      <main className="flex-1 relative">
        {viewMode === 'map' && (
          <LeafletMap
            scholars={filteredScholars}
            selectedScholar={selectedScholar}
            onSelectScholar={setSelectedScholar}
            mapStyle={mapStyle}
            timeRange={timeRange}
          />
        )}

        {viewMode === 'timeline' && (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Timeline view coming soon</p>
            </div>
          </div>
        )}

        {viewMode === 'network' && (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Network view coming soon</p>
            </div>
          </div>
        )}

        {/* Map Style Switcher */}
        {viewMode === 'map' && (
          <div className="absolute top-5 left-5 z-[1000] flex gap-2">
            {(['dark', 'light', 'terrain'] as MapStyle[]).map(style => (
              <Button
                key={style}
                variant="ghost"
                size="sm"
                onClick={() => setMapStyle(style)}
                className={cn(
                  "px-4 py-2 backdrop-blur-md border transition-all capitalize",
                  mapStyle === style
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-black/40 text-white/80 border-white/20 hover:bg-black/60 hover:text-white"
                )}
              >
                <Layers className="w-4 h-4 mr-2" />
                {style}
              </Button>
            ))}
          </div>
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
