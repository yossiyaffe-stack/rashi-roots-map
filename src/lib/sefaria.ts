/**
 * Sefaria API Client
 * 
 * Provides access to Sefaria's text database for:
 * - Text metadata and indexes
 * - Citation links between texts
 * - Related works and commentaries
 * 
 * Rate limiting: ~1 request per second recommended
 */

const SEFARIA_API = 'https://www.sefaria.org/api';

export interface SefariaIndex {
  title: string;
  heTitle: string;
  categories: string[];
  length: number;
  compDate?: number;
  compPlace?: string;
  era?: string;
}

export interface SefariaLink {
  ref: string;
  sourceRef: string;
  sourceHeRef: string;
  category: string;
  type?: string;
}

export interface CitationStats {
  sampleCitations: number[];
  averagePerVerse: number;
  estimatedTotalCitations: number;
  textLength: number;
}

export interface CitingSource {
  work: string;
  count: number;
}

/**
 * Fetch text index/metadata from Sefaria
 */
export async function getTextIndex(textName: string): Promise<SefariaIndex> {
  const encoded = encodeURIComponent(textName);
  const response = await fetch(`${SEFARIA_API}/v2/index/${encoded}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch index for ${textName}: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get links/citations for a specific text reference
 */
export async function getLinks(textRef: string): Promise<SefariaLink[]> {
  const encoded = encodeURIComponent(textRef);
  const response = await fetch(`${SEFARIA_API}/links/${encoded}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch links for ${textRef}: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get related texts for a work
 */
export async function getRelatedTexts(textName: string): Promise<{ links?: SefariaLink[] }> {
  const encoded = encodeURIComponent(textName);
  const response = await fetch(`${SEFARIA_API}/related/${encoded}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch related texts for ${textName}: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get citation statistics for a work by sampling verses
 */
export async function getCitationStats(textName: string): Promise<CitationStats | null> {
  try {
    // Sample different sections to estimate total citations
    const sampleRefs = [
      `${textName}.1.1`,
      `${textName}.2.1`,
      `${textName}.3.1`,
      `${textName}.5.1`,
      `${textName}.10.1`
    ];
    
    const citationCounts: number[] = [];
    
    for (const ref of sampleRefs) {
      try {
        const links = await getLinks(ref);
        citationCounts.push(links.length);
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch {
        // Skip failed refs (may not exist in all texts)
        continue;
      }
    }
    
    if (citationCounts.length === 0) {
      return null;
    }
    
    const avgPerVerse = citationCounts.reduce((a, b) => a + b, 0) / citationCounts.length;
    
    // Get total length from index
    const index = await getTextIndex(textName);
    const estimatedTotal = Math.floor(avgPerVerse * (index.length || 100));
    
    return {
      sampleCitations: citationCounts,
      averagePerVerse: avgPerVerse,
      estimatedTotalCitations: estimatedTotal,
      textLength: index.length || 0
    };
  } catch (error) {
    console.error('Error getting citation stats:', error);
    return null;
  }
}

/**
 * Get all works that cite this text, aggregated by source work
 */
export async function getCitingSources(textName: string): Promise<CitingSource[]> {
  try {
    const related = await getRelatedTexts(textName);
    
    if (!related.links || related.links.length === 0) {
      return [];
    }
    
    // Count citations by source work
    const citationCounts: Record<string, number> = {};
    
    // Sample first 200 links to get distribution
    for (const link of related.links.slice(0, 200)) {
      // Extract work name from reference (e.g., "Rashi on Genesis.1.1" -> "Rashi on Genesis")
      const sourceWork = link.ref.split('.')[0].replace(/_/g, ' ');
      citationCounts[sourceWork] = (citationCounts[sourceWork] || 0) + 1;
    }
    
    return Object.entries(citationCounts)
      .map(([work, count]) => ({ work, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error getting citing sources:', error);
    return [];
  }
}

/**
 * Sefaria text name mapping for scholars
 */
export const SCHOLAR_SEFARIA_WORKS: Record<string, string[]> = {
  'rashi': [
    'Rashi_on_Genesis',
    'Rashi_on_Exodus',
    'Rashi_on_Leviticus',
    'Rashi_on_Numbers',
    'Rashi_on_Deuteronomy'
  ],
  'rashbam': [
    'Rashbam_on_Genesis',
    'Rashbam_on_Exodus',
    'Rashbam_on_Leviticus',
    'Rashbam_on_Numbers',
    'Rashbam_on_Deuteronomy'
  ],
  'ibn-ezra': [
    'Ibn_Ezra_on_Genesis',
    'Ibn_Ezra_on_Exodus',
    'Ibn_Ezra_on_Leviticus',
    'Ibn_Ezra_on_Numbers',
    'Ibn_Ezra_on_Deuteronomy'
  ],
  'ramban': [
    'Ramban_on_Genesis',
    'Ramban_on_Exodus',
    'Ramban_on_Leviticus',
    'Ramban_on_Numbers',
    'Ramban_on_Deuteronomy'
  ]
};
