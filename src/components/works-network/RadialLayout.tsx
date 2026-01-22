import { useMemo } from 'react';
import type { WorkWithAuthor, TextualRelationshipWithWorks } from '@/hooks/useWorks';
import { WorksLayoutProps, DEPTH_COLORS, CATEGORY_COLORS } from './types';

interface RadialLayoutProps extends WorksLayoutProps {
  centerWork: WorkWithAuthor | null;
}

export const RadialLayout = ({
  works,
  relationships,
  selectedWork,
  onSelectWork,
  workDepthLevels,
  selectedWorkConnections,
  highlightSelected,
  viewWidth,
  viewHeight,
  centerWork,
  onHoverWork,
}: RadialLayoutProps) => {
  const centerX = viewWidth / 2;
  const centerY = viewHeight / 2;
  
  // Build connection tree from center work
  const { orderedWorks, workPositions } = useMemo(() => {
    const positions: Record<string, { x: number; y: number; depth: number; ring: number }> = {};
    
    if (!centerWork) {
      // No center selected - show all works in a simple ring
      const radius = Math.min(viewWidth, viewHeight) * 0.35;
      works.forEach((work, i) => {
        const angle = (i / works.length) * 2 * Math.PI - Math.PI / 2;
        positions[work.id] = {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          depth: workDepthLevels[work.id] ?? 0,
          ring: 1,
        };
      });
      return { orderedWorks: works, workPositions: positions };
    }

    // Center work at center
    positions[centerWork.id] = {
      x: centerX,
      y: centerY,
      depth: workDepthLevels[centerWork.id] ?? 0,
      ring: 0,
    };

    // Build ring structure - works connected to center
    const rings: Map<number, WorkWithAuthor[]> = new Map();
    const visited = new Set<string>([centerWork.id]);
    
    // Find direct connections (ring 1)
    const ring1: WorkWithAuthor[] = [];
    relationships.forEach(rel => {
      if (rel.work_id === centerWork.id && rel.related_work_id) {
        const work = works.find(w => w.id === rel.related_work_id);
        if (work && !visited.has(work.id)) {
          ring1.push(work);
          visited.add(work.id);
        }
      }
      if (rel.related_work_id === centerWork.id && rel.work_id) {
        const work = works.find(w => w.id === rel.work_id);
        if (work && !visited.has(work.id)) {
          ring1.push(work);
          visited.add(work.id);
        }
      }
    });
    rings.set(1, ring1);

    // Find second-degree connections (ring 2)
    const ring2: WorkWithAuthor[] = [];
    ring1.forEach(r1Work => {
      relationships.forEach(rel => {
        if (rel.work_id === r1Work.id && rel.related_work_id) {
          const work = works.find(w => w.id === rel.related_work_id);
          if (work && !visited.has(work.id)) {
            ring2.push(work);
            visited.add(work.id);
          }
        }
        if (rel.related_work_id === r1Work.id && rel.work_id) {
          const work = works.find(w => w.id === rel.work_id);
          if (work && !visited.has(work.id)) {
            ring2.push(work);
            visited.add(work.id);
          }
        }
      });
    });
    rings.set(2, ring2);

    // Find third-degree connections (ring 3)
    const ring3: WorkWithAuthor[] = [];
    ring2.forEach(r2Work => {
      relationships.forEach(rel => {
        if (rel.work_id === r2Work.id && rel.related_work_id) {
          const work = works.find(w => w.id === rel.related_work_id);
          if (work && !visited.has(work.id)) {
            ring3.push(work);
            visited.add(work.id);
          }
        }
        if (rel.related_work_id === r2Work.id && rel.work_id) {
          const work = works.find(w => w.id === rel.work_id);
          if (work && !visited.has(work.id)) {
            ring3.push(work);
            visited.add(work.id);
          }
        }
      });
    });
    rings.set(3, ring3);

    // Position each ring - much larger spacing
    const baseRadius = 220;
    const ringSpacing = 240;
    
    rings.forEach((ringWorks, ringNum) => {
      const radius = baseRadius + (ringNum - 1) * ringSpacing;
      // Sort by importance (year written as proxy - older = more foundational)
      const sorted = [...ringWorks].sort((a, b) => (a.year_written ?? 1500) - (b.year_written ?? 1500));
      
      sorted.forEach((work, i) => {
        const angle = (i / sorted.length) * 2 * Math.PI - Math.PI / 2;
        // Add slight randomness to prevent perfect circles
        const radiusJitter = (Math.random() - 0.5) * 20;
        
        positions[work.id] = {
          x: centerX + Math.cos(angle) * (radius + radiusJitter),
          y: centerY + Math.sin(angle) * (radius + radiusJitter),
          depth: workDepthLevels[work.id] ?? 0,
          ring: ringNum,
        };
      });
    });

    // Add remaining unconnected works in outer ring
    const unconnected = works.filter(w => !visited.has(w.id));
    if (unconnected.length > 0) {
      const outerRadius = baseRadius + 3 * ringSpacing;
      unconnected.forEach((work, i) => {
        const angle = (i / unconnected.length) * 2 * Math.PI - Math.PI / 2;
        positions[work.id] = {
          x: centerX + Math.cos(angle) * outerRadius,
          y: centerY + Math.sin(angle) * outerRadius,
          depth: workDepthLevels[work.id] ?? 0,
          ring: 4,
        };
      });
    }

    const ordered = [centerWork, ...ring1, ...ring2, ...ring3, ...unconnected];
    return { orderedWorks: ordered, workPositions: positions };
  }, [works, relationships, centerWork, workDepthLevels, viewWidth, viewHeight, centerX, centerY]);

  const getWorkColor = (work: WorkWithAuthor) => {
    if (selectedWork?.id === work.id) return 'hsl(var(--accent))';
    if (centerWork?.id === work.id) return '#fbbf24'; // Gold for center
    if (highlightSelected && selectedWork && !selectedWorkConnections.has(work.id)) {
      return 'hsl(var(--muted))';
    }
    const depth = workDepthLevels[work.id] ?? 0;
    return DEPTH_COLORS[depth] ?? DEPTH_COLORS[3];
  };

  const isRelationshipHighlighted = (rel: TextualRelationshipWithWorks) => {
    if (!highlightSelected || !selectedWork) return true;
    return rel.work_id === selectedWork.id || rel.related_work_id === selectedWork.id;
  };

  return (
    <g>
      {/* Concentric ring guides */}
      {centerWork && [1, 2, 3].map(ring => (
        <circle
          key={ring}
          cx={centerX}
          cy={centerY}
          r={220 + (ring - 1) * 240}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={1}
          strokeDasharray="6,12"
          opacity={0.3}
        />
      ))}

      {/* Relationship lines */}
      {relationships.map(rel => {
        if (!rel.work_id || !rel.related_work_id) return null;
        const fromPos = workPositions[rel.work_id];
        const toPos = workPositions[rel.related_work_id];
        if (!fromPos || !toPos) return null;

        const highlighted = isRelationshipHighlighted(rel);
        const color = CATEGORY_COLORS[rel.relationship_category] || CATEGORY_COLORS.default;

        // Curved path - curve away from center for radial effect
        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Control point perpendicular to line, curved outward
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = (fromPos.y + toPos.y) / 2;
        const perpX = -dy / dist * 30;
        const perpY = dx / dist * 30;

        return (
          <path
            key={rel.id}
            d={`M ${fromPos.x} ${fromPos.y} Q ${midX + perpX} ${midY + perpY} ${toPos.x} ${toPos.y}`}
            stroke={color}
            strokeWidth={highlighted ? 2.5 : 1}
            strokeOpacity={highlighted ? 0.85 : 0.15}
            fill="none"
            strokeDasharray={rel.relationship_category === 'supercommentary' ? '6,3' : undefined}
          />
        );
      })}

      {/* Work nodes */}
      {orderedWorks.map(work => {
        const pos = workPositions[work.id];
        if (!pos) return null;

        const isSelected = selectedWork?.id === work.id;
        const isCenter = centerWork?.id === work.id;
        const color = getWorkColor(work);
        const dimmed = highlightSelected && selectedWork && !selectedWorkConnections.has(work.id);

        // Center node is larger - all nodes much bigger now
        const nodeWidth = isCenter ? 260 : 200;
        const nodeHeight = isCenter ? 90 : 70;

        return (
          <g
            key={work.id}
            transform={`translate(${pos.x}, ${pos.y})`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectWork(isSelected ? null : work);
            }}
            onMouseEnter={() => work.manuscript_url && onHoverWork?.({ work, position: pos })}
            onMouseLeave={() => onHoverWork?.(null)}
            style={{ cursor: 'pointer' }}
            className="transition-opacity duration-200"
          >
            {/* Center glow effect */}
            {isCenter && (
              <ellipse
                cx={0}
                cy={0}
                rx={nodeWidth / 2 + 20}
                ry={nodeHeight / 2 + 15}
                fill="url(#center-glow)"
                opacity={0.4}
              />
            )}

            {/* Selection glow */}
            {isSelected && !isCenter && (
              <rect
                x={-nodeWidth / 2 - 5}
                y={-nodeHeight / 2 - 5}
                width={nodeWidth + 10}
                height={nodeHeight + 10}
                rx={14}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="3"
                opacity="0.6"
              />
            )}
            
            {/* Node background */}
            <rect
              x={-nodeWidth / 2}
              y={-nodeHeight / 2}
              width={nodeWidth}
              height={nodeHeight}
              rx={isCenter ? 14 : 10}
              fill={isSelected || isCenter ? color : 'hsl(var(--card))'}
              stroke={color}
              strokeWidth={isCenter ? 4 : isSelected ? 3 : 2}
              opacity={dimmed ? 0.25 : 1}
              className="transition-all duration-200"
            />

            {/* Manuscript indicator */}
            {work.manuscript_url && !dimmed && (
              <g transform={`translate(${nodeWidth / 2 - 18}, ${-nodeHeight / 2 + 8})`}>
                <circle r={10} fill="hsl(var(--card))" stroke={color} strokeWidth={1.5} />
                <text
                  textAnchor="middle"
                  dy={4}
                  fontSize={12}
                  fill={color}
                >
                  📜
                </text>
              </g>
            )}
            
            {/* Work title - larger fonts */}
            <text
              textAnchor="middle"
              dy={isCenter ? -10 : -6}
              fill={isSelected || isCenter ? 'hsl(var(--card))' : 'hsl(var(--foreground))'}
              fontSize={isCenter ? 18 : 15}
              fontWeight={700}
              opacity={dimmed ? 0.25 : 1}
            >
              {work.title.length > (isCenter ? 24 : 20) ? work.title.slice(0, isCenter ? 22 : 18) + '...' : work.title}
            </text>
            
            {/* Author & year - larger fonts */}
            <text
              textAnchor="middle"
              dy={isCenter ? 14 : 12}
              fill={isSelected || isCenter ? 'hsl(var(--card))' : 'hsl(var(--muted-foreground))'}
              fontSize={isCenter ? 14 : 12}
              opacity={dimmed ? 0.25 : 0.85}
            >
              {work.author_name} {work.year_written ? `(${work.year_written})` : ''}
            </text>
          </g>
        );
      })}

      {/* Center glow gradient definition */}
      <defs>
        <radialGradient id="center-glow">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>
    </g>
  );
};
