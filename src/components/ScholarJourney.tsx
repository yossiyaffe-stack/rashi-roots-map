import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Play, Pause, SkipForward, SkipBack, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { useScholarLocations, LOCATION_REASON_CONFIG, type LocationReason } from '@/hooks/useScholars';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMapControls } from '@/contexts/MapControlsContext';

interface ScholarJourneyProps {
  scholarId: string;
  scholarName?: string;
  onLocationClick?: (lat: number, lng: number) => void;
}

// Refs for each location item to enable scroll-into-view
const locationRefs: Record<number, HTMLDivElement | null> = {};

export function ScholarJourney({ scholarId, scholarName, onLocationClick }: ScholarJourneyProps) {
  const { data: locations = [], isLoading } = useScholarLocations(scholarId);
  const { showJourneyMarkers, setShowJourneyMarkers } = useMapControls();
  const navigate = useNavigate();
  const location = useLocation();
  const isMapPage = location.pathname === '/';
  
  // Animation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [displayYear, setDisplayYear] = useState<number | null>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const stepDuration = 3000; // 3 seconds per location

  // Enable journey markers on the map when this component mounts (scholar selected)
  useEffect(() => {
    setShowJourneyMarkers(true);
    return () => {
      // Optionally disable when scholar panel closes - but keep it on for now
    };
  }, [setShowJourneyMarkers]);

  // Clear animation on unmount or scholar change
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [scholarId]);

  // Reset animation when scholar changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentStep(-1);
    setDisplayYear(null);
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
  }, [scholarId]);

  // Animation step handler
  const goToStep = useCallback((step: number, autoAdvance: boolean = false) => {
    if (step < 0 || step >= locations.length) {
      // End of journey
      setIsPlaying(false);
      return;
    }

    const location = locations[step];
    setCurrentStep(step);
    setDisplayYear(location.start_year || null);
    
    // Pan to location on map
    onLocationClick?.(location.latitude, location.longitude);
    
    // Scroll the current location item into view within the panel
    setTimeout(() => {
      const ref = locationRefs[step];
      if (ref) {
        ref.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);

    // Schedule next step if playing
    if (autoAdvance && step < locations.length - 1) {
      animationRef.current = setTimeout(() => {
        goToStep(step + 1, true);
      }, stepDuration);
    } else if (autoAdvance && step >= locations.length - 1) {
      // Reached the end
      setIsPlaying(false);
    }
  }, [locations, onLocationClick, stepDuration]);

  // Play/Pause handler
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      // Pause
      setIsPlaying(false);
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    } else {
      // If not on map page, navigate there first, then start playing
      if (!isMapPage) {
        navigate('/');
        // Delay play start to let map load
        setTimeout(() => {
          setIsPlaying(true);
          const startStep = currentStep < 0 ? 0 : currentStep;
          goToStep(startStep, true);
        }, 300);
      } else {
        // Play immediately
        setIsPlaying(true);
        const startStep = currentStep < 0 ? 0 : currentStep;
        goToStep(startStep, true);
      }
    }
  }, [isPlaying, currentStep, goToStep, isMapPage, navigate]);

  // Step controls
  const goToPrevious = useCallback(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    setIsPlaying(false);
    goToStep(Math.max(0, currentStep - 1), false);
  }, [currentStep, goToStep]);

  const goToNext = useCallback(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    setIsPlaying(false);
    goToStep(Math.min(locations.length - 1, currentStep + 1), false);
  }, [currentStep, locations.length, goToStep]);

  const resetJourney = useCallback(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    setIsPlaying(false);
    setCurrentStep(-1);
    setDisplayYear(null);
  }, []);

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

      {/* Animation Controls - Collapsible */}
      {locations.length > 1 && (
        <Collapsible open={controlsOpen || isPlaying} onOpenChange={setControlsOpen}>
          <CollapsibleTrigger className="w-full mb-2 p-2 rounded-lg bg-gradient-to-r from-accent/10 to-primary/5 border border-accent/20 flex items-center justify-between hover:bg-accent/15 transition-colors">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">
                {isPlaying ? 'Playing...' : 'Play Journey Animation'}
              </span>
            </div>
            {controlsOpen || isPlaying ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-accent/10 to-primary/5 border border-accent/20">
              {/* Year Display */}
              {displayYear !== null && (
                <div className="text-center mb-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Year</div>
                  <div className="text-3xl font-bold text-accent animate-fade-in">
                    {displayYear}
                  </div>
                  {currentStep >= 0 && locations[currentStep] && (
                    <div className="text-sm text-foreground/80 mt-1 animate-fade-in">
                      {LOCATION_REASON_CONFIG[(locations[currentStep].reason as LocationReason) || 'travel'].icon}{' '}
                      {locations[currentStep].location_name}
                    </div>
                  )}
                </div>
              )}

              {/* Progress indicator */}
              <div className="flex items-center gap-1 mb-3">
                {locations.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex-1 h-1.5 rounded-full transition-all duration-300",
                      index < currentStep ? "bg-accent" :
                      index === currentStep ? "bg-accent animate-pulse" :
                      "bg-white/20"
                    )}
                  />
                ))}
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetJourney}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-accent"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPrevious}
                  disabled={currentStep <= 0}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-accent disabled:opacity-30"
                  title="Previous"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={togglePlay}
                  className={cn(
                    "h-10 w-10 p-0 rounded-full",
                    isPlaying ? "bg-accent/80 hover:bg-accent" : "bg-accent hover:bg-accent/90"
                  )}
                  title={isPlaying ? "Pause" : "Play Journey"}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNext}
                  disabled={currentStep >= locations.length - 1}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-accent disabled:opacity-30"
                  title="Next"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              {/* Instructions */}
              {currentStep < 0 && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Press play to animate {scholarName ? `${scholarName}'s` : "the scholar's"} journey
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-accent/50 via-accent/30 to-accent/10" />
        
        <div className="space-y-3">
          {locations.map((location, index) => {
            const reason = (location.reason as LocationReason) || 'travel';
            const config = LOCATION_REASON_CONFIG[reason] || LOCATION_REASON_CONFIG.travel;
            const isCurrentStep = index === currentStep;
            const isPast = index < currentStep;
            
            return (
              <div
                key={location.id}
                ref={(el) => { locationRefs[index] = el; }}
                onClick={() => {
                  onLocationClick?.(location.latitude, location.longitude);
                  setCurrentStep(index);
                  setDisplayYear(location.start_year || null);
                  setIsPlaying(false);
                  if (animationRef.current) {
                    clearTimeout(animationRef.current);
                  }
                }}
                className={cn(
                  "relative pl-10 pr-3 py-3 rounded-lg border transition-all cursor-pointer group",
                  isCurrentStep 
                    ? "bg-accent/20 border-accent ring-2 ring-accent/30 scale-[1.02]" 
                    : isPast 
                      ? "bg-accent/5 border-accent/30" 
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                )}
              >
                {/* Timeline dot */}
                <div className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all",
                  config.bgColor,
                  isCurrentStep && "ring-2 ring-accent ring-offset-2 ring-offset-background scale-125"
                )}>
                  {config.icon}
                </div>
                
                {/* Step number indicator */}
                <div className={cn(
                  "absolute -left-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center",
                  isCurrentStep || isPast ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {index + 1}
                </div>
                
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium transition-colors",
                        isCurrentStep ? "text-accent" : "text-foreground group-hover:text-accent"
                      )}>
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
                    <div className={cn(
                      "text-xs font-medium",
                      isCurrentStep ? "text-accent" : "text-accent/80"
                    )}>
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