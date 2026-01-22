import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { LOCATION_REASON_CONFIG, type LocationReason } from '@/hooks/useScholars';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface LocationReasonFilterProps {
  selectedReasons: LocationReason[];
  onReasonsChange: (reasons: LocationReason[]) => void;
}

const ALL_REASONS: LocationReason[] = ['birth', 'study', 'rabbinate', 'exile', 'refuge', 'travel', 'death'];

export function LocationReasonFilter({ selectedReasons, onReasonsChange }: LocationReasonFilterProps) {
  const [open, setOpen] = useState(false);

  const toggleReason = (reason: LocationReason) => {
    if (selectedReasons.includes(reason)) {
      onReasonsChange(selectedReasons.filter(r => r !== reason));
    } else {
      onReasonsChange([...selectedReasons, reason]);
    }
  };

  const clearAll = () => {
    onReasonsChange([]);
  };

  const selectAll = () => {
    onReasonsChange([...ALL_REASONS]);
  };

  const hasFilters = selectedReasons.length > 0 && selectedReasons.length < ALL_REASONS.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 h-8",
            hasFilters && "border-accent text-accent"
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          Journey
          {hasFilters && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] bg-accent/20 text-accent">
              {selectedReasons.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-sidebar border-white/10" align="start">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-foreground">Filter by Life Events</h4>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        
        <div className="space-y-2">
          {ALL_REASONS.map(reason => {
            const config = LOCATION_REASON_CONFIG[reason];
            const isChecked = selectedReasons.length === 0 || selectedReasons.includes(reason);
            
            return (
              <label
                key={reason}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all",
                  "hover:bg-white/5",
                  isChecked && selectedReasons.length > 0 && config.bgColor
                )}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleReason(reason)}
                  className="border-white/30"
                />
                <span className="text-lg">{config.icon}</span>
                <span className={cn(
                  "text-sm flex-1",
                  isChecked && selectedReasons.length > 0 ? config.color : "text-muted-foreground"
                )}>
                  {config.label}
                </span>
              </label>
            );
          })}
        </div>
        
        <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={selectAll}
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={clearAll}
          >
            Clear All
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}