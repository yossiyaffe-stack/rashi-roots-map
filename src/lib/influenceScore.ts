/**
 * Influence Score Calculator for Rabbinic Texts
 * 
 * Scoring components:
 * - Manuscripts (cumulative): weight 2x
 * - Print editions: weight 10x
 * - Geographic regions: weight 15x
 * 
 * Period multipliers account for different eras of text production
 */

export interface InfluenceData {
  manuscriptsCumulative: number;
  printEditions: number;
  geographicRegions: number;
  periodStart: number;
}

export function calculateInfluenceScore(data: InfluenceData): number {
  // Component scores with weights
  const manuscriptScore = data.manuscriptsCumulative * 2;
  const printScore = data.printEditions * 10;
  const geoScore = data.geographicRegions * 15;
  
  const rawScore = manuscriptScore + printScore + geoScore;
  
  // Logarithmic scaling for massive range handling
  const baseScore = rawScore > 0 ? Math.log10(rawScore + 1) * 150 : 0;
  
  // Period multipliers
  let multiplier = 1.0;
  if (data.periodStart < 1475) {
    multiplier = 0.6; // Manuscript era - fewer sources
  } else if (data.periodStart < 1550) {
    multiplier = 1.2; // Early print revolution
  } else if (data.periodStart < 1900) {
    multiplier = 1.0; // Established print era
  } else {
    multiplier = 0.9; // Modern - normalized for volume
  }
  
  return Math.min(Math.floor(baseScore * multiplier), 999);
}

/**
 * Get influence level label based on score
 */
export function getInfluenceLevel(score: number): {
  label: string;
  color: string;
} {
  if (score >= 900) return { label: 'Foundational', color: 'text-amber-500' };
  if (score >= 700) return { label: 'Major', color: 'text-emerald-500' };
  if (score >= 500) return { label: 'Important', color: 'text-blue-500' };
  if (score >= 300) return { label: 'Significant', color: 'text-purple-500' };
  if (score >= 100) return { label: 'Notable', color: 'text-slate-400' };
  return { label: 'Limited', color: 'text-slate-500' };
}

/**
 * Format period label from start/end years
 */
export function formatPeriodLabel(start: number, end: number): string {
  if (start < 0) {
    return `${Math.abs(start)} BCE - ${end > 0 ? `${end} CE` : `${Math.abs(end)} BCE`}`;
  }
  return `${start} - ${end} CE`;
}
