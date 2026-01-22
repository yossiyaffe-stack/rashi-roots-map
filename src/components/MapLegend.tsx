import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface MapLegendProps {
  showConnections?: boolean;
  showMigrations?: boolean;
}

export function MapLegend({ showConnections = false, showMigrations = false }: MapLegendProps) {
  const [expanded, setExpanded] = useState(true);

  const legendItems = [
    { color: 'bg-[#c9a961]', label: 'Rashi (Foundational)' },
    { color: 'bg-[#ea580c]', label: 'Grandsons' },
    { color: 'bg-[#facc15]', label: 'Direct Students' },
    { color: 'bg-[#f59e0b]', label: 'Rishonim Period' },
    { color: 'bg-[#22c55e]', label: 'Acharonim Period' },
    { color: 'bg-[#6366f1]', label: 'Supercommentators' },
    { color: 'bg-[#8b7355]', label: 'Other Scholars' },
  ];

  const connectionItems = [
    { color: 'bg-[#22c55e]', label: 'Educational', style: 'solid' },
    { color: 'bg-[#f59e0b]', label: 'Family', style: 'solid' },
    { color: 'bg-[#3b82f6]', label: 'Literary', style: 'dashed' },
  ];

  const migrationItems = [
    { icon: '⚠️', label: 'Expulsion' },
    { icon: '🔥', label: 'Persecution' },
    { icon: '🏃', label: 'Flight' },
    { icon: '📚', label: 'Scholarly Movement' },
  ];

  return (
    <div className="space-y-2">
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
          <ChevronUp className="w-4 h-4 text-white/40" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/40" />
        )}
      </button>

      {/* Collapsible content */}
      <div className={cn(
        "transition-all duration-200 overflow-hidden",
        expanded ? "max-h-80" : "max-h-0"
      )}>
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

            {/* Connection Types - Only show when enabled */}
            {showConnections && (
              <div className="pt-3 border-t border-white/10">
                <div className="text-sm font-semibold text-foreground/80 mb-2">
                  Connection Types
                </div>
                <div className="space-y-2">
                  {connectionItems.map((item) => (
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
  );
}
