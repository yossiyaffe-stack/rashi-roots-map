import { Calendar } from 'lucide-react';
import type { DbHistoricalEvent } from '@/hooks/useScholars';

interface HistoricalEventsListProps {
  events: DbHistoricalEvent[];
  timeRange: [number, number];
}

export function HistoricalEventsList({ events, timeRange }: HistoricalEventsListProps) {
  const filteredEvents = events.filter(
    (e) => e.year >= timeRange[0] && e.year <= timeRange[1]
  );

  if (filteredEvents.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-bold">
        <Calendar className="w-3.5 h-3.5" />
        Historical Events
      </div>
      <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
        {filteredEvents.slice(0, 5).map((event) => (
          <div key={event.id} className="flex items-start gap-2">
            <span className="text-xs text-accent font-medium shrink-0">{event.year}</span>
            <span className="text-xs text-muted-foreground leading-tight">{event.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
