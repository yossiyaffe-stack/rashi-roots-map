import { useMemo } from 'react';
import type { WorkWithAuthor, TextualRelationshipWithWorks } from '@/hooks/useWorks';
import { WorksLayoutProps, DEPTH_COLORS, CATEGORY_COLORS } from './types';



export const TimelineLayout = ({
  works,
  relationships,
  selectedWork,
  onSelectWork,
  workDepthLevels,
  selectedWorkConnections,
  highlightSelected,
  viewWidth,
  viewHeight,
  onHoverWork,
}: WorksLayoutProps) => {
  // Sort works by year
  const sortedWorks = useMemo(() => {
    return [...works].sort((a, b) => {
      const yearA = a.year_written ?? 1100;
      const yearB = b.year_written ?? 1100;
      return yearA - yearB;
    });
  }, [works]);

  // Get min/max years for timeline
  const { minYear, maxYear } = useMemo(() => {
    let min = Infinity, max = -Infinity;
    sortedWorks.forEach(w => {
      const year = w.year_written ?? 1100;
      if (year < min) min = year;
      if (year > max) max = year;
    });
    return { minYear: min === Infinity ? 1000 : min, maxYear: max === -Infinity ? 1600 : max };
  }, [sortedWorks]);

  // Timeline axis position - enlarged for readability
  const timelineX = 120;
  const contentStartX = 200;
  const yearSpan = maxYear - minYear || 100;

  // Position works chronologically with depth-based horizontal offset
  const workPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number; depth: number }> = {};
    
    // Group works by depth and track positions
    const depthYearSlots: Record<number, Record<number, number>> = {};
    
    const paddingTop = 120;
    const paddingBottom = 120;
    const usableHeight = viewHeight - paddingTop - paddingBottom;
    const nodeHeight = 100;
    
    sortedWorks.forEach(work => {
      const year = work.year_written ?? 1100;
      const depth = workDepthLevels[work.id] ?? 0;
      
      // Y position based on year (top to bottom chronologically)
      const yearProgress = (year - minYear) / yearSpan;
      const baseY = paddingTop + yearProgress * usableHeight;
      
      // X position based on depth level - much larger spacing
      const depthOffset = depth * 320;
      const x = contentStartX + depthOffset + 120;
      
      // Avoid vertical overlapping within same depth column
      if (!depthYearSlots[depth]) depthYearSlots[depth] = {};
      const roundedY = Math.round(baseY / nodeHeight) * nodeHeight;
      depthYearSlots[depth][roundedY] = (depthYearSlots[depth][roundedY] || 0) + 1;
      const slotCount = depthYearSlots[depth][roundedY];
      const verticalOffset = (slotCount - 1) * (nodeHeight + 20);
      
      positions[work.id] = {
        x: x,
        y: baseY + verticalOffset,
        depth,
      };
    });

    return positions;
  }, [sortedWorks, workDepthLevels, viewHeight, minYear, yearSpan]);

  const getWorkColor = (work: WorkWithAuthor) => {
    if (selectedWork?.id === work.id) return 'hsl(var(--accent))';
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

  // Generate year markers for timeline
  const yearMarkers = useMemo(() => {
    const markers: number[] = [];
    const step = 50; // 50-year intervals
    const startYear = Math.floor(minYear / step) * step;
    for (let year = startYear; year <= maxYear + step; year += step) {
      markers.push(year);
    }
    return markers;
  }, [minYear, maxYear]);

  return (
    <g>
      {/* Timeline axis */}
      <line
        x1={timelineX}
        y1={40}
        x2={timelineX}
        y2={viewHeight - 40}
        stroke="hsl(var(--border))"
        strokeWidth={2}
      />
      
      {/* Year markers */}
      {yearMarkers.map(year => {
        const yearProgress = (year - minYear) / yearSpan;
        const y = 100 + yearProgress * (viewHeight - 200);
        if (y < 60 || y > viewHeight - 60) return null;
        
        return (
          <g key={year}>
            <line
              x1={timelineX - 12}
              y1={y}
              x2={timelineX + 12}
              y2={y}
              stroke="hsl(var(--border))"
              strokeWidth={2}
            />
            <text
              x={timelineX - 18}
              y={y + 6}
              textAnchor="end"
              fill="hsl(var(--foreground))"
              fontSize={18}
              fontWeight={800}
            >
              {year}
            </text>
          </g>
        );
      })}

      {/* Depth level headers */}
      <g>
        {[0, 1, 2, 3].map(depth => (
          <text
            key={depth}
            x={contentStartX + depth * 320 + 120}
            y={50}
            textAnchor="middle"
            fill={DEPTH_COLORS[depth]}
            fontSize={16}
            fontWeight={700}
          >
            {depth === 0 ? 'Original Texts' : depth === 1 ? 'Commentaries' : depth === 2 ? 'Supercommentaries' : 'Super-super'}
          </text>
        ))}
      </g>

      {/* Relationship lines */}
      {relationships.map(rel => {
        if (!rel.work_id || !rel.related_work_id) return null;
        const fromPos = workPositions[rel.work_id];
        const toPos = workPositions[rel.related_work_id];
        if (!fromPos || !toPos) return null;

        const highlighted = isRelationshipHighlighted(rel);
        const color = CATEGORY_COLORS[rel.relationship_category] || CATEGORY_COLORS.default;

        // Curved path connecting works
        const midX = (fromPos.x + toPos.x) / 2;
        const midY = (fromPos.y + toPos.y) / 2;
        const curveOffset = Math.abs(fromPos.x - toPos.x) * 0.2;

        return (
          <path
            key={rel.id}
            d={`M ${fromPos.x} ${fromPos.y} Q ${midX - curveOffset} ${midY} ${toPos.x} ${toPos.y}`}
            stroke={color}
            strokeWidth={highlighted ? 2.5 : 1}
            strokeOpacity={highlighted ? 0.85 : 0.15}
            fill="none"
            strokeDasharray={rel.relationship_category === 'supercommentary' ? '6,3' : undefined}
          />
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
            onMouseEnter={() => work.manuscript_url && onHoverWork?.({ work, position: pos })}
            onMouseLeave={() => onHoverWork?.(null)}
            style={{ cursor: 'pointer' }}
            className="transition-opacity duration-200"
          >
            {/* Selection glow */}
            {isSelected && (
              <rect
                x={-113}
                y={-43}
                width={226}
                height={86}
                rx={14}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="4"
                opacity="0.6"
                filter="url(#work-glow)"
              />
            )}
            
            {/* Node background - much larger */}
            <rect
              x={-110}
              y={-40}
              width={220}
              height={80}
              rx={12}
              fill={isSelected ? color : 'hsl(var(--card))'}
              stroke={color}
              strokeWidth={isSelected ? 3 : 2}
              opacity={dimmed ? 0.25 : 1}
              className="transition-all duration-200"
            />

            {/* Manuscript indicator */}
            {work.manuscript_url && !dimmed && (
              <g transform="translate(95, -32)">
                <circle r={12} fill="hsl(var(--card))" stroke={color} strokeWidth={1.5} />
                <text
                  textAnchor="middle"
                  dy={5}
                  fontSize={14}
                  fill={color}
                >
                  📜
                </text>
              </g>
            )}
            
            {/* Work title - larger font */}
            <text
              textAnchor="middle"
              dy={-8}
              fill={isSelected ? 'hsl(var(--card))' : 'hsl(var(--foreground))'}
              fontSize={16}
              fontWeight={700}
              opacity={dimmed ? 0.25 : 1}
            >
              {work.title.length > 22 ? work.title.slice(0, 20) + '...' : work.title}
            </text>
            
            {/* Author & year - larger font */}
            <text
              textAnchor="middle"
              dy={16}
              fill={isSelected ? 'hsl(var(--card))' : 'hsl(var(--muted-foreground))'}
              fontSize={13}
              opacity={dimmed ? 0.25 : 0.85}
            >
              {work.author_name} {work.year_written ? `(${work.year_written})` : ''}
            </text>
          </g>
        );
      })}
    </g>
  );
};
