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

/**
 * The article a name takes inside a sentence, per language (DATA-09): «el Reino Unido», «the Netherlands».
 * Most names take none; «los» marks a plural name (Países Bajos). Which ones take one was reviewed by the
 * product owner (D18).
 */
export interface Articles {
  readonly es?: 'el' | 'la' | 'los';
  readonly en?: 'the';
}

/** Anything that can be asked in a question (spec §4, DATA-01). */
export interface Entity {
  /**
   * Upper-case code: ISO 3166-1 alpha-2 where one exists (ES), otherwise ISO 3166-2 (GB-SCT) or a custom code
   * (XS, Somalilandia) (DATA-01). It also names the flag file.
   */
  readonly code: string;
  readonly name: Localized;
  /** The article the name takes in a sentence, if any (DATA-09). Options and lists show the name alone. */
  readonly article?: Articles;
  /** Quiz capital (DATA-03); `null` keeps the entity out of Capitals games (CAP-02, CAP-03). */
  readonly capital: Localized | null;
  /** Other official capitals: shown as extra info, never offered as wrong options (DATA-03). */
  readonly otherCapitals: readonly Localized[];
  readonly region: Region;
  readonly category: Category;
  readonly tier: Tier;
  /**
   * The entity has a recognizable silhouette, so it can be asked or offered in Shapes games. Microstates
   * (SHAPE-03) and entities without a reliable, undisputed geometry (SHAPE-04) do not.
   */
  readonly shapeEligible: boolean;
}

/**
 * An entity of the extended set (§13.2, Appendix A): a territory, a state with limited recognition or an
 * autonomous region, asked only at level 4 Experto (LVL-07).
 */
export interface ExtendedEntity extends Entity {
  readonly category: 'limited-recognition' | 'territory' | 'subnational';
  /** Its status in plain, factual words, for the Atlas: «Territorio autónomo de Dinamarca» (DATA-08). */
  readonly status: Localized;
}

export function isCapitalEligible(entity: Entity): boolean {
  return entity.capital !== null;
}

export function isShapeEligible(entity: Entity): boolean {
  return entity.shapeEligible;
}

/** File name of the entity's silhouette in `src/assets/shapes` (SHAPE-02). */
export function shapeFileName(entity: Entity): string {
  return `${entity.code.toLowerCase()}.svg`;
}

/** File name of the entity's flag in `src/assets/flags`. */
export function flagFileName(entity: Entity): string {
  return `${entity.code.toLowerCase()}.svg`;
}
