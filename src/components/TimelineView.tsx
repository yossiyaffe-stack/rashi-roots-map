import { Calendar } from 'lucide-react';
import type { Scholar, HistoricalEvent } from '@/data/scholars';
import { ScholarCard } from './ScholarCard';
import { cn } from '@/lib/utils';

interface TimelineViewProps {
  scholars: Scholar[];
  selectedScholar: Scholar | null;
  onSelectScholar: (scholar: Scholar) => void;
  showHistoricalContext: boolean;
  historicalEvents: HistoricalEvent[];
  timeFilter: [number, number];
}

export const TimelineView = ({
  scholars,
  selectedScholar,
  onSelectScholar,
  showHistoricalContext,
  historicalEvents,
  timeFilter
}: TimelineViewProps) => {
  // Group scholars by century
  const centuryGroups: Record<number, Scholar[]> = {};
  scholars.forEach(scholar => {
    const century = Math.floor(scholar.birth / 100) * 100;
    if (!centuryGroups[century]) centuryGroups[century] = [];
    centuryGroups[century].push(scholar);
  });

  const visibleEvents = historicalEvents.filter(
    event => event.year >= timeFilter[0] && event.year <= timeFilter[1]
  );

  const getEventStyles = (importance: HistoricalEvent['importance']) => {
    switch (importance) {
      case 'critical':
        return 'border-l-destructive bg-destructive/5';
      case 'major':
        return 'border-l-orange-500 bg-card';
      case 'foundational':
        return 'border-l-primary bg-card';
      case 'scholarly':
        return 'border-l-green-600 bg-card';
      default:
        return 'border-l-secondary bg-card';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Historical Events */}
      {showHistoricalContext && visibleEvents.length > 0 && (
        <div className="gradient-card border-2 border-primary rounded-xl p-6 mb-4">
          <h3 className="font-display text-2xl text-foreground mb-4">Historical Context</h3>
          <div className="space-y-3">
            {visibleEvents.map((event, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-4 border-l-4 rounded",
                  getEventStyles(event.importance)
                )}
              >
                <span className="font-bold text-secondary text-lg mr-4">{event.year}</span>
                <span className="font-semibold text-foreground text-lg">{event.name}</span>
                <p className="mt-2 text-muted-foreground leading-relaxed">{event.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline by Century */}
      {Object.keys(centuryGroups)
        .sort((a, b) => Number(a) - Number(b))
        .map(century => (
          <div key={century} className="relative pl-8 border-l-4 border-primary">
            <div className="flex items-center gap-2 mb-4 font-display text-2xl font-bold text-secondary">
              <Calendar className="w-6 h-6 text-primary" />
              {century}s – {Number(century) + 99}
            </div>
            <div className="flex flex-wrap gap-4">
              {centuryGroups[Number(century)].map(scholar => (
                <ScholarCard
                  key={scholar.id}
                  scholar={scholar}
                  isSelected={selectedScholar?.id === scholar.id}
                  onClick={() => onSelectScholar(scholar)}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};
