import { Info } from 'lucide-react';
import type { Scholar } from '@/data/scholars';

interface MapViewProps {
  scholars: Scholar[];
  selectedScholar: Scholar | null;
  onSelectScholar: (scholar: Scholar) => void;
}

export const MapView = ({ scholars, selectedScholar, onSelectScholar }: MapViewProps) => {
  // Simple projection for demonstration (Mercator-like)
  const project = (lat: number, lng: number) => {
    // Center on Europe
    const centerLng = 15;
    const centerLat = 50;
    const scale = 12;
    
    const x = 450 + (lng - centerLng) * scale;
    const y = 300 - (lat - centerLat) * scale;
    return { x, y };
  };

  return (
    <div className="relative">
      {/* Legend */}
      <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg mb-4 text-muted-foreground">
        <Info className="w-5 h-5 text-secondary" />
        <span>Click on locations to see historical context and place names</span>
      </div>

      <svg width="100%" height="600" className="border-2 border-primary rounded-lg bg-parchment">
        {/* Simplified Europe outline */}
        <defs>
          <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(35 25% 88%)" />
            <stop offset="100%" stopColor="hsl(40 20% 82%)" />
          </linearGradient>
        </defs>

        {/* Background regions (simplified) */}
        <ellipse cx="350" cy="280" rx="200" ry="150" fill="url(#mapGradient)" className="stroke-primary" strokeWidth="1" opacity="0.3" />
        <ellipse cx="550" cy="250" rx="150" ry="120" fill="url(#mapGradient)" className="stroke-primary" strokeWidth="1" opacity="0.3" />

        {/* Scholar markers */}
        {scholars.map(scholar => {
          const pos = project(scholar.location.lat, scholar.location.lng);
          const isRashi = scholar.id === 1;
          const isCommentator = !!scholar.commentariesOnRashi;
          const isSelected = selectedScholar?.id === scholar.id;
          
          return (
            <g key={scholar.id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={scholar.importance / 4}
                className={`
                  cursor-pointer transition-all duration-200
                  ${isRashi ? 'fill-primary' : isCommentator ? 'fill-secondary' : 'fill-brown-dark'}
                  stroke-brown-deep stroke-2
                  ${isSelected ? 'brightness-110' : 'hover:brightness-110'}
                `}
                style={{
                  transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                  transformOrigin: `${pos.x}px ${pos.y}px`
                }}
                onClick={() => onSelectScholar(scholar)}
              />
              <text
                x={pos.x}
                y={pos.y - scholar.importance / 4 - 8}
                textAnchor="middle"
                className="fill-foreground text-[11px] font-semibold pointer-events-none"
              >
                {scholar.location.city}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
