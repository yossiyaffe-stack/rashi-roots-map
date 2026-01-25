import { useState } from 'react';
import { BookOpen, Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  JEWISH_PERIODS,
  SECULAR_PERIODS,
  type PeriodOption,
  type PeriodMode,
} from '@/constants/filterOptions';

interface PeriodFilterProps {
  selectedPeriods: string[];
  onPeriodsChange: (periods: string[]) => void;
  onTimeRangeChange?: (range: [number, number]) => void;
  mode: PeriodMode;
  onModeChange: (mode: PeriodMode) => void;
}

const formatYear = (year: number | null): string => {
  if (year === null) return 'Present';
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
};

export const PeriodFilter = ({
  selectedPeriods,
  onPeriodsChange,
  onTimeRangeChange,
  mode,
  onModeChange,
}: PeriodFilterProps) => {
  const periods = mode === 'jewish' ? JEWISH_PERIODS : SECULAR_PERIODS;

  const togglePeriod = (periodName: string, period: PeriodOption) => {
    const isSelected = selectedPeriods.includes(periodName);
    let newSelected: string[];
    
    if (isSelected) {
      newSelected = selectedPeriods.filter((p) => p !== periodName);
    } else {
      newSelected = [...selectedPeriods, periodName];
    }
    
    onPeriodsChange(newSelected);

    // Calculate combined time range from all selected periods
    if (onTimeRangeChange && newSelected.length > 0) {
      const selectedPeriodObjects = periods.filter((p) =>
        newSelected.includes(p.name)
      );
      const minYear = Math.min(...selectedPeriodObjects.map((p) => p.startYear));
      const maxYear = Math.max(
        ...selectedPeriodObjects.map((p) => p.endYear ?? new Date().getFullYear())
      );
      onTimeRangeChange([minYear, maxYear]);
    }
  };

  const selectAll = () => {
    const allNames = periods.map((p) => p.name);
    onPeriodsChange(allNames);
    if (onTimeRangeChange) {
      const minYear = Math.min(...periods.map((p) => p.startYear));
      const maxYear = Math.max(
        ...periods.map((p) => p.endYear ?? new Date().getFullYear())
      );
      onTimeRangeChange([minYear, maxYear]);
    }
  };

  const clearAll = () => {
    onPeriodsChange([]);
  };

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onModeChange('jewish')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all flex-1 justify-center',
            mode === 'jewish'
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          <BookOpen className="w-4 h-4" />
          Jewish
        </button>
        <button
          onClick={() => onModeChange('secular')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all flex-1 justify-center',
            mode === 'secular'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          <Globe className="w-4 h-4" />
          Secular
        </button>
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={selectAll}
          className="text-primary hover:underline"
        >
          Select All
        </button>
        <span className="text-muted-foreground">|</span>
        <button
          onClick={clearAll}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear All
        </button>
        <span className="ml-auto text-muted-foreground">
          {selectedPeriods.length} selected
        </span>
      </div>

      {/* Period List */}
      <ScrollArea className="h-[280px]">
        <div className="space-y-1 pr-3">
          {periods.map((period) => {
            const isSelected = selectedPeriods.includes(period.name);
            return (
              <button
                key={period.name}
                onClick={() => togglePeriod(period.name, period)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all',
                  isSelected
                    ? mode === 'jewish'
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-card hover:bg-muted border border-border'
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center',
                      isSelected
                        ? mode === 'jewish'
                          ? 'bg-primary border-primary'
                          : 'bg-blue-500 border-blue-500'
                        : 'border-muted-foreground/50'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className="font-medium">{period.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatYear(period.startYear)} – {formatYear(period.endYear)}
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
