import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type DbScholar = Tables<'scholars'>;
export type DbWork = Tables<'works'>;
export type DbRelationship = Tables<'relationships'>;
export type DbHistoricalEvent = Tables<'historical_events'>;
export type DbPlace = Tables<'places'>;

export interface ScholarWithDetails extends DbScholar {
  works?: DbWork[];
  relationships?: DbRelationship[];
}

export function useScholars() {
  return useQuery({
    queryKey: ['scholars'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scholars')
        .select('*')
        .order('importance', { ascending: false });
      
      if (error) throw error;
      return data as DbScholar[];
    },
  });
}

export function useScholarWithWorks(scholarId: string | null) {
  return useQuery({
    queryKey: ['scholar', scholarId],
    queryFn: async () => {
      if (!scholarId) return null;
      
      const [scholarRes, worksRes, relationshipsRes] = await Promise.all([
        supabase.from('scholars').select('*').eq('id', scholarId).single(),
        supabase.from('works').select('*').eq('scholar_id', scholarId),
        supabase.from('relationships').select('*').or(`from_scholar_id.eq.${scholarId},to_scholar_id.eq.${scholarId}`),
      ]);
      
      if (scholarRes.error) throw scholarRes.error;
      
      return {
        ...scholarRes.data,
        works: worksRes.data || [],
        relationships: relationshipsRes.data || [],
      } as ScholarWithDetails;
    },
    enabled: !!scholarId,
  });
}

export function useHistoricalEvents() {
  return useQuery({
    queryKey: ['historical-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historical_events')
        .select('*')
        .order('year', { ascending: true });
      
      if (error) throw error;
      return data as DbHistoricalEvent[];
    },
  });
}

export function useRelationships() {
  return useQuery({
    queryKey: ['relationships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relationships')
        .select('*');
      
      if (error) throw error;
      return data as DbRelationship[];
    },
  });
}

export function usePlaces() {
  return useQuery({
    queryKey: ['places'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .order('importance', { ascending: false });
      
      if (error) throw error;
      return data as DbPlace[];
    },
  });
}
