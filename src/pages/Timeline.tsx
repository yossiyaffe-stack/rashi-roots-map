import { useState } from 'react';
import { TimelineView } from '@/components/TimelineView';
import { useScholars, useHistoricalEvents, type DbScholar } from '@/hooks/useScholars';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';

const Timeline = () => {
  const [selectedScholar, setSelectedScholar] = useState<DbScholar | null>(null);
  const [timeRange, setTimeRange] = useState<[number, number]>([1000, 1650]);

  const { data: scholars = [], isLoading: scholarsLoading } = useScholars();
  const { data: historicalEvents = [], isLoading: eventsLoading } = useHistoricalEvents();

  const filteredScholars = scholars.filter(s => {
    if (!s.birth_year) return true;
    return s.birth_year >= timeRange[0] && s.birth_year <= timeRange[1];
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
          <h1 className="text-2xl font-bold mb-4">Scholar Timeline</h1>
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
          historicalEvents={historicalEvents}
          timeRange={timeRange}
        />
      </div>
    </div>
  );
};

export default Timeline;
