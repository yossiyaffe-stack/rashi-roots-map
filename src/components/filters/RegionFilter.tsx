import { useState } from 'react';
import { BookOpen, Globe, Check, MapPin, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  RABBINIC_REGIONS,
  SECULAR_REGIONS,
  type RegionOption,
  type RegionMode,
} from '@/constants/filterOptions';

interface RegionFilterProps {
  selectedRegions: string[];
  onRegionsChange: (regions: string[]) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number } | null) => void;
  mode: RegionMode;
  onModeChange: (mode: RegionMode) => void;
}

export const RegionFilter = ({
  selectedRegions,
  onRegionsChange,
  onBoundsChange,
  mode,
  onModeChange,
}: RegionFilterProps) => {
  const regions = mode === 'rabbinic' ? RABBINIC_REGIONS : SECULAR_REGIONS;

  const toggleRegion = (regionId: string, region: RegionOption) => {
    const isSelected = selectedRegions.includes(regionId);
    let newSelected: string[];
    
    if (isSelected) {
      newSelected = selectedRegions.filter((r) => r !== regionId);
    } else {
      newSelected = [...selectedRegions, regionId];
    }
    
    onRegionsChange(newSelected);

    // Calculate combined bounding box from all selected regions
    if (onBoundsChange) {
      if (newSelected.length === 0) {
        onBoundsChange(null);
      } else {
        const selectedRegionObjects = regions.filter((r) =>
          newSelected.includes(r.id)
        );
        const boundsWithData = selectedRegionObjects.filter((r) => r.bounds);
        if (boundsWithData.length > 0) {
          const combinedBounds = {
            north: Math.max(...boundsWithData.map((r) => r.bounds!.north)),
            south: Math.min(...boundsWithData.map((r) => r.bounds!.south)),
            east: Math.max(...boundsWithData.map((r) => r.bounds!.east)),
            west: Math.min(...boundsWithData.map((r) => r.bounds!.west)),
          };
          onBoundsChange(combinedBounds);
        }
      }
    }
  };

  const selectAll = () => {
    const allIds = regions.map((r) => r.id);
    onRegionsChange(allIds);
    if (onBoundsChange) {
      onBoundsChange(null); // Show all when all selected
    }
  };

  const clearAll = () => {
    onRegionsChange([]);
    if (onBoundsChange) {
      onBoundsChange(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onModeChange('rabbinic')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all flex-1 justify-center',
            mode === 'rabbinic'
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          <BookOpen className="w-4 h-4" />
          Rabbinic
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
          Geographic
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
          {selectedRegions.length} selected
        </span>
      </div>

      {/* Region List */}
      <ScrollArea className="h-[320px]">
        <div className="space-y-1 pr-3">
          {regions.map((region) => {
            const isSelected = selectedRegions.includes(region.id);
            return (
              <div
                key={region.id}
                className={cn(
                  'w-full flex items-start gap-2 px-3 py-2.5 rounded-md text-sm transition-all cursor-pointer',
                  isSelected
                    ? mode === 'rabbinic'
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-card hover:bg-muted border border-border'
                )}
                onClick={() => toggleRegion(region.id, region)}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center mt-0.5 flex-shrink-0',
                    isSelected
                      ? mode === 'rabbinic'
                        ? 'bg-primary border-primary'
                        : 'bg-blue-500 border-blue-500'
                      : 'border-muted-foreground/50'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-medium">{region.name}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="ml-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[250px]">
                        <p className="text-xs">{region.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {region.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
