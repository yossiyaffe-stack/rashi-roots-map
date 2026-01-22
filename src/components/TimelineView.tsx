import { Calendar, Globe, BookOpen } from 'lucide-react';
import type { DbScholar, DbHistoricalEvent } from '@/hooks/useScholars';
import { cn } from '@/lib/utils';

interface TimelineViewProps {
  scholars: DbScholar[];
  selectedScholar: DbScholar | null;
  onSelectScholar: (scholar: DbScholar) => void;
  historicalEvents: DbHistoricalEvent[];
  timeRange: [number, number];
}

export const TimelineView = ({
  scholars,
  selectedScholar,
  onSelectScholar,
  historicalEvents,
  timeRange
}: TimelineViewProps) => {
  // Group scholars by century
  const centuryGroups: Record<number, DbScholar[]> = {};
  scholars.forEach(scholar => {
    if (!scholar.birth_year) return;
    const century = Math.floor(scholar.birth_year / 100) * 100;
    if (!centuryGroups[century]) centuryGroups[century] = [];
    centuryGroups[century].push(scholar);
  });

  const visibleEvents = historicalEvents.filter(
    event => event.year >= timeRange[0] && event.year <= timeRange[1]
  );

  const getEventStyles = (event: DbHistoricalEvent) => {
    const isSecular = (event as any).category === 'secular';
    
    if (isSecular) {
      // Secular events use blue theme
      switch (event.importance) {
        case 'critical':
          return 'border-l-blue-500 bg-blue-500/15';
        case 'major':
          return 'border-l-blue-400 bg-blue-400/10';
        case 'foundational':
          return 'border-l-blue-300 bg-blue-300/10';
        default:
          return 'border-l-blue-300 bg-blue-300/10';
      }
    }
    
    // Jewish events use original colors
    switch (event.importance) {
      case 'critical':
        return 'border-l-destructive bg-destructive/10';
      case 'major':
        return 'border-l-orange-500 bg-orange-500/10';
      case 'foundational':
        return 'border-l-accent bg-accent/10';
      case 'scholarly':
        return 'border-l-green-600 bg-green-600/10';
      default:
        return 'border-l-muted bg-muted/10';
    }
  };

  const getScholarColor = (scholar: DbScholar): string => {
    if (scholar.name === 'Rashi') return 'bg-rose-500';
    if (scholar.relationship_type === 'supercommentator') return 'bg-blue-500';
    if (scholar.period === 'Rishonim') return 'bg-amber-500';
    return 'bg-violet-500';
  };

  return (
    <div className="flex flex-col gap-8 p-6 overflow-auto h-full">
      {/* Historical Events */}
      {visibleEvents.length > 0 && (
        <div className="bg-sidebar/50 border border-white/10 rounded-xl p-6 mb-4">
          <h3 className="font-display text-xl text-accent mb-4">Historical Context</h3>
          <div className="space-y-3">
            {visibleEvents.map((event) => {
              const isSecular = (event as any).category === 'secular';
              return (
                <div
                  key={event.id}
                  className={cn(
                    "p-4 border-l-4 rounded-r-lg",
                    getEventStyles(event)
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isSecular && <Globe className="w-4 h-4 text-blue-400" />}
                    <span className={cn(
                      "font-bold text-lg mr-4",
                      isSecular ? "text-blue-400" : "text-accent"
                    )}>
                      {event.year}
                    </span>
                    <span className="font-semibold text-foreground text-lg">{event.name}</span>
                    {isSecular && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 ml-2">
                        Secular
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="mt-2 text-muted-foreground leading-relaxed">{event.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline by Century */}
      {Object.keys(centuryGroups)
        .sort((a, b) => Number(a) - Number(b))
        .map(century => (
          <div key={century} className="relative pl-8 border-l-4 border-accent">
            <div className="flex items-center gap-2 mb-4 font-display text-xl font-bold text-accent">
              <Calendar className="w-5 h-5" />
              {century}s – {Number(century) + 99}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {centuryGroups[Number(century)].map(scholar => (
                <div
                  key={scholar.id}
                  onClick={() => onSelectScholar(scholar)}
                  className={cn(
                    "p-4 rounded-xl cursor-pointer transition-all border group",
                    selectedScholar?.id === scholar.id
                      ? "bg-white/10 border-accent"
                      : "bg-sidebar/30 border-transparent hover:bg-white/5 hover:border-white/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-3 h-3 rounded-full mt-1.5 shrink-0", getScholarColor(scholar))} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-foreground group-hover:text-accent transition-colors truncate">
                          {scholar.name}
                        </h4>
                        {scholar.hebrew_name && (
                          <span className="text-sm font-hebrew text-accent/80 shrink-0">
                            {scholar.hebrew_name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {scholar.birth_place || 'Unknown'} • {scholar.birth_year || '?'}–{scholar.death_year || '?'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};
