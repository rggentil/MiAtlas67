import { describe, expect, it } from 'vitest';
import { flagFileName, isCapitalEligible, REGIONS, type Entity } from '../domain/entity.ts';
import { countries } from './countries.ts';
import { extendedEntities } from './extended.ts';
import { extendedLandBorders } from './neighbours.ts';
import { expertRelations, relations } from './relations.ts';
import { extendedFlagGroups, similarFlagGroups } from './similarFlags.ts';

const bundledFlags = new Set(
  Object.keys(import.meta.glob('../assets/flags/*.svg')).map((path) => path.split('/').pop()),
);

const flagSources = Object.values(
  import.meta.glob<string>('../assets/flags/SOURCES.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
).join('');

/** Appendix A of the spec after the review (D30), by category and region. */
const APPENDIX_A = {
  'limited-recognition': {
    europe: ['XK', 'MD-SN', 'XC'],
    asia: ['TW', 'GE-AB', 'XO'],
    africa: ['EH', 'XS'],
  },
  territory: {
    europe: ['FO', 'GI', 'IM', 'JE', 'GG'],
    americas: ['GL', 'PR', 'AW', 'CW', 'SX', 'BM', 'KY', 'VG', 'VI', 'TC', 'AI', 'MS', 'FK', 'PM'],
    asia: ['HK', 'MO'],
    africa: ['SH-HL'],
    oceania: ['NC', 'PF', 'GU', 'AS', 'MP', 'CK', 'NU', 'TK', 'NF'],
  },
  subnational: {
    europe: ['GB-ENG', 'GB-SCT', 'GB-WLS', 'AX', 'MD-GA'],
    americas: ['BQ-BO', 'BQ-SE', 'BQ-SA'],
    asia: ['IQ-KR'],
    africa: ['XP', 'XJ', 'XZ'],
    oceania: ['PG-NSB'],
  },
} as const;

/** Flags that flag-icons does not have: they come from Wikimedia Commons (DATA-05). */
const COMMONS_FLAGS = [
  'GE-AB',
  'XO',
  'MD-SN',
  'XC',
  'XS',
  'MD-GA',
  'BQ-BO',
  'BQ-SE',
  'BQ-SA',
  'IQ-KR',
  'XP',
  'XJ',
  'XZ',
  'PG-NSB',
];

const everyEntity: readonly Entity[] = [...countries, ...extendedEntities];

function byCode(code: string): Entity {
  const entity = everyEntity.find((candidate) => candidate.code === code);
  if (!entity) throw new Error(`No entity with code ${code}`);
  return entity;
}

function codes(entities: readonly Entity[]): string[] {
  return entities.map((entity) => entity.code);
}

function duplicates(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

function sorted(values: readonly string[]): string[] {
  return [...values].sort();
}

describe('extended set dataset', () => {
  it('DATA-07 has the 52 entities of Appendix A, each in its category and region (DATA-04)', () => {
    expect(extendedEntities).toHaveLength(52);
    for (const [category, regions] of Object.entries(APPENDIX_A)) {
      const byRegion: Readonly<Record<string, readonly string[]>> = regions;
      for (const [region, expected] of Object.entries(byRegion)) {
        const actual = extendedEntities.filter(
          (entity) => entity.category === category && entity.region === region,
        );
        expect(sorted(codes(actual)), `${category} / ${region}`).toEqual(sorted(expected));
      }
    }
  });

  it('§13.2 has 8 states with limited recognition, 31 territories and 13 autonomous regions', () => {
    const size = (category: string) =>
      extendedEntities.filter((entity) => entity.category === category).length;
    expect(size('limited-recognition')).toBe(8);
    expect(size('territory')).toBe(31);
    expect(size('subnational')).toBe(13);
  });

  it('DATA-07 D30 Azores and Madeira are left out, like Irlanda del Norte', () => {
    const names = extendedEntities.map((entity) => entity.name.es);
    expect(names).not.toContain('Azores');
    expect(names).not.toContain('Madeira');
    expect(names).not.toContain('Irlanda del Norte');
  });

  it('DATA-01 DATA-06 every entity has a code, both names, a valid region and a tier', () => {
    for (const entity of extendedEntities) {
      expect(entity.code).toMatch(/^[A-Z]{2}(-[A-Z0-9]{2,3})?$/);
      expect(entity.name.es.trim(), entity.code).not.toBe('');
      expect(entity.name.en.trim(), entity.code).not.toBe('');
      expect(REGIONS).toContain(entity.region);
      expect([1, 2, 3]).toContain(entity.tier);
    }
  });

  it('DATA-06 codes, Spanish names and English names are unique among the countries and the extended set', () => {
    expect(duplicates(everyEntity.map((entity) => entity.code))).toEqual([]);
    expect(duplicates(everyEntity.map((entity) => entity.name.es))).toEqual([]);
    expect(duplicates(everyEntity.map((entity) => entity.name.en))).toEqual([]);
  });

  it.each([
    ['FK', 'Islas Malvinas', 'Falkland Islands'],
    ['GL', 'Groenlandia', 'Greenland'],
    ['CW', 'Curazao', 'Curaçao'],
    ['XS', 'Somalilandia', 'Somaliland'],
    ['GE-AB', 'Abjasia', 'Abkhazia'],
    ['XJ', 'Jubalandia', 'Jubaland'],
    ['IQ-KR', 'Kurdistán iraquí', 'Kurdistan Region'],
    ['BQ-SE', 'San Eustaquio', 'Sint Eustatius'],
  ])('DATA-02 %s is called "%s" in Spanish and "%s" in English', (code, es, en) => {
    expect(byCode(code).name).toEqual({ es, en });
  });

  it('DATA-01 DATA-06 every quiz capital and other capital has both languages', () => {
    for (const entity of extendedEntities) {
      for (const capital of [entity.capital, ...entity.otherCapitals]) {
        if (capital === null) continue;
        expect(capital.es.trim(), entity.code).not.toBe('');
        expect(capital.en.trim(), entity.code).not.toBe('');
      }
    }
  });

  it('CAP-02 D30 only Chipre del Norte, Gibraltar, Hong Kong, Macao and Tokelau have no quiz capital', () => {
    const without = extendedEntities.filter((entity) => !isCapitalEligible(entity));
    expect(sorted(codes(without))).toEqual(sorted(['XC', 'GI', 'HK', 'MO', 'TK']));
  });

  it('CAP-03 D30 only Londres, Oranjestad and Kingston are the quiz capital of two entities', () => {
    for (const language of ['es', 'en'] as const) {
      const holders = new Map<string, string[]>();
      for (const entity of everyEntity) {
        if (entity.capital === null) continue;
        const name = entity.capital[language];
        holders.set(name, [...(holders.get(name) ?? []), entity.code]);
      }
      const shared = [...holders.values()].filter((entities) => entities.length > 1).map(sorted);
      expect(sorted(shared.map((pair) => pair.join(' ')))).toEqual([
        'AW BQ-SE',
        'GB GB-ENG',
        'JM NF',
      ]);
    }
  });

  it.each([
    ['FK', 'Puerto Argentino/Stanley', 'Stanley'],
    ['MS', 'Brades', 'Brades'],
    ['GU', 'Agaña', 'Hagåtña'],
    ['XZ', 'Ciudad de Zanzíbar', 'Zanzibar City'],
    ['PG-NSB', 'Buka', 'Buka'],
    ['GB-ENG', 'Londres', 'London'],
    ['BQ-SE', 'Oranjestad', 'Oranjestad'],
    ['EH', 'El Aaiún', 'Laayoune'],
  ])('D30 the quiz capital of %s is "%s" (en: "%s")', (code, es, en) => {
    expect(byCode(code).capital).toEqual({ es, en });
  });

  it('DATA-03 D30 Plymouth (Montserrat) and Arawa (Bougainville) are other capitals, not quiz capitals', () => {
    expect(byCode('MS').otherCapitals).toEqual([{ es: 'Plymouth', en: 'Plymouth' }]);
    expect(byCode('PG-NSB').otherCapitals).toEqual([{ es: 'Arawa', en: 'Arawa' }]);
    const quizCapitals = everyEntity.flatMap((entity) =>
      entity.capital ? [entity.capital.es] : [],
    );
    expect(quizCapitals).not.toContain('Plymouth');
    expect(quizCapitals).not.toContain('Arawa');
  });

  it('DATA-09 D30 the names that take an article are the ones the product owner reviewed', () => {
    const withArticle = (language: 'es' | 'en', article: string) =>
      sorted(codes(extendedEntities.filter((entity) => entity.article?.[language] === article)));
    expect(withArticle('es', 'el')).toEqual(sorted(['EH', 'IQ-KR']));
    expect(withArticle('es', 'la')).toEqual(sorted(['IM', 'NF', 'PF']));
    expect(extendedEntities.filter((entity) => entity.article?.es !== undefined)).toHaveLength(5);
    expect(withArticle('en', 'the')).toEqual(
      sorted(['FO', 'IM', 'KY', 'VG', 'VI', 'TC', 'FK', 'MP', 'CK', 'IQ-KR']),
    );
    expect(extendedEntities.filter((entity) => entity.article?.en !== undefined)).toHaveLength(10);
    // Plural names go without one in Spanish, as in D18: «de Bermudas», «de Islas Feroe».
    expect(byCode('BM').article).toBeUndefined();
    expect(byCode('FO').article?.es).toBeUndefined();
  });

  it('DATA-08 every entity has its status in plain words, in both languages', () => {
    for (const entity of extendedEntities) {
      expect(entity.status.es.trim(), entity.code).not.toBe('');
      expect(entity.status.en.trim(), entity.code).not.toBe('');
    }
    expect(byCode('FO')).toMatchObject({
      status: { es: 'Territorio autónomo de Dinamarca', en: 'Self-governing territory of Denmark' },
    });
    expect(byCode('TW')).toMatchObject({ status: { es: 'Estado con reconocimiento limitado' } });
    expect(byCode('XP')).toMatchObject({ status: { es: 'Estado federado de Somalia' } });
  });

  it('SHAPE-04 Puntland and Jubalandia are not in the Shapes games', () => {
    const notEligible = extendedEntities.filter((entity) => !entity.shapeEligible);
    expect(sorted(codes(notEligible))).toEqual(['XJ', 'XP']);
  });

  it('DATA-05 DATA-06 every flag file exists in the bundle', () => {
    const missing = extendedEntities.map(flagFileName).filter((file) => !bundledFlags.has(file));
    expect(missing).toEqual([]);
  });

  it('DATA-05 every flag from Wikimedia Commons is listed in SOURCES.md with its source and licence', () => {
    for (const code of COMMONS_FLAGS) {
      const row = flagSources
        .split('\n')
        .find((line) => line.startsWith(`| \`${code.toLowerCase()}.svg\``));
      expect(row, code).toBeDefined();
      expect(row, code).toContain('https://commons.wikimedia.org/wiki/File:');
      expect(row, code).toMatch(/\| (Public domain|CC BY-SA [0-9.]+) \|$/);
    }
  });
});

describe('level 4 land borders and similar flags', () => {
  const known = new Set(codes(everyEntity));
  const neighboursOf = (code: string) => sorted(expertRelations.neighbours.get(code) ?? []);
  const similarTo = (code: string) => expertRelations.similarFlags.get(code) ?? [];

  it('DATA-06 every extended border joins two different known entities, once', () => {
    const seen = new Set<string>();
    for (const [a, b] of extendedLandBorders) {
      expect(known, a).toContain(a);
      expect(known, b).toContain(b);
      expect(a).not.toBe(b);
      const key = sorted([a, b]).join(' ');
      expect(seen, key).not.toContain(key);
      seen.add(key);
    }
  });

  it('DATA-06 every extended flag group has at least two known entities, without repeats', () => {
    for (const group of extendedFlagGroups) {
      expect(group.length).toBeGreaterThanOrEqual(2);
      expect(new Set(group).size).toBe(group.length);
      for (const code of group) expect(known, code).toContain(code);
    }
  });

  it.each([
    ['XK', ['AL', 'RS', 'ME', 'MK']],
    ['EH', ['MA', 'MR', 'DZ']],
    ['GE-AB', ['GE', 'RU']],
    ['XS', ['SO', 'ET', 'DJ', 'XP']],
    ['GB-ENG', ['GB-SCT', 'GB-WLS']],
    ['GI', ['ES']],
    ['SX', ['FR']],
  ] as const)('LVL-06 D30 %s has the reviewed land neighbours', (code, expected) => {
    expect(neighboursOf(code)).toEqual(sorted(expected));
  });

  it('LVL-06 D30 at level 4 a country also borders its extended neighbours (Serbia–Kosovo)', () => {
    expect(neighboursOf('RS')).toContain('XK');
    expect(neighboursOf('MA')).toContain('EH');
    expect(neighboursOf('ES')).toContain('GI');
  });

  it('LVL-06 island territories have no land neighbours', () => {
    for (const code of [
      'TW',
      'FO',
      'IM',
      'JE',
      'GL',
      'PR',
      'BM',
      'FK',
      'NC',
      'GU',
      'BQ-BO',
      'XZ',
    ]) {
      expect(expertRelations.neighbours.get(code), code).toBeUndefined();
    }
  });

  it('LVL-06 D30 the British territories share the group of the Union Jack in the corner', () => {
    expect(similarTo('AU')).toEqual(expect.arrayContaining(['NZ', 'KY', 'FK', 'BM', 'CK', 'NU']));
  });

  it('LVL-06 D30 Jersey is among the red crosses on white, not with Escocia', () => {
    expect(similarTo('JE')).toEqual(expect.arrayContaining(['GB-ENG', 'GG', 'GE']));
    expect(similarTo('JE')).not.toContain('GB-SCT');
    expect(similarTo('GB-SCT')).toEqual([]);
  });

  it('LVL-06 D30 every flag with a crescent and a star is in one group', () => {
    expect(similarTo('TR')).toEqual(
      expect.arrayContaining([
        'TN',
        'XC',
        'DZ',
        'AZ',
        'MR',
        'PK',
        'MY',
        'SG',
        'TM',
        'UZ',
        'LY',
        'KM',
        'EH',
      ]),
    );
  });

  it('LVL-06 level 4 keeps every level 3 relation', () => {
    for (const [code, linked] of relations.neighbours) {
      expect(expertRelations.neighbours.get(code), code).toEqual(
        expect.arrayContaining([...linked]),
      );
    }
    for (const [code, linked] of relations.similarFlags) {
      expect(expertRelations.similarFlags.get(code), code).toEqual(
        expect.arrayContaining([...linked]),
      );
    }
  });
});

describe('levels 1–3 do not change', () => {
  const extendedCodes = new Set(codes(extendedEntities));

  it('§13.2 the 195 countries of levels 1–3 have no extended entity', () => {
    expect(countries).toHaveLength(195);
    expect(countries.filter((country) => extendedCodes.has(country.code))).toEqual([]);
    expect(
      countries.filter((country) => !['un-member', 'un-observer'].includes(country.category)),
    ).toEqual([]);
  });

  it('LVL-06 the level 3 borders and similar flags use no extended entity', () => {
    const used = [
      ...relations.neighbours.keys(),
      ...[...relations.neighbours.values()].flat(),
      ...relations.similarFlags.keys(),
      ...[...relations.similarFlags.values()].flat(),
      ...similarFlagGroups.flat(),
    ];
    expect(used.filter((code) => extendedCodes.has(code))).toEqual([]);
  });
});
