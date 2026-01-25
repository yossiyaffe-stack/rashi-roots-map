import { useMemo } from 'react';
import { useScholars, type DbScholar } from './useScholars';
import { useInfluenceScores, type ScholarInfluenceScore } from './useInfluenceScores';
import { useFilters } from '@/contexts/FilterContext';
import type { DomainId } from '@/lib/domains';

export type ScholarSortMode = 'alphabetical' | 'period' | 'influence';

interface FilteredScholar extends DbScholar {
  influenceScore?: ScholarInfluenceScore;
}

export function useFilteredScholars(
  searchTerm: string = '',
  sortMode: ScholarSortMode = 'period',
  domain: DomainId = 'all',
  scholarNameMap?: Map<string, string[]>
) {
  const { data: scholars = [], isLoading: scholarsLoading } = useScholars();
  const { data: influenceScores } = useInfluenceScores(domain);
  const { 
    mapViewportBounds, 
    timelineRange, 
    isInMapViewport, 
    isInTimelineRange 
  } = useFilters();

  const filteredAndSortedScholars = useMemo(() => {
    let result = [...scholars];

    // 1. Apply spatial filter (map viewport)
    if (mapViewportBounds) {
      result = result.filter(s => isInMapViewport(s.latitude, s.longitude));
    }

    // 2. Apply temporal filter (timeline range)
    if (timelineRange) {
      result = result.filter(s => isInTimelineRange(s.birth_year, s.death_year));
    }

    // 3. Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => {
        // Check all name variants if available
        if (scholarNameMap) {
          const variants = scholarNameMap.get(s.id) || [];
          return variants.some(v => v.includes(term));
        }
        // Fallback to basic name matching
        return (
          s.name.toLowerCase().includes(term) ||
          (s.hebrew_name && s.hebrew_name.includes(searchTerm))
        );
      });
    }

    // 4. Attach influence scores
    const withScores: FilteredScholar[] = result.map(s => ({
      ...s,
      influenceScore: influenceScores?.get(s.id),
    }));

    // 5. Sort based on mode
    switch (sortMode) {
      case 'alphabetical':
        withScores.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'influence':
        withScores.sort((a, b) => {
          const scoreA = a.influenceScore?.score ?? 0;
          const scoreB = b.influenceScore?.score ?? 0;
          return scoreB - scoreA;
        });
        break;
      case 'period':
      default:
        // Keep default order (by importance) - will be grouped by period in UI
        break;
    }

    return withScores;
  }, [
    scholars, 
    searchTerm, 
    sortMode, 
    influenceScores, 
    mapViewportBounds, 
    timelineRange,
    isInMapViewport,
    isInTimelineRange,
    scholarNameMap
  ]);

  // Group by period for period view
  const scholarsByPeriod = useMemo(() => {
    const groups: Record<string, FilteredScholar[]> = {};
    filteredAndSortedScholars.forEach(scholar => {
      const period = scholar.period || 'Unknown Period';
      if (!groups[period]) groups[period] = [];
      groups[period].push(scholar);
    });
    return groups;
  }, [filteredAndSortedScholars]);

  return {
    scholars: filteredAndSortedScholars,
    scholarsByPeriod,
    isLoading: scholarsLoading,
    totalCount: scholars.length,
    filteredCount: filteredAndSortedScholars.length,
    hasActiveFilters: Boolean(mapViewportBounds || timelineRange || searchTerm),
  };
}
