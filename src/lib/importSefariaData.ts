/**
 * Sefaria Data Import Utilities
 * 
 * Functions to fetch and import citation data from Sefaria API
 * into the local database for influence score calculations.
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  getCitationStats, 
  getCitingSources, 
  SCHOLAR_SEFARIA_WORKS,
  type CitingSource 
} from './sefaria';

export interface ImportResult {
  scholarSlug: string;
  totalCitations: number;
  topCitingSources: CitingSource[];
  message: string;
  success: boolean;
}

/**
 * Import Sefaria citation data for a specific scholar
 */
export async function importScholarSefariaData(scholarSlug: string): Promise<ImportResult> {
  const works = SCHOLAR_SEFARIA_WORKS[scholarSlug];
  
  if (!works || works.length === 0) {
    return {
      scholarSlug,
      totalCitations: 0,
      topCitingSources: [],
      message: `No Sefaria works configured for ${scholarSlug}`,
      success: false
    };
  }
  
  let totalCitations = 0;
  const allCitingSources: CitingSource[] = [];
  
  console.log(`Importing Sefaria data for ${scholarSlug}...`);
  
  for (const work of works) {
    console.log(`  Fetching ${work}...`);
    
    try {
      // Get citation stats
      const stats = await getCitationStats(work);
      if (stats) {
        totalCitations += stats.estimatedTotalCitations;
        console.log(`    Found ~${stats.estimatedTotalCitations} citations`);
      }
      
      // Get citing sources
      const sources = await getCitingSources(work);
      allCitingSources.push(...sources);
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`    Error fetching ${work}:`, error);
    }
  }
  
  // Aggregate citing sources across all works
  const aggregated: Record<string, number> = {};
  for (const source of allCitingSources) {
    aggregated[source.work] = (aggregated[source.work] || 0) + source.count;
  }
  
  const topCitingSources = Object.entries(aggregated)
    .map(([work, count]) => ({ work, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);
  
  // Save to database
  const { error } = await supabase
    .from('scholars')
    .update({
      sefaria_citations_total: totalCitations,
      sefaria_citing_sources: topCitingSources,
      sefaria_last_updated: new Date().toISOString()
    })
    .eq('slug', scholarSlug);
  
  if (error) {
    console.error('Database update error:', error);
    return {
      scholarSlug,
      totalCitations,
      topCitingSources,
      message: `Failed to save: ${error.message}`,
      success: false
    };
  }
  
  return {
    scholarSlug,
    totalCitations,
    topCitingSources,
    message: `Imported ${totalCitations.toLocaleString()} citations from ${topCitingSources.length} sources`,
    success: true
  };
}

/**
 * Import Sefaria data for all configured scholars
 */
export async function importAllSefariaData(): Promise<ImportResult[]> {
  const results: ImportResult[] = [];
  
  for (const slug of Object.keys(SCHOLAR_SEFARIA_WORKS)) {
    const result = await importScholarSefariaData(slug);
    results.push(result);
    
    // Longer delay between scholars
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}

/**
 * Import Rashi-specific Sefaria data (convenience function)
 */
export async function importRashiSefariaData(): Promise<ImportResult> {
  return importScholarSefariaData('rashi');
}
