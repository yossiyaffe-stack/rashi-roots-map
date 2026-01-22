import { useMemo, useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, BookOpen, Scroll, FileText, BookMarked } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkWithAuthor, TextualRelationshipWithWorks } from '@/hooks/useWorks';

interface WorksNetworkViewProps {
  works: WorkWithAuthor[];
  relationships: TextualRelationshipWithWorks[];
  selectedWork: WorkWithAuthor | null;
  onSelectWork: (work: WorkWithAuthor | null) => void;
}

// Category colors for textual relationships
const CATEGORY_COLORS: Record<string, string> = {
  commentary: '#10b981', // emerald
  supercommentary: '#3b82f6', // blue
  citation: '#8b5cf6', // violet
  glossary: '#f59e0b', // amber
  abridgment: '#ec4899', // pink
  translation: '#06b6d4', // cyan
  default: '#6b7280', // gray
};

// Work type icons
const WORK_TYPE_ICONS: Record<string, typeof BookOpen> = {
  biblical_commentary: BookOpen,
  talmudic_commentary: Scroll,
  halachic: FileText,
  responsa: BookMarked,
  default: BookOpen,
};

export const WorksNetworkView = ({
  works,
  relationships,
  selectedWork,
  onSelectWork,
}: WorksNetworkViewProps) => {
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

  // Sort works by year
  const sortedWorks = useMemo(() => {
    return [...displayedWorks].sort((a, b) => {
      const yearA = a.year_written ?? 1100;
      const yearB = b.year_written ?? 1100;
      return yearA - yearB;
    });
  }, [displayedWorks]);

  // Calculate depth levels for works based on relationships
  const workDepthLevels = useMemo(() => {
    const depths: Record<string, number> = {};
    const parentMap = new Map<string, string>(); // child -> parent work

    // Build parent map from relationships
    relationships.forEach(rel => {
      if (rel.work_id && rel.related_work_id) {
        // work_id is the commentary/child, related_work_id is what it comments on (parent)
        if (rel.relationship_category === 'commentary' || rel.relationship_category === 'supercommentary') {
          parentMap.set(rel.work_id, rel.related_work_id);
        }
      }
    });

    // Calculate depth for each work
    const getDepth = (workId: string, visited = new Set<string>()): number => {
      if (depths[workId] !== undefined) return depths[workId];
      if (visited.has(workId)) return 0; // Prevent cycles
      visited.add(workId);

      const parentId = parentMap.get(workId);
      if (!parentId) {
        depths[workId] = 0; // Original text
        return 0;
      }
      
      const parentDepth = getDepth(parentId, visited);
      depths[workId] = parentDepth + 1;
      return depths[workId];
    };

    // Calculate depths for all displayed works
    sortedWorks.forEach(work => getDepth(work.id));

    return depths;
  }, [sortedWorks, relationships]);

  // Fixed viewport dimensions - like Scholars Network
  const viewWidth = 1600;
  const viewHeight = 900;

  // Position works in a hierarchical tree layout by depth level
  const workPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number; depth: number }> = {};
    
    // Group works by depth level first, then by era within each level
    const depthGroups: Record<number, Record<number, WorkWithAuthor[]>> = {};
    
    sortedWorks.forEach(work => {
      const depth = workDepthLevels[work.id] ?? 0;
      const year = work.year_written ?? 1100;
      const era = Math.floor(year / 50) * 50;
      
      if (!depthGroups[depth]) depthGroups[depth] = {};
      if (!depthGroups[depth][era]) depthGroups[depth][era] = [];
      depthGroups[depth][era].push(work);
    });

    const depthLevels = Object.keys(depthGroups).map(Number).sort((a, b) => a - b);
    const numDepths = depthLevels.length || 1;
    
    // Dynamic spacing based on viewport - like Scholars Network
    const depthSpacing = Math.min(180, (viewHeight - 100) / (numDepths + 1));
    
    // Find max works in any depth level for horizontal spacing
    let maxWorksInLevel = 1;
    depthLevels.forEach(depth => {
      const erasInDepth = depthGroups[depth];
      let count = 0;
      Object.values(erasInDepth).forEach(works => count += works.length);
      if (count > maxWorksInLevel) maxWorksInLevel = count;
    });
    
    const nodeSpacing = Math.min(180, (viewWidth - 100) / (maxWorksInLevel + 1));
    
    let currentY = 80;
    
    depthLevels.forEach((depth) => {
      const erasInDepth = depthGroups[depth];
      const eras = Object.keys(erasInDepth).map(Number).sort((a, b) => a - b);
      
      // Calculate total width needed for this depth level
      let totalWorks = 0;
      eras.forEach(era => {
        totalWorks += erasInDepth[era].length;
      });
      
      const centerX = viewWidth / 2;
      let currentX = centerX - ((totalWorks - 1) * nodeSpacing) / 2;
      
      eras.forEach((era) => {
        const worksInEra = erasInDepth[era];
        
        worksInEra.forEach((work) => {
          positions[work.id] = {
            x: currentX,
            y: currentY,
            depth,
          };
          currentX += nodeSpacing;
        });
      });
      
      currentY += depthSpacing;
    });

    return positions;
  }, [sortedWorks, workDepthLevels, viewWidth, viewHeight]);

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
    setZoom(z => Math.max(0.3, Math.min(2, z + delta)));
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsPanning(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const isRelationshipHighlighted = (rel: TextualRelationshipWithWorks) => {
    if (!highlightSelected || !selectedWork) return true;
    return rel.work_id === selectedWork.id || rel.related_work_id === selectedWork.id;
  };

  // Depth level colors
  const DEPTH_COLORS: Record<number, string> = {
    0: '#8b5cf6', // violet - original texts
    1: '#10b981', // emerald - direct commentaries
    2: '#ec4899', // pink - supercommentaries
    3: '#f59e0b', // amber - super-supercommentaries
  };

  const getWorkColor = (work: WorkWithAuthor) => {
    if (selectedWork?.id === work.id) return 'hsl(var(--accent))';
    if (highlightSelected && selectedWork && !selectedWorkConnections.has(work.id)) {
      return 'hsl(var(--muted))';
    }
    // Color by depth level
    const depth = workDepthLevels[work.id] ?? 0;
    return DEPTH_COLORS[depth] ?? DEPTH_COLORS[3];
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
          transition: isPanning ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        <defs>
          <marker
            id="arrowhead-work"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
          </marker>
          <filter id="work-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Relationship lines */}
        {relationships.map(rel => {
          if (!rel.work_id || !rel.related_work_id) return null;
          const fromPos = workPositions[rel.work_id];
          const toPos = workPositions[rel.related_work_id];
          if (!fromPos || !toPos) return null;

          const highlighted = isRelationshipHighlighted(rel);
          const color = CATEGORY_COLORS[rel.relationship_category] || CATEGORY_COLORS.default;

          // Calculate control point for curved line
          const midX = (fromPos.x + toPos.x) / 2;
          const midY = (fromPos.y + toPos.y) / 2;
          const dx = toPos.x - fromPos.x;
          const curveOffset = Math.abs(dx) * 0.3;
          const controlX = midX + (dx > 0 ? -curveOffset : curveOffset);
          const controlY = midY;

          return (
            <g key={rel.id}>
              <path
                d={`M ${fromPos.x} ${fromPos.y} Q ${controlX} ${controlY} ${toPos.x} ${toPos.y}`}
                stroke={color}
                strokeWidth={highlighted ? 2 : 1}
                strokeOpacity={highlighted ? 0.8 : 0.2}
                fill="none"
                strokeDasharray={rel.relationship_category === 'supercommentary' ? '6,3' : undefined}
              />
              {/* Relationship label on hover */}
              <title>{rel.relationship_type} ({rel.relationship_category})</title>
            </g>
          );
        })}

        {/* Work nodes */}
        {sortedWorks.map(work => {
          const pos = workPositions[work.id];
          if (!pos) return null;

          const isSelected = selectedWork?.id === work.id;
          const color = getWorkColor(work);
          const dimmed = highlightSelected && selectedWork && !selectedWorkConnections.has(work.id);

          return (
            <g
              key={work.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectWork(isSelected ? null : work);
              }}
              style={{ cursor: 'pointer' }}
              filter={isSelected ? 'url(#work-glow)' : undefined}
            >
              {/* Glow effect for selected */}
              {isSelected && (
                <rect
                  x={-78}
                  y={-33}
                  width={156}
                  height={66}
                  rx={10}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="3"
                  opacity="0.5"
                  filter="url(#work-glow)"
                />
              )}
              
              {/* Background rectangle */}
              <rect
                x={-75}
                y={-30}
                width={150}
                height={60}
                rx={8}
                fill={isSelected ? color : 'hsl(var(--card))'}
                stroke={color}
                strokeWidth={isSelected ? 3 : 1.5}
                opacity={dimmed ? 0.3 : 1}
              />
              
              {/* Work title */}
              <text
                textAnchor="middle"
                dy={-5}
                fill={isSelected ? 'hsl(var(--card))' : 'hsl(var(--foreground))'}
                fontSize={12}
                fontWeight={600}
                opacity={dimmed ? 0.3 : 1}
              >
                {work.title.length > 18 ? work.title.slice(0, 16) + '...' : work.title}
              </text>
              
              {/* Author name */}
              <text
                textAnchor="middle"
                dy={12}
                fill={isSelected ? 'hsl(var(--card))' : 'hsl(var(--muted-foreground))'}
                fontSize={10}
                opacity={dimmed ? 0.3 : 0.8}
              >
                {work.author_name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-card/90 backdrop-blur rounded-lg border border-border hover:bg-accent/20 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-card/90 backdrop-blur rounded-lg border border-border hover:bg-accent/20 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 bg-card/90 backdrop-blur rounded-lg border border-border hover:bg-accent/20 transition-colors"
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
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur p-4 rounded-lg border border-border max-w-xs">
          <h3 className="font-bold text-foreground">{selectedWork.title}</h3>
          {selectedWork.hebrew_title && (
            <p className="text-sm text-muted-foreground font-hebrew">{selectedWork.hebrew_title}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">by {selectedWork.author_name}</p>
          {selectedWork.year_written && (
            <p className="text-xs text-muted-foreground">c. {selectedWork.year_written}</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur p-3 rounded-lg border border-border">
        <h4 className="text-xs font-semibold text-foreground mb-2">Depth Levels</h4>
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#8b5cf6' }} />
            <span className="text-xs text-muted-foreground">Original Texts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#10b981' }} />
            <span className="text-xs text-muted-foreground">Commentaries</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ec4899' }} />
            <span className="text-xs text-muted-foreground">Supercommentaries</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#f59e0b' }} />
            <span className="text-xs text-muted-foreground">Super-super</span>
          </div>
        </div>
        <h4 className="text-xs font-semibold text-foreground mb-2">Relationship Types</h4>
        <div className="space-y-1">
          {Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'default').map(([category, color]) => (
            <div key={category} className="flex items-center gap-2">
              <div 
                className="w-4 h-0.5" 
                style={{ 
                  backgroundColor: color,
                  borderStyle: category === 'supercommentary' ? 'dashed' : 'solid',
                }}
              />
              <span className="text-xs text-muted-foreground capitalize">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
