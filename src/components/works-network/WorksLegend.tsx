import { DEPTH_COLORS, CATEGORY_COLORS, LayoutMode } from './types';

interface WorksLegendProps {
  layoutMode: LayoutMode;
}

export const WorksLegend = ({ layoutMode }: WorksLegendProps) => {
  return (
    <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur p-3 rounded-lg border border-border shadow-lg">
      <h4 className="text-xs font-semibold text-foreground mb-2">
        {layoutMode === 'radial' ? 'Distance from Center' : 'Depth Levels'}
      </h4>
      <div className="space-y-1.5 mb-3">
        {layoutMode === 'radial' ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-400" />
              <span className="text-xs text-muted-foreground">Center (Selected)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-dashed border-muted-foreground opacity-50" />
              <span className="text-xs text-muted-foreground">Ring 1 (Direct)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-dashed border-muted-foreground opacity-30" />
              <span className="text-xs text-muted-foreground">Ring 2+ (Indirect)</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: DEPTH_COLORS[0] }} />
              <span className="text-xs text-muted-foreground">Original Texts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: DEPTH_COLORS[1] }} />
              <span className="text-xs text-muted-foreground">Commentaries</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: DEPTH_COLORS[2] }} />
              <span className="text-xs text-muted-foreground">Supercommentaries</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: DEPTH_COLORS[3] }} />
              <span className="text-xs text-muted-foreground">Super-super</span>
            </div>
          </>
        )}
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
  );
};
