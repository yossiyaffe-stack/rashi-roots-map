import { useMemo } from 'react';
import type { DbScholar } from '@/hooks/useScholars';

export interface ScholarSearchIndex {
  scholar_id: string;
  searchTerms: string[];
}

// Extracts all searchable name variants from a scholar's name field
// Names are stored as: "[Common Name/Acronym] - [Alternative Name] ([Full Rabbinic Name])"
// e.g., "Rashi (Rabbi Shlomo Yitzchaki)" or "Ramban - Nachmanides (Rabbi Moshe ben Nachman)"
function extractNameVariants(name: string): string[] {
  const variants: string[] = [];
  
  // Add full name
  variants.push(name.toLowerCase());
  
  // Extract acronym/common name (before " - " or " (")
  const beforeDash = name.split(' - ')[0].split(' (')[0].trim();
  if (beforeDash) variants.push(beforeDash.toLowerCase());
  
  // Extract alternative name (between " - " and " (")
  const dashMatch = name.match(/ - ([^(]+)/);
  if (dashMatch) {
    variants.push(dashMatch[1].trim().toLowerCase());
  }
  
  // Extract full rabbinic name (inside parentheses)
  const parenMatch = name.match(/\(([^)]+)\)/);
  if (parenMatch) {
    variants.push(parenMatch[1].trim().toLowerCase());
    // Also add individual words from rabbinic name
    parenMatch[1].split(' ').forEach(word => {
      if (word.length > 2) variants.push(word.toLowerCase());
    });
  }
  
  // Common transliteration variants
  const transliterations: Record<string, string[]> = {
    'rashi': ['רש"י', 'rashi', 'raschi'],
    'rambam': ['רמב"ם', 'maimonides', 'moses maimonides'],
    'ramban': ['רמב"ן', 'nachmanides'],
    'rashbam': ['רשב"ם', 'rashbam'],
    'tosafot': ['תוספות', 'tosafos', 'tosefot'],
  };
  
  // Add known transliterations
  Object.entries(transliterations).forEach(([key, values]) => {
    if (beforeDash.toLowerCase().includes(key)) {
      values.forEach(v => variants.push(v.toLowerCase()));
    }
  });
  
  return [...new Set(variants)]; // Remove duplicates
}

// Extracts the best search-friendly name for external APIs like Sefaria
// For "Ramban - Nachmanides (Rabbi Moshe ben Nachman)" returns "Nachmanides"
// For "Rashi (Rabbi Shlomo Yitzchaki)" returns "Rashi"
export function getSefariaSearchName(name: string): string {
  // If there's an alternative name after " - ", prefer that (e.g., "Nachmanides")
  const dashMatch = name.match(/ - ([^(]+)/);
  if (dashMatch) {
    return dashMatch[1].trim();
  }
  
  // Otherwise use the common name/acronym before any parentheses
  const beforeParen = name.split(' (')[0].trim();
  return beforeParen;
}

export function useScholarNameVariants(scholars: DbScholar[]): Map<string, string[]> {
  return useMemo(() => {
    const map = new Map<string, string[]>();
    
    scholars.forEach(scholar => {
      const variants: string[] = [];
      
      // Extract from primary name
      variants.push(...extractNameVariants(scholar.name));
      
      // Add Hebrew name
      if (scholar.hebrew_name) {
        variants.push(scholar.hebrew_name.toLowerCase());
        // Hebrew names without vowels often have variations
        variants.push(scholar.hebrew_name);
      }
      
      map.set(scholar.id, [...new Set(variants)]);
    });
    
    return map;
  }, [scholars]);
}
