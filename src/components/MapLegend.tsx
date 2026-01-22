import { Info } from 'lucide-react';

export function MapLegend() {
  const legendItems = [
    { color: 'bg-[#c9a961]', label: 'Rashi (Foundational)' },
    { color: 'bg-[#ea580c]', label: 'Grandsons' },
    { color: 'bg-[#facc15]', label: 'Direct Students' },
    { color: 'bg-[#f59e0b]', label: 'Rishonim Period' },
    { color: 'bg-[#22c55e]', label: 'Acharonim Period' },
    { color: 'bg-[#6366f1]', label: 'Supercommentators' },
    { color: 'bg-[#8b7355]', label: 'Other Scholars' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-bold">
        <Info className="w-3.5 h-3.5" />
        Scholar Types
      </div>
      <div className="space-y-2">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm`} />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
