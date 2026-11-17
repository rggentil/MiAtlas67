import { describe, expect, it } from 'vitest';
import { flagFileName, isCapitalEligible, REGIONS, type Entity } from '../domain/entity.ts';
import { countries } from './countries.ts';

const bundledFlags = new Set(
  Object.keys(import.meta.glob('../assets/flags/*.svg')).map((path) => path.split('/').pop()),
);

function byCode(code: string): Entity {
  const entity = countries.find((c) => c.code === code);
  if (!entity) throw new Error(`No entity with code ${code}`);
  return entity;
}

function duplicates(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

describe('countries dataset', () => {
  it('§13.2 has 193 UN members and 2 UN observers', () => {
    expect(countries.filter((c) => c.category === 'un-member')).toHaveLength(193);
    expect(countries.filter((c) => c.category === 'un-observer').map((c) => c.code)).toEqual([
      'VA',
      'PS',
    ]);
  });

  it('DATA-01 DATA-06 every entity has an ISO code, both names, a valid region and a tier', () => {
    for (const entity of countries) {
      expect(entity.code).toMatch(/^[A-Z]{2}$/);
      expect(entity.name.es.trim()).not.toBe('');
      expect(entity.name.en.trim()).not.toBe('');
      expect(REGIONS).toContain(entity.region);
      expect([1, 2, 3]).toContain(entity.tier);
    }
  });

  it('DATA-01 DATA-06 every quiz capital and other capital has both languages', () => {
    for (const entity of countries) {
      for (const capital of [entity.capital, ...entity.otherCapitals]) {
        if (capital === null) continue;
        expect(capital.es.trim(), entity.code).not.toBe('');
        expect(capital.en.trim(), entity.code).not.toBe('');
      }
    }
  });

  it('DATA-06 codes, Spanish names and English names are unique', () => {
    expect(duplicates(countries.map((c) => c.code))).toEqual([]);
    expect(duplicates(countries.map((c) => c.name.es))).toEqual([]);
    expect(duplicates(countries.map((c) => c.name.en))).toEqual([]);
  });

  it('CAP-03 no two entities share a quiz capital', () => {
    const capitals = countries.flatMap((c) => (c.capital ? [c.capital] : []));
    expect(duplicates(capitals.map((capital) => capital.es))).toEqual([]);
    expect(duplicates(capitals.map((capital) => capital.en))).toEqual([]);
  });

  it('DATA-03 other capitals differ from the quiz capital', () => {
    for (const entity of countries) {
      for (const other of entity.otherCapitals) {
        expect(other.es, entity.code).not.toBe(entity.capital?.es);
      }
    }
  });

  it('CAP-02 every one of the 195 countries can be asked in Capitals games', () => {
    expect(countries.filter((c) => !isCapitalEligible(c)).map((c) => c.code)).toEqual([]);
  });

  it.each([
    ['MC', 'Mónaco'],
    ['SG', 'Singapur'],
    ['VA', 'Ciudad del Vaticano'],
    ['NR', 'Yaren'],
    ['IL', 'Jerusalén'],
    ['PS', 'Jerusalén Este'],
  ])('D13 the quiz capital of %s is "%s"', (code, capital) => {
    expect(byCode(code).capital?.es).toBe(capital);
  });

  it('DATA-05 DATA-06 every flag file exists in the bundle', () => {
    const missing = countries.map(flagFileName).filter((file) => !bundledFlags.has(file));
    expect(missing).toEqual([]);
  });

  it.each([
    ['QA', 'Catar'],
    ['KE', 'Kenia'],
    ['NL', 'Países Bajos'],
    ['BH', 'Baréin'],
    ['BD', 'Bangladés'],
    ['SZ', 'Esuatini'],
  ])('DATA-02 the entity %s is called "%s" in Spanish', (code, name) => {
    expect(byCode(code).name.es).toBe(name);
  });

  it.each([
    ['RU', 'europe'],
    ['CY', 'europe'],
    ['TR', 'asia'],
    ['GE', 'asia'],
    ['KZ', 'asia'],
    ['EG', 'africa'],
  ])('DATA-04 transcontinental %s belongs to %s by convention', (code, region) => {
    expect(byCode(code).region).toBe(region);
  });

  it('§7 tier sizes stay close to the agreed ~40 / ~70 / ~85', () => {
    const size = (tier: number) => countries.filter((c) => c.tier === tier).length;
    expect(size(1)).toBeGreaterThanOrEqual(35);
    expect(size(1)).toBeLessThanOrEqual(45);
    expect(size(2)).toBeGreaterThanOrEqual(60);
    expect(size(2)).toBeLessThanOrEqual(80);
    expect(size(3)).toBeGreaterThanOrEqual(75);
  });
});
