import { useState, useMemo } from 'react';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { LeafletMap } from '@/components/LeafletMap';
import { ScholarDetailPanel } from '@/components/ScholarDetailPanel';

import { useScholars, useRelationships, type DbScholar } from '@/hooks/useScholars';
import { cn } from '@/lib/utils';

const Index = () => {
  const [selectedScholar, setSelectedScholar] = useState<DbScholar | null>(null);
  const [timeRange, setTimeRange] = useState<[number, number]>([1000, 1650]);
  const [showConnections, setShowConnections] = useState(false);
  const [showMigrations, setShowMigrations] = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(true);

  const { data: scholars = [] } = useScholars();
  const { data: relationships = [] } = useRelationships();

  const filteredScholars = useMemo(() => {
    return scholars.filter(s => {
      const inTimeRange = !s.birth_year || 
        (s.birth_year >= timeRange[0] && s.birth_year <= timeRange[1]);
      return inTimeRange;
    });
  }, [scholars, timeRange]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Map Content */}
      <div className="flex-1 relative min-h-0">
        <LeafletMap
          scholars={filteredScholars}
          relationships={relationships}
          selectedScholar={selectedScholar}
          onSelectScholar={setSelectedScholar}
          timeRange={timeRange}
          showConnections={showConnections}
          onShowConnectionsChange={setShowConnections}
          showMigrations={showMigrations}
          onShowMigrationsChange={setShowMigrations}
        />

        {/* Scholar Detail Panel */}
        {selectedScholar && (
          <ScholarDetailPanel
            scholar={selectedScholar}
            onClose={() => setSelectedScholar(null)}
          />
        )}
      </div>

      {/* Timeline Footer - Bottom of Map */}
      <footer className="bg-sidebar border-t border-white/10 z-[1000]">
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
            <ChevronDown className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronUp className="w-4 h-4 text-white/40" />
          )}
        </button>
        
        <div className={cn(
          "transition-all duration-200 overflow-hidden",
          timelineExpanded ? "max-h-20 px-4 pb-4" : "max-h-0"
        )}>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/50 w-20">{timeRange[0]} CE</span>
            <Slider
              value={[timeRange[0], timeRange[1]]}
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
        </div>
      </footer>
    </div>
  );
};

export default Index;
