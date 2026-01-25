import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WorkSourceCounts {
  manuscripts: number;
  editions: number;
  editionsByType: Record<string, number>;
  geographicLocations: number;
  geographicByType: Record<string, number>;
  locations: number;
}

/**
 * Fetch source counts for a specific work from granular tables
 * - manuscript_sources: manuscript records linked to this work
 * - edition_sources: print edition records for this work
 * - geographic_distribution: geographic spread for this work
 * - work_locations: composition, print, manuscript locations
 */
export function useWorkSourceCounts(workId: string | null) {
  return useQuery({
    queryKey: ['work-source-counts', workId],
    queryFn: async (): Promise<WorkSourceCounts> => {
      if (!workId) {
        return {
          manuscripts: 0,
          editions: 0,
          editionsByType: {},
          geographicLocations: 0,
          geographicByType: {},
          locations: 0,
        };
      }

      // Fetch all counts in parallel
      const [manuscriptsResult, editionsResult, geographicResult, locationsResult] = await Promise.all([
        supabase
          .from('manuscript_sources')
          .select('id', { count: 'exact', head: true })
          .eq('work_id', workId),
        supabase
          .from('edition_sources')
          .select('id, edition_type')
          .eq('work_id', workId),
        supabase
          .from('geographic_distribution')
          .select('id, location_type, count')
          .eq('work_id', workId),
        supabase
          .from('work_locations')
          .select('id, location_type')
          .eq('work_id', workId),
      ]);

      if (manuscriptsResult.error) throw manuscriptsResult.error;
      if (editionsResult.error) throw editionsResult.error;
      if (geographicResult.error) throw geographicResult.error;
      if (locationsResult.error) throw locationsResult.error;

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
        locations: locationsResult.data?.length ?? 0,
      };
    },
    enabled: !!workId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
