import { useQuery } from '@tanstack/react-query';

const SEFARIA_TOPIC_DETAIL_API = 'https://www.sefaria.org/api/v2/topics';

/**
 * Map common scholar names to Sefaria topic slugs
 */
export const SCHOLAR_SLUG_MAP: Record<string, string> = {
  // === RASHI'S FAMILY & STUDENTS ===
  'Rashi': 'rashi',
  'רש"י': 'rashi',
  'Rashbam': 'rashbam',
  'רשב"ם': 'rashbam',
  'Rabbeinu Tam': 'rabbeinu-tam',
  'רבינו תם': 'rabbeinu-tam',
  
  // === SPANISH SCHOOL ===
  'Ibn Ezra': 'ibn-ezra',
  'Abraham ibn Ezra': 'ibn-ezra',
  'אבן עזרא': 'ibn-ezra',
  'Ramban': 'nachmanides',
  'Nachmanides': 'nachmanides',
  'רמב"ן': 'nachmanides',
  'Rashba': 'rashba',
  'רשב"א': 'rashba',
  
  // === MAIMONIDES ===
  'Rambam': 'maimonides',
  'Maimonides': 'maimonides',
  'רמב"ם': 'maimonides',
  
  // === ITALIAN ===
  'Sforno': 'sforno',
  'ספורנו': 'sforno',
  
  // === RASHI SUPERCOMMENTATORS ===
  'Elijah Mizrachi': 'elijah-mizrachi',
  'Mizrachi': 'elijah-mizrachi',
  'Maharal': 'maharal',
  'מהר"ל': 'maharal',
  'Chizkuni': 'chizkuni',
  'חזקוני': 'chizkuni',
  
  // === CODES & HALACHA ===
  'Rosh': 'rosh',
  'רא"ש': 'rosh',
  'Joseph Karo': 'joseph-karo',
  'Rema': 'rema',
  'רמ"א': 'rema',
  
  // === LATER AUTHORITIES ===
  'Vilna Gaon': 'vilna-gaon',
  'Gra': 'vilna-gaon',
  'הגר"א': 'vilna-gaon',
  
  // === TANNAIM ===
  'Hillel': 'hillel',
  'הלל': 'hillel',
  'Shammai': 'shammai',
  'שמאי': 'shammai',
  'Rabbi Akiva': 'rabbi-akiva',
  'רבי עקיבא': 'rabbi-akiva',
  
  // === AMORAIM ===
  'Rav': 'rav',
  'Rava': 'rava',
  'רבא': 'rava',
  'Abaye': 'abaye',
  'אביי': 'abaye',
  
  // === GEONIM ===
  'Saadia Gaon': 'saadia-gaon',
  'רס"ג': 'saadia-gaon',
};

interface SefariaScholarData {
  slug: string;
  name: string;
  nameHebrew: string | null;
  description: string | null;
  descriptionHebrew: string | null;
  sefariaUrl: string;
  numSources: number;
}

/**
 * Get the Sefaria slug for a scholar name
 * Falls back to the provided slug if available, or converts name to slug format
 */
export function getSefariaSlug(name: string, existingSlug?: string | null): string {
  // Check the map first
  if (SCHOLAR_SLUG_MAP[name]) {
    return SCHOLAR_SLUG_MAP[name];
  }
  
  // Use existing slug if provided
  if (existingSlug) {
    return existingSlug;
  }
  
  // Convert name to slug format
  return name.toLowerCase().replace(/\s+/g, '-').replace(/['"]/g, '');
}

/**
 * Fetch a single scholar's bio from Sefaria
 */
async function fetchSefariaScholar(slug: string): Promise<SefariaScholarData | null> {
  try {
    const response = await fetch(`${SEFARIA_TOPIC_DETAIL_API}/${slug}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    
    return {
      slug: data.slug,
      name: data.primaryTitle?.en || data.slug,
      nameHebrew: data.primaryTitle?.he || null,
      description: data.description?.en || null,
      descriptionHebrew: data.description?.he || null,
      sefariaUrl: `https://www.sefaria.org/topics/${data.slug}`,
      numSources: data.numSources || 0,
    };
  } catch (error) {
    console.error(`Error fetching Sefaria data for ${slug}:`, error);
    return null;
  }
}

/**
 * React Query hook for fetching scholar bio from Sefaria
 */
export function useSefariaScholar(scholarName: string | null, existingSlug?: string | null) {
  const slug = scholarName ? getSefariaSlug(scholarName, existingSlug) : null;
  
  return useQuery({
    queryKey: ['sefaria-scholar', slug],
    queryFn: () => fetchSefariaScholar(slug!),
    enabled: !!slug,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: 1,
  });
}

/**
 * Get a brief bio (first 1-2 sentences) from the full description
 */
export function getBriefBio(description: string | null | undefined, maxLength: number = 150): string | null {
  if (!description) return null;
  
  // Split into sentences
  const sentences = description.split(/(?<=[.!?])\s+/);
  
  let brief = sentences[0];
  
  // Add second sentence if the first is very short
  if (brief.length < 80 && sentences.length > 1) {
    brief += ' ' + sentences[1];
  }
  
  // Truncate if too long
  if (brief.length > maxLength) {
    brief = brief.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
  }
  
  return brief;
}
