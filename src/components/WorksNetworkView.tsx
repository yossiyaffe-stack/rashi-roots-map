import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, ExternalLink, BookOpen, Scroll, Focus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkWithAuthor, TextualRelationshipWithWorks } from '@/hooks/useWorks';
import { LayoutMode, HoveredWork } from './works-network/types';
import { TimelineLayout } from './works-network/TimelineLayout';
import { RadialLayout } from './works-network/RadialLayout';
import { WorksLegend } from './works-network/WorksLegend';
import { LayoutModeSelector } from './works-network/LayoutModeSelector';
import { CenterWorkSelector } from './works-network/CenterWorkSelector';

interface WorksNetworkViewProps {
  works: WorkWithAuthor[];
  relationships: TextualRelationshipWithWorks[];
  selectedWork: WorkWithAuthor | null;
  onSelectWork: (work: WorkWithAuthor | null) => void;
}

// Parse manuscript URL for source info
const parseManuscriptUrl = (url: string): { source: string; id: string | null } => {
  if (url.includes('hebrewbooks.org')) {
    const match = url.match(/hebrewbooks\.org\/(\d+)/);
    return { source: 'HebrewBooks', id: match ? match[1] : null };
  }
  if (url.includes('sefaria.org')) {
    return { source: 'Sefaria', id: null };
  }
  return { source: 'Digital Edition', id: null };
};

export const WorksNetworkView = ({
  works,
  relationships,
  selectedWork,
  onSelectWork,
}: WorksNetworkViewProps) => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('timeline');
  const [centerWork, setCenterWork] = useState<WorkWithAuthor | null>(null);
  const [showOnlyConnected, setShowOnlyConnected] = useState(true);
  const [focusMode, setFocusMode] = useState(false); // Only show selected work's relationships
  const [highlightSelected, setHighlightSelected] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredWork, setHoveredWork] = useState<HoveredWork | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get all connected work IDs
  const connectedWorkIds = useMemo(() => {
    const ids = new Set<string>();
    relationships.forEach(rel => {
      if (rel.work_id) ids.add(rel.work_id);
      if (rel.related_work_id) ids.add(rel.related_work_id);
    });
    return ids;
  }, [relationships]);

  // Filter works based on showOnlyConnected
  const baseDisplayedWorks = useMemo(() => {
    if (!showOnlyConnected) return works;
    return works.filter(w => connectedWorkIds.has(w.id));
  }, [works, connectedWorkIds, showOnlyConnected]);

  // Get connections for selected work (including multi-level)
  const selectedWorkConnections = useMemo(() => {
    if (!selectedWork) return new Set<string>();
    const ids = new Set<string>();
    ids.add(selectedWork.id);
    
    // Get direct connections
    relationships.forEach(rel => {
      if (rel.work_id === selectedWork.id && rel.related_work_id) {
        ids.add(rel.related_work_id);
      }
      if (rel.related_work_id === selectedWork.id && rel.work_id) {
        ids.add(rel.work_id);
      }
    });
    
    // If in focus mode, also get second-level connections for context
    if (focusMode) {
      const directIds = new Set(ids);
      directIds.forEach(workId => {
        relationships.forEach(rel => {
          if (rel.work_id === workId && rel.related_work_id) {
            ids.add(rel.related_work_id);
          }
          if (rel.related_work_id === workId && rel.work_id) {
            ids.add(rel.work_id);
          }
        });
      });
    }
    
    return ids;
  }, [selectedWork, relationships, focusMode]);

  // Filter works and relationships based on focus mode
  const displayedWorks = useMemo(() => {
    if (!focusMode || !selectedWork) return baseDisplayedWorks;
    return baseDisplayedWorks.filter(w => selectedWorkConnections.has(w.id));
  }, [baseDisplayedWorks, focusMode, selectedWork, selectedWorkConnections]);

  const displayedRelationships = useMemo(() => {
    if (!focusMode || !selectedWork) return relationships;
    return relationships.filter(rel => 
      selectedWorkConnections.has(rel.work_id || '') || 
      selectedWorkConnections.has(rel.related_work_id || '')
    );
  }, [relationships, focusMode, selectedWork, selectedWorkConnections]);

  // Calculate depth levels for works based on relationships
  const workDepthLevels = useMemo(() => {
    const depths: Record<string, number> = {};
    const parentMap = new Map<string, string>();

    relationships.forEach(rel => {
      if (rel.work_id && rel.related_work_id) {
        if (rel.relationship_category === 'commentary' || rel.relationship_category === 'supercommentary') {
          parentMap.set(rel.work_id, rel.related_work_id);
        }
      }
    });

    const getDepth = (workId: string, visited = new Set<string>()): number => {
      if (depths[workId] !== undefined) return depths[workId];
      if (visited.has(workId)) return 0;
      visited.add(workId);

      const parentId = parentMap.get(workId);
      if (!parentId) {
        depths[workId] = 0;
        return 0;
      }
      
      const parentDepth = getDepth(parentId, visited);
      depths[workId] = parentDepth + 1;
      return depths[workId];
    };

    displayedWorks.forEach(work => getDepth(work.id));

    return depths;
  }, [displayedWorks, relationships]);

  // Fixed viewport dimensions
  const viewWidth = layoutMode === 'timeline' ? 1200 : 1000;
  const viewHeight = layoutMode === 'timeline' ? 1200 : 900;

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(z * 1.25, 4));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.25, 0.25));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.25, Math.min(3, z + delta)));
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsPanning(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Reset pan/zoom when switching layouts
  useEffect(() => {
    handleResetView();
  }, [layoutMode]);

  // Auto-select center work in radial mode if none selected
  useEffect(() => {
    if (layoutMode === 'radial' && !centerWork && displayedWorks.length > 0) {
      // Select oldest work as default center (likely foundational)
      const sorted = [...displayedWorks].sort((a, b) => 
        (a.year_written ?? 1500) - (b.year_written ?? 1500)
      );
      setCenterWork(sorted[0]);
    }
  }, [layoutMode, centerWork, displayedWorks]);

  // Reset image loaded state when hover changes
  useEffect(() => {
    setImageLoaded(false);
  }, [hoveredWork?.work.id]);

  const handleHoverWork = useCallback((hovered: HoveredWork | null) => {
    setHoveredWork(hovered);
  }, []);

  const layoutProps = {
    works: displayedWorks,
    relationships: displayedRelationships,
    selectedWork,
    onSelectWork,
    workDepthLevels,
    selectedWorkConnections,
    highlightSelected: highlightSelected && !focusMode, // Disable highlight when in focus mode
    viewWidth,
    viewHeight,
    onHoverWork: handleHoverWork,
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-background cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.15s ease-out'
        }}
      >
        <defs>
          <filter id="work-glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {layoutMode === 'timeline' ? (
          <TimelineLayout {...layoutProps} />
        ) : (
          <RadialLayout {...layoutProps} centerWork={centerWork} />
        )}
      </svg>

      {/* Layout mode selector */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2">
        <LayoutModeSelector mode={layoutMode} onModeChange={setLayoutMode} />
      </div>

      {/* Center work selector (radial mode only) */}
      {layoutMode === 'radial' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2">
          <CenterWorkSelector
            works={displayedWorks}
            selectedCenterWork={centerWork}
            onSelectCenterWork={setCenterWork}
          />
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-card/90 backdrop-blur rounded-lg border border-border hover:bg-accent/20 transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-card/90 backdrop-blur rounded-lg border border-border hover:bg-accent/20 transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 bg-card/90 backdrop-blur rounded-lg border border-border hover:bg-accent/20 transition-colors"
          title="Reset view"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Toggle controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <button
          onClick={() => setShowOnlyConnected(!showOnlyConnected)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm",
            showOnlyConnected 
              ? "bg-accent/20 border-accent/50 text-accent" 
              : "bg-card/90 border-border text-foreground"
          )}
        >
          {showOnlyConnected ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          Connected Only
        </button>
        <button
          onClick={() => setFocusMode(!focusMode)}
          disabled={!selectedWork}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm",
            focusMode && selectedWork
              ? "bg-amber-500/20 border-amber-500/50 text-amber-300" 
              : "bg-card/90 border-border text-foreground",
            !selectedWork && "opacity-50 cursor-not-allowed"
          )}
          title={selectedWork ? "Show only relationships for selected work" : "Select a work first"}
        >
          <Focus className="w-4 h-4" />
          Focus Mode
        </button>
        <button
          onClick={() => setHighlightSelected(!highlightSelected)}
          disabled={focusMode}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm",
            highlightSelected && !focusMode
              ? "bg-accent/20 border-accent/50 text-accent" 
              : "bg-card/90 border-border text-foreground",
            focusMode && "opacity-50"
          )}
        >
          Highlight Selected
        </button>
      </div>

      {/* Manuscript preview tooltip */}
      {hoveredWork && hoveredWork.work.manuscript_url && (
        <ManuscriptPreviewTooltip
          work={hoveredWork.work}
          position={hoveredWork.position}
          zoom={zoom}
          pan={pan}
          viewWidth={viewWidth}
          viewHeight={viewHeight}
          containerRef={containerRef}
          imageLoaded={imageLoaded}
          onImageLoad={() => setImageLoaded(true)}
        />
      )}

      {/* Selected work info */}
      {selectedWork && (
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur p-4 rounded-lg border border-border max-w-xs shadow-lg animate-fade-in">
          <h3 className="font-bold text-foreground">{selectedWork.title}</h3>
          {selectedWork.hebrew_title && (
            <p className="text-sm text-muted-foreground font-hebrew">{selectedWork.hebrew_title}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">by {selectedWork.author_name}</p>
          {selectedWork.year_written && (
            <p className="text-xs text-muted-foreground">c. {selectedWork.year_written}</p>
          )}
          {selectedWork.manuscript_url && (
            <a 
              href={selectedWork.manuscript_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:underline mt-2 inline-block"
            >
              View Digital Edition →
            </a>
          )}
        </div>
      )}

      {/* Legend */}
      <WorksLegend layoutMode={layoutMode} />
    </div>
  );
};

// Inline tooltip component to avoid complex positioning issues
interface ManuscriptPreviewTooltipProps {
  work: WorkWithAuthor;
  position: { x: number; y: number };
  zoom: number;
  pan: { x: number; y: number };
  viewWidth: number;
  viewHeight: number;
  containerRef: React.RefObject<HTMLDivElement>;
  imageLoaded: boolean;
  onImageLoad: () => void;
}

const ManuscriptPreviewTooltip = ({
  work,
  position,
  zoom,
  pan,
  viewWidth,
  viewHeight,
  containerRef,
  imageLoaded,
  onImageLoad,
}: ManuscriptPreviewTooltipProps) => {
  const container = containerRef.current;
  if (!container || !work.manuscript_url) return null;

  const { source, id } = parseManuscriptUrl(work.manuscript_url);
  const isHebrewBooks = source === 'HebrewBooks' && id;
  const isSefaria = source === 'Sefaria';
  const coverImageUrl = isHebrewBooks ? `https://hebrewbooks.org/reader/cover.aspx?req=${id}` : null;

  // Calculate tooltip position
  const rect = container.getBoundingClientRect();
  const svgCenterX = rect.width / 2;
  const svgCenterY = rect.height / 2;

  // Scale from viewBox to container coordinates
  const scaleX = rect.width / viewWidth;
  const scaleY = rect.height / viewHeight;

  // Apply zoom and pan transformations
  const screenX = svgCenterX + (position.x - viewWidth / 2) * scaleX * zoom + pan.x;
  const screenY = svgCenterY + (position.y - viewHeight / 2) * scaleY * zoom + pan.y;

  // Position tooltip to the right of the node
  const tooltipX = Math.min(screenX + 90, rect.width - 260);
  const tooltipY = Math.max(20, Math.min(screenY - 60, rect.height - 280));

  return (
    <div 
      className="absolute z-50 w-56 rounded-lg border border-border bg-card shadow-xl overflow-hidden animate-scale-in pointer-events-auto"
      style={{
        left: tooltipX,
        top: tooltipY,
      }}
      onMouseEnter={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-border bg-muted/40 flex items-center gap-2">
        {isSefaria ? (
          <Scroll className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
        )}
        <span className="text-xs font-medium text-muted-foreground">{source}</span>
      </div>

      {/* Cover image */}
      {coverImageUrl && (
        <div className="relative h-36 bg-muted/30 overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground text-xs">Loading...</div>
            </div>
          )}
          <img
            src={coverImageUrl}
            alt={`Cover of ${work.title}`}
            className={cn(
              "w-full h-full object-contain transition-opacity duration-300",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={onImageLoad}
          />
        </div>
      )}

      {/* Sefaria placeholder */}
      {isSefaria && (
        <div className="h-28 bg-gradient-to-br from-emerald-950/30 to-background flex items-center justify-center p-3">
          <div className="text-center">
            <Scroll className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
            <p className="text-xs text-emerald-400 font-hebrew">
              {work.hebrew_title || 'ספריא'}
            </p>
          </div>
        </div>
      )}

      {/* Fallback */}
      {!coverImageUrl && !isSefaria && (
        <div className="h-20 bg-gradient-to-br from-amber-950/20 to-background flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-amber-400" />
        </div>
      )}

      {/* Info */}
      <div className="p-2 space-y-0.5">
        <h4 className="font-semibold text-xs text-foreground truncate">{work.title}</h4>
        {work.hebrew_title && (
          <p className="text-xs text-muted-foreground font-hebrew truncate">{work.hebrew_title}</p>
        )}
        <p className="text-[10px] text-muted-foreground truncate">
          {work.author_name} {work.year_written && `(${work.year_written})`}
        </p>
      </div>

      {/* Link */}
      <a
        href={work.manuscript_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium transition-colors border-t border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <span>Open</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};
