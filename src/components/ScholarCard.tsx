import { MapPin } from 'lucide-react';
import type { Scholar } from '@/data/scholars';
import { cn } from '@/lib/utils';
import { InfluenceScoreBadge } from '@/components/InfluenceScoreBadge';
import type { ScholarInfluenceScore } from '@/hooks/useInfluenceScores';

interface ScholarCardProps {
  scholar: Scholar;
  isSelected: boolean;
  onClick: () => void;
  influenceScore?: ScholarInfluenceScore;
}

export const ScholarCard = ({ scholar, isSelected, onClick, influenceScore }: ScholarCardProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border-2 p-4 cursor-pointer transition-all duration-300",
        "gradient-card border-primary hover:shadow-elevated hover:-translate-y-1 hover:border-secondary",
        isSelected && "bg-gradient-to-br from-secondary to-brown-dark text-primary-foreground shadow-elevated"
      )}
      onClick={onClick}
      style={{
        minWidth: `${Math.max(140, scholar.importance * 1.8)}px`,
        opacity: Math.max(0.7, scholar.importance / 100)
      }}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
      
      <div className="flex items-start justify-between gap-2">
        <div className="font-display text-base font-bold mb-0.5 leading-tight">
          {scholar.name.split('(')[0].trim()}
        </div>
        {influenceScore && (
          <InfluenceScoreBadge scoreData={influenceScore} size="sm" />
        )}
      </div>
      
      <div className={cn(
        "font-hebrew text-xl mb-2",
        isSelected ? "text-gold-light" : "text-secondary"
      )}>
        {scholar.hebrewName}
      </div>
      
      <div className={cn(
        "text-sm mb-2",
        isSelected ? "opacity-90" : "text-muted-foreground"
      )}>
        {scholar.birth}–{scholar.death}
      </div>
      
      <div className={cn(
        "flex items-center gap-1 text-sm italic",
        isSelected ? "opacity-80" : "text-muted-foreground"
      )}>
        <MapPin className="w-3.5 h-3.5" />
        {scholar.location.city}
      </div>
      
      {scholar.period && (
        <div className={cn(
          "mt-2 text-xs px-2 py-0.5 rounded inline-block",
          isSelected ? "bg-white/20" : "bg-secondary/10 text-secondary"
        )}>
          {scholar.period}
        </div>
      )}
      
      {scholar.commentariesOnRashi && (
        <div className={cn(
          "mt-2 text-xs font-semibold px-2 py-1 rounded text-center",
          isSelected ? "bg-white/30" : "bg-primary text-primary-foreground"
        )}>
          Commented on Rashi
        </div>
      )}
      
      {scholar.relationshipType && (
        <div className={cn(
          "mt-1 text-xs capitalize",
          isSelected ? "opacity-70" : "text-sepia"
        )}>
          {scholar.relationshipType.replace(/_/g, ' ')}
        </div>
      )}
    </div>
  );
};
