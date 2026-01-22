import { useState } from 'react';
import { Calendar, BookOpen } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { DbHistoricalEvent } from '@/hooks/useScholars';

interface HistoricalEventsListProps {
  events: DbHistoricalEvent[];
  timeRange: [number, number];
}

type ViewMode = 'events' | 'context';

const IMPORTANCE_ORDER = ['critical', 'major', 'foundational', 'scholarly'] as const;

const IMPORTANCE_LABELS: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'text-red-400' },
  major: { label: 'Major', color: 'text-amber-400' },
  foundational: { label: 'Foundational', color: 'text-blue-400' },
  scholarly: { label: 'Scholarly', color: 'text-violet-400' },
};

export function HistoricalEventsList({ events, timeRange }: HistoricalEventsListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('events');

  const filteredEvents = events.filter(
    (e) => e.year >= timeRange[0] && e.year <= timeRange[1]
  );

  if (filteredEvents.length === 0) return null;

  // Group events by importance for context view
  const groupedEvents = IMPORTANCE_ORDER.reduce((acc, importance) => {
    acc[importance] = filteredEvents.filter(e => e.importance === importance);
    return acc;
  }, {} as Record<string, DbHistoricalEvent[]>);

  return (
    <div className="space-y-3">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-bold">
          {viewMode === 'events' ? (
            <Calendar className="w-3.5 h-3.5" />
          ) : (
            <BookOpen className="w-3.5 h-3.5" />
          )}
          {viewMode === 'events' ? 'Events' : 'Context'}
        </div>
        
        {/* Toggle buttons */}
        <div className="flex rounded-md border border-white/10 overflow-hidden">
          <button
            onClick={() => setViewMode('events')}
            className={cn(
              "px-2 py-1 text-[10px] transition-colors",
              viewMode === 'events' 
                ? "bg-accent text-accent-foreground" 
                : "bg-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode('context')}
            className={cn(
              "px-2 py-1 text-[10px] transition-colors",
              viewMode === 'context' 
                ? "bg-accent text-accent-foreground" 
                : "bg-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            By Type
          </button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="h-40">
        {viewMode === 'events' ? (
          // Timeline view - simple chronological list
          <div className="space-y-2 pr-2">
            {filteredEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-2">
                <span className="text-xs text-accent font-medium shrink-0 w-10">{event.year}</span>
                <span className="text-xs text-muted-foreground leading-tight">{event.name}</span>
              </div>
            ))}
          </div>
        ) : (
          // Context view - grouped by importance
          <div className="space-y-3 pr-2">
            {IMPORTANCE_ORDER.map((importance) => {
              const eventsInGroup = groupedEvents[importance];
              if (!eventsInGroup || eventsInGroup.length === 0) return null;
              
              const { label, color } = IMPORTANCE_LABELS[importance];
              
              return (
                <div key={importance} className="space-y-1.5">
                  <div className={cn("text-[10px] uppercase tracking-wider font-bold", color)}>
                    {label} ({eventsInGroup.length})
                  </div>
                  {eventsInGroup.map((event) => (
                    <div key={event.id} className="pl-2 border-l border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/40">{event.year}</span>
                        <span className="text-xs text-foreground">{event.name}</span>
                      </div>
                      {event.description && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                          {event.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
