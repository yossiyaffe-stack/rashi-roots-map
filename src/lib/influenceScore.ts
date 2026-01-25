/**
 * Influence Score Calculator for Rabbinic Texts
 * 
 * Scoring components:
 * - Manuscripts (cumulative): weight 2x
 * - Print editions: weight 10x
 * - Geographic regions: weight 15x
 * 
 * Period multipliers account for different eras of text production.
 * Domain-specific canonical multipliers adjust scores based on context.
 * 
 * Example calculation:
 * Rashi with 100 manuscripts, 200 prints, 20 regions in 1500s:
 * = (100×2) + (200×10) + (20×15) = 200 + 2000 + 300 = 2500 raw
 * = log₁₀(2501) × 150 × 1.2 = 3.4 × 150 × 1.2 = 612 base score
 * With Torah Commentary domain multiplier (2.3): 612 × 2.3 = 999 (capped)
 */

import { getCanonicalMultiplier, type DomainId } from './domains';

export interface InfluenceData {
  manuscriptsCumulative: number;
  printEditions: number;
  geographicRegions: number;
  citationsTotal?: number; // Sefaria citation count
  periodStart: number;
  scholarSlug?: string | null;
  domain?: DomainId;
}

/**
 * Calculate influence score with optional domain-specific multiplier
 * 
 * Scoring components:
 * - Manuscripts: 2 points each (physical preservation)
 * - Print editions: 10 points each (mass distribution)
 * - Geographic regions: 15 points each (cultural spread)
 * - Citations: 0.05 points each (scholarly engagement via Sefaria)
 */
export function calculateInfluenceScore(data: InfluenceData): number {
  // Component scores with weights
  const manuscriptScore = data.manuscriptsCumulative * 2;
  const printScore = data.printEditions * 10;
  const geoScore = data.geographicRegions * 15;
  const citationScore = (data.citationsTotal || 0) * 0.05; // 0.05 per citation
  
  const rawScore = manuscriptScore + printScore + geoScore + citationScore;
  
  // Logarithmic scaling for massive range handling
  const baseScore = rawScore > 0 ? Math.log10(rawScore + 1) * 150 : 0;
  
  // Period multipliers
  let periodMultiplier = 1.0;
  if (data.periodStart < 1475) {
    periodMultiplier = 0.6; // Manuscript era - fewer sources
  } else if (data.periodStart < 1550) {
    periodMultiplier = 1.2; // Early print revolution
  } else if (data.periodStart < 1900) {
    periodMultiplier = 1.0; // Established print era
  } else {
    periodMultiplier = 0.9; // Modern - normalized for volume
  }
  
  let score = baseScore * periodMultiplier;
  
  // Apply canonical multiplier if domain specified
  if (data.scholarSlug && data.domain && data.domain !== 'all') {
    const canonicalMultiplier = getCanonicalMultiplier(data.scholarSlug, data.domain);
    score = score * canonicalMultiplier;
  }
  
  return Math.min(Math.floor(score), 999);
}

/**
 * Calculate base influence score without domain multiplier
 * Used for displaying the "base" score in tooltips
 */
export function calculateBaseInfluenceScore(data: Omit<InfluenceData, 'scholarSlug' | 'domain'>): number {
  return calculateInfluenceScore({
    ...data,
    scholarSlug: undefined,
    domain: undefined,
  });
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
