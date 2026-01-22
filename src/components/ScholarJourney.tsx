import { MapPin } from 'lucide-react';
import { useScholarLocations, LOCATION_REASON_CONFIG, type LocationReason } from '@/hooks/useScholars';
import { cn } from '@/lib/utils';

interface ScholarJourneyProps {
  scholarId: string;
  onLocationClick?: (lat: number, lng: number) => void;
}

export function ScholarJourney({ scholarId, onLocationClick }: ScholarJourneyProps) {
  const { data: locations = [], isLoading } = useScholarLocations(scholarId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-16 bg-white/5 rounded-lg" />
        <div className="h-16 bg-white/5 rounded-lg" />
      </div>
    );
  }

  if (locations.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-3 flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        Life Journey ({locations.length} locations)
      </h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-accent/50 via-accent/30 to-accent/10" />
        
        <div className="space-y-3">
          {locations.map((location, index) => {
            const reason = (location.reason as LocationReason) || 'travel';
            const config = LOCATION_REASON_CONFIG[reason] || LOCATION_REASON_CONFIG.travel;
            
            return (
              <div
                key={location.id}
                onClick={() => onLocationClick?.(location.latitude, location.longitude)}
                className={cn(
                  "relative pl-10 pr-3 py-3 rounded-lg border transition-all cursor-pointer group",
                  "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                )}
              >
                {/* Timeline dot */}
                <div className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs",
                  config.bgColor
                )}>
                  {config.icon}
                </div>
                
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground group-hover:text-accent transition-colors">
                        {location.location_name}
                      </span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded uppercase font-medium",
                        config.bgColor, config.color
                      )}>
                        {config.label}
                      </span>
                    </div>
                    {location.historical_context && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {location.historical_context}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-accent font-medium">
                      {location.start_year || '?'}
                      {location.end_year && location.end_year !== location.start_year && (
                        <span className="text-muted-foreground"> – {location.end_year}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}