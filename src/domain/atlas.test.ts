import { describe, expect, it } from 'vitest';
import { countries } from '../data/countries.ts';
import { extendedEntities } from '../data/extended.ts';
import { atlasOf } from './atlas.ts';
import type { Entity, ExtendedEntity } from './entity.ts';

const names = (entities: readonly Entity[], language: 'es' | 'en' = 'es') =>
  entities.map((entity) => entity.name[language]);

describe('atlasOf', () => {
  it('ATL-01 a region lists its countries, then its extended entities, each in alphabetical order', () => {
    const oceania = atlasOf(countries, extendedEntities, 'oceania', 'es');

    expect(oceania.countries).toHaveLength(14);
    expect(names(oceania.countries)[0]).toBe('Australia');
    expect(names(oceania.countries).at(-1)).toBe('Vanuatu');
    expect(oceania.countries.every((entity) => entity.region === 'oceania')).toBe(true);
    expect(oceania.others).toHaveLength(10);
    expect(names(oceania.others)[0]).toBe('Bougainville');
    expect(names(oceania.others).at(-1)).toBe('Tokelau');
  });

  it('ATL-01 the extended entities are never among the countries, and the countries never among the others', () => {
    const extendedCodes = new Set(extendedEntities.map((entity) => entity.code));

    for (const region of ['world', 'europe', 'africa', 'americas', 'asia', 'oceania'] as const) {
      const atlas = atlasOf(countries, extendedEntities, region, 'es');
      expect(atlas.countries.some((entity) => extendedCodes.has(entity.code))).toBe(false);
      expect(atlas.others.every((entity) => extendedCodes.has(entity.code))).toBe(true);
    }
  });

  it('ATL-01 "Mundo" lists the 195 countries and the 52 extended entities', () => {
    const world = atlasOf(countries, extendedEntities, 'world', 'es');

    expect(world.countries).toHaveLength(195);
    expect(world.others).toHaveLength(52);
  });

  it('ATL-01 every region has its own entities: Europa 45 + 13, África 54 + 6, América 35 + 17, Asia 47 + 6', () => {
    const counts = (['europe', 'africa', 'americas', 'asia'] as const).map((region) => {
      const atlas = atlasOf(countries, extendedEntities, region, 'es');
      return [atlas.countries.length, atlas.others.length];
    });

    expect(counts).toEqual([
      [45, 13],
      [54, 6],
      [35, 17],
      [47, 6],
    ]);
  });

  it('ATL-01 NFR-06 the order follows the language: accents do not move a name, and English sorts its own names', () => {
    const sample: Entity[] = [
      { ...country('IS'), name: { es: 'Islas Cook', en: 'Cook Islands' } },
      { ...country('IN'), name: { es: 'Isla Norfolk', en: 'Norfolk Island' } },
      { ...country('AT'), name: { es: 'Austria', en: 'Austria' } },
      { ...country('AL'), name: { es: 'Åland', en: 'Åland' } },
    ];

    expect(names(atlasOf(sample, [], 'world', 'es').countries)).toEqual([
      'Åland',
      'Austria',
      'Isla Norfolk',
      'Islas Cook',
    ]);
    expect(names(atlasOf(sample, [], 'world', 'en').countries, 'en')).toEqual([
      'Åland',
      'Austria',
      'Cook Islands',
      'Norfolk Island',
    ]);
  });

  it('ATL-01 a region without extended entities has an empty second list', () => {
    const only: ExtendedEntity[] = extendedEntities.filter((entity) => entity.region === 'asia');

    expect(atlasOf(countries, only, 'oceania', 'es').others).toEqual([]);
  });
});

function country(code: string): Entity {
  const found = countries.find((entity) => entity.code === code);
  if (!found) throw new Error(`No country ${code}`);
  return found;
}
