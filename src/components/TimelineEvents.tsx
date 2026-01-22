import { useMemo, useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import type { DbHistoricalEvent } from '@/hooks/useScholars';
import { cn } from '@/lib/utils';
import type L from 'leaflet';

interface TimelineEventsProps {
  events: DbHistoricalEvent[];
  timeRange: [number, number];
  mapRef?: React.MutableRefObject<L.Map | null>;
}

const IMPORTANCE_CONFIG = {
  critical: { color: 'bg-red-500', label: 'Critical' },
  major: { color: 'bg-amber-500', label: 'Major' },
  foundational: { color: 'bg-accent', label: 'Foundational' },
  scholarly: { color: 'bg-blue-500', label: 'Scholarly' },
};

// Timeline bounds matching the slider
const TIMELINE_MIN = 1000;
const TIMELINE_MAX = 1800;

export function TimelineEvents({ events, timeRange, mapRef }: TimelineEventsProps) {
  const [selectedEvent, setSelectedEvent] = useState<DbHistoricalEvent | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sort events by year for consistent positioning
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.year - b.year);
  }, [events]);

  const filteredEvents = useMemo(() => {
    return sortedEvents.filter(e => e.year >= timeRange[0] && e.year <= timeRange[1]);
  }, [sortedEvents, timeRange]);

  // Calculate scroll position based on timeline filter position
  useEffect(() => {
    if (!scrollContainerRef.current || sortedEvents.length === 0) return;

    const container = scrollContainerRef.current;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    const maxScroll = scrollWidth - clientWidth;

    if (maxScroll <= 0) return;

    // Calculate the center of the time range
    const timeCenter = (timeRange[0] + timeRange[1]) / 2;
    
    // Calculate the position as a ratio within the full timeline
    const ratio = (timeCenter - TIMELINE_MIN) / (TIMELINE_MAX - TIMELINE_MIN);
    
    // Scroll to the corresponding position
    const targetScroll = Math.max(0, Math.min(maxScroll, ratio * maxScroll));
    
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  }, [timeRange, sortedEvents]);

  if (filteredEvents.length === 0) {
    return (
      <div className="text-xs text-white/40 text-center py-2">
        No events in selected time range
      </div>
    );
  }

  return (
    <>
      <div 
        ref={scrollContainerRef} 
        className="flex gap-2 pb-2 overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30"
      >
        {filteredEvents.map((event) => {
          const config = IMPORTANCE_CONFIG[event.importance] || IMPORTANCE_CONFIG.scholarly;
          return (
            <button
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-lg border transition-all",
                "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20",
                "text-left group"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", config.color)} />
                <span className="text-xs font-medium text-white/80 group-hover:text-white">
                  {event.year}
                </span>
              </div>
              <div className="text-[11px] text-white/50 group-hover:text-white/70 max-w-[150px] truncate">
                {event.name}
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="bg-sidebar border-white/10">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              {selectedEvent && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[10px] uppercase",
                    IMPORTANCE_CONFIG[selectedEvent.importance]?.color || 'bg-blue-500',
                    "text-white border-none"
                  )}
                >
                  {selectedEvent.year} CE
                </Badge>
              )}
            </div>
            <DialogTitle className="text-lg text-foreground">
              {selectedEvent?.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-2">
              {selectedEvent?.description}
            </DialogDescription>
          </DialogHeader>
          
          {/* Show on map button if event has coordinates */}
          {selectedEvent?.latitude && selectedEvent?.longitude && mapRef && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-2"
              onClick={() => {
                if (mapRef.current && selectedEvent.latitude && selectedEvent.longitude) {
                  mapRef.current.flyTo([selectedEvent.latitude, selectedEvent.longitude], 8, { duration: 1.5 });
                  setSelectedEvent(null);
                }
              }}
            >
              <MapPin className="w-4 h-4" />
              Show on map
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
