import { useMemo } from 'react';
import type { DbScholar, DbRelationship } from '@/hooks/useScholars';

interface NetworkViewProps {
  scholars: DbScholar[];
  relationships: DbRelationship[];
  selectedScholar: DbScholar | null;
  onSelectScholar: (scholar: DbScholar) => void;
}

export const NetworkView = ({ 
  scholars, 
  relationships, 
  selectedScholar, 
  onSelectScholar 
}: NetworkViewProps) => {
  
  const connections = useMemo(() => {
    return relationships.filter(r => r.from_scholar_id && r.to_scholar_id);
  }, [relationships]);

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

  // Simple grid layout
  const getNodePosition = (idx: number, total: number) => {
    const cols = Math.ceil(Math.sqrt(total));
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const spacing = 180;
    const x = 120 + col * spacing;
    const y = 80 + row * spacing;
    return { x, y };
  };

  const scholarPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    scholars.forEach((s, idx) => {
      positions[s.id] = getNodePosition(idx, scholars.length);
    });
    return positions;
  }, [scholars]);

  const svgHeight = Math.max(600, Math.ceil(scholars.length / 4) * 180 + 100);

  return (
    <div className="w-full h-full overflow-auto p-6">
      <svg width="100%" height={svgHeight} className="min-w-[800px]">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" className="fill-accent" />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Draw connections first (behind nodes) */}
        {connections.map((conn, idx) => {
          const fromPos = scholarPositions[conn.from_scholar_id!];
          const toPos = scholarPositions[conn.to_scholar_id!];
          
          if (!fromPos || !toPos) return null;
          
          const isEducational = conn.type === 'educational';
          const isLiterary = conn.type === 'literary';
          
          return (
            <line
              key={`${conn.from_scholar_id}-${conn.to_scholar_id}-${idx}`}
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              stroke={isEducational ? '#f59e0b' : isLiterary ? '#3b82f6' : '#6b7280'}
              strokeWidth="2"
              strokeDasharray={isLiterary ? "5,5" : "none"}
              markerEnd="url(#arrowhead)"
              opacity="0.5"
            />
          );
        })}

        {/* Draw nodes */}
        {scholars.map((scholar) => {
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
              
              {/* Hebrew name on hover */}
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
      <div className="absolute bottom-6 left-6 bg-sidebar/90 backdrop-blur-md border border-white/10 rounded-lg p-4 text-xs space-y-2">
        <div className="font-bold text-accent mb-2">Connection Types</div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-gray-500" />
          <span className="text-muted-foreground">Son / Son-in-law / Grandson</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-amber-500" />
          <span className="text-muted-foreground">Teacher-Student</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-blue-500" style={{ borderTop: '2px dashed' }} />
          <span className="text-muted-foreground">Literary</span>
        </div>
      </div>
    </div>
  );
};
