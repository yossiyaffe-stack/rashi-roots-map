import { Settings2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { CityFilter } from '@/contexts/MapControlsContext';
import { LOCATION_REASON_CONFIG, type LocationReason } from '@/hooks/useScholars';
import { Checkbox } from '@/components/ui/checkbox';

interface MapControlsPanelProps {
  showBoundaries: boolean;
  onShowBoundariesChange: (show: boolean) => void;
  showBoundaryShading: boolean;
  onShowBoundaryShadingChange: (show: boolean) => void;
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
  showJourneyMarkers: boolean;
  onShowJourneyMarkersChange: (show: boolean) => void;
  journeyReasonFilter: LocationReason[];
  onJourneyReasonFilterChange: (reasons: LocationReason[]) => void;
}

const CITY_FILTER_OPTIONS: { value: CityFilter; label: string; description: string }[] = [
  { value: 'all', label: 'All', description: 'Show all cities' },
  { value: 'major', label: 'Major', description: 'Importance ≥ 7' },
];

const ALL_REASONS: LocationReason[] = ['birth', 'study', 'rabbinate', 'exile', 'refuge', 'travel', 'death'];

export function MapControlsPanel({
  showBoundaries,
  onShowBoundariesChange,
  showBoundaryShading,
  onShowBoundaryShadingChange,
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
  showJourneyMarkers,
  onShowJourneyMarkersChange,
  journeyReasonFilter,
  onJourneyReasonFilterChange,
}: MapControlsPanelProps) {
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
        <div className="flex items-center gap-2 text-accent font-bold">
          <Settings2 className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest">Map Controls</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Layers Section */}
          <div>
            <div className="text-sm font-semibold text-foreground/80 mb-3">
              Layers
            </div>
            <div className="space-y-3">
              {/* Show Kingdoms Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="show-boundaries-panel" className="text-sm text-muted-foreground cursor-pointer">
                  Show Kingdoms
                </Label>
                <Switch
                  id="show-boundaries-panel"
                  checked={showBoundaries}
                  onCheckedChange={onShowBoundariesChange}
                />
              </div>

              {/* Show Boundary Shading Toggle - only visible when boundaries are on */}
              {showBoundaries && (
                <div className="flex items-center justify-between pl-4 border-l-2 border-accent/30">
                  <Label htmlFor="show-boundary-shading-panel" className="text-sm text-muted-foreground cursor-pointer">
                    Fill Shading
                  </Label>
                  <Switch
                    id="show-boundary-shading-panel"
                    checked={showBoundaryShading}
                    onCheckedChange={onShowBoundaryShadingChange}
                  />
                </div>
              )}

              {/* Show Migrations Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="show-migrations-panel" className="text-sm text-muted-foreground cursor-pointer">
                  Show Migrations
                </Label>
                <Switch
                  id="show-migrations-panel"
                  checked={showMigrations}
                  onCheckedChange={onShowMigrationsChange}
                />
              </div>

              {/* Show Connections Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="show-connections-panel" className="text-sm text-muted-foreground cursor-pointer">
                  Show Connections
                </Label>
                <Switch
                  id="show-connections-panel"
                  checked={showConnections}
                  onCheckedChange={onShowConnectionsChange}
                />
              </div>
            </div>
          </div>

          {/* Scholar Journeys Section */}
          <div className="pt-3 border-t border-white/10">
            <div className="text-sm font-semibold text-foreground/80 mb-3">
              Scholar Journeys
            </div>
            <div className="space-y-3">
              {/* Show Journey Markers Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="show-journey-markers-panel" className="text-sm text-muted-foreground cursor-pointer">
                  Show Journey Markers
                </Label>
                <Switch
                  id="show-journey-markers-panel"
                  checked={showJourneyMarkers}
                  onCheckedChange={onShowJourneyMarkersChange}
                />
              </div>

              {/* Journey Reason Filters */}
              {showJourneyMarkers && (
                <div className="space-y-2 pl-2 border-l-2 border-accent/30">
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
                            "flex items-center gap-2 p-1.5 rounded cursor-pointer transition-all",
                            "hover:bg-white/5",
                            isChecked && journeyReasonFilter.length > 0 && config.bgColor
                          )}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleReason(reason)}
                            className="border-white/30 h-3.5 w-3.5"
                          />
                          <span className="text-sm">{config.icon}</span>
                          <span className={cn(
                            "text-xs flex-1",
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
                <Label htmlFor="show-scholar-cities-panel" className="text-sm text-muted-foreground cursor-pointer">
                  Scholar Cities Only
                </Label>
                <Switch
                  id="show-scholar-cities-panel"
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
                <Label htmlFor="show-place-english-panel" className="text-sm text-muted-foreground cursor-pointer">
                  Places (English)
                </Label>
                <Switch
                  id="show-place-english-panel"
                  checked={showPlaceNamesEnglish}
                  onCheckedChange={onShowPlaceNamesEnglishChange}
                />
              </div>

              {/* Show Place Names Hebrew Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="show-place-hebrew-panel" className="text-sm text-muted-foreground cursor-pointer">
                  Places (Hebrew)
                </Label>
                <Switch
                  id="show-place-hebrew-panel"
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
                <Label htmlFor="show-scholar-english-panel" className="text-sm text-muted-foreground cursor-pointer">
                  Scholars (English)
                </Label>
                <Switch
                  id="show-scholar-english-panel"
                  checked={showScholarNamesEnglish}
                  onCheckedChange={onShowScholarNamesEnglishChange}
                />
              </div>

              {/* Show Scholar Names Hebrew Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="show-scholar-hebrew-panel" className="text-sm text-muted-foreground cursor-pointer">
                  Scholars (Hebrew)
                </Label>
                <Switch
                  id="show-scholar-hebrew-panel"
                  checked={showScholarNamesHebrew}
                  onCheckedChange={onShowScholarNamesHebrewChange}
                />
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
