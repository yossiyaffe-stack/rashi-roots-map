import { cn } from '@/lib/utils';
import type { DbScholar } from '@/hooks/useScholars';

interface ScholarListItemProps {
  scholar: DbScholar;
  isSelected: boolean;
  onClick: () => void;
}

export function ScholarListItem({ scholar, isSelected, onClick }: ScholarListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl cursor-pointer transition-all duration-300",
        isSelected
          ? "bg-white/10 border border-accent"
          : "border border-transparent hover:bg-white/5"
      )}
    >
      <div className="flex justify-between items-start">
        <span className="font-semibold text-foreground">{scholar.name}</span>
        {scholar.hebrew_name && (
          <span className="font-hebrew text-accent text-sm">{scholar.hebrew_name}</span>
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-2">
        <span>
          {scholar.birth_year && scholar.death_year 
            ? `${scholar.birth_year} – ${scholar.death_year}`
            : scholar.period || 'Unknown period'}
        </span>
        {scholar.birth_place && (
          <>
            <span className="opacity-50">•</span>
            <span>{scholar.birth_place}</span>
          </>
        )}
      </div>
    </div>
  );
}
