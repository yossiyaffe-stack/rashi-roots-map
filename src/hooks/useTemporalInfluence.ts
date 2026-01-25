import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TemporalInfluenceData {
  id: string;
  scholar_id: string;
  period_start: number;
  period_end: number;
  period_label: string | null;
  manuscripts_new: number;
  manuscripts_cumulative: number;
  print_editions: number;
  geographic_regions: number;
  influence_score: number;
  created_at: string;
  updated_at: string;
}

export function useTemporalInfluence(scholarId: string | null) {
  return useQuery({
    queryKey: ['temporal-influence', scholarId],
    queryFn: async () => {
      if (!scholarId) return [];
      
      const { data, error } = await supabase
        .from('temporal_influence')
        .select('*')
        .eq('scholar_id', scholarId)
        .order('period_start', { ascending: true });
      
      if (error) throw error;
      return (data as TemporalInfluenceData[]) || [];
    },
    enabled: !!scholarId,
  });
}

export function useAllTemporalInfluence() {
  return useQuery({
    queryKey: ['temporal-influence-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('temporal_influence')
        .select('*, scholars(name, hebrew_name)')
        .order('period_start', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
}
