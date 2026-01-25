import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ScholarSourceCounts {
  manuscripts: number;
  editions: number;
  editionsByType: Record<string, number>;
  geographicLocations: number;
  geographicByType: Record<string, number>;
}

/**
 * Fetch real counts from the granular source tables for a specific scholar
 * - manuscript_sources: actual manuscript records
 * - edition_sources: print edition records (historical + modern)
 * - geographic_distribution: geographic spread data
 */
export function useScholarSourceCounts(scholarId: string | null) {
  return useQuery({
    queryKey: ['scholar-source-counts', scholarId],
    queryFn: async (): Promise<ScholarSourceCounts> => {
      if (!scholarId) {
        return {
          manuscripts: 0,
          editions: 0,
          editionsByType: {},
          geographicLocations: 0,
          geographicByType: {},
        };
      }

      // Fetch all three in parallel
      const [manuscriptsResult, editionsResult, geographicResult] = await Promise.all([
        supabase
          .from('manuscript_sources')
          .select('id', { count: 'exact', head: true })
          .eq('scholar_id', scholarId),
        supabase
          .from('edition_sources')
          .select('id, edition_type')
          .eq('scholar_id', scholarId),
        supabase
          .from('geographic_distribution')
          .select('id, location_type, count')
          .eq('scholar_id', scholarId),
      ]);

      if (manuscriptsResult.error) throw manuscriptsResult.error;
      if (editionsResult.error) throw editionsResult.error;
      if (geographicResult.error) throw geographicResult.error;

      // Count editions by type
      const editionsByType: Record<string, number> = {};
      (editionsResult.data || []).forEach(edition => {
        const type = edition.edition_type || 'Unknown';
        editionsByType[type] = (editionsByType[type] || 0) + 1;
      });

      // Count geographic distribution by type and sum counts
      const geographicByType: Record<string, number> = {};
      let totalGeographicCount = 0;
      (geographicResult.data || []).forEach(geo => {
        const type = geo.location_type || 'Unknown';
        const count = geo.count || 1;
        geographicByType[type] = (geographicByType[type] || 0) + count;
        totalGeographicCount += count;
      });

      return {
        manuscripts: manuscriptsResult.count ?? 0,
        editions: editionsResult.data?.length ?? 0,
        editionsByType,
        geographicLocations: totalGeographicCount,
        geographicByType,
      };
    },
    enabled: !!scholarId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Fetch source counts for all scholars (for leaderboards, etc.)
 */
export function useAllScholarSourceCounts() {
  return useQuery({
    queryKey: ['all-scholar-source-counts'],
    queryFn: async () => {
      // Fetch aggregated counts per scholar
      const [manuscriptsResult, editionsResult, geographicResult] = await Promise.all([
        supabase
          .from('manuscript_sources')
          .select('scholar_id'),
        supabase
          .from('edition_sources')
          .select('scholar_id'),
        supabase
          .from('geographic_distribution')
          .select('scholar_id, count'),
      ]);

      if (manuscriptsResult.error) throw manuscriptsResult.error;
      if (editionsResult.error) throw editionsResult.error;
      if (geographicResult.error) throw geographicResult.error;

      // Aggregate by scholar_id
      const countsMap = new Map<string, ScholarSourceCounts>();

      // Count manuscripts per scholar
      const manuscriptCounts = new Map<string, number>();
      (manuscriptsResult.data || []).forEach(m => {
        manuscriptCounts.set(m.scholar_id, (manuscriptCounts.get(m.scholar_id) || 0) + 1);
      });

      // Count editions per scholar
      const editionCounts = new Map<string, number>();
      (editionsResult.data || []).forEach(e => {
        editionCounts.set(e.scholar_id, (editionCounts.get(e.scholar_id) || 0) + 1);
      });

      // Sum geographic counts per scholar
      const geoCounts = new Map<string, number>();
      (geographicResult.data || []).forEach(g => {
        const count = g.count || 1;
        geoCounts.set(g.scholar_id, (geoCounts.get(g.scholar_id) || 0) + count);
      });

      // Combine all unique scholar IDs
      const allScholarIds = new Set([
        ...manuscriptCounts.keys(),
        ...editionCounts.keys(),
        ...geoCounts.keys(),
      ]);

      allScholarIds.forEach(scholarId => {
        countsMap.set(scholarId, {
          manuscripts: manuscriptCounts.get(scholarId) || 0,
          editions: editionCounts.get(scholarId) || 0,
          editionsByType: {},
          geographicLocations: geoCounts.get(scholarId) || 0,
          geographicByType: {},
        });
      });

      return countsMap;
    },
    staleTime: 5 * 60 * 1000,
  });
}
