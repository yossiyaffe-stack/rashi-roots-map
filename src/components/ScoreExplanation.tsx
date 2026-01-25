import { HelpCircle, Star } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DOMAINS, getCanonicalMultiplier, isCanonicalInDomain, type DomainId } from '@/lib/domains';
import { cn } from '@/lib/utils';

interface ScoreExplanationProps {
  baseScore: number;
  displayScore: number;
  domain: DomainId;
  scholarSlug?: string | null;
  className?: string;
}

export function ScoreExplanation({
  baseScore,
  displayScore,
  domain,
  scholarSlug,
  className,
}: ScoreExplanationProps) {
  const multiplier = getCanonicalMultiplier(scholarSlug, domain);
  const isCanonical = isCanonicalInDomain(scholarSlug, domain);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button 
            className={cn(
              "inline-flex items-center justify-center w-4 h-4 rounded-full",
              "bg-white/10 hover:bg-white/20 transition-colors",
              className
            )}
          >
            <HelpCircle className="w-3 h-3 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-sidebar/95 backdrop-blur-sm border border-white/10 p-3 shadow-xl max-w-[240px] z-[9999]"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">Base Score</span>
              <span className="text-foreground font-medium">{baseScore}</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">Domain</span>
              <span className="text-foreground text-xs">{DOMAINS[domain].name}</span>
            </div>

            {multiplier !== 1.0 && (
              <>
                <div className="h-px bg-border/50" />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Canonical Multiplier</span>
                  <span className="text-amber-400 font-medium">×{multiplier.toFixed(1)}</span>
                </div>
              </>
            )}

            {isCanonical && (
              <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                <Star className="w-3 h-3 fill-current" />
                <span>Canonical work in this domain</span>
              </div>
            )}

            <div className="h-px bg-border/50" />
            
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-foreground">Final Score</span>
              <span className="text-foreground font-bold">{displayScore}/999</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
