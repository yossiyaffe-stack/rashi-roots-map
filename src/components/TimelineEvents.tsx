import { useMemo, useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, User, BookOpen, Globe } from 'lucide-react';
import type { DbHistoricalEvent, DbScholar } from '@/hooks/useScholars';
import { cn } from '@/lib/utils';
import type L from 'leaflet';

interface TimelineEventsProps {
  events: DbHistoricalEvent[];
  scholars?: DbScholar[];
  timeRange: [number, number];
  mapRef?: React.MutableRefObject<L.Map | null>;
  onSelectScholar?: (scholar: DbScholar) => void;
  showSecularHistory?: boolean;
  onToggleSecularHistory?: (show: boolean) => void;
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

export function TimelineEvents({ events, scholars = [], timeRange, mapRef, onSelectScholar, showSecularHistory = false, onToggleSecularHistory }: TimelineEventsProps) {
  const [selectedEvent, setSelectedEvent] = useState<DbHistoricalEvent | null>(null);
  const [selectedBirthScholar, setSelectedBirthScholar] = useState<DbScholar | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Create birth events from scholars
  const scholarBirthEvents = useMemo(() => {
    return scholars
      .filter(s => s.birth_year && s.latitude && s.longitude)
      .map(s => ({
        id: `birth-${s.id}`,
        year: s.birth_year!,
        name: `${s.name} born`,
        type: 'birth' as const,
        scholar: s,
      }));
  }, [scholars]);

  // Combine and sort all events, filtering by category
  const allTimelineItems = useMemo(() => {
    const historicalItems = events
      .filter(e => {
        // Filter by category - show jewish by default, include secular if toggle is on
        const eventCategory = (e as any).category || 'jewish';
        if (eventCategory === 'jewish') return true;
        return showSecularHistory;
      })
      .map(e => ({
        id: e.id,
        year: e.year,
        name: e.name,
        type: 'historical' as const,
        category: (e as any).category || 'jewish',
        event: e,
      }));
    
    const birthItems = scholarBirthEvents.map(b => ({
      id: b.id,
      year: b.year,
      name: b.name,
      type: 'birth' as const,
      category: 'jewish',
      scholar: b.scholar,
    }));
    
    return [...historicalItems, ...birthItems].sort((a, b) => a.year - b.year);
  }, [events, scholarBirthEvents, showSecularHistory]);

  const filteredItems = useMemo(() => {
    return allTimelineItems.filter(item => item.year >= timeRange[0] && item.year <= timeRange[1]);
  }, [allTimelineItems, timeRange]);

  // Calculate scroll position based on timeline filter position
  useEffect(() => {
    if (!scrollContainerRef.current || allTimelineItems.length === 0) return;

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
  }, [timeRange, allTimelineItems]);

  // Handle birth event click - fly to scholar location
  const handleBirthClick = (scholar: DbScholar) => {
    if (mapRef?.current && scholar.latitude && scholar.longitude) {
      mapRef.current.flyTo([scholar.latitude, scholar.longitude], 10, { duration: 1.5 });
    }
    if (onSelectScholar) {
      onSelectScholar(scholar);
    }
  };

  if (filteredItems.length === 0) {
    return (
      <div className="text-xs text-white/40 text-center py-2">
        No events in selected time range
      </div>
    );
  }

  return (
    <>
      {/* Category toggle */}
      {onToggleSecularHistory && (
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => onToggleSecularHistory(false)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all",
              !showSecularHistory 
                ? "bg-accent/20 text-accent border border-accent/30" 
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
            )}
          >
            <BookOpen className="w-3 h-3" />
            Jewish History
          </button>
          <button
            onClick={() => onToggleSecularHistory(true)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all",
              showSecularHistory 
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
            )}
          >
            <Globe className="w-3 h-3" />
            + Secular History
          </button>
        </div>
      )}
      
      <div
        ref={scrollContainerRef} 
        className="flex gap-2 pb-2 overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30"
      >
        {filteredItems.map((item) => {
          if (item.type === 'birth') {
            const scholar = item.scholar as DbScholar;
            return (
              <button
                key={item.id}
                onClick={() => handleBirthClick(scholar)}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-lg border transition-all",
                  "bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-500/50",
                  "text-left group"
                )}
              >
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-rose-400" />
                  <span className="text-xs font-medium text-white/80 group-hover:text-white">
                    {item.year}
                  </span>
                </div>
                <div className="text-[11px] text-rose-300/70 group-hover:text-rose-200 max-w-[150px] truncate">
                  {scholar.name} born
                </div>
              </button>
            );
          }
          
          // Historical event
          const event = item.event as DbHistoricalEvent;
          const config = IMPORTANCE_CONFIG[event.importance] || IMPORTANCE_CONFIG.scholarly;
          return (
            <button
              key={item.id}
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
