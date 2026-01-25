import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid, ReferenceLine } from 'recharts';
import { useTemporalInfluence } from '@/hooks/useTemporalInfluence';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getInfluenceLevel, formatPeriodLabel } from '@/lib/influenceScore';
import { TrendingUp, BookOpen, Printer, Globe } from 'lucide-react';

interface TemporalInfluenceViewProps {
  scholarId: string;
  scholarName?: string;
}

export function TemporalInfluenceView({ scholarId, scholarName }: TemporalInfluenceViewProps) {
  const { data, isLoading, error } = useTemporalInfluence(scholarId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-[250px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive p-4 bg-destructive/10 rounded-lg">
        Failed to load temporal influence data
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-muted/20 rounded-lg text-center">
        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No temporal influence data available for this scholar.</p>
        <p className="text-xs mt-1">Data will appear once manuscript and edition records are added.</p>
      </div>
    );
  }

  // Calculate peak influence
  const peakPeriod = data.reduce((max, curr) => 
    curr.influence_score > max.influence_score ? curr : max
  , data[0]);
  
  const latestPeriod = data[data.length - 1];
  const influenceLevel = getInfluenceLevel(latestPeriod?.influence_score || 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.[0]) return null;
    
    const d = payload[0].payload;
    return (
      <div className="bg-sidebar/95 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="font-semibold text-accent mb-2">
          {d.period_label || formatPeriodLabel(d.period_start, d.period_end)}
        </p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-accent" />
            <span className="text-muted-foreground">Influence Score:</span>
            <span className="font-bold text-foreground">{d.influence_score}</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-3 h-3 text-amber-500" />
            <span className="text-muted-foreground">Manuscripts:</span>
            <span className="text-foreground">{d.manuscripts_cumulative} total (+{d.manuscripts_new} new)</span>
          </div>
          <div className="flex items-center gap-2">
            <Printer className="w-3 h-3 text-emerald-500" />
            <span className="text-muted-foreground">Print Editions:</span>
            <span className="text-foreground">{d.print_editions}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3 text-blue-500" />
            <span className="text-muted-foreground">Regions Active:</span>
            <span className="text-foreground">{d.geographic_regions}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="bg-accent/20 text-accent">
          Peak: {peakPeriod?.influence_score || 0}
        </Badge>
        <Badge variant="outline" className={influenceLevel.color}>
          {influenceLevel.label} Influence
        </Badge>
        <Badge variant="outline" className="text-muted-foreground">
          {data.length} periods tracked
        </Badge>
      </div>

      {/* Chart */}
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="influenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="period_start" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              domain={[0, 'dataMax + 50']}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={peakPeriod?.influence_score} 
              stroke="hsl(var(--accent))" 
              strokeDasharray="3 3" 
              opacity={0.5}
            />
            <Area 
              type="monotone" 
              dataKey="influence_score" 
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              fill="url(#influenceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-accent rounded" />
          <span>Influence Score (0-999)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-accent/30 rounded" />
          <span>Peak Period</span>
        </div>
      </div>
    </div>
  );
}
