import { useState } from 'react';
import { Calendar, MapPin, X, ChevronLeft, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PeriodFilter } from './PeriodFilter';
import { RegionFilter } from './RegionFilter';
import type { PeriodMode, RegionMode } from '@/constants/filterOptions';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // Period filter props
  selectedPeriods: string[];
  onPeriodsChange: (periods: string[]) => void;
  periodMode: PeriodMode;
  onPeriodModeChange: (mode: PeriodMode) => void;
  onTimeRangeChange?: (range: [number, number]) => void;
  // Region filter props
  selectedRegions: string[];
  onRegionsChange: (regions: string[]) => void;
  regionMode: RegionMode;
  onRegionModeChange: (mode: RegionMode) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number } | null) => void;
  // Embedded mode (inside sidebar)
  isEmbedded?: boolean;
}

export const FilterPanel = ({
  isOpen,
  onClose,
  selectedPeriods,
  onPeriodsChange,
  periodMode,
  onPeriodModeChange,
  onTimeRangeChange,
  selectedRegions,
  onRegionsChange,
  regionMode,
  onRegionModeChange,
  onBoundsChange,
  isEmbedded = true,
}: FilterPanelProps) => {
  const [activeTab, setActiveTab] = useState<'period' | 'region'>('period');

  const totalActiveFilters = selectedPeriods.length + selectedRegions.length;

  const clearAllFilters = () => {
    onPeriodsChange([]);
    onRegionsChange([]);
    if (onBoundsChange) onBoundsChange(null);
  };

  if (!isOpen) return null;

  // Embedded mode - render directly without the wrapper
  if (isEmbedded) {
    return (
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'period' | 'region')} className="flex flex-col h-full">
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-white/10 bg-transparent h-auto p-0 shrink-0">
            <TabsTrigger
              value="period"
              className={cn(
                'flex items-center gap-1.5 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent',
                selectedPeriods.length > 0 && 'text-accent'
              )}
            >
              <Calendar className="w-4 h-4" />
              <span>Time Period</span>
              {selectedPeriods.length > 0 && (
                <span className="text-xs bg-accent/20 px-1.5 rounded-full">
                  {selectedPeriods.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="region"
              className={cn(
                'flex items-center gap-1.5 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent',
                selectedRegions.length > 0 && 'text-accent'
              )}
            >
              <MapPin className="w-4 h-4" />
              <span>Region</span>
              {selectedRegions.length > 0 && (
                <span className="text-xs bg-accent/20 px-1.5 rounded-full">
                  {selectedRegions.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="p-3 flex-1 overflow-hidden">
            <TabsContent value="period" className="mt-0 h-full">
              <PeriodFilter
                selectedPeriods={selectedPeriods}
                onPeriodsChange={onPeriodsChange}
                onTimeRangeChange={onTimeRangeChange}
                mode={periodMode}
                onModeChange={onPeriodModeChange}
              />
            </TabsContent>

            <TabsContent value="region" className="mt-0 h-full">
              <RegionFilter
                selectedRegions={selectedRegions}
                onRegionsChange={onRegionsChange}
                onBoundsChange={onBoundsChange}
                mode={regionMode}
                onModeChange={onRegionModeChange}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    );
  }

  // Floating panel mode (original)
  return (
    <div className="absolute left-full top-0 ml-2 z-50 w-80 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Filters</h3>
          {totalActiveFilters > 0 && (
            <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
              {totalActiveFilters}
            </span>
          )}
        </div>
        {totalActiveFilters > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'period' | 'region')}>
        <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-border bg-transparent h-auto p-0">
          <TabsTrigger
            value="period"
            className={cn(
              'flex items-center gap-1.5 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent',
              selectedPeriods.length > 0 && 'text-primary'
            )}
          >
            <Calendar className="w-4 h-4" />
            <span>Time Period</span>
            {selectedPeriods.length > 0 && (
              <span className="text-xs bg-primary/20 px-1.5 rounded-full">
                {selectedPeriods.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="region"
            className={cn(
              'flex items-center gap-1.5 py-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent',
              selectedRegions.length > 0 && 'text-primary'
            )}
          >
            <MapPin className="w-4 h-4" />
            <span>Region</span>
            {selectedRegions.length > 0 && (
              <span className="text-xs bg-primary/20 px-1.5 rounded-full">
                {selectedRegions.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="p-3">
          <TabsContent value="period" className="mt-0">
            <PeriodFilter
              selectedPeriods={selectedPeriods}
              onPeriodsChange={onPeriodsChange}
              onTimeRangeChange={onTimeRangeChange}
              mode={periodMode}
              onModeChange={onPeriodModeChange}
            />
          </TabsContent>

          <TabsContent value="region" className="mt-0">
            <RegionFilter
              selectedRegions={selectedRegions}
              onRegionsChange={onRegionsChange}
              onBoundsChange={onBoundsChange}
              mode={regionMode}
              onModeChange={onRegionModeChange}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
