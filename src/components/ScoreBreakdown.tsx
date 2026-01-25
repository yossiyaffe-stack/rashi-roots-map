import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Globe, Printer, TrendingUp, Calendar, Sparkles, Award, Quote } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { DOMAINS, type DomainId } from '@/lib/domains';
import { getInfluenceTier } from '@/hooks/useInfluenceScores';

interface ScoreBreakdownProps {
  scholarName: string;
  scholarSlug?: string | null;
  domain: DomainId;
  baseScore: number;
  displayScore: number;
  multiplier: number;
  manuscripts: number;
  printEditions: number;
  regions: number;
  citationsTotal?: number;
  periodStart?: number;
  periodEnd?: number;
  compact?: boolean;
}

export function ScoreBreakdown({ 
  scholarName,
  scholarSlug,
  domain, 
  baseScore, 
  displayScore, 
  multiplier,
  manuscripts,
  printEditions,
  regions,
  citationsTotal = 0,
  periodStart,
  periodEnd,
  compact = false,
}: ScoreBreakdownProps) {
  const tier = getInfluenceTier(displayScore);
  const hasMultiplier = multiplier > 1;
  const hasCitations = citationsTotal > 0;
  
  // Calculate time span
  const currentYear = new Date().getFullYear();
  const timeSpan = periodStart ? currentYear - periodStart : 0;
  
  // Raw score calculation
  const manuscriptPoints = manuscripts * 2;
  const printPoints = printEditions * 10;
  const regionPoints = regions * 15;
  const citationPoints = Math.floor(citationsTotal * 0.05);
  const rawScore = manuscriptPoints + printPoints + regionPoints + citationPoints;
  
  if (compact) {
    return (
      <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Influence Score</span>
          <div className={cn('text-xl font-bold', tier.textColor)}>
            {displayScore}
            <span className="text-xs text-muted-foreground font-normal">/999</span>
          </div>
        </div>
        
        <div className={cn("grid gap-2 text-center", hasCitations ? "grid-cols-4" : "grid-cols-3")}>
          <StatMini icon={<BookOpen className="w-3 h-3" />} value={manuscripts} label="MSS" />
          <StatMini icon={<Printer className="w-3 h-3" />} value={printEditions} label="Print" />
          <StatMini icon={<Globe className="w-3 h-3" />} value={regions} label="Regions" />
          {hasCitations && (
            <StatMini icon={<Quote className="w-3 h-3" />} value={citationsTotal} label="Citations" />
          )}
        </div>
        
        {hasMultiplier && domain !== 'all' && (
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-md px-2 py-1">
            <Sparkles className="w-3 h-3" />
            <span>Canonical ×{multiplier.toFixed(1)} in {DOMAINS[domain].name}</span>
          </div>
        )}
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
              Influence Score Breakdown
            </CardTitle>
            {hasMultiplier && domain !== 'all' && (
              <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Canonical work in {DOMAINS[domain].name}
              </p>
            )}
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
        {/* Impressive Statistics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            icon={<BookOpen className="w-5 h-5 text-amber-500" />}
            label="Manuscripts"
            value={manuscripts}
            subtitle="preserved worldwide"
            points={manuscriptPoints}
          />
          <StatCard 
            icon={<Printer className="w-5 h-5 text-emerald-500" />}
            label="Print Editions"
            value={printEditions}
            subtitle="catalogued editions"
            points={printPoints}
          />
          <StatCard 
            icon={<Globe className="w-5 h-5 text-blue-500" />}
            label="Geographic Spread"
            value={regions}
            subtitle="regions worldwide"
            points={regionPoints}
          />
          {hasCitations ? (
            <StatCard 
              icon={<Quote className="w-5 h-5 text-cyan-500" />}
              label="Sefaria Citations"
              value={citationsTotal}
              subtitle="scholarly references"
              points={citationPoints}
            />
          ) : (
            <StatCard 
              icon={<Calendar className="w-5 h-5 text-purple-500" />}
              label="Time Span"
              value={timeSpan}
              subtitle="years of influence"
              showPoints={false}
            />
          )}
        </div>
        
        {hasCitations && (
          <StatCard 
            icon={<Calendar className="w-5 h-5 text-purple-500" />}
            label="Time Span"
            value={timeSpan}
            subtitle="years of influence"
            showPoints={false}
          />
        )}

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
              <span>Print Editions ({printEditions} × 10)</span>
              <span className="text-emerald-400">+{printPoints}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Geographic Regions ({regions} × 15)</span>
              <span className="text-blue-400">+{regionPoints}</span>
            </div>
            {hasCitations && (
              <div className="flex justify-between text-muted-foreground">
                <span>Sefaria Citations ({citationsTotal.toLocaleString()} × 0.05)</span>
                <span className="text-cyan-400">+{citationPoints}</span>
              </div>
            )}
            
            <Separator className="bg-white/10 my-2" />
            
            <div className="flex justify-between font-semibold text-foreground">
              <span>Raw Score</span>
              <span>{rawScore.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between text-muted-foreground">
              <span>→ Log₁₀ scaling × Period multiplier</span>
              <span className="text-foreground">{baseScore}</span>
            </div>
            
            {hasMultiplier && domain !== 'all' && (
              <div className="flex justify-between text-amber-400">
                <span>→ Canonical multiplier (×{multiplier.toFixed(1)})</span>
                <span className="font-bold">{displayScore}</span>
              </div>
            )}
          </div>
        </div>

        {/* Impressive Context */}
        <ImpressiveContext 
          scholarSlug={scholarSlug}
          manuscripts={manuscripts}
          printEditions={printEditions}
          regions={regions}
          timeSpan={timeSpan}
          displayScore={displayScore}
          citationsTotal={citationsTotal}
        />
      </CardContent>
    </Card>
  );
}

function StatMini({ 
  icon, 
  value, 
  label 
}: { 
  icon: React.ReactNode; 
  value: number; 
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
      </div>
      <span className="text-lg font-bold text-foreground">{value.toLocaleString()}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  subtitle, 
  points, 
  showPoints = true 
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtitle: string;
  points?: number;
  showPoints?: boolean;
}) {
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">
        {value.toLocaleString()}
      </p>
      <p className="text-[10px] text-muted-foreground">
        {subtitle}
      </p>
      {showPoints && points !== undefined && (
        <Badge variant="secondary" className="text-[10px] bg-accent/10 text-accent">
          +{points.toLocaleString()} points
        </Badge>
      )}
    </div>
  );
}

function ImpressiveContext({ 
  scholarSlug,
  manuscripts,
  printEditions,
  regions,
  timeSpan,
  displayScore,
  citationsTotal = 0,
}: { 
  scholarSlug?: string | null;
  manuscripts: number;
  printEditions: number;
  regions: number;
  timeSpan: number;
  displayScore: number;
  citationsTotal?: number;
}) {
  const facts: { icon: React.ReactNode; text: string }[] = [];
  
  // Generate impressive contextual facts based on data
  if (scholarSlug === 'rashi') {
    facts.push({
      icon: <BookOpen className="w-4 h-4 text-amber-500" />,
      text: "First dated Hebrew printed book in history (1475)"
    });
    facts.push({
      icon: <Calendar className="w-4 h-4 text-purple-500" />,
      text: `${timeSpan} years of continuous influence`
    });
    facts.push({
      icon: <Globe className="w-4 h-4 text-blue-500" />,
      text: "Found in virtually every Jewish home worldwide"
    });
  }
  
  if (manuscripts > 100) {
    facts.push({
      icon: <BookOpen className="w-4 h-4 text-amber-500" />,
      text: `More manuscripts than 95% of medieval works`
    });
  } else if (manuscripts > 50) {
    facts.push({
      icon: <BookOpen className="w-4 h-4 text-amber-500" />,
      text: `Exceptional manuscript preservation rate`
    });
  }
  
  if (printEditions > 200) {
    facts.push({
      icon: <Printer className="w-4 h-4 text-emerald-500" />,
      text: `Over ${printEditions} editions — among the most printed Jewish texts`
    });
  } else if (printEditions > 100) {
    facts.push({
      icon: <Printer className="w-4 h-4 text-emerald-500" />,
      text: `Published in ${regions}+ countries across centuries`
    });
  }
  
  if (timeSpan > 800) {
    facts.push({
      icon: <Calendar className="w-4 h-4 text-purple-500" />,
      text: `Nearly a millennium of unbroken study tradition`
    });
  } else if (timeSpan > 500) {
    facts.push({
      icon: <Calendar className="w-4 h-4 text-purple-500" />,
      text: `Over ${timeSpan} years of continuous scholarly engagement`
    });
  }
  
  // Citation facts
  if (citationsTotal > 10000) {
    facts.push({
      icon: <Quote className="w-4 h-4 text-cyan-500" />,
      text: `Over ${Math.floor(citationsTotal / 1000)}K scholarly citations in Sefaria`
    });
  } else if (citationsTotal > 1000) {
    facts.push({
      icon: <Quote className="w-4 h-4 text-cyan-500" />,
      text: `${citationsTotal.toLocaleString()} citations from later commentaries`
    });
  }

  if (displayScore >= 900) {
    facts.push({
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      text: "Among the most influential works in rabbinic literature"
    });
  }
  
  if (facts.length === 0) return null;
  
  // Limit to 3 most relevant facts
  const displayFacts = facts.slice(0, 3);
  
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Notable Impact</h4>
      <div className="space-y-2">
        {displayFacts.map((fact, i) => (
          <div 
            key={i}
            className="flex items-start gap-2 p-2 rounded-md bg-white/5 text-xs text-foreground"
          >
            <div className="shrink-0 mt-0.5">{fact.icon}</div>
            <span>{fact.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
