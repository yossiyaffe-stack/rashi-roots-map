import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Play, Pause, SkipForward, SkipBack, RotateCcw, ChevronDown, ChevronRight, Map } from 'lucide-react';
import { useWorkLocations } from '@/hooks/useWorks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMapControls } from '@/contexts/MapControlsContext';

// Work location type icons and colors
const locationTypeConfig: Record<string, { icon: string; color: string; label: string }> = {
  composition: { icon: '✍️', color: '#8B5CF6', label: 'Composition' },
  manuscript_copy: { icon: '📜', color: '#F59E0B', label: 'Manuscript' },
  first_print: { icon: '🖨️', color: '#10B981', label: 'First Printing' },
  reprint: { icon: '📖', color: '#3B82F6', label: 'Reprint' },
  translation: { icon: '🌐', color: '#EC4899', label: 'Translation' },
};

interface WorkJourneyPanelProps {
  workId: string;
  workTitle?: string;
  onLocationClick?: (lat: number, lng: number) => void;
}

export function WorkJourneyPanel({ workId, workTitle, onLocationClick }: WorkJourneyPanelProps) {
  const { data: locations = [], isLoading } = useWorkLocations(workId);
  const { 
    setMapEntityMode,
    activeWorkJourneyId,
    setActiveWorkJourneyId,
    workJourneyStep,
    setWorkJourneyStep,
    isWorkJourneyPlaying,
    setIsWorkJourneyPlaying,
  } = useMapControls();
  const navigate = useNavigate();
  const location = useLocation();
  const isMapPage = location.pathname === '/';
  
  const [controlsOpen, setControlsOpen] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const stepDuration = 3000; // 3 seconds per location

  // Sort locations chronologically
  const sortedLocations = [...locations].sort((a, b) => {
    const yearDiff = (a.year || 0) - (b.year || 0);
    if (yearDiff !== 0) return yearDiff;
    // Order by type if same year
    const typeOrder: Record<string, number> = { composition: 1, manuscript_copy: 2, first_print: 3, reprint: 4, translation: 5 };
    return (typeOrder[a.location_type] || 99) - (typeOrder[b.location_type] || 99);
  });

  // Activate this work's journey when component mounts
  useEffect(() => {
    setActiveWorkJourneyId(workId);
    setMapEntityMode('works');
    return () => {
      // Clean up when unmounting
      if (activeWorkJourneyId === workId) {
        setActiveWorkJourneyId(null);
        setIsWorkJourneyPlaying(false);
      }
    };
  }, [workId, setActiveWorkJourneyId, setMapEntityMode]);

  // Clear animation on unmount or work change
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [workId]);

  // Reset animation when work changes
  useEffect(() => {
    setIsWorkJourneyPlaying(false);
    setWorkJourneyStep(-1);
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
  }, [workId, setIsWorkJourneyPlaying, setWorkJourneyStep]);

  // Animation step handler
  const goToStep = useCallback((step: number, autoAdvance: boolean = false) => {
    if (step < 0 || step >= sortedLocations.length) {
      // End of journey
      setIsWorkJourneyPlaying(false);
      return;
    }

    const loc = sortedLocations[step];
    setWorkJourneyStep(step);
    
    // Pan to location if place has coordinates
    if (loc.place?.latitude && loc.place?.longitude) {
      onLocationClick?.(loc.place.latitude, loc.place.longitude);
    }

    // Schedule next step if playing
    if (autoAdvance && step < sortedLocations.length - 1) {
      animationRef.current = setTimeout(() => {
        goToStep(step + 1, true);
      }, stepDuration);
    } else if (autoAdvance && step >= sortedLocations.length - 1) {
      // Reached the end
      setIsWorkJourneyPlaying(false);
    }
  }, [sortedLocations, onLocationClick, setWorkJourneyStep, setIsWorkJourneyPlaying, stepDuration]);

  // Play/Pause handler
  const togglePlay = useCallback(() => {
    if (isWorkJourneyPlaying) {
      // Pause
      setIsWorkJourneyPlaying(false);
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    } else {
      // If not on map page, navigate there first, then start playing
      if (!isMapPage) {
        navigate('/');
        // Delay play start to let map load
        setTimeout(() => {
          setIsWorkJourneyPlaying(true);
          const startStep = workJourneyStep < 0 ? 0 : workJourneyStep;
          goToStep(startStep, true);
        }, 500);
      } else {
        setIsWorkJourneyPlaying(true);
        const startStep = workJourneyStep < 0 ? 0 : workJourneyStep;
        goToStep(startStep, true);
      }
    }
  }, [isWorkJourneyPlaying, isMapPage, workJourneyStep, navigate, goToStep, setIsWorkJourneyPlaying]);

  // Stop animation when isWorkJourneyPlaying becomes false externally
  useEffect(() => {
    if (!isWorkJourneyPlaying && animationRef.current) {
      clearTimeout(animationRef.current);
    }
  }, [isWorkJourneyPlaying]);

  const handleReset = () => {
    setIsWorkJourneyPlaying(false);
    setWorkJourneyStep(-1);
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
  };

  const handlePrevious = () => {
    if (workJourneyStep > 0) {
      goToStep(workJourneyStep - 1, false);
    }
  };

  const handleNext = () => {
    if (workJourneyStep < sortedLocations.length - 1) {
      goToStep(workJourneyStep + 1, false);
    }
  };

  const handleViewOnMap = () => {
    setActiveWorkJourneyId(workId);
    setMapEntityMode('works');
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
        <div className="w-4 h-4 border-2 border-t-primary rounded-full animate-spin" />
        Loading journey data...
      </div>
    );
  }

  if (sortedLocations.length === 0) {
    return (
      <div className="p-3 text-sm text-muted-foreground">
        No geographic data available for this work.
      </div>
    );
  }

  const manuscriptCount = sortedLocations.filter(l => l.location_type === 'manuscript_copy').length;

  return (
    <div className="space-y-3">
      {/* Summary Stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleViewOnMap}
          className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer group"
        >
          <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
          <div className="flex-1">
            <span className="text-lg font-bold text-purple-400">{sortedLocations.length}</span>
            <span className="text-xs text-muted-foreground ml-2">locations</span>
          </div>
          <Map className="w-3.5 h-3.5 text-muted-foreground group-hover:text-purple-400 transition-colors shrink-0" />
        </button>
        
        {manuscriptCount > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="text-lg font-bold text-amber-400">{manuscriptCount}</span>
            <span className="text-xs text-muted-foreground">manuscripts</span>
          </div>
        )}
      </div>

      {/* Journey Controls */}
      <Collapsible open={controlsOpen} onOpenChange={setControlsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
          {controlsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <Play className="w-3 h-3" />
          Play Journey Animation
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-3 space-y-3">
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              disabled={workJourneyStep < 0}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrevious}
              disabled={workJourneyStep <= 0}
              className="h-8 w-8 p-0"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </Button>
            
            <Button
              size="sm"
              variant={isWorkJourneyPlaying ? 'destructive' : 'default'}
              onClick={togglePlay}
              className="h-8 px-4 gap-2"
            >
              {isWorkJourneyPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Play
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleNext}
              disabled={workJourneyStep >= sortedLocations.length - 1}
              className="h-8 w-8 p-0"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Progress */}
          {workJourneyStep >= 0 && (
            <div className="text-xs text-muted-foreground">
              Step {workJourneyStep + 1} of {sortedLocations.length}
              {sortedLocations[workJourneyStep]?.place?.name_english && (
                <span className="ml-2 text-foreground">
                  — {sortedLocations[workJourneyStep].place?.name_english}
                </span>
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Location List */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {sortedLocations.map((loc, index) => {
          const config = locationTypeConfig[loc.location_type] || locationTypeConfig.composition;
          const isActive = index === workJourneyStep;
          
          return (
            <button
              key={loc.id}
              onClick={() => {
                goToStep(index, false);
                if (!isMapPage) navigate('/');
              }}
              className={cn(
                "w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all",
                isActive 
                  ? "bg-primary/20 border border-primary/40" 
                  : "bg-white/5 border border-transparent hover:bg-white/10"
              )}
            >
              <span className="text-base">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {loc.place?.name_english || 'Unknown location'}
                </div>
                <div className="text-muted-foreground flex items-center gap-2">
                  <span>{config.label}</span>
                  {loc.year && <span>• {loc.circa ? 'c. ' : ''}{loc.year}</span>}
                </div>
              </div>
              <span className="text-muted-foreground shrink-0">{index + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
