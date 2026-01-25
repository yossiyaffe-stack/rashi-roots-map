/**
 * Domain Configuration for Context-Aware Influence Scoring
 * 
 * Each domain represents a specific area of Jewish scholarship.
 * Canonical multipliers adjust base influence scores to reflect
 * a scholar's relative importance within that specific domain.
 * 
 * MULTIPLIER METHODOLOGY:
 * -----------------------
 * 2.5 = FOUNDATIONAL (everyone uses it)
 *       Example: Shulchan Aruch in halakha, Mishneh Torah, Zohar
 * 
 * 2.3 = UNIVERSAL (in every collection)
 *       Example: Rashi in Torah commentary, Tosafot in Talmud
 * 
 * 2.0 = MAJOR (standard reference)
 *       Example: Ramban in Torah, Rosh in Talmud, Aruch HaShulchan
 * 
 * 1.8 = IMPORTANT (widely studied)
 *       Example: Rashbam, Sforno, Maharik
 * 
 * 1.5 = SIGNIFICANT (specialized but valuable)
 *       Example: Kli Yakar, Shabbetai Bass
 * 
 * 1.0 = BASE (no adjustment)
 *       Applied to all scholars in "all" domain or unlisted works
 */

export const DOMAINS = {
  all: {
    id: 'all',
    name: 'All Rabbinic Literature',
    description: '200 BCE – 2025 CE, entire corpus',
    multipliers: {} as Record<string, number>
  },
  torah_commentary: {
    id: 'torah_commentary',
    name: 'Torah Commentary',
    description: 'Biblical commentators on Pentateuch',
    multipliers: {
      'rashi': 2.3,           // 416 × 2.3 = 957 - foundational
      'ramban': 2.2,          // Major Torah commentator
      'ibn_ezra': 2.1,        // Major grammatical approach
      'rashbam': 1.8,         // Important peshat commentator
      'sforno': 1.7,
      'ohr_hachaim': 1.6,
      'kli_yakar': 1.5,
      'mizrahi': 1.9,         // Major Rashi supercommentary
      'maharal': 1.7,         // Gur Aryeh on Rashi
      'shabbetai_bass': 1.4,  // Siftei Chakhamim
    } as Record<string, number>
  },
  talmud_commentary: {
    id: 'talmud_commentary',
    name: 'Talmud Commentary',
    description: 'Commentators on Babylonian Talmud',
    multipliers: {
      'rashi': 2.4,           // Rashi on Talmud even more canonical
      'tosafot': 2.3,
      'rabbeinu_tam': 2.2,    // Leader of Tosafists
      'rosh': 2.0,
      'ran': 1.9,
      'ritva': 1.8,
      'rashba': 2.1,
      'maharshal': 1.9,       // Critical Talmud work
      'vilna_gaon': 2.0,      // Biur HaGra
    } as Record<string, number>
  },
  halakha: {
    id: 'halakha',
    name: 'Halakhic Works',
    description: 'Jewish law codes and responsa',
    multipliers: {
      'shulchan_aruch': 2.5,
      'mishneh_torah': 2.5,
      'tur': 2.2,
      'aruch_hashulchan': 2.0,
      'mishnah_berurah': 2.1,
      'igrot_moshe': 1.8,
      'taz': 2.1,             // Major Shulchan Aruch commentary
      'vilna_gaon': 1.9,
    } as Record<string, number>
  },
  kabbalah: {
    id: 'kabbalah',
    name: 'Kabbalah & Mysticism',
    description: 'Mystical and esoteric works',
    multipliers: {
      'zohar': 2.5,
      'arizal': 2.3,
      'ramchal': 2.0,
      'tanya': 2.2,
      'sefer_yetzirah': 1.9,
      'maharal': 2.1,         // Deep philosophical/mystical
      'ramban': 1.8,          // Kabbalistic Torah commentary
    } as Record<string, number>
  },
  responsa: {
    id: 'responsa',
    name: 'Responsa Literature',
    description: 'Rabbinic legal decisions',
    multipliers: {
      'chatam_sofer': 2.0,
      'radvaz': 1.9,
      'rashba_responsa': 2.0,
      'maharik': 1.8,
      'maharam_rothenburg': 1.9,
      'rosh': 1.8,
    } as Record<string, number>
  }
} as const;

export type DomainId = keyof typeof DOMAINS;
export type Domain = typeof DOMAINS[DomainId];

/**
 * Get the canonical multiplier for a scholar in a specific domain
 * Returns 1.0 if no special multiplier is defined
 */
export function getCanonicalMultiplier(
  scholarSlug: string | undefined | null, 
  domainId: DomainId
): number {
  if (!scholarSlug || domainId === 'all') return 1.0;
  return DOMAINS[domainId].multipliers[scholarSlug] ?? 1.0;
}

/**
 * Check if a scholar is canonical (has multiplier > 1) in a domain
 */
export function isCanonicalInDomain(
  scholarSlug: string | undefined | null,
  domainId: DomainId
): boolean {
  if (!scholarSlug || domainId === 'all') return false;
  const multiplier = DOMAINS[domainId].multipliers[scholarSlug];
  return multiplier !== undefined && multiplier > 1.0;
}

/**
 * Get all domain options for UI selectors
 */
export function getDomainOptions(): Array<{ id: DomainId; name: string; description: string }> {
  return Object.entries(DOMAINS).map(([id, domain]) => ({
    id: id as DomainId,
    name: domain.name,
    description: domain.description,
  }));
}
