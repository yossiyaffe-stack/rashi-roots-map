import { useMemo, useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkWithAuthor, TextualRelationshipWithWorks } from '@/hooks/useWorks';
import { LayoutMode } from './works-network/types';
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

export const WorksNetworkView = ({
  works,
  relationships,
  selectedWork,
  onSelectWork,
}: WorksNetworkViewProps) => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('timeline');
  const [centerWork, setCenterWork] = useState<WorkWithAuthor | null>(null);
  const [showOnlyConnected, setShowOnlyConnected] = useState(true);
  const [highlightSelected, setHighlightSelected] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
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
  const displayedWorks = useMemo(() => {
    if (!showOnlyConnected) return works;
    return works.filter(w => connectedWorkIds.has(w.id));
  }, [works, connectedWorkIds, showOnlyConnected]);

  // Get connections for selected work
  const selectedWorkConnections = useMemo(() => {
    if (!selectedWork) return new Set<string>();
    const ids = new Set<string>();
    ids.add(selectedWork.id);
    relationships.forEach(rel => {
      if (rel.work_id === selectedWork.id && rel.related_work_id) {
        ids.add(rel.related_work_id);
      }
      if (rel.related_work_id === selectedWork.id && rel.work_id) {
        ids.add(rel.work_id);
      }
    });
    return ids;
  }, [selectedWork, relationships]);

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

  const layoutProps = {
    works: displayedWorks,
    relationships,
    selectedWork,
    onSelectWork,
    workDepthLevels,
    selectedWorkConnections,
    highlightSelected,
    viewWidth,
    viewHeight,
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
          onClick={() => setHighlightSelected(!highlightSelected)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm",
            highlightSelected 
              ? "bg-accent/20 border-accent/50 text-accent" 
              : "bg-card/90 border-border text-foreground"
          )}
        >
          Highlight Selected
        </button>
      </div>

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
