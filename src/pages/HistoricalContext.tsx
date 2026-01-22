import { useState } from 'react';
import { Calendar, BookOpen, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useHistoricalEvents } from '@/hooks/useScholars';

type ViewMode = 'timeline' | 'importance' | 'location';

const IMPORTANCE_ORDER = ['critical', 'major', 'foundational', 'scholarly'] as const;

const IMPORTANCE_STYLES: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
  critical: { label: 'Critical', bgColor: 'bg-red-500/20', textColor: 'text-red-400', borderColor: 'border-red-500/50' },
  major: { label: 'Major', bgColor: 'bg-amber-500/20', textColor: 'text-amber-400', borderColor: 'border-amber-500/50' },
  foundational: { label: 'Foundational', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400', borderColor: 'border-blue-500/50' },
  scholarly: { label: 'Scholarly', bgColor: 'bg-violet-500/20', textColor: 'text-violet-400', borderColor: 'border-violet-500/50' },
};

export default function HistoricalContext() {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [timeRange, setTimeRange] = useState<[number, number]>([1000, 1800]);
  const [timelineExpanded, setTimelineExpanded] = useState(true);

  const { data: events = [], isLoading } = useHistoricalEvents();

  const filteredEvents = events.filter(
    (e) => e.year >= timeRange[0] && e.year <= timeRange[1]
  );

  // Group events by importance
  const groupedByImportance = IMPORTANCE_ORDER.reduce((acc, importance) => {
    acc[importance] = filteredEvents.filter(e => e.importance === importance);
    return acc;
  }, {} as Record<string, typeof events>);

  // Group events by location (if available)
  const groupedByLocation = filteredEvents.reduce((acc, event) => {
    const location = event.latitude && event.longitude ? 'With Location' : 'No Location';
    if (!acc[location]) acc[location] = [];
    acc[location].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <header className="p-6 border-b border-white/10 bg-sidebar/50">
        <h1 className="text-2xl font-bold text-foreground mb-2">Historical Context</h1>
        <p className="text-sm text-muted-foreground">
          Explore significant events that shaped medieval Jewish scholarship ({filteredEvents.length} events)
        </p>
      </header>

      {/* View Mode Tabs */}
      <div className="p-4 border-b border-white/10 flex gap-2">
        <button
          onClick={() => setViewMode('timeline')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            viewMode === 'timeline'
              ? "bg-accent text-accent-foreground"
              : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          )}
        >
          <Calendar className="w-4 h-4" />
          Timeline
        </button>
        <button
          onClick={() => setViewMode('importance')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            viewMode === 'importance'
              ? "bg-accent text-accent-foreground"
              : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          )}
        >
          <BookOpen className="w-4 h-4" />
          By Importance
        </button>
        <button
          onClick={() => setViewMode('location')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            viewMode === 'location'
              ? "bg-accent text-accent-foreground"
              : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          )}
        >
          <MapPin className="w-4 h-4" />
          By Location
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex">
        <ScrollArea className="flex-1 p-6">
          {isLoading ? (
            <div className="text-muted-foreground">Loading events...</div>
          ) : viewMode === 'timeline' ? (
            // Timeline View
            <div className="space-y-4 max-w-3xl">
              {filteredEvents.map((event) => {
                const style = IMPORTANCE_STYLES[event.importance] || IMPORTANCE_STYLES.scholarly;
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "p-4 rounded-lg border-l-4 bg-white/5",
                      style.borderColor
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-lg font-bold text-accent">{event.year}</span>
                          <span className={cn("text-xs uppercase tracking-wider font-semibold", style.textColor)}>
                            {style.label}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-foreground mb-1">{event.name}</h3>
                        {event.description && (
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        )}
                      </div>
                      {event.latitude && event.longitude && (
                        <MapPin className="w-4 h-4 text-accent/50 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'importance' ? (
            // Grouped by Importance
            <div className="space-y-8 max-w-3xl">
              {IMPORTANCE_ORDER.map((importance) => {
                const eventsInGroup = groupedByImportance[importance];
                if (!eventsInGroup || eventsInGroup.length === 0) return null;
                const style = IMPORTANCE_STYLES[importance];

                return (
                  <div key={importance}>
                    <h2 className={cn("text-lg font-bold mb-4 flex items-center gap-2", style.textColor)}>
                      <div className={cn("w-3 h-3 rounded-full", style.bgColor, "border", style.borderColor)} />
                      {style.label} Events ({eventsInGroup.length})
                    </h2>
                    <div className="space-y-3 pl-5 border-l border-white/10">
                      {eventsInGroup.map((event) => (
                        <div key={event.id} className="group">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-accent w-12">{event.year}</span>
                            <span className="text-sm text-foreground group-hover:text-accent transition-colors">
                              {event.name}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-xs text-muted-foreground ml-15 mt-1 pl-15" style={{ marginLeft: '3.75rem' }}>
                              {event.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Grouped by Location
            <div className="space-y-8 max-w-3xl">
              {Object.entries(groupedByLocation).map(([location, locationEvents]) => (
                <div key={location}>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                    <MapPin className={cn("w-4 h-4", location === 'With Location' ? 'text-accent' : 'text-muted-foreground')} />
                    {location} ({locationEvents.length})
                  </h2>
                  <div className="grid gap-3">
                    {locationEvents.map((event) => {
                      const style = IMPORTANCE_STYLES[event.importance] || IMPORTANCE_STYLES.scholarly;
                      return (
                        <div
                          key={event.id}
                          className={cn("p-3 rounded-lg bg-white/5 border", style.borderColor)}
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-bold text-accent">{event.year}</span>
                            <span className={cn("text-xs", style.textColor)}>{style.label}</span>
                          </div>
                          <h3 className="text-sm font-medium text-foreground">{event.name}</h3>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Timeline Filter Footer */}
      <footer className="border-t border-white/10 bg-sidebar/50">
        <button
          onClick={() => setTimelineExpanded(!timelineExpanded)}
          className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            <span className="text-xs uppercase tracking-widest text-accent font-bold">Time Filter</span>
            <span className="text-xs text-muted-foreground">({timeRange[0]} – {timeRange[1]} CE)</span>
          </div>
          {timelineExpanded ? (
            <ChevronDown className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronUp className="w-4 h-4 text-white/40" />
          )}
        </button>

        <div className={cn(
          "transition-all duration-200 overflow-hidden",
          timelineExpanded ? "max-h-24 px-4 pb-4" : "max-h-0"
        )}>
          <div className="flex justify-between text-sm mb-2">
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
        </div>
      </footer>
    </div>
  );
}
