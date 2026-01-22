import { Info } from 'lucide-react';

interface MapLegendProps {
  showConnections?: boolean;
  showMigrations?: boolean;
}

export function MapLegend({ showConnections = false, showMigrations = false }: MapLegendProps) {
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
    <div className="space-y-3">
      {/* Scholar Types */}
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-bold mb-2">
          <Info className="w-3.5 h-3.5" />
          Scholar Types
        </div>
        <div className="space-y-1.5">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm`} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Types - Only show when enabled */}
      {showConnections && (
        <div className="pt-3 border-t border-white/10">
          <div className="text-xs uppercase tracking-widest text-accent font-bold mb-2">
            Connection Types
          </div>
          <div className="space-y-1.5">
            {connectionItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                {item.style === 'dashed' ? (
                  <div className="w-4 h-0 border-t-2 border-dashed border-[#3b82f6]" />
                ) : (
                  <div className={`w-4 h-0.5 ${item.color}`} />
                )}
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Migration Causes - Only show when enabled */}
      {showMigrations && (
        <div className="pt-3 border-t border-white/10">
          <div className="text-xs uppercase tracking-widest text-accent font-bold mb-2">
            Migration Causes
          </div>
          <div className="space-y-1.5">
            {migrationItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm">{item.icon}</span>
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
