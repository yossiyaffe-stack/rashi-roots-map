import { useMemo } from 'react';
import { Circle, X, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCircleFilter, isPointInCircle } from '@/contexts/CircleFilterContext';
import type { DbScholar } from '@/hooks/useScholars';
import { cn } from '@/lib/utils';

interface CircleFilterPanelProps {
  scholars: DbScholar[];
  timeRange: [number, number];
  onSelectScholar: (scholar: DbScholar) => void;
  selectedScholar: DbScholar | null;
}

export function CircleFilterPanel({ 
  scholars, 
  timeRange, 
  onSelectScholar,
  selectedScholar 
}: CircleFilterPanelProps) {
  const { circleFilter, clearCircleFilter, isDrawingCircle, setIsDrawingCircle } = useCircleFilter();

  // Filter scholars by circle and time
  const filteredScholars = useMemo(() => {
    if (!circleFilter) return [];
    
    return scholars.filter(scholar => {
      // Check time range
      const inTimeRange = !scholar.birth_year || 
        (scholar.birth_year >= timeRange[0] && scholar.birth_year <= timeRange[1]);
      if (!inTimeRange) return false;
      
      // Check location
      if (scholar.latitude && scholar.longitude) {
        return isPointInCircle(
          scholar.latitude,
          scholar.longitude,
          circleFilter.center[0],
          circleFilter.center[1],
          circleFilter.radius
        );
      }
      return false;
    });
  }, [scholars, circleFilter, timeRange]);

  const radiusKm = circleFilter ? (circleFilter.radius / 1000).toFixed(0) : 0;

  if (!circleFilter && !isDrawingCircle) {
    return (
      <div className="absolute bottom-24 right-4 z-[1000]">
        <Button
          onClick={() => setIsDrawingCircle(true)}
          className="bg-sidebar/95 backdrop-blur-md border border-white/20 text-foreground hover:bg-white/10"
        >
          <Circle className="w-4 h-4 mr-2" />
          Draw Circle Filter
        </Button>
      </div>
    );
  }

  if (isDrawingCircle && !circleFilter) {
    return (
      <div className="absolute bottom-24 right-4 z-[1000]">
        <div className="bg-sidebar/95 backdrop-blur-md border border-accent/50 rounded-lg p-4 shadow-xl">
          <div className="flex items-center gap-2 text-accent mb-2">
            <Circle className="w-4 h-4" />
            <span className="font-medium">Drawing Mode</span>
          </div>
          <p className="text-xs text-white/60 mb-3">
            Click with right mouse button and drag to draw a circle
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsDrawingCircle(false)}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-24 right-4 z-[1000] w-72">
      <div className="bg-sidebar/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-accent" />
            <span className="text-xs uppercase tracking-widest text-accent font-bold">
              Area Filter
            </span>
          </div>
          <button
            onClick={clearCircleFilter}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Stats */}
        <div className="p-3 border-b border-white/10 bg-white/5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-white/60">
              <MapPin className="w-3.5 h-3.5" />
              <span>Radius: {radiusKm} km</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeRange[0]}–{timeRange[1]}</span>
            </div>
          </div>
        </div>

        {/* Scholar List */}
        <div className="p-2">
          <div className="text-xs text-white/50 px-2 py-1 mb-1">
            {filteredScholars.length} scholar{filteredScholars.length !== 1 ? 's' : ''} found
          </div>
          <ScrollArea className="max-h-60">
            <div className="space-y-1">
              {filteredScholars.map(scholar => (
                <button
                  key={scholar.id}
                  onClick={() => onSelectScholar(scholar)}
                  className={cn(
                    "w-full p-2 rounded-lg text-left transition-all",
                    selectedScholar?.id === scholar.id
                      ? "bg-accent/20 border border-accent"
                      : "hover:bg-white/10 border border-transparent"
                  )}
                >
                  <div className="font-medium text-sm truncate">{scholar.name}</div>
                  <div className="text-xs text-white/50 flex items-center gap-1.5">
                    <span>{scholar.birth_year || '?'}–{scholar.death_year || '?'}</span>
                    {scholar.hebrew_name && (
                      <>
                        <span className="text-white/30">•</span>
                        <span className="font-hebrew">{scholar.hebrew_name}</span>
                      </>
                    )}
                  </div>
                </button>
              ))}
              {filteredScholars.length === 0 && (
                <div className="text-center text-white/40 text-sm py-4">
                  No scholars in this area
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Actions */}
        <div className="p-2 border-t border-white/10">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsDrawingCircle(true)}
            className="w-full"
          >
            <Circle className="w-3.5 h-3.5 mr-2" />
            Redraw Circle
          </Button>
        </div>
      </div>
    </div>
  );
}
