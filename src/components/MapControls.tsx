import { Settings2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { CityFilter } from '@/contexts/MapControlsContext';

interface MapControlsProps {
  showBoundaries: boolean;
  onShowBoundariesChange: (show: boolean) => void;
  showMigrations: boolean;
  onShowMigrationsChange: (show: boolean) => void;
  showConnections: boolean;
  onShowConnectionsChange: (show: boolean) => void;
  showPlaceNamesEnglish: boolean;
  onShowPlaceNamesEnglishChange: (show: boolean) => void;
  showPlaceNamesHebrew: boolean;
  onShowPlaceNamesHebrewChange: (show: boolean) => void;
  showScholarNamesEnglish: boolean;
  onShowScholarNamesEnglishChange: (show: boolean) => void;
  showScholarNamesHebrew: boolean;
  onShowScholarNamesHebrewChange: (show: boolean) => void;
  cityFilter: CityFilter;
  onCityFilterChange: (filter: CityFilter) => void;
  showOnlyScholarCities: boolean;
  onShowOnlyScholarCitiesChange: (show: boolean) => void;
}

const CITY_FILTER_OPTIONS: { value: CityFilter; label: string; description: string }[] = [
  { value: 'all', label: 'All Cities', description: 'Show all cities' },
  { value: 'major', label: 'Major Only', description: 'Importance ≥ 8' },
  { value: 'minor', label: 'Minor & Major', description: 'Importance ≥ 5' },
];

export function MapControls({
  showBoundaries,
  onShowBoundariesChange,
  showMigrations,
  onShowMigrationsChange,
  showConnections,
  onShowConnectionsChange,
  showPlaceNamesEnglish,
  onShowPlaceNamesEnglishChange,
  showPlaceNamesHebrew,
  onShowPlaceNamesHebrewChange,
  showScholarNamesEnglish,
  onShowScholarNamesEnglishChange,
  showScholarNamesHebrew,
  onShowScholarNamesHebrewChange,
  cityFilter,
  onCityFilterChange,
  showOnlyScholarCities,
  onShowOnlyScholarCitiesChange,
}: MapControlsProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      {/* Header with collapse toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full gap-2 text-xs uppercase tracking-widest text-accent font-bold hover:text-accent/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4" />
          <span>Map Controls</span>
        </div>
        {expanded ? (
          <ChevronLeft className="w-4 h-4 text-white/40" />
        ) : (
          <ChevronRight className="w-4 h-4 text-white/40" />
        )}
      </button>

      {/* Horizontal slide-out panel */}
      <div className={cn(
        "absolute left-full top-0 ml-2 z-50 transition-all duration-300 origin-left",
        expanded 
          ? "opacity-100 translate-x-0 scale-x-100" 
          : "opacity-0 -translate-x-4 scale-x-0 pointer-events-none"
      )}>
        <div className="bg-sidebar/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-3 min-w-[260px] max-w-[300px]">
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 pr-2">
              {/* Layers Section */}
              <div>
                <div className="text-sm font-semibold text-foreground/80 mb-3">
                  Layers
                </div>
                <div className="space-y-3">
                  {/* Show Kingdoms Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-boundaries-sidebar" className="text-sm text-muted-foreground cursor-pointer">
                      Show Kingdoms
                    </Label>
                    <Switch
                      id="show-boundaries-sidebar"
                      checked={showBoundaries}
                      onCheckedChange={onShowBoundariesChange}
                    />
                  </div>

                  {/* Show Migrations Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-migrations-sidebar" className="text-sm text-muted-foreground cursor-pointer">
                      Show Migrations
                    </Label>
                    <Switch
                      id="show-migrations-sidebar"
                      checked={showMigrations}
                      onCheckedChange={onShowMigrationsChange}
                    />
                  </div>

                  {/* Show Connections Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-connections-sidebar" className="text-sm text-muted-foreground cursor-pointer">
                      Show Connections
                    </Label>
                    <Switch
                      id="show-connections-sidebar"
                      checked={showConnections}
                      onCheckedChange={onShowConnectionsChange}
                    />
                  </div>
                </div>
              </div>

              {/* City Labels Section */}
              <div className="pt-3 border-t border-white/10">
                <div className="text-sm font-semibold text-foreground/80 mb-3">
                  City Labels
                </div>
                <div className="space-y-3">
                  {/* Show Only Scholar Cities Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-scholar-cities" className="text-sm text-muted-foreground cursor-pointer">
                      Scholar Cities Only
                    </Label>
                    <Switch
                      id="show-scholar-cities"
                      checked={showOnlyScholarCities}
                      onCheckedChange={onShowOnlyScholarCitiesChange}
                    />
                  </div>

                  {/* City Importance Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground/70 uppercase tracking-wide">
                      City Importance
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {CITY_FILTER_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => onCityFilterChange(option.value)}
                          className={cn(
                            "px-2 py-1 rounded text-[10px] uppercase tracking-wide transition-colors border",
                            cityFilter === option.value
                              ? 'bg-accent/20 border-accent/50 text-accent' 
                              : 'bg-transparent border-white/10 text-white/50 hover:border-white/30 hover:text-white/70'
                          )}
                          title={option.description}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Show Place Names English Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-place-english" className="text-sm text-muted-foreground cursor-pointer">
                      Places (English)
                    </Label>
                    <Switch
                      id="show-place-english"
                      checked={showPlaceNamesEnglish}
                      onCheckedChange={onShowPlaceNamesEnglishChange}
                    />
                  </div>

                  {/* Show Place Names Hebrew Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-place-hebrew" className="text-sm text-muted-foreground cursor-pointer">
                      Places (Hebrew)
                    </Label>
                    <Switch
                      id="show-place-hebrew"
                      checked={showPlaceNamesHebrew}
                      onCheckedChange={onShowPlaceNamesHebrewChange}
                    />
                  </div>
                </div>
              </div>

              {/* Scholar Labels Section */}
              <div className="pt-3 border-t border-white/10">
                <div className="text-sm font-semibold text-foreground/80 mb-3">
                  Scholar Labels
                </div>
                <div className="space-y-3">
                  {/* Show Scholar Names English Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-scholar-english" className="text-sm text-muted-foreground cursor-pointer">
                      Scholars (English)
                    </Label>
                    <Switch
                      id="show-scholar-english"
                      checked={showScholarNamesEnglish}
                      onCheckedChange={onShowScholarNamesEnglishChange}
                    />
                  </div>

                  {/* Show Scholar Names Hebrew Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-scholar-hebrew" className="text-sm text-muted-foreground cursor-pointer">
                      Scholars (Hebrew)
                    </Label>
                    <Switch
                      id="show-scholar-hebrew"
                      checked={showScholarNamesHebrew}
                      onCheckedChange={onShowScholarNamesHebrewChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
