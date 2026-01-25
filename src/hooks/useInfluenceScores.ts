import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateInfluenceScore, calculateBaseInfluenceScore } from '@/lib/influenceScore';
import { getCanonicalMultiplier, type DomainId } from '@/lib/domains';

export interface ScholarInfluenceScore {
  scholar_id: string;
  score: number;
  baseScore: number;
  displayScore: number;
  manuscripts_cumulative: number;
  print_editions: number;
  geographic_regions: number;
  period_start: number;
  period_end: number;
  scholarSlug?: string | null;
  canonicalMultiplier: number;
}

export interface TemporalInfluenceRecord {
  scholar_id: string;
  influence_score: number;
  manuscripts_cumulative: number;
  print_editions: number;
  geographic_regions: number;
  period_start: number;
  period_end: number;
}

/**
 * Fetch the most recent influence score for each scholar
 * Returns a map of scholar_id -> score data for efficient lookup
 */
export function useInfluenceScores(domain: DomainId = 'all') {
  return useQuery({
    queryKey: ['influence-scores-latest', domain],
    queryFn: async () => {
      // Get all temporal influence records, ordered by period descending
      // We'll pick the most recent period for each scholar
      const { data: influenceData, error: influenceError } = await supabase
        .from('temporal_influence')
        .select('scholar_id, influence_score, manuscripts_cumulative, print_editions, geographic_regions, period_start, period_end')
        .order('period_start', { ascending: false });
      
      if (influenceError) throw influenceError;

      // Get scholar slugs for domain multiplier calculation
      const { data: scholarsData, error: scholarsError } = await supabase
        .from('scholars')
        .select('id, slug');
      
      if (scholarsError) throw scholarsError;
      
      // Create a slug lookup map
      const slugMap = new Map<string, string | null>();
      (scholarsData || []).forEach(s => {
        slugMap.set(s.id, s.slug);
      });
      
      // Create a map with only the most recent (highest period_start) for each scholar
      const scoreMap = new Map<string, ScholarInfluenceScore>();
      
      (influenceData || []).forEach(record => {
        if (!scoreMap.has(record.scholar_id)) {
          const scholarSlug = slugMap.get(record.scholar_id);
          const canonicalMultiplier = getCanonicalMultiplier(scholarSlug, domain);
          
          // Calculate base score (without domain multiplier)
          const baseScore = calculateBaseInfluenceScore({
            manuscriptsCumulative: record.manuscripts_cumulative ?? 0,
            printEditions: record.print_editions ?? 0,
            geographicRegions: record.geographic_regions ?? 0,
            periodStart: record.period_start,
          });
          
          // Calculate display score (with domain multiplier)
          const displayScore = calculateInfluenceScore({
            manuscriptsCumulative: record.manuscripts_cumulative ?? 0,
            printEditions: record.print_editions ?? 0,
            geographicRegions: record.geographic_regions ?? 0,
            periodStart: record.period_start,
            scholarSlug,
            domain,
          });
          
          scoreMap.set(record.scholar_id, {
            scholar_id: record.scholar_id,
            score: displayScore, // Primary score to display
            baseScore,
            displayScore,
            manuscripts_cumulative: record.manuscripts_cumulative ?? 0,
            print_editions: record.print_editions ?? 0,
            geographic_regions: record.geographic_regions ?? 0,
            period_start: record.period_start,
            period_end: record.period_end,
            scholarSlug,
            canonicalMultiplier,
          });
        }
      });
      
      return scoreMap;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Get tier color and label based on influence score
 * 700-999: Gold (Foundational)
 * 400-699: Silver (Major/Important)
 * 0-399: Bronze (Notable/Limited)
 */
export function getInfluenceTier(score: number): {
  tier: 'gold' | 'silver' | 'bronze';
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
} {
  if (score >= 700) {
    return {
      tier: 'gold',
      label: 'Foundational',
      bgColor: 'bg-amber-500/20',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/50',
    };
  }
  if (score >= 400) {
    return {
      tier: 'silver',
      label: 'Major',
      bgColor: 'bg-slate-300/20',
      textColor: 'text-slate-300',
      borderColor: 'border-slate-400/50',
    };
  }
  return {
    tier: 'bronze',
    label: 'Notable',
    bgColor: 'bg-orange-700/20',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-600/50',
  };
}
