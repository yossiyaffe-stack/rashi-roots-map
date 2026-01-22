import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type DbScholar = Tables<'scholars'>;
export type DbWork = Tables<'works'>;
export type DbRelationship = Tables<'relationships'>;
export type DbHistoricalEvent = Tables<'historical_events'> & { category?: string };
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

export interface WorkWithTextualRelationships extends DbWork {
  textualRelationships?: {
    id: string;
    relationship_type: string;
    relationship_category: string;
    related_work_title: string | null;
    related_work_hebrew_title: string | null;
    related_text_canonical: string | null;
    depth_level: number | null;
    notes: string | null;
    author_name: string | null;
  }[];
  supercommentaries?: {
    id: string;
    title: string;
    hebrew_title: string | null;
    author_name: string;
    notes: string | null;
  }[];
}

export interface ScholarWithWorksAndRelationships extends DbScholar {
  works?: WorkWithTextualRelationships[];
  relationships?: DbRelationship[];
}

export function useScholarWithWorks(scholarId: string | null) {
  return useQuery({
    queryKey: ['scholar', scholarId],
    queryFn: async () => {
      if (!scholarId) return null;
      
      // Fetch scholar, their works, and relationships in parallel
      const [scholarRes, worksRes, relationshipsRes] = await Promise.all([
        supabase.from('scholars').select('*').eq('id', scholarId).single(),
        supabase.from('works').select('*').eq('scholar_id', scholarId),
        supabase.from('relationships').select('*').or(`from_scholar_id.eq.${scholarId},to_scholar_id.eq.${scholarId}`),
      ]);
      
      if (scholarRes.error) throw scholarRes.error;
      
      const works = worksRes.data || [];
      const workIds = works.map(w => w.id);
      
      // Fetch textual relationships where this scholar's works are the TARGET (supercommentaries ON their works)
      let textualRelsByWork: Record<string, WorkWithTextualRelationships['supercommentaries']> = {};
      
      if (workIds.length > 0) {
        const { data: textualRels } = await supabase
          .from('textual_relationships')
          .select(`
            id,
            work_id,
            related_work_id,
            relationship_type,
            relationship_category,
            depth_level,
            notes,
            work:works!work_id(id, title, hebrew_title, scholar_id)
          `)
          .in('related_work_id', workIds);
        
        // Group supercommentaries by the target work (related_work_id)
        if (textualRels) {
          for (const rel of textualRels) {
            const targetWorkId = rel.related_work_id;
            if (!targetWorkId) continue;
            
            if (!textualRelsByWork[targetWorkId]) {
              textualRelsByWork[targetWorkId] = [];
            }
            
            // Get author name for the commenting work
            const commentingWork = rel.work as any;
            let authorName = 'Unknown';
            if (commentingWork?.scholar_id) {
              const { data: authorData } = await supabase
                .from('scholars')
                .select('name')
                .eq('id', commentingWork.scholar_id)
                .single();
              if (authorData) authorName = authorData.name;
            }
            
            textualRelsByWork[targetWorkId]!.push({
              id: rel.id,
              title: commentingWork?.title || 'Unknown Work',
              hebrew_title: commentingWork?.hebrew_title || null,
              author_name: authorName,
              notes: rel.notes,
            });
          }
        }
      }
      
      // Attach supercommentaries to each work
      const worksWithRelationships: WorkWithTextualRelationships[] = works.map(work => ({
        ...work,
        supercommentaries: textualRelsByWork[work.id] || [],
      }));
      
      return {
        ...scholarRes.data,
        works: worksWithRelationships,
        relationships: relationshipsRes.data || [],
      } as ScholarWithWorksAndRelationships;
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
      // Fetch textual relationships with work author info to map to scholars
      const { data, error } = await supabase
        .from('textual_relationships')
        .select(`
          *,
          work:works!work_id(id, scholar_id),
          related_work:works!related_work_id(id, scholar_id)
        `);
      
      if (error) throw error;
      
      // Transform to include scholar IDs for visualization
      return (data ?? []).map((rel: any) => ({
        ...rel,
        from_scholar_id: rel.work?.scholar_id || null,
        to_scholar_id: rel.related_work?.scholar_id || null,
      })) as (DbTextualRelationship & { from_scholar_id: string | null; to_scholar_id: string | null })[];
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
