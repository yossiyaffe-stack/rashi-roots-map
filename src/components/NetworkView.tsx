import type { Scholar } from '@/data/scholars';
import { scholars as allScholars } from '@/data/scholars';

interface NetworkViewProps {
  scholars: Scholar[];
  selectedScholar: Scholar | null;
  onSelectScholar: (scholar: Scholar) => void;
}

export const NetworkView = ({ scholars, selectedScholar, onSelectScholar }: NetworkViewProps) => {
  const getConnections = (scholarId: number) => {
    const scholar = allScholars.find(s => s.id === scholarId);
    const connections: { from: number; to: number; type: string }[] = [];
    
    if (scholar?.teachers) {
      scholar.teachers.forEach(teacherId => {
        connections.push({ from: teacherId, to: scholarId, type: 'teacher' });
      });
    }
    if (scholar?.students) {
      scholar.students.forEach(studentId => {
        connections.push({ from: scholarId, to: studentId, type: 'student' });
      });
    }
    
    return connections;
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" height="600" className="min-w-[1000px]">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" className="fill-secondary" />
          </marker>
          <linearGradient id="nodeGradientRashi" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(43 52% 51%)" />
            <stop offset="100%" stopColor="hsl(45 70% 65%)" />
          </linearGradient>
          <linearGradient id="nodeGradientCommentator" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(30 24% 53%)" />
            <stop offset="100%" stopColor="hsl(30 25% 35%)" />
          </linearGradient>
          <linearGradient id="nodeGradientOther" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(30 25% 35%)" />
            <stop offset="100%" stopColor="hsl(25 35% 18%)" />
          </linearGradient>
        </defs>

        {/* Draw connections first (behind nodes) */}
        {scholars.map((scholar) => {
          const connections = getConnections(scholar.id);
          const idx = scholars.findIndex(s => s.id === scholar.id);
          
          return connections.map((conn, cidx) => {
            const fromIdx = scholars.findIndex(s => s.id === conn.from);
            const toIdx = scholars.findIndex(s => s.id === conn.to);
            
            if (fromIdx === -1 || toIdx === -1) return null;
            
            const x1 = 150 + (fromIdx % 4) * 250;
            const y1 = 100 + Math.floor(fromIdx / 4) * 150;
            const x2 = 150 + (toIdx % 4) * 250;
            const y2 = 100 + Math.floor(toIdx / 4) * 150;
            
            return (
              <line
                key={`${conn.from}-${conn.to}-${cidx}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className="stroke-secondary"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
                opacity="0.4"
              />
            );
          });
        })}

        {/* Draw nodes */}
        {scholars.map((scholar, idx) => {
          const x = 150 + (idx % 4) * 250;
          const y = 100 + Math.floor(idx / 4) * 150;
          const radius = scholar.importance / 5;
          
          const gradientId = scholar.id === 1 
            ? 'url(#nodeGradientRashi)' 
            : scholar.commentariesOnRashi 
              ? 'url(#nodeGradientCommentator)' 
              : 'url(#nodeGradientOther)';

          return (
            <g key={scholar.id}>
              <circle
                cx={x}
                cy={y}
                r={radius}
                fill={gradientId}
                className="stroke-brown-deep stroke-2 cursor-pointer transition-all hover:brightness-110"
                style={{ 
                  transform: selectedScholar?.id === scholar.id ? 'scale(1.1)' : 'scale(1)',
                  transformOrigin: `${x}px ${y}px`
                }}
                onClick={() => onSelectScholar(scholar)}
              />
              <text
                x={x}
                y={y + radius + 20}
                textAnchor="middle"
                className="fill-foreground text-xs font-medium pointer-events-none"
              >
                {scholar.name.split('(')[0].trim()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
