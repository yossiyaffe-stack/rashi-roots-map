import { cn } from '@/lib/utils';
import type { DbScholar } from '@/hooks/useScholars';
import { InfluenceScoreBadge } from '@/components/InfluenceScoreBadge';
import { ImpressiveStatHighlight } from '@/components/ScoreStatsBadge';
import type { ScholarInfluenceScore } from '@/hooks/useInfluenceScores';
import { type DomainId } from '@/lib/domains';

interface ScholarListItemProps {
  scholar: DbScholar;
  isSelected: boolean;
  onClick: () => void;
  influenceScore?: ScholarInfluenceScore;
  domain?: DomainId;
}

export function ScholarListItem({ scholar, isSelected, onClick, influenceScore, domain = 'all' }: ScholarListItemProps) {
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
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-foreground truncate">{scholar.name}</span>
          {influenceScore && (
            <InfluenceScoreBadge scoreData={influenceScore} size="sm" domain={domain} />
          )}
        </div>
        {scholar.hebrew_name && (
          <span className="font-hebrew text-accent text-sm shrink-0">{scholar.hebrew_name}</span>
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
      
      {/* Impressive stat highlight */}
      {influenceScore && (
        <div className="mt-2">
          <ImpressiveStatHighlight
            manuscripts={influenceScore.manuscripts_cumulative}
            editions={influenceScore.print_editions}
            regions={influenceScore.geographic_regions}
          />
        </div>
      )}
    </div>
  );
}