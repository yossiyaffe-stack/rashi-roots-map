import { Crown, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface KingdomsLegendProps {
  isEmbedded?: boolean;
}

const KINGDOM_ITEMS = [
  { color: 'bg-red-600', label: 'Holy Roman Empire', years: '962–1806' },
  { color: 'bg-blue-500', label: 'Kingdom of France', years: '987–1792' },
  { color: 'bg-green-600', label: 'Ottoman Empire', years: '1299–1922' },
  { color: 'bg-purple-600', label: 'Polish-Lithuanian', years: '1569–1795' },
  { color: 'bg-amber-500', label: 'Iberian Kingdoms', years: 'c. 1000–1492' },
];

const REGION_ITEMS = [
  { color: '#c9a961', label: 'Champagne', years: 'Rashi era: 1040–1105' },
  { color: '#ea580c', label: 'Rhineland (ShUM)', years: 'c. 900–1350' },
];

export function KingdomsLegend({ isEmbedded = false }: KingdomsLegendProps) {
  const [expanded, setExpanded] = useState(false);

  const legendContent = (
    <ScrollArea className="max-h-[calc(100vh-200px)]">
      <div className="space-y-4 pr-2">
        {/* Major Kingdoms */}
        <div>
          <div className="text-sm font-semibold text-foreground/80 mb-2">
            Major Kingdoms
          </div>
          <div className="space-y-2">
            {KINGDOM_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-sm ${item.color} opacity-70 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-muted-foreground block truncate">{item.label}</span>
                  <span className="text-[10px] text-white/40">{item.years}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Jewish Centers */}
        <div className="pt-3 border-t border-white/10">
          <div className="text-sm font-semibold text-foreground/80 mb-2">
            Jewish Centers
          </div>
          <div className="space-y-2">
            {REGION_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div 
                  className="w-3.5 h-3.5 rounded-sm shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-muted-foreground block truncate">{item.label}</span>
                  <span className="text-[10px] text-white/40">{item.years}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );

  // Embedded mode - render content directly without toggle
  if (isEmbedded) {
    return legendContent;
  }

  // Standalone mode with toggle
  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full gap-2 text-xs uppercase tracking-widest text-accent font-bold hover:text-accent/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4" />
          <span>Kingdoms</span>
        </div>
        {expanded ? (
          <ChevronLeft className="w-4 h-4 text-white/40" />
        ) : (
          <ChevronRight className="w-4 h-4 text-white/40" />
        )}
      </button>

      <div className={cn(
        "absolute left-full top-0 ml-2 z-50 transition-all duration-300 origin-left",
        expanded 
          ? "opacity-100 translate-x-0 scale-x-100" 
          : "opacity-0 -translate-x-4 scale-x-0 pointer-events-none"
      )}>
        <div className="bg-sidebar/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl p-3 min-w-[200px] max-w-[280px]">
          {legendContent}
        </div>
      </div>
    </div>
  );
}
