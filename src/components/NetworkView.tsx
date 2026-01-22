import { useMemo } from 'react';
import type { DbScholar, DbBiographicalRelationship, DbTextualRelationship, DbIntellectualRelationship } from '@/hooks/useScholars';
import { useRelationshipFilters } from '@/contexts/RelationshipFilterContext';
import { Users, FileText, Lightbulb } from 'lucide-react';

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
    return [...scholars].sort((a, b) => {
      const yearA = a.birth_year ?? 9999;
      const yearB = b.birth_year ?? 9999;
      return yearA - yearB;
    });
  }, [scholars]);

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
    <div className="w-full h-full overflow-auto p-6">
      <svg width={svgDimensions.width} height={svgDimensions.height} className="min-w-[800px]">
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
          
          // Offset lines slightly to prevent overlap
          const offset = idx * 0.5;
          
          return (
            <line
              key={`bio-${conn.id}`}
              x1={fromPos.x}
              y1={fromPos.y + offset}
              x2={toPos.x}
              y2={toPos.y + offset}
              stroke={DOMAIN_COLORS.biographical}
              strokeWidth="2"
              markerEnd="url(#arrowhead-bio)"
              opacity="0.6"
              className="transition-opacity hover:opacity-100"
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
          
          // Offset lines to prevent overlap with biographical
          const offset = -3 - (idx % 3);
          
          return (
            <line
              key={`text-${conn.id}`}
              x1={fromPos.x}
              y1={fromPos.y + offset}
              x2={toPos.x}
              y2={toPos.y + offset}
              stroke={DOMAIN_COLORS.textual}
              strokeWidth="2"
              strokeDasharray="6,3"
              markerEnd="url(#arrowhead-text)"
              opacity="0.6"
              className="transition-opacity hover:opacity-100"
            />
          );
        })}

        {/* Draw intellectual connections (scholar-to-work, shown as self-loops/arcs) */}
        {filteredIntellectual.map((conn, idx) => {
          const fromPos = scholarPositions[conn.scholar_id];
          
          if (!fromPos) return null;
          
          // Draw as a small arc indicating intellectual activity
          const arcRadius = 20 + (idx % 3) * 5;
          
          return (
            <path
              key={`int-${conn.id}`}
              d={`M ${fromPos.x - arcRadius} ${fromPos.y - 10} 
                  A ${arcRadius} ${arcRadius} 0 0 1 ${fromPos.x + arcRadius} ${fromPos.y - 10}`}
              fill="none"
              stroke={DOMAIN_COLORS.intellectual}
              strokeWidth="2"
              strokeDasharray="4,2"
              opacity="0.6"
              className="transition-opacity hover:opacity-100"
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
          const isRashi = scholar.name === 'Rashi';

          return (
            <g key={scholar.id} className="cursor-pointer" onClick={() => onSelectScholar(scholar)}>
              {/* Glow effect for Rashi */}
              {isRashi && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius + 8}
                  fill="none"
                  stroke="#fbbf24"
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
                className="transition-all hover:brightness-125"
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
      </svg>

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
