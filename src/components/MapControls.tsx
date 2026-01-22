import { Settings2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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
}

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
}: MapControlsProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="space-y-2">
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

      {/* Collapsible content */}
      <div className={cn(
        "transition-all duration-200 overflow-hidden",
        expanded ? "max-h-96" : "max-h-0"
      )}>
        <div className="space-y-3 pt-1">
          {/* Layers Section */}
          <div className="text-xs text-muted-foreground/60 uppercase tracking-wider pt-1">Layers</div>
          
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

          {/* Labels Section */}
          <div className="text-xs text-muted-foreground/60 uppercase tracking-wider pt-2">Labels</div>

          {/* Show Place Names English Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="show-place-english" className="text-sm text-muted-foreground cursor-pointer">
              Place Names (English)
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
              Place Names (Hebrew)
            </Label>
            <Switch
              id="show-place-hebrew"
              checked={showPlaceNamesHebrew}
              onCheckedChange={onShowPlaceNamesHebrewChange}
            />
          </div>

          {/* Show Scholar Names English Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="show-scholar-english" className="text-sm text-muted-foreground cursor-pointer">
              Scholar Names (English)
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
              Scholar Names (Hebrew)
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
  );
}
