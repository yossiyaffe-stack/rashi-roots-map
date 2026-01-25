import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Globe, Printer, TrendingUp, Calendar, Sparkles, Award, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useWorkSourceCounts } from '@/hooks/useWorkSourceCounts';

interface WorkScoreBreakdownProps {
  workId: string;
  workTitle: string;
  yearWritten?: number | null;
  compact?: boolean;
}

// Compute a simple score for a work based on source data
function computeWorkScore(manuscripts: number, editions: number, regions: number, yearWritten?: number | null) {
  const manuscriptPoints = manuscripts * 2;
  const printPoints = editions * 10;
  const regionPoints = regions * 15;
  const rawScore = manuscriptPoints + printPoints + regionPoints;
  
  // Apply logarithmic scaling similar to scholar scores
  if (rawScore === 0) return { rawScore: 0, displayScore: 0 };
  
  const logScore = Math.log10(rawScore + 1) * 150;
  const displayScore = Math.min(999, Math.round(logScore));
  
  return { rawScore, displayScore };
}

function getInfluenceTier(score: number) {
  if (score >= 700) {
    return { tier: 'gold', label: 'Foundational', bgColor: 'bg-amber-500/20', textColor: 'text-amber-400', borderColor: 'border-amber-500/30' };
  } else if (score >= 400) {
    return { tier: 'silver', label: 'Highly Influential', bgColor: 'bg-slate-400/20', textColor: 'text-slate-300', borderColor: 'border-slate-400/30' };
  } else if (score >= 100) {
    return { tier: 'bronze', label: 'Influential', bgColor: 'bg-orange-600/20', textColor: 'text-orange-400', borderColor: 'border-orange-500/30' };
  }
  return { tier: 'none', label: 'Emerging', bgColor: 'bg-white/10', textColor: 'text-muted-foreground', borderColor: 'border-white/10' };
}

export function WorkScoreBreakdown({ 
  workId,
  workTitle,
  yearWritten,
  compact = false,
}: WorkScoreBreakdownProps) {
  const { data: sourceCounts, isLoading } = useWorkSourceCounts(workId);
  
  const manuscripts = sourceCounts?.manuscripts ?? 0;
  const editions = sourceCounts?.editions ?? 0;
  const regions = sourceCounts?.geographicLocations ?? 0;
  const locations = sourceCounts?.locations ?? 0;
  
  const { rawScore, displayScore } = computeWorkScore(manuscripts, editions, regions, yearWritten);
  const tier = getInfluenceTier(displayScore);
  const hasData = manuscripts > 0 || editions > 0 || regions > 0 || locations > 0;
  
  // Calculate time span
  const currentYear = new Date().getFullYear();
  const timeSpan = yearWritten ? currentYear - yearWritten : 0;
  
  const manuscriptPoints = manuscripts * 2;
  const printPoints = editions * 10;
  const regionPoints = regions * 15;
  
  if (compact) {
    return (
      <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Influence Score</span>
            {isLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          </div>
          <div className={cn('text-xl font-bold', tier.textColor)}>
            {displayScore}
            <span className="text-xs text-muted-foreground font-normal">/999</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <StatMini icon={<BookOpen className="w-3 h-3" />} value={manuscripts} label="MSS" verified={manuscripts > 0} />
          <StatMini icon={<Printer className="w-3 h-3" />} value={editions} label="Print" verified={editions > 0} />
          <StatMini icon={<Globe className="w-3 h-3" />} value={regions} label="Regions" verified={regions > 0} />
        </div>
      </div>
    );
  }
  
  if (!hasData && !isLoading) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-muted/20 rounded-lg text-center">
        <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No source data available for this text yet.</p>
        <p className="text-xs mt-1">Manuscript and edition records will appear here once catalogued.</p>
      </div>
    );
  }
  
  return (
    <Card className="bg-sidebar/50 border-white/10 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Text Influence Score
            </CardTitle>
          </div>
          <div className={cn(
            'text-3xl font-bold px-3 py-1 rounded-lg',
            tier.bgColor, tier.textColor, tier.borderColor, 'border'
          )}>
            {displayScore}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Loading source data...</span>
          </div>
        )}
        
        {hasData && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 rounded-md px-2 py-1">
            <Sparkles className="w-3 h-3" />
            <span>Verified source data ({manuscripts + editions + locations} records)</span>
          </div>
        )}
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            icon={<BookOpen className="w-5 h-5 text-amber-500" />}
            label="Manuscripts"
            value={manuscripts}
            subtitle="preserved copies"
            points={manuscriptPoints}
            verified={manuscripts > 0}
          />
          <StatCard 
            icon={<Printer className="w-5 h-5 text-emerald-500" />}
            label="Print Editions"
            value={editions}
            subtitle="catalogued editions"
            points={printPoints}
            verified={editions > 0}
          />
          <StatCard 
            icon={<Globe className="w-5 h-5 text-blue-500" />}
            label="Geographic Spread"
            value={regions}
            subtitle="locations worldwide"
            points={regionPoints}
            verified={regions > 0}
          />
          <StatCard 
            icon={<Calendar className="w-5 h-5 text-purple-500" />}
            label="Time Span"
            value={timeSpan}
            subtitle="years of influence"
            showPoints={false}
          />
        </div>

        {rawScore > 0 && (
          <>
            <Separator className="bg-white/10" />
            
            {/* Score Calculation */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Award className="w-4 h-4" />
                Score Calculation
              </div>
              
              <div className="bg-black/20 rounded-lg p-3 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Manuscripts ({manuscripts} × 2)</span>
                  <span className="text-amber-400">+{manuscriptPoints}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Print Editions ({editions} × 10)</span>
                  <span className="text-emerald-400">+{printPoints}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Geographic Regions ({regions} × 15)</span>
                  <span className="text-blue-400">+{regionPoints}</span>
                </div>
                
                <Separator className="bg-white/10 my-2" />
                
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Raw Score</span>
                  <span>{rawScore.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-muted-foreground">
                  <span>→ Log₁₀ scaling</span>
                  <span className="text-foreground font-bold">{displayScore}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatMini({ 
  icon, 
  value, 
  label,
  verified = false,
}: { 
  icon: React.ReactNode; 
  value: number; 
  label: string;
  verified?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
      </div>
      <span className={cn(
        "text-lg font-bold",
        verified ? "text-emerald-400" : "text-foreground"
      )}>
        {value.toLocaleString()}
      </span>
      <span className={cn(
        "text-[10px]",
        verified ? "text-emerald-400/70" : "text-muted-foreground"
      )}>
        {label}{verified && " ✓"}
      </span>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  subtitle, 
  points, 
  showPoints = true,
  verified = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtitle: string;
  points?: number;
  showPoints?: boolean;
  verified?: boolean;
}) {
  return (
    <div className={cn(
      "p-3 rounded-lg bg-white/5 border space-y-1",
      verified ? "border-emerald-500/30" : "border-white/10"
    )}>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
        </div>
        {verified && (
          <span className="text-emerald-400 text-[10px]">✓ verified</span>
        )}
      </div>
      <p className={cn(
        "text-2xl font-bold",
        verified ? "text-emerald-400" : "text-foreground"
      )}>
        {value.toLocaleString()}
      </p>
      <p className="text-[10px] text-muted-foreground">
        {subtitle}
      </p>
      {showPoints && points !== undefined && points > 0 && (
        <Badge variant="secondary" className="text-[10px] bg-accent/10 text-accent">
          +{points.toLocaleString()} points
        </Badge>
      )}
    </div>
  );
}
