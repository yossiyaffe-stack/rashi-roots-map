import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import type { DbScholar, DbBiographicalRelationship, DbTextualRelationship, DbIntellectualRelationship } from '@/hooks/useScholars';
import { useRelationshipFilters } from '@/contexts/RelationshipFilterContext';
import { Users, FileText, Lightbulb, Filter, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface NetworkViewProps {
  scholars: DbScholar[];
  biographicalRelationships: DbBiographicalRelationship[];
  textualRelationships: DbTextualRelationship[];
  intellectualRelationships: DbIntellectualRelationship[];
  selectedScholar: DbScholar | null;
  onSelectScholar: (scholar: DbScholar) => void;
}

// Domain colors matching the filter panel
const DOMAIN_COLORS = {
  biographical: '#f43f5e', // rose-500
  textual: '#10b981', // emerald-500
  intellectual: '#8b5cf6', // violet-500
};

export const NetworkView = ({ 
  scholars, 
  biographicalRelationships,
  textualRelationships,
  intellectualRelationships,
  selectedScholar, 
  onSelectScholar 
}: NetworkViewProps) => {
  const { filters, shouldShowRelationship } = useRelationshipFilters();
  const [showOnlyConnected, setShowOnlyConnected] = useState(false);
  const [focusOnSelected, setFocusOnSelected] = useState(false);
  const [highlightSelected, setHighlightSelected] = useState(false);
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter biographical relationships based on filters
  const filteredBiographical = useMemo(() => {
    if (!filters.domains.biographical) return [];
    return biographicalRelationships.filter(rel => 
      shouldShowRelationship('biographical', rel.relationship_category, rel.certainty)
    );
  }, [biographicalRelationships, filters, shouldShowRelationship]);

  // Filter textual relationships - these now include scholar IDs resolved from works
  const filteredTextual = useMemo(() => {
    if (!filters.domains.textual) return [];
    return textualRelationships.filter(rel => 
      shouldShowRelationship('textual', rel.relationship_category, rel.certainty) &&
      (rel as any).from_scholar_id && (rel as any).to_scholar_id
    );
  }, [textualRelationships, filters, shouldShowRelationship]);

  // Filter intellectual relationships
  const filteredIntellectual = useMemo(() => {
    if (!filters.domains.intellectual) return [];
    return intellectualRelationships.filter(rel => 
      shouldShowRelationship('intellectual', rel.relationship_category, rel.certainty)
    );
  }, [intellectualRelationships, filters, shouldShowRelationship]);

  // Get scholars connected to the selected scholar
  const selectedScholarConnections = useMemo(() => {
    if (!selectedScholar) return new Set<string>();
    
    const ids = new Set<string>();
    ids.add(selectedScholar.id); // Include the selected scholar
    
    filteredBiographical.forEach(rel => {
      if (rel.scholar_id === selectedScholar.id) ids.add(rel.related_scholar_id);
      if (rel.related_scholar_id === selectedScholar.id) ids.add(rel.scholar_id);
    });
    
    filteredTextual.forEach(rel => {
      const fromId = (rel as any).from_scholar_id;
      const toId = (rel as any).to_scholar_id;
      if (fromId === selectedScholar.id && toId) ids.add(toId);
      if (toId === selectedScholar.id && fromId) ids.add(fromId);
    });
    
    filteredIntellectual.forEach(rel => {
      if (rel.scholar_id === selectedScholar.id) ids.add(rel.scholar_id);
    });
    
    return ids;
  }, [selectedScholar, filteredBiographical, filteredTextual, filteredIntellectual]);

  // Get set of scholar IDs that have active relationships
  const connectedScholarIds = useMemo(() => {
    const ids = new Set<string>();
    
    filteredBiographical.forEach(rel => {
      ids.add(rel.scholar_id);
      ids.add(rel.related_scholar_id);
    });
    
    filteredTextual.forEach(rel => {
      const fromId = (rel as any).from_scholar_id;
      const toId = (rel as any).to_scholar_id;
      if (fromId) ids.add(fromId);
      if (toId) ids.add(toId);
    });
    
    filteredIntellectual.forEach(rel => {
      ids.add(rel.scholar_id);
    });
    
    return ids;
  }, [filteredBiographical, filteredTextual, filteredIntellectual]);

  // Filter scholars based on toggles
  const displayedScholars = useMemo(() => {
    let filtered = scholars;
    
    // If focusing on selected scholar, show only their connections
    if (focusOnSelected && selectedScholar && selectedScholarConnections.size > 0) {
      filtered = filtered.filter(s => selectedScholarConnections.has(s.id));
    } else if (showOnlyConnected) {
      // Otherwise if showing only connected, filter by all connections
      filtered = filtered.filter(s => connectedScholarIds.has(s.id));
    }
    
    return filtered;
  }, [scholars, showOnlyConnected, focusOnSelected, selectedScholar, connectedScholarIds, selectedScholarConnections]);

  // Check if a relationship involves the selected scholar (only dim when highlightSelected is on)
  const isRelationshipHighlighted = (scholarId1: string, scholarId2?: string): boolean => {
    if (!highlightSelected || !selectedScholar) return true; // No highlight mode = all fully visible
    return scholarId1 === selectedScholar.id || scholarId2 === selectedScholar.id;
  };

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(z * 1.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(z / 1.25, 0.25));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(Math.max(z * delta, 0.25), 3));
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Reset pan when mouse leaves
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsPanning(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const getNodeColor = (scholar: DbScholar): string => {
    if (scholar.name === 'Rashi') return '#e11d48';
    if (scholar.relationship_type === 'supercommentator') return '#3b82f6';
    if (scholar.period === 'Rishonim') return '#f59e0b';
    return '#8b5cf6';
  };

  const getNodeRadius = (scholar: DbScholar): number => {
    const importance = scholar.importance || 50;
    return Math.max(15, importance / 4);
  };

  // Sort scholars chronologically by birth year
  const sortedScholars = useMemo(() => {
    return [...displayedScholars].sort((a, b) => {
      const yearA = a.birth_year ?? 9999;
      const yearB = b.birth_year ?? 9999;
      return yearA - yearB;
    });
  }, [displayedScholars]);

  // Timeline-based horizontal layout - scholars flow left-to-right by birth year
  const scholarPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    
    // Group scholars by approximate era (every 25 years)
    const eras: Record<number, DbScholar[]> = {};
    sortedScholars.forEach(s => {
      const year = s.birth_year ?? 1100;
      const era = Math.floor(year / 25) * 25;
      if (!eras[era]) eras[era] = [];
      eras[era].push(s);
    });
    
    const eraKeys = Object.keys(eras).map(Number).sort((a, b) => a - b);
    const colSpacing = 200;
    const rowSpacing = 120;
    
    eraKeys.forEach((era, colIdx) => {
      const scholarsInEra = eras[era];
      const centerY = 300; // Center of the SVG
      const startY = centerY - ((scholarsInEra.length - 1) * rowSpacing) / 2;
      
      scholarsInEra.forEach((s, rowIdx) => {
        positions[s.id] = {
          x: 150 + colIdx * colSpacing,
          y: startY + rowIdx * rowSpacing
        };
      });
    });
    
    return positions;
  }, [sortedScholars]);

  // Calculate SVG dimensions based on layout
  const svgDimensions = useMemo(() => {
    const positions = Object.values(scholarPositions);
    if (positions.length === 0) return { width: 800, height: 600 };
    
    const maxX = Math.max(...positions.map(p => p.x)) + 150;
    const maxY = Math.max(...positions.map(p => p.y)) + 100;
    const minY = Math.min(...positions.map(p => p.y));
    
    return { 
      width: Math.max(800, maxX), 
      height: Math.max(600, maxY - minY + 200)
    };
  }, [scholarPositions]);

  // Count connections for legend
  const connectionCounts = useMemo(() => ({
    biographical: filteredBiographical.length,
    textual: filteredTextual.length,
    intellectual: filteredIntellectual.length,
  }), [filteredBiographical, filteredTextual, filteredIntellectual]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      <svg 
        width="100%" 
        height="100%" 
        style={{ 
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        <g transform={`translate(${svgDimensions.width / 2 - 400}, 50)`}>
        <defs>
          <marker id="arrowhead-bio" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={DOMAIN_COLORS.biographical} />
          </marker>
          <marker id="arrowhead-text" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={DOMAIN_COLORS.textual} />
          </marker>
          <marker id="arrowhead-int" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={DOMAIN_COLORS.intellectual} />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Draw biographical connections (person-to-person) */}
        {filteredBiographical.map((conn, idx) => {
          const fromPos = scholarPositions[conn.scholar_id];
          const toPos = scholarPositions[conn.related_scholar_id];
          
          if (!fromPos || !toPos) return null;
          
          const isHighlighted = isRelationshipHighlighted(conn.scholar_id, conn.related_scholar_id);
          const offset = idx * 0.5;
          
          return (
            <line
              key={`bio-${conn.id}`}
              x1={fromPos.x}
              y1={fromPos.y + offset}
              x2={toPos.x}
              y2={toPos.y + offset}
              stroke={DOMAIN_COLORS.biographical}
              strokeWidth={isHighlighted && highlightSelected ? 3 : 2}
              markerEnd="url(#arrowhead-bio)"
              opacity={isHighlighted ? 0.8 : 0.15}
              className="transition-all duration-200"
            />
          );
        })}

        {/* Draw textual connections (work-to-work mapped to scholar-to-scholar) */}
        {filteredTextual.map((conn, idx) => {
          const fromScholarId = (conn as any).from_scholar_id;
          const toScholarId = (conn as any).to_scholar_id;
          const fromPos = scholarPositions[fromScholarId];
          const toPos = scholarPositions[toScholarId];
          
          if (!fromPos || !toPos || fromScholarId === toScholarId) return null;
          
          const isHighlighted = isRelationshipHighlighted(fromScholarId, toScholarId);
          const offset = -3 - (idx % 3);
          
          return (
            <line
              key={`text-${conn.id}`}
              x1={fromPos.x}
              y1={fromPos.y + offset}
              x2={toPos.x}
              y2={toPos.y + offset}
              stroke={DOMAIN_COLORS.textual}
              strokeWidth={isHighlighted && highlightSelected ? 3 : 2}
              strokeDasharray="6,3"
              markerEnd="url(#arrowhead-text)"
              opacity={isHighlighted ? 0.8 : 0.15}
              className="transition-all duration-200"
            />
          );
        })}

        {/* Draw intellectual connections (scholar-to-work, shown as self-loops/arcs) */}
        {filteredIntellectual.map((conn, idx) => {
          const fromPos = scholarPositions[conn.scholar_id];
          
          if (!fromPos) return null;
          
          const isHighlighted = isRelationshipHighlighted(conn.scholar_id);
          const arcRadius = 20 + (idx % 3) * 5;
          
          return (
            <path
              key={`int-${conn.id}`}
              d={`M ${fromPos.x - arcRadius} ${fromPos.y - 10} 
                  A ${arcRadius} ${arcRadius} 0 0 1 ${fromPos.x + arcRadius} ${fromPos.y - 10}`}
              fill="none"
              stroke={DOMAIN_COLORS.intellectual}
              strokeWidth={isHighlighted && highlightSelected ? 3 : 2}
              strokeDasharray="4,2"
              opacity={isHighlighted ? 0.8 : 0.15}
              className="transition-all duration-200"
            />
          );
        })}

        {/* Draw nodes */}
        {sortedScholars.map((scholar) => {
          const pos = scholarPositions[scholar.id];
          if (!pos) return null;
          
          const radius = getNodeRadius(scholar);
          const color = getNodeColor(scholar);
          const isSelected = selectedScholar?.id === scholar.id;
          const isConnectedToSelected = highlightSelected && selectedScholar 
            ? selectedScholarConnections.has(scholar.id) 
            : true;
          const isRashi = scholar.name === 'Rashi';

          return (
            <g 
              key={scholar.id} 
              className="cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation();
                onSelectScholar(scholar);
              }}
              opacity={isConnectedToSelected ? 1 : 0.25}
            >
              {/* Glow effect for selected scholar or Rashi */}
              {(isSelected || isRashi) && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius + 8}
                  fill="none"
                  stroke={isSelected ? '#fbbf24' : '#fbbf24'}
                  strokeWidth="3"
                  opacity="0.5"
                  filter="url(#glow)"
                />
              )}
              
              {/* Main node */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                fill={color}
                stroke={isSelected ? '#fbbf24' : '#fff'}
                strokeWidth={isSelected ? 3 : 2}
                className="transition-all duration-200 hover:brightness-125"
                style={{ 
                  transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                  transformOrigin: `${pos.x}px ${pos.y}px`
                }}
              />
              
              {/* Label */}
              <text
                x={pos.x}
                y={pos.y + radius + 18}
                textAnchor="middle"
                className="fill-foreground text-xs font-medium pointer-events-none"
              >
                {scholar.name.split('(')[0].trim()}
              </text>
              
              {/* Hebrew name */}
              {scholar.hebrew_name && (
                <text
                  x={pos.x}
                  y={pos.y + radius + 32}
                  textAnchor="middle"
                  className="fill-accent/70 text-[10px] font-hebrew pointer-events-none"
                >
                  {scholar.hebrew_name}
                </text>
              )}
            </g>
          );
        })}
        </g>
      </svg>

      {/* Zoom Controls */}
      <div className="absolute top-6 left-6 bg-sidebar/90 backdrop-blur-md border border-white/10 rounded-lg p-2 flex flex-col gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleResetView}
          className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          title="Reset view"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <div className="text-[10px] text-center text-muted-foreground mt-1">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-6 right-6 bg-sidebar/90 backdrop-blur-md border border-white/10 rounded-lg p-4 text-xs space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-accent" />
          <span className="font-bold text-accent uppercase tracking-wide">Display</span>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="show-connected" className="text-sm text-muted-foreground cursor-pointer">
            Connected scholars only
          </Label>
          <Switch
            id="show-connected"
            checked={showOnlyConnected}
            onCheckedChange={setShowOnlyConnected}
            disabled={focusOnSelected}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="highlight-selected" className="text-sm text-muted-foreground cursor-pointer">
            Highlight selected
          </Label>
          <Switch
            id="highlight-selected"
            checked={highlightSelected}
            onCheckedChange={setHighlightSelected}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="focus-selected" className="text-sm text-muted-foreground cursor-pointer">
            Focus on selected
          </Label>
          <Switch
            id="focus-selected"
            checked={focusOnSelected}
            onCheckedChange={setFocusOnSelected}
          />
        </div>
        
        {selectedScholar && (
          <div className="pt-2 border-t border-white/10">
            <div className="text-accent font-medium">{selectedScholar.name}</div>
            <div className="text-muted-foreground/70">
              {selectedScholarConnections.size - 1} connections
            </div>
            <button 
              onClick={() => onSelectScholar(null as any)}
              className="mt-1 text-xs text-white/50 hover:text-white underline"
            >
              Clear selection
            </button>
          </div>
        )}
        
        {!selectedScholar && (
          <div className="text-muted-foreground/70 italic">
            Click a scholar to see connections
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 right-6 bg-sidebar/90 backdrop-blur-md border border-white/10 rounded-lg p-4 text-xs space-y-2">
        <div className="font-bold text-accent mb-2">Relationship Domains</div>
        
        {connectionCounts.biographical > 0 && (
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3" style={{ color: DOMAIN_COLORS.biographical }} />
            <div className="w-6 h-0.5" style={{ backgroundColor: DOMAIN_COLORS.biographical }} />
            <span className="text-muted-foreground">
              Biographical ({connectionCounts.biographical})
            </span>
          </div>
        )}
        
        {connectionCounts.textual > 0 && (
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3" style={{ color: DOMAIN_COLORS.textual }} />
            <div className="w-6 h-0.5" style={{ backgroundColor: DOMAIN_COLORS.textual }} />
            <span className="text-muted-foreground">
              Textual ({connectionCounts.textual})
            </span>
          </div>
        )}
        
        {connectionCounts.intellectual > 0 && (
          <div className="flex items-center gap-2">
            <Lightbulb className="w-3 h-3" style={{ color: DOMAIN_COLORS.intellectual }} />
            <div className="w-6 h-0.5 border-t-2 border-dashed" style={{ borderColor: DOMAIN_COLORS.intellectual }} />
            <span className="text-muted-foreground">
              Intellectual ({connectionCounts.intellectual})
            </span>
          </div>
        )}
        
        {connectionCounts.biographical === 0 && connectionCounts.textual === 0 && connectionCounts.intellectual === 0 && (
          <div className="text-muted-foreground italic">No relationships to display</div>
        )}
      </div>
    </div>
  );
};
