import { useState } from 'react';
import { Search, Calendar, Users, MapPin, Filter, Info } from 'lucide-react';
import { scholars, historicalEvents, type Scholar } from '@/data/scholars';
import { TimelineView } from '@/components/TimelineView';
import { NetworkView } from '@/components/NetworkView';
import { MapView } from '@/components/MapView';
import { ScholarDetail } from '@/components/ScholarDetail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

type ViewType = 'timeline' | 'network' | 'map';

const Index = () => {
  const [view, setView] = useState<ViewType>('timeline');
  const [selectedScholar, setSelectedScholar] = useState<Scholar | null>(null);
  const [timeFilter, setTimeFilter] = useState<[number, number]>([1000, 1900]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyRashiCommentators, setShowOnlyRashiCommentators] = useState(false);
  const [showHistoricalContext, setShowHistoricalContext] = useState(true);

  const filteredScholars = scholars.filter(s => {
    const inTimeRange = s.birth >= timeFilter[0] && s.birth <= timeFilter[1];
    const matchesSearch = searchTerm === '' ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.hebrewName.includes(searchTerm);
    const matchesFilter = !showOnlyRashiCommentators || s.commentariesOnRashi;
    return inTimeRange && matchesSearch && matchesFilter;
  });

  const viewButtons: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'timeline', label: 'Timeline', icon: <Calendar className="w-4 h-4" /> },
    { id: 'network', label: 'Network', icon: <Users className="w-4 h-4" /> },
    { id: 'map', label: 'Geography', icon: <MapPin className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-parchment to-parchment-dark">
      {/* Header */}
      <header className="gradient-header border-b-4 border-primary shadow-header px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="mb-6">
            <span className="block font-display text-5xl md:text-6xl font-bold gradient-gold tracking-tight mb-2">
              Rashi's Legacy
            </span>
            <span className="block text-lg md:text-xl text-primary font-normal italic tracking-wide">
              Mapping Jewish Intellectual History Through Time & Space
            </span>
          </h1>

          {/* Search */}
          <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
            <Input
              type="text"
              placeholder="Search scholars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-parchment/90 border-2 border-secondary text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
            />
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="bg-foreground/5 border-b-2 border-primary/30 px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6">
          {/* View Toggles */}
          <div className="flex bg-card rounded-lg p-1 shadow-card">
            {viewButtons.map(btn => (
              <Button
                key={btn.id}
                variant="ghost"
                className={cn(
                  "flex items-center gap-2 px-6 py-2 font-semibold transition-all",
                  view === btn.id
                    ? "gradient-button text-primary-foreground shadow-elevated"
                    : "text-sepia hover:bg-primary/10 hover:text-secondary"
                )}
                onClick={() => setView(btn.id)}
              >
                {btn.icon}
                {btn.label}
              </Button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-brown-dark">
              <Checkbox
                checked={showOnlyRashiCommentators}
                onCheckedChange={(checked) => setShowOnlyRashiCommentators(checked as boolean)}
                className="border-secondary data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
              />
              <Filter className="w-4 h-4 text-secondary" />
              Show only Rashi commentators
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-brown-dark">
              <Checkbox
                checked={showHistoricalContext}
                onCheckedChange={(checked) => setShowHistoricalContext(checked as boolean)}
                className="border-secondary data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
              />
              <Info className="w-4 h-4 text-secondary" />
              Show historical events
            </label>

            {/* Time Range Slider */}
            <div className="flex flex-col gap-2 min-w-[200px]">
              <span className="text-sm font-semibold text-brown-dark">
                Time Range: {timeFilter[0]} – {timeFilter[1]}
              </span>
              <div className="flex gap-2">
                <Slider
                  value={[timeFilter[0]]}
                  min={1000}
                  max={1900}
                  step={10}
                  onValueChange={([val]) => setTimeFilter([val, timeFilter[1]])}
                  className="flex-1"
                />
                <Slider
                  value={[timeFilter[1]]}
                  min={1000}
                  max={1900}
                  step={10}
                  onValueChange={([val]) => setTimeFilter([timeFilter[0], val])}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto p-8">
        <div className={cn(
          "grid gap-8",
          selectedScholar ? "grid-cols-1 lg:grid-cols-[1fr_400px]" : "grid-cols-1"
        )}>
          {/* Visualization Area */}
          <div className="bg-card rounded-xl p-8 shadow-card min-h-[600px] animate-fade-in">
            {view === 'timeline' && (
              <TimelineView
                scholars={filteredScholars}
                selectedScholar={selectedScholar}
                onSelectScholar={setSelectedScholar}
                showHistoricalContext={showHistoricalContext}
                historicalEvents={historicalEvents}
                timeFilter={timeFilter}
              />
            )}
            {view === 'network' && (
              <NetworkView
                scholars={filteredScholars}
                selectedScholar={selectedScholar}
                onSelectScholar={setSelectedScholar}
              />
            )}
            {view === 'map' && (
              <MapView
                scholars={filteredScholars}
                selectedScholar={selectedScholar}
                onSelectScholar={setSelectedScholar}
              />
            )}
          </div>

          {/* Scholar Detail Panel */}
          {selectedScholar && (
            <ScholarDetail
              scholar={selectedScholar}
              onClose={() => setSelectedScholar(null)}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
