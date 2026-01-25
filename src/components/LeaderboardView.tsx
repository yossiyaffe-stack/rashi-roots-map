import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Medal, Award, BookOpen, Printer, Globe, Calendar, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInfluenceTier, type ScholarInfluenceScore } from '@/hooks/useInfluenceScores';
import type { DbScholar } from '@/hooks/useScholars';

type SortKey = 'score' | 'manuscripts' | 'editions' | 'regions';
type SortDirection = 'asc' | 'desc';

interface LeaderboardViewProps {
  scholars: DbScholar[];
  influenceScores: Map<string, ScholarInfluenceScore>;
  onScholarClick?: (scholar: DbScholar) => void;
  className?: string;
}

export function LeaderboardView({ 
  scholars, 
  influenceScores, 
  onScholarClick,
  className,
}: LeaderboardViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Combine scholar data with scores
  const scholarsWithScores = scholars
    .map(scholar => ({
      scholar,
      scoreData: influenceScores.get(scholar.id),
    }))
    .filter(item => item.scoreData)
    .sort((a, b) => {
      const aData = a.scoreData!;
      const bData = b.scoreData!;
      
      let aVal: number, bVal: number;
      switch (sortKey) {
        case 'manuscripts':
          aVal = aData.manuscripts_cumulative;
          bVal = bData.manuscripts_cumulative;
          break;
        case 'editions':
          aVal = aData.print_editions;
          bVal = bData.print_editions;
          break;
        case 'regions':
          aVal = aData.geographic_regions;
          bVal = bData.geographic_regions;
          break;
        default:
          aVal = aData.displayScore;
          bVal = bData.displayScore;
      }
      
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
    })
    .slice(0, 25);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const SortHeader = ({ label, sortKeyName, icon }: { label: string; sortKeyName: SortKey; icon?: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 -ml-2 hover:bg-white/5 gap-1"
      onClick={() => handleSort(sortKeyName)}
    >
      {icon}
      <span className="text-xs">{label}</span>
      {sortKey === sortKeyName && (
        sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
      )}
    </Button>
  );

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-amber-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-300" />;
    if (index === 2) return <Medal className="w-5 h-5 text-orange-400" />;
    return <span className="text-muted-foreground text-sm">#{index + 1}</span>;
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className={cn('rounded-lg border border-white/10 overflow-hidden', className)}>
      <div className="bg-gradient-to-r from-accent/20 to-transparent p-4 border-b border-white/10">
        <h3 className="font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Influence Leaderboard
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Top scholars ranked by influence score and metrics
        </p>
      </div>
      
      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader className="bg-black/20 sticky top-0 z-10">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-12 text-center">Rank</TableHead>
              <TableHead className="min-w-[180px]">Scholar</TableHead>
              <TableHead className="text-right">
                <SortHeader label="Score" sortKeyName="score" icon={<Award className="w-3 h-3" />} />
              </TableHead>
              <TableHead className="text-right hidden md:table-cell">
                <SortHeader label="MSS" sortKeyName="manuscripts" icon={<BookOpen className="w-3 h-3 text-amber-500" />} />
              </TableHead>
              <TableHead className="text-right hidden md:table-cell">
                <SortHeader label="Print" sortKeyName="editions" icon={<Printer className="w-3 h-3 text-emerald-500" />} />
              </TableHead>
              <TableHead className="text-right hidden lg:table-cell">
                <SortHeader label="Regions" sortKeyName="regions" icon={<Globe className="w-3 h-3 text-blue-500" />} />
              </TableHead>
              <TableHead className="text-right hidden lg:table-cell">
                <span className="flex items-center gap-1 text-xs">
                  <Calendar className="w-3 h-3 text-purple-500" />
                  Years
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scholarsWithScores.map(({ scholar, scoreData }, index) => {
              const tier = getInfluenceTier(scoreData!.displayScore);
              const timeSpan = scholar.birth_year 
                ? currentYear - scholar.birth_year 
                : scoreData!.period_start 
                  ? currentYear - scoreData!.period_start 
                  : 0;
              
              return (
                <TableRow 
                  key={scholar.id}
                  className={cn(
                    'border-white/5 cursor-pointer transition-colors',
                    index === 0 && 'bg-amber-500/5',
                    index === 1 && 'bg-slate-500/5',
                    index === 2 && 'bg-orange-500/5',
                    'hover:bg-white/5'
                  )}
                  onClick={() => onScholarClick?.(scholar)}
                >
                  <TableCell className="text-center">
                    {getRankIcon(index)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground truncate max-w-[200px]">
                        {scholar.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {scholar.birth_year || '?'}–{scholar.death_year || '?'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        'font-bold',
                        tier.bgColor, tier.textColor, tier.borderColor, 'border'
                      )}
                    >
                      {scoreData!.displayScore}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell font-mono text-sm">
                    {scoreData!.manuscripts_cumulative.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell font-mono text-sm">
                    {scoreData!.print_editions.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right hidden lg:table-cell font-mono text-sm">
                    {scoreData!.geographic_regions}
                  </TableCell>
                  <TableCell className="text-right hidden lg:table-cell font-mono text-sm text-muted-foreground">
                    {timeSpan > 0 ? `${timeSpan}y` : '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
      
      {/* Summary footer */}
      <div className="p-3 bg-black/20 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing top {scholarsWithScores.length} scholars</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            700+ Foundational
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            400+ Major
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            0+ Notable
          </span>
        </div>
      </div>
    </div>
  );
}
