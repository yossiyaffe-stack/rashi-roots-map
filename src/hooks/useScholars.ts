import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type DbScholar = Tables<'scholars'>;
export type DbWork = Tables<'works'>;
export type DbRelationship = Tables<'relationships'>;
export type DbHistoricalEvent = Tables<'historical_events'>;
export type DbPlace = Tables<'places'>;
export type DbLocationName = Tables<'location_names'>;

// Multi-dimensional relationship types (defined manually until types regenerate)
export interface DbBiographicalRelationship {
  id: string;
  scholar_id: string;
  related_scholar_id: string;
  relationship_category: string;
  relationship_type: string;
  from_year: number | null;
  to_year: number | null;
  circa: boolean | null;
  certainty: string | null;
  primary_relationship: boolean | null;
  location_id: string | null;
  notes: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTextualRelationship {
  id: string;
  work_id: string;
  related_work_id: string | null;
  related_text_canonical: string | null;
  relationship_category: string;
  relationship_type: string;
  depth_level: number | null;
  subject_type: string | null;
  subject_text: string | null;
  section_reference: string | null;
  citation_count: number | null;
  certainty: string | null;
  notes: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbIntellectualRelationship {
  id: string;
  scholar_id: string;
  work_id: string | null;
  related_concept: string | null;
  relationship_category: string;
  relationship_type: string;
  from_year: number | null;
  to_year: number | null;
  circa: boolean | null;
  certainty: string | null;
  influence_strength: string | null;
  notes: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

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

export function useLocationNames() {
  return useQuery({
    queryKey: ['location-names'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('location_names')
        .select('*')
        .order('is_preferred', { ascending: false });
      
      if (error) throw error;
      return data as DbLocationName[];
    },
  });
}

// Multi-dimensional relationship hooks
// Note: Using 'as any' until Supabase types regenerate for new tables
export function useBiographicalRelationships() {
  return useQuery({
    queryKey: ['biographical-relationships'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('biographical_relationships')
        .select('*');
      
      if (error) throw error;
      return (data ?? []) as DbBiographicalRelationship[];
    },
  });
}

export function useTextualRelationships() {
  return useQuery({
    queryKey: ['textual-relationships'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('textual_relationships')
        .select('*');
      
      if (error) throw error;
      return (data ?? []) as DbTextualRelationship[];
    },
  });
}

export function useIntellectualRelationships() {
  return useQuery({
    queryKey: ['intellectual-relationships'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('intellectual_relationships')
        .select('*');
      
      if (error) throw error;
      return (data ?? []) as DbIntellectualRelationship[];
    },
  });
}

// Combined hook for all multi-dimensional relationships
export function useMultiDimensionalRelationships() {
  const biographical = useBiographicalRelationships();
  const textual = useTextualRelationships();
  const intellectual = useIntellectualRelationships();
  
  return {
    biographical: biographical.data ?? [],
    textual: textual.data ?? [],
    intellectual: intellectual.data ?? [],
    isLoading: biographical.isLoading || textual.isLoading || intellectual.isLoading,
    isError: biographical.isError || textual.isError || intellectual.isError,
  };
}
