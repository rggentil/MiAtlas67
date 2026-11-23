import type { Entity, ExtendedEntity, Localized } from './entity.ts';
import type { RegionChoice } from './questions.ts';

/** What the Atlas lists for a region (ATL-01, D34). */
export interface AtlasRegion {
  /** The countries of the region (all 195 in "Mundo"), in alphabetical order. */
  readonly countries: readonly Entity[];
  /** Its extended entities, «Territorios y otros», in alphabetical order, after the countries. */
  readonly others: readonly ExtendedEntity[];
}

/**
 * The entities the Atlas shows for `region`, each list in the alphabetical order of `language`: «Isla Norfolk»
 * before «Islas Cook», and an accent does not move a name («Åland» next to «Austria»).
 */
export function atlasOf(
  countries: readonly Entity[],
  extended: readonly ExtendedEntity[],
  region: RegionChoice,
  language: keyof Localized,
): AtlasRegion {
  const collator = new Intl.Collator(language);
  const inRegion = (entity: Entity) => region === 'world' || entity.region === region;
  const byName = (a: Entity, b: Entity) => collator.compare(a.name[language], b.name[language]);

  return {
    countries: countries.filter(inRegion).sort(byName),
    others: extended.filter(inRegion).sort(byName),
  };
}
