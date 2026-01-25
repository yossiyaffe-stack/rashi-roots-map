import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info, BookOpen, Printer, Globe, Calendar, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInfluenceTier } from '@/hooks/useInfluenceScores';

interface ScoreStatsBadgeProps {
  score: number;
  manuscripts: number;
  editions: number;
  regions: number;
  periodStart?: number;
  hasMultiplier?: boolean;
  multiplier?: number;
  className?: string;
}

export function ScoreStatsBadge({ 
  score,
  manuscripts,
  editions,
  regions,
  periodStart,
  hasMultiplier = false,
  multiplier = 1,
  className,
}: ScoreStatsBadgeProps) {
  const tier = getInfluenceTier(score);
  const currentYear = new Date().getFullYear();
  const timeSpan = periodStart ? currentYear - periodStart : 0;
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-full font-bold border cursor-help',
              'transition-all hover:scale-105 px-2 py-0.5 text-xs',
              tier.bgColor, tier.textColor, tier.borderColor,
              hasMultiplier && 'ring-1 ring-amber-400/30',
              className
            )}
          >
            {hasMultiplier && (
              <Sparkles className="w-3 h-3 fill-current" />
            )}
            <span>{score}</span>
            <Info className="w-3 h-3 opacity-60" />
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-sidebar/95 backdrop-blur-sm border border-white/10 p-0 shadow-xl max-w-[260px] z-[9999]"
        >
          <div className="p-3 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className={cn('font-bold text-lg', tier.textColor)}>
                  {score}
                </span>
                <span className="text-muted-foreground text-xs">/999</span>
              </div>
              <Badge 
                variant="secondary" 
                className={cn('text-[10px]', tier.bgColor, tier.textColor)}
              >
                {tier.label}
              </Badge>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <StatBox 
                icon={<BookOpen className="w-3 h-3 text-amber-500" />}
                value={manuscripts}
                label="Manuscripts"
              />
              <StatBox 
                icon={<Printer className="w-3 h-3 text-emerald-500" />}
                value={editions}
                label="Editions"
              />
              <StatBox 
                icon={<Globe className="w-3 h-3 text-blue-500" />}
                value={regions}
                label="Regions"
              />
              <StatBox 
                icon={<Calendar className="w-3 h-3 text-purple-500" />}
                value={timeSpan}
                label="Years"
              />
            </div>
            
            {/* Multiplier info */}
            {hasMultiplier && multiplier > 1 && (
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-md px-2 py-1.5">
                <Sparkles className="w-3 h-3" />
                <span>Canonical ×{multiplier.toFixed(1)}</span>
              </div>
            )}
            
            <div className="text-[10px] text-center text-muted-foreground pt-1 border-t border-white/10">
              Click for detailed breakdown
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function StatBox({ 
  icon, 
  value, 
  label 
}: { 
  icon: React.ReactNode; 
  value: number; 
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 p-1.5 rounded bg-white/5">
      {icon}
      <div className="flex flex-col">
        <span className="text-xs font-bold text-foreground">{value.toLocaleString()}</span>
        <span className="text-[9px] text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

// Highlight badge for impressive single stat
interface ImpressiveStatProps {
  manuscripts: number;
  editions: number;
  regions: number;
  className?: string;
}

export function ImpressiveStatHighlight({ 
  manuscripts, 
  editions, 
  regions,
  className,
}: ImpressiveStatProps) {
  // Determine most impressive stat to highlight
  let stat: { icon: React.ReactNode; label: string; color: string } | null = null;
  
  if (editions > 200) {
    stat = {
      icon: <Printer className="w-3 h-3" />,
      label: `${editions}+ editions`,
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };
  } else if (manuscripts > 100) {
    stat = {
      icon: <BookOpen className="w-3 h-3" />,
      label: `${manuscripts}+ manuscripts`,
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
  } else if (regions > 20) {
    stat = {
      icon: <Globe className="w-3 h-3" />,
      label: `${regions}+ regions`,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
  } else if (editions > 50) {
    stat = {
      icon: <Printer className="w-3 h-3" />,
      label: `${editions} editions`,
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };
  }
  
  if (!stat) return null;
  
  return (
    <Badge 
      variant="outline" 
      className={cn('text-[10px] gap-1', stat.color, className)}
    >
      {stat.icon}
      {stat.label}
    </Badge>
  );
}
