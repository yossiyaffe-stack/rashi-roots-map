import { Calendar } from 'lucide-react';
import type { DbHistoricalEvent } from '@/hooks/useScholars';
import { cn } from '@/lib/utils';

interface HistoricalEventsListProps {
  events: DbHistoricalEvent[];
  timeRange: [number, number];
}

export function HistoricalEventsList({ events, timeRange }: HistoricalEventsListProps) {
  const visibleEvents = events.filter(
    e => e.year >= timeRange[0] && e.year <= timeRange[1]
  );

  const getEventColor = (importance: DbHistoricalEvent['importance']) => {
    switch (importance) {
      case 'critical':
        return 'border-l-rose-500 bg-rose-500/10';
      case 'major':
        return 'border-l-orange-500 bg-orange-500/10';
      case 'foundational':
        return 'border-l-amber-500 bg-amber-500/10';
      case 'scholarly':
        return 'border-l-green-500 bg-green-500/10';
      default:
        return 'border-l-muted bg-muted/10';
    }
  };

  if (visibleEvents.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">
        No events in selected time range
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-bold">
        <Calendar className="w-3.5 h-3.5" />
        Historical Events
      </div>
      <div className="space-y-2">
        {visibleEvents.slice(0, 5).map((event) => (
          <div
            key={event.id}
            className={cn(
              "p-2 border-l-2 rounded-r text-xs",
              getEventColor(event.importance)
            )}
          >
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-accent">{event.year}</span>
              <span className="text-foreground font-medium">{event.name}</span>
            </div>
          </div>
        ))}
        {visibleEvents.length > 5 && (
          <div className="text-xs text-muted-foreground">
            +{visibleEvents.length - 5} more events
          </div>
        )}
      </div>
    </div>
  );
}
