import { Info, ChevronRight, ChevronLeft, Users, FileText, Lightbulb } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { DbRelationship } from '@/hooks/useScholars';
import { useRelationshipFilters } from '@/contexts/RelationshipFilterContext';

interface MapLegendProps {
  showConnections?: boolean;
  showMigrations?: boolean;
  relationships?: DbRelationship[];
}

// Multi-dimensional relationship domain colors
const DOMAIN_COLORS = {
  biographical: { color: 'bg-rose-500', lineClass: 'border-rose-500', label: 'Biographical', Icon: Users },
  textual: { color: 'bg-emerald-500', lineClass: 'border-emerald-500', label: 'Textual', Icon: FileText },
  intellectual: { color: 'bg-violet-500', lineClass: 'border-violet-500', label: 'Intellectual', Icon: Lightbulb },
};

// Legacy connection types for backward compatibility
const CONNECTION_TYPE_CONFIG: Record<string, { color: string; label: string; style: 'solid' | 'dashed' }> = {
  educational: { color: 'bg-[#22c55e]', label: 'Educational', style: 'solid' },
  family: { color: 'bg-[#f59e0b]', label: 'Family', style: 'solid' },
  literary: { color: 'bg-[#3b82f6]', label: 'Literary', style: 'dashed' },
};

export function MapLegend({ showConnections = false, showMigrations = false, relationships = [] }: MapLegendProps) {
  const [expanded, setExpanded] = useState(false);
  const { filters } = useRelationshipFilters();

  const legendItems = [
    { color: 'bg-[#c9a961]', label: 'Rashi (Foundational)' },
    { color: 'bg-[#ea580c]', label: 'Grandsons' },
    { color: 'bg-[#facc15]', label: 'Direct Students' },
    { color: 'bg-[#f59e0b]', label: 'Rishonim Period' },
    { color: 'bg-[#22c55e]', label: 'Acharonim Period' },
    { color: 'bg-[#6366f1]', label: 'Supercommentators' },
    { color: 'bg-[#8b7355]', label: 'Other Scholars' },
  ];

  // Active domains based on filters
  const activeDomains = useMemo(() => {
    return Object.entries(filters.domains)
      .filter(([_, enabled]) => enabled)
      .map(([domain]) => DOMAIN_COLORS[domain as keyof typeof DOMAIN_COLORS]);
  }, [filters.domains]);

  // Dynamically determine which connection types exist in the data (legacy)
  const activeConnectionTypes = useMemo(() => {
    const types = new Set(relationships.map(r => r.type));
    return Array.from(types)
      .filter(type => CONNECTION_TYPE_CONFIG[type])
      .map(type => CONNECTION_TYPE_CONFIG[type]);
  }, [relationships]);

  const migrationItems = [
    { icon: '⚠️', label: 'Expulsion' },
    { icon: '🔥', label: 'Persecution' },
    { icon: '🏃', label: 'Flight' },
    { icon: '📚', label: 'Scholarly Movement' },
  ];

  return (
    <div className="relative">
      {/* Header with collapse toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full gap-2 text-xs uppercase tracking-widest text-accent font-bold hover:text-accent/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span>Legend</span>
        </div>
        {expanded ? (
          <ChevronLeft className="w-4 h-4 text-white/40" />
        ) : (
          <ChevronRight className="w-4 h-4 text-white/40" />
        )}
      </button>

      {/* Horizontal slide-out panel */}
      <div className={cn(
        "absolute left-full top-0 ml-2 z-50 transition-all duration-300 origin-left",
        expanded 
          ? "opacity-100 translate-x-0 scale-x-100" 
          : "opacity-0 -translate-x-4 scale-x-0 pointer-events-none"
      )}>
        <div className="bg-sidebar/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-3 min-w-[200px] max-w-[280px]">
          <ScrollArea className="max-h-72">
            <div className="space-y-4 pr-2">
              {/* Scholar Types */}
              <div>
                <div className="text-sm font-semibold text-foreground/80 mb-2">
                  Scholar Types
                </div>
                <div className="space-y-2">
                  {legendItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={`w-3.5 h-3.5 rounded-full ${item.color} shadow-sm shrink-0`} />
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Relationship Domains - Multi-dimensional */}
              {showConnections && activeDomains.length > 0 && (
                <div className="pt-3 border-t border-white/10">
                  <div className="text-sm font-semibold text-foreground/80 mb-2">
                    Relationship Types
                  </div>
                  <div className="space-y-2">
                    {activeDomains.map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className={cn("w-5 h-0.5 rounded", item.color)} />
                        <item.Icon className="w-3.5 h-3.5 text-white/60" />
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Legacy Connection Types - Only show if multi-dimensional domains are all disabled */}
              {showConnections && activeDomains.length === 0 && activeConnectionTypes.length > 0 && (
                <div className="pt-3 border-t border-white/10">
                  <div className="text-sm font-semibold text-foreground/80 mb-2">
                    Connection Types
                  </div>
                  <div className="space-y-2">
                    {activeConnectionTypes.map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        {item.style === 'dashed' ? (
                          <div className="w-5 h-0 border-t-2 border-dashed border-[#3b82f6] shrink-0" />
                        ) : (
                          <div className={`w-5 h-0.5 ${item.color} shrink-0`} />
                        )}
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Migration Causes - Only show when enabled */}
              {showMigrations && (
                <div className="pt-3 border-t border-white/10">
                  <div className="text-sm font-semibold text-foreground/80 mb-2">
                    Migration Causes
                  </div>
                  <div className="space-y-2">
                    {migrationItems.map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-base shrink-0">{item.icon}</span>
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
