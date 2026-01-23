import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DbWork, DbTextualRelationship } from './useScholars';

export interface WorkWithAuthor extends DbWork {
  author_name: string;
  author_hebrew_name: string | null;
}

export interface WorkWithLocation extends DbWork {
  author_name: string;
  author_hebrew_name: string | null;
  author_id: string;
  latitude: number | null;
  longitude: number | null;
  author_period: string | null;
}

export interface TextualRelationshipWithWorks extends DbTextualRelationship {
  from_work: WorkWithAuthor | null;
  to_work: WorkWithAuthor | null;
}

export function useWorksWithAuthors() {
  return useQuery({
    queryKey: ['works-with-authors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('works')
        .select(`
          *,
          scholar:scholars!scholar_id(id, name, hebrew_name)
        `);
      
      if (error) throw error;
      
      return (data ?? []).map((work: any) => ({
        ...work,
        author_name: work.scholar?.name || 'Unknown',
        author_hebrew_name: work.scholar?.hebrew_name || null,
      })) as WorkWithAuthor[];
    },
  });
}

export function useWorksWithLocations() {
  return useQuery({
    queryKey: ['works-with-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('works')
        .select(`
          *,
          scholar:scholars!scholar_id(id, name, hebrew_name, latitude, longitude, period)
        `);
      
      if (error) throw error;
      
      return (data ?? []).map((work: any) => ({
        ...work,
        author_id: work.scholar?.id || '',
        author_name: work.scholar?.name || 'Unknown',
        author_hebrew_name: work.scholar?.hebrew_name || null,
        latitude: work.scholar?.latitude || null,
        longitude: work.scholar?.longitude || null,
        author_period: work.scholar?.period || null,
      })) as WorkWithLocation[];
    },
  });
}

export function useTextualRelationshipsWithWorks() {
  return useQuery({
    queryKey: ['textual-relationships-with-works'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('textual_relationships')
        .select(`
          *,
          from_work:works!work_id(
            id, title, hebrew_title, year_written, work_type,
            scholar:scholars!scholar_id(id, name, hebrew_name)
          ),
          to_work:works!related_work_id(
            id, title, hebrew_title, year_written, work_type,
            scholar:scholars!scholar_id(id, name, hebrew_name)
          )
        `);
      
      if (error) throw error;
      
      return (data ?? []).map((rel: any) => ({
        ...rel,
        from_work: rel.from_work ? {
          ...rel.from_work,
          author_name: rel.from_work.scholar?.name || 'Unknown',
          author_hebrew_name: rel.from_work.scholar?.hebrew_name || null,
        } : null,
        to_work: rel.to_work ? {
          ...rel.to_work,
          author_name: rel.to_work.scholar?.name || 'Unknown',
          author_hebrew_name: rel.to_work.scholar?.hebrew_name || null,
        } : null,
      })) as TextualRelationshipWithWorks[];
    },
  });
}
