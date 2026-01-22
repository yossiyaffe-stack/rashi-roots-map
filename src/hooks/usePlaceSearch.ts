import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlaceSearchResult {
  place_id: string;
  modern_name: string;
  name_english: string;
  name_hebrew: string | null;
  latitude: number;
  longitude: number;
  matched_name: string;
  matched_language: string;
  matched_script: string;
}

export function usePlaceSearch() {
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchPlaces = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const normalizedQuery = query.toLowerCase().trim();
      
      // Search location_names table for any matching name variation
      const { data: nameMatches, error: nameError } = await supabase
        .from('location_names')
        .select(`
          place_id,
          name,
          language,
          script
        `)
        .or(`name.ilike.%${query}%,normalized_name.ilike.%${normalizedQuery}%`)
        .limit(20);

      if (nameError) throw nameError;

      if (!nameMatches || nameMatches.length === 0) {
        // Fallback: search places table directly
        const { data: places, error: placesError } = await supabase
          .from('places')
          .select('id, modern_name, name_english, name_hebrew, latitude, longitude')
          .or(`name_english.ilike.%${query}%,name_hebrew.ilike.%${query}%,modern_name.ilike.%${query}%`)
          .limit(10);

        if (placesError) throw placesError;

        setResults(
          (places || []).map(p => ({
            place_id: p.id,
            modern_name: p.modern_name,
            name_english: p.name_english,
            name_hebrew: p.name_hebrew,
            latitude: p.latitude,
            longitude: p.longitude,
            matched_name: p.name_english,
            matched_language: 'english',
            matched_script: 'latin',
          }))
        );
        return;
      }

      // Get unique place IDs
      const placeIds = [...new Set(nameMatches.map(n => n.place_id))];

      // Fetch place details for matched places
      const { data: places, error: placesError } = await supabase
        .from('places')
        .select('id, modern_name, name_english, name_hebrew, latitude, longitude')
        .in('id', placeIds);

      if (placesError) throw placesError;

      // Combine results with matched name info
      const combinedResults: PlaceSearchResult[] = [];
      const seenPlaces = new Set<string>();

      for (const match of nameMatches) {
        if (seenPlaces.has(match.place_id)) continue;
        seenPlaces.add(match.place_id);

        const place = places?.find(p => p.id === match.place_id);
        if (place) {
          combinedResults.push({
            place_id: place.id,
            modern_name: place.modern_name,
            name_english: place.name_english,
            name_hebrew: place.name_hebrew,
            latitude: place.latitude,
            longitude: place.longitude,
            matched_name: match.name,
            matched_language: match.language,
            matched_script: match.script || 'latin',
          });
        }
      }

      setResults(combinedResults);
    } catch (error) {
      console.error('Place search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return { results, isSearching, searchPlaces, clearResults };
}
