import { TrendingUp, Calendar, MapPin, Printer, BookOpen, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useWorkLocations } from '@/hooks/useWorks';
import { cn } from '@/lib/utils';

interface WorkTemporalViewProps {
  workId: string;
  workTitle: string;
  yearWritten?: number | null;
}

const LOCATION_TYPE_CONFIG: Record<string, { label: string; icon: typeof MapPin; color: string }> = {
  composition: { label: 'Composed', icon: BookOpen, color: 'text-purple-400' },
  first_print: { label: 'First Print', icon: Printer, color: 'text-emerald-400' },
  reprint: { label: 'Reprint', icon: Printer, color: 'text-green-400' },
  manuscript_copy: { label: 'Manuscript', icon: BookOpen, color: 'text-amber-400' },
  translation: { label: 'Translation', icon: BookOpen, color: 'text-cyan-400' },
};

export function WorkTemporalView({ workId, workTitle, yearWritten }: WorkTemporalViewProps) {
  const { data: locations = [], isLoading, error } = useWorkLocations(workId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-lg">
        Error loading timeline data.
      </div>
    );
  }

  // Sort locations by year
  const sortedLocations = [...locations].sort((a, b) => (a.year || 0) - (b.year || 0));
  
  // Get earliest and latest events
  const yearsWithData = sortedLocations.filter(l => l.year).map(l => l.year as number);
  const earliestYear = yearWritten || Math.min(...yearsWithData, new Date().getFullYear());
  const latestYear = Math.max(...yearsWithData, new Date().getFullYear());
  const timeSpan = latestYear - earliestYear;

  // Group by century for summary
  const byCentury: Record<string, number> = {};
  sortedLocations.forEach(loc => {
    if (loc.year) {
      const century = Math.floor(loc.year / 100) + 1;
      const label = `${century}th c.`;
      byCentury[label] = (byCentury[label] || 0) + 1;
    }
  });

  if (sortedLocations.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-muted/20 rounded-lg text-center">
        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No timeline data available for this text.</p>
        <p className="text-xs mt-1">Geographic transmission history will appear here once recorded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {yearWritten && (
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            <Calendar className="w-3 h-3 mr-1" />
            Written c. {yearWritten}
          </Badge>
        )}
        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          <MapPin className="w-3 h-3 mr-1" />
          {sortedLocations.length} locations
        </Badge>
        {timeSpan > 0 && (
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <TrendingUp className="w-3 h-3 mr-1" />
            {timeSpan} year span
          </Badge>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Transmission Timeline
        </h4>
        
        <div className="relative pl-6 space-y-3">
          {/* Timeline line */}
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-white/10" />
          
          {sortedLocations.map((loc, index) => {
            const config = LOCATION_TYPE_CONFIG[loc.location_type] || { 
              label: loc.location_type, 
              icon: MapPin, 
              color: 'text-muted-foreground' 
            };
            const Icon = config.icon;
            const placeName = loc.place?.name_english || 'Unknown location';
            
            return (
              <div key={loc.id} className="relative flex gap-3">
                {/* Timeline dot */}
                <div className={cn(
                  "absolute -left-4 top-1.5 w-2 h-2 rounded-full ring-2 ring-background",
                  config.color.replace('text-', 'bg-')
                )} />
                
                <div className="flex-1 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-4 h-4", config.color)} />
                      <span className={cn("text-sm font-medium", config.color)}>
                        {config.label}
                      </span>
                    </div>
                    {loc.year && (
                      <span className="text-xs text-muted-foreground">
                        {loc.circa && 'c. '}{loc.year}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground mt-1">{placeName}</p>
                  {loc.printer_publisher && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Publisher: {loc.printer_publisher}
                    </p>
                  )}
                  {loc.notes && (
                    <p className="text-xs text-muted-foreground/70 mt-1 italic">{loc.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Century distribution */}
      {Object.keys(byCentury).length > 1 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Distribution by Century</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byCentury).map(([century, count]) => (
              <Badge key={century} variant="outline" className="text-xs">
                {century}: {count}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
