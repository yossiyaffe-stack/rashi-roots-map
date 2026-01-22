import { Route, ChevronLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { LOCATION_REASON_CONFIG, type LocationReason } from '@/hooks/useScholars';
import { Checkbox } from '@/components/ui/checkbox';

interface ScholarJourneysPanelProps {
  showJourneyMarkers: boolean;
  onShowJourneyMarkersChange: (show: boolean) => void;
  journeyReasonFilter: LocationReason[];
  onJourneyReasonFilterChange: (reasons: LocationReason[]) => void;
  onClose?: () => void;
}

const ALL_REASONS: LocationReason[] = ['birth', 'study', 'rabbinate', 'exile', 'refuge', 'travel', 'death'];

export function ScholarJourneysPanel({
  showJourneyMarkers,
  onShowJourneyMarkersChange,
  journeyReasonFilter,
  onJourneyReasonFilterChange,
  onClose,
}: ScholarJourneysPanelProps) {
  const toggleReason = (reason: LocationReason) => {
    if (journeyReasonFilter.includes(reason)) {
      onJourneyReasonFilterChange(journeyReasonFilter.filter(r => r !== reason));
    } else {
      onJourneyReasonFilterChange([...journeyReasonFilter, reason]);
    }
  };

  return (
    <div className="flex flex-col h-full w-[280px]">
      {/* Header */}
      <div className="p-4 border-b border-white/10 shrink-0">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-accent font-bold hover:text-accent/80 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <Route className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest">Scholar Journeys</span>
        </button>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Description */}
          <p className="text-xs text-muted-foreground">
            Visualize the life journeys of medieval scholars, showing their movements through birth, study, rabbinate positions, exile, and death.
          </p>

          {/* Show Journey Markers Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="show-journey-markers" className="text-sm text-foreground/80 cursor-pointer">
              Show Journey Markers
            </Label>
            <Switch
              id="show-journey-markers"
              checked={showJourneyMarkers}
              onCheckedChange={onShowJourneyMarkersChange}
            />
          </div>

          {/* Journey Reason Filters */}
          {showJourneyMarkers && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <Label className="text-xs text-muted-foreground/70 uppercase tracking-wide">
                Filter by Life Event
              </Label>
              <div className="space-y-1.5">
                {ALL_REASONS.map(reason => {
                  const config = LOCATION_REASON_CONFIG[reason];
                  const isChecked = journeyReasonFilter.length === 0 || journeyReasonFilter.includes(reason);
                  
                  return (
                    <label
                      key={reason}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all",
                        "hover:bg-white/5",
                        isChecked && journeyReasonFilter.length > 0 && config.bgColor
                      )}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleReason(reason)}
                        className="border-white/30 h-4 w-4"
                      />
                      <span className="text-lg">{config.icon}</span>
                      <span className={cn(
                        "text-sm flex-1",
                        isChecked && journeyReasonFilter.length > 0 ? config.color : "text-muted-foreground"
                      )}>
                        {config.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="pt-3 border-t border-white/10 text-xs text-muted-foreground/60">
            <p>Click on a scholar marker to see their detailed journey with animated route playback.</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
