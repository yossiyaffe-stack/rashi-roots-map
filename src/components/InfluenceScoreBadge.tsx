import { TrendingUp, BookOpen, Printer, Globe } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { type ScholarInfluenceScore, getInfluenceTier } from '@/hooks/useInfluenceScores';

interface InfluenceScoreBadgeProps {
  scoreData: ScholarInfluenceScore;
  size?: 'sm' | 'md';
  className?: string;
}

export function InfluenceScoreBadge({ 
  scoreData, 
  size = 'sm',
  className 
}: InfluenceScoreBadgeProps) {
  const tier = getInfluenceTier(scoreData.score);
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 min-w-[32px]',
    md: 'text-xs px-2 py-1 min-w-[40px]',
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center justify-center rounded-full font-bold border cursor-help transition-all hover:scale-105',
              tier.bgColor,
              tier.textColor,
              tier.borderColor,
              sizeClasses[size],
              className
            )}
          >
            {scoreData.score}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-sidebar/95 backdrop-blur-sm border border-white/10 p-3 shadow-xl max-w-[220px]"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className={cn('font-bold text-sm', tier.textColor)}>
                {tier.label} Influence
              </span>
              <span className="text-foreground font-bold">{scoreData.score}</span>
            </div>
            
            <div className="h-px bg-border/50" />
            
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <BookOpen className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="text-muted-foreground">Manuscripts:</span>
                <span className="text-foreground font-medium ml-auto">
                  {scoreData.manuscripts_cumulative}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Printer className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="text-muted-foreground">Print Editions:</span>
                <span className="text-foreground font-medium ml-auto">
                  {scoreData.print_editions}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-blue-500 shrink-0" />
                <span className="text-muted-foreground">Regions:</span>
                <span className="text-foreground font-medium ml-auto">
                  {scoreData.geographic_regions}
                </span>
              </div>
            </div>
            
            <div className="h-px bg-border/50" />
            
            <div className="text-[10px] text-muted-foreground text-center">
              Data from {scoreData.period_start}–{scoreData.period_end}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Get CSS color values for use in map markers (non-React context)
 */
export function getInfluenceBadgeColors(score: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (score >= 700) {
    return {
      bg: 'rgba(245, 158, 11, 0.25)',
      text: '#fbbf24',
      border: 'rgba(245, 158, 11, 0.6)',
    };
  }
  if (score >= 400) {
    return {
      bg: 'rgba(203, 213, 225, 0.25)',
      text: '#cbd5e1',
      border: 'rgba(148, 163, 184, 0.6)',
    };
  }
  return {
    bg: 'rgba(194, 65, 12, 0.25)',
    text: '#fb923c',
    border: 'rgba(234, 88, 12, 0.6)',
  };
}
