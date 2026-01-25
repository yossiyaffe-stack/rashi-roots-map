import { supabase } from '@/integrations/supabase/client';
import { calculateInfluenceScore } from './influenceScore';

export interface TemporalCSVRow {
  scholar_id?: string;
  scholar_name?: string;
  period_start: string;
  period_end: string;
  period_label?: string;
  manuscripts_new?: string;
  manuscripts_cumulative?: string;
  print_editions?: string;
  geographic_regions?: string;
}

/**
 * Parse CSV content into rows
 */
export function parseCSV(csvContent: string): TemporalCSVRow[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });
    return row as unknown as TemporalCSVRow;
  });
}

/**
 * Import temporal influence data from parsed CSV rows
 */
export async function importTemporalData(
  csvRows: TemporalCSVRow[],
  scholarId: string
): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = [];
  let success = 0;
  
  const records = csvRows.map((row, index) => {
    try {
      const periodStart = parseInt(row.period_start);
      const periodEnd = parseInt(row.period_end);
      
      if (isNaN(periodStart) || isNaN(periodEnd)) {
        throw new Error(`Invalid period dates at row ${index + 1}`);
      }
      
      const manuscriptsCumulative = parseInt(row.manuscripts_cumulative || '0');
      const printEditions = parseInt(row.print_editions || '0');
      const geographicRegions = parseInt(row.geographic_regions || '0');
      
      return {
        scholar_id: scholarId,
        period_start: periodStart,
        period_end: periodEnd,
        period_label: row.period_label || null,
        manuscripts_new: parseInt(row.manuscripts_new || '0'),
        manuscripts_cumulative: manuscriptsCumulative,
        print_editions: printEditions,
        geographic_regions: geographicRegions,
        influence_score: calculateInfluenceScore({
          manuscriptsCumulative,
          printEditions,
          geographicRegions,
          periodStart,
        }),
      };
    } catch (err) {
      errors.push(`Row ${index + 1}: ${err instanceof Error ? err.message : 'Parse error'}`);
      return null;
    }
  }).filter(Boolean);
  
  if (records.length === 0) {
    return { success: 0, errors: ['No valid records to import'] };
  }
  
  // Delete existing records for this scholar
  await supabase
    .from('temporal_influence')
    .delete()
    .eq('scholar_id', scholarId);
  
  // Insert new records
  const { error } = await supabase
    .from('temporal_influence')
    .insert(records);
  
  if (error) {
    errors.push(`Database error: ${error.message}`);
  } else {
    success = records.length;
  }
  
  return { success, errors };
}

/**
 * Bulk import for multiple scholars
 */
export async function importBulkTemporalData(
  csvContent: string,
  scholarIdMap: Map<string, string> // name -> UUID mapping
): Promise<{ success: number; errors: string[] }> {
  const rows = parseCSV(csvContent);
  const errors: string[] = [];
  let totalSuccess = 0;
  
  // Group by scholar
  const byScholar = new Map<string, TemporalCSVRow[]>();
  
  for (const row of rows) {
    const scholarKey = row.scholar_id || row.scholar_name || '';
    if (!scholarKey) {
      errors.push('Row missing scholar identifier');
      continue;
    }
    
    const existing = byScholar.get(scholarKey) || [];
    existing.push(row);
    byScholar.set(scholarKey, existing);
  }
  
  // Process each scholar
  for (const [key, scholarRows] of byScholar) {
    const scholarId = scholarIdMap.get(key) || key;
    const result = await importTemporalData(scholarRows, scholarId);
    totalSuccess += result.success;
    errors.push(...result.errors.map(e => `[${key}] ${e}`));
  }
  
  return { success: totalSuccess, errors };
}
