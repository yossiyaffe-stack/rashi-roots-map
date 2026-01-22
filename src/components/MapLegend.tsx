import { Info } from 'lucide-react';

export function MapLegend() {
  const legendItems = [
    { color: 'bg-rose-500', label: 'Rashi (Foundational)' },
    { color: 'bg-amber-500', label: 'Rishonim Period' },
    { color: 'bg-blue-500', label: 'Supercommentators' },
    { color: 'bg-violet-500', label: 'Later Scholars' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-bold">
        <Info className="w-3.5 h-3.5" />
        Legend
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
