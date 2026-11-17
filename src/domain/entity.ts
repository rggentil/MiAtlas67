/** Regions of the game (spec §4). "Mundo" is not a region but all of them together (LVL-02). */
export const REGIONS = ['europe', 'africa', 'americas', 'asia', 'oceania'] as const;
export type Region = (typeof REGIONS)[number];

/** Entity categories (spec §13.2). */
export type Category =
  'un-member' | 'un-observer' | 'limited-recognition' | 'territory' | 'subnational';

/** Familiarity tier (spec §7): 1 very well known, 2 reasonably known, 3 the rest. */
export type Tier = 1 | 2 | 3;

export interface Localized {
  readonly es: string;
  readonly en: string;
}

/** Anything that can be asked in a question (spec §4, DATA-01). */
export interface Entity {
  /** ISO 3166-1 alpha-2 code, upper case; it also names the flag file. */
  readonly code: string;
  readonly name: Localized;
  /** Quiz capital (DATA-03); `null` keeps the entity out of Capitals games (CAP-02, CAP-03). */
  readonly capital: Localized | null;
  /** Other official capitals: shown as extra info, never offered as wrong options (DATA-03). */
  readonly otherCapitals: readonly Localized[];
  readonly region: Region;
  readonly category: Category;
  readonly tier: Tier;
}

export function isCapitalEligible(entity: Entity): boolean {
  return entity.capital !== null;
}

/** File name of the entity's flag in `src/assets/flags`. */
export function flagFileName(entity: Entity): string {
  return `${entity.code.toLowerCase()}.svg`;
}
