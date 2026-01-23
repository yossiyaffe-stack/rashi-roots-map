import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DbWork, DbTextualRelationship, DbPlace } from './useScholars';

// Work location types
export type WorkLocationType = 'composition' | 'first_print' | 'reprint' | 'manuscript_copy' | 'translation';

export interface WorkLocationEvent {
  id: string;
  work_id: string;
  place_id: string | null;
  location_type: WorkLocationType;
  year: number | null;
  circa: boolean;
  printer_publisher: string | null;
  notes: string | null;
  source: string | null;
  // Joined place data
  place?: {
    id: string;
    name_english: string;
    name_hebrew: string | null;
    latitude: number;
    longitude: number;
    modern_country: string | null;
  } | null;
}

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
  // Work-specific location events
  location_events?: WorkLocationEvent[];
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
      // Fetch works with author data
      const { data: worksData, error: worksError } = await supabase
        .from('works')
        .select(`
          *,
          scholar:scholars!scholar_id(id, name, hebrew_name, latitude, longitude, period)
        `);
      
      if (worksError) throw worksError;

      // Fetch work locations with place data
      const { data: locationsData, error: locationsError } = await supabase
        .from('work_locations')
        .select(`
          *,
          place:places!place_id(id, name_english, name_hebrew, latitude, longitude, modern_country)
        `);
      
      if (locationsError) throw locationsError;

      // Group locations by work_id
      const locationsByWork = new Map<string, WorkLocationEvent[]>();
      (locationsData ?? []).forEach((loc: any) => {
        const workId = loc.work_id;
        if (!locationsByWork.has(workId)) {
          locationsByWork.set(workId, []);
        }
        locationsByWork.get(workId)!.push({
          id: loc.id,
          work_id: loc.work_id,
          place_id: loc.place_id,
          location_type: loc.location_type,
          year: loc.year,
          circa: loc.circa ?? false,
          printer_publisher: loc.printer_publisher,
          notes: loc.notes,
          source: loc.source,
          place: loc.place ? {
            id: loc.place.id,
            name_english: loc.place.name_english,
            name_hebrew: loc.place.name_hebrew,
            latitude: loc.place.latitude,
            longitude: loc.place.longitude,
            modern_country: loc.place.modern_country,
          } : null,
        });
      });
      
      return (worksData ?? []).map((work: any) => ({
        ...work,
        author_id: work.scholar?.id || '',
        author_name: work.scholar?.name || 'Unknown',
        author_hebrew_name: work.scholar?.hebrew_name || null,
        latitude: work.scholar?.latitude || null,
        longitude: work.scholar?.longitude || null,
        author_period: work.scholar?.period || null,
        location_events: locationsByWork.get(work.id) || [],
      })) as WorkWithLocation[];
    },
  });
}

export function useWorkLocations(workId?: string) {
  return useQuery({
    queryKey: ['work-locations', workId],
    enabled: !!workId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_locations')
        .select(`
          *,
          place:places!place_id(id, name_english, name_hebrew, latitude, longitude, modern_country)
        `)
        .eq('work_id', workId!)
        .order('year', { ascending: true });
      
      if (error) throw error;
      
      return (data ?? []).map((loc: any) => ({
        id: loc.id,
        work_id: loc.work_id,
        place_id: loc.place_id,
        location_type: loc.location_type as WorkLocationType,
        year: loc.year,
        circa: loc.circa ?? false,
        printer_publisher: loc.printer_publisher,
        notes: loc.notes,
        source: loc.source,
        place: loc.place ? {
          id: loc.place.id,
          name_english: loc.place.name_english,
          name_hebrew: loc.place.name_hebrew,
          latitude: loc.place.latitude,
          longitude: loc.place.longitude,
          modern_country: loc.place.modern_country,
        } : null,
      })) as WorkLocationEvent[];
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
