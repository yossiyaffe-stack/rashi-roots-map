import { useState } from 'react';
import { TimelineView } from '@/components/TimelineView';
import { useScholars, useHistoricalEvents, type DbScholar } from '@/hooks/useScholars';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const Timeline = () => {
  const [selectedScholar, setSelectedScholar] = useState<DbScholar | null>(null);
  const [timeRange, setTimeRange] = useState<[number, number]>([1000, 1650]);
  const [showSecularHistory, setShowSecularHistory] = useState(false);

  const { data: scholars = [], isLoading: scholarsLoading } = useScholars();
  const { data: historicalEvents = [], isLoading: eventsLoading } = useHistoricalEvents();

  const filteredScholars = scholars.filter(s => {
    if (!s.birth_year) return true;
    return s.birth_year >= timeRange[0] && s.birth_year <= timeRange[1];
  });

  // Filter historical events by category
  const filteredEvents = historicalEvents.filter(e => {
    const eventCategory = (e as any).category || 'jewish';
    if (eventCategory === 'jewish') return true;
    return showSecularHistory;
  });

  const isLoading = scholarsLoading || eventsLoading;

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <Skeleton className="w-[80%] h-[80%] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Timeline Header */}
      <header className="p-4 border-b border-border bg-card">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Scholar Timeline</h1>
            
            {/* Secular History Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSecularHistory(false)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all",
                  !showSecularHistory 
                    ? "bg-primary/20 text-primary border border-primary/30" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <BookOpen className="w-4 h-4" />
                Jewish History
              </button>
              <button
                onClick={() => setShowSecularHistory(true)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all",
                  showSecularHistory 
                    ? "bg-blue-500/20 text-blue-500 border border-blue-500/30" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Globe className="w-4 h-4" />
                + Secular History
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <span className="text-sm text-muted-foreground w-20">{timeRange[0]} CE</span>
            <Slider
              value={timeRange}
              min={900}
              max={1900}
              step={10}
              onValueChange={(val) => setTimeRange(val as [number, number])}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-20 text-right">{timeRange[1]} CE</span>
          </div>
        </div>
      </header>

      {/* Timeline Content */}
      <div className="flex-1 overflow-hidden">
        <TimelineView
          scholars={filteredScholars}
          selectedScholar={selectedScholar}
          onSelectScholar={setSelectedScholar}
          historicalEvents={filteredEvents}
          timeRange={timeRange}
        />
      </div>
    </div>
  );
};

export default Timeline;
