import { describe, expect, it } from 'vitest';
import {
  flagFileName,
  isCapitalEligible,
  REGIONS,
  shapeFileName,
  type Entity,
} from '../domain/entity.ts';
import { capitalKey, generateRound, LEVELS, REGION_CHOICES, TOPICS } from '../domain/questions.ts';
import { createRng } from '../domain/random.ts';
import { countries } from './countries.ts';
import { extendedEntities } from './extended.ts';
import { extendedLandBorders } from './neighbours.ts';
import { expertRelations, relations } from './relations.ts';
import { extendedFlagGroups, similarFlagGroups } from './similarFlags.ts';

const bundledFlags = new Set(
  Object.keys(import.meta.glob('../assets/flags/*.svg')).map((path) => path.split('/').pop()),
);

/** The bundled silhouettes (SHAPE-02), by file name, with their SVG text. */
const bundledShapes = new Map(
  Object.entries(
    import.meta.glob<string>('../assets/shapes/*.svg', {
      eager: true,
      query: '?raw',
      import: 'default',
    }),
  ).map(([path, svg]) => [path.split('/').pop(), svg]),
);

/** A silhouette bigger than this would weigh too much on a phone, as for the 195 countries. */
const MAX_SHAPE_BYTES = 20_000;

const flagSources = Object.values(
  import.meta.glob<string>('../assets/flags/SOURCES.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
).join('');

type Pair = readonly [es: string, en: string];
type Row = readonly [
  category: string,
  region: string,
  name: Pair,
  capital: Pair | null,
  status: string,
];

/**
 * Appendix A as the product owner reviewed it (D30): category, region, name, quiz capital and status in Spanish.
 * Azores and Madeira are left out (Appendix A.4).
 */
// prettier-ignore
const REVIEWED: Readonly<Record<string, Row>> = {
  XK: ['limited-recognition', 'europe', ['Kosovo', 'Kosovo'], ['Pristina', 'Pristina'], 'Estado con reconocimiento limitado'],
  TW: ['limited-recognition', 'asia', ['Taiwán', 'Taiwan'], ['Taipéi', 'Taipei'], 'Estado con reconocimiento limitado'],
  EH: ['limited-recognition', 'africa', ['Sahara Occidental', 'Western Sahara'], ['El Aaiún', 'Laayoune'], 'Territorio en disputa'],
  'GE-AB': ['limited-recognition', 'asia', ['Abjasia', 'Abkhazia'], ['Sujumi', 'Sukhumi'], 'Estado de facto con reconocimiento limitado'],
  XO: ['limited-recognition', 'asia', ['Osetia del Sur', 'South Ossetia'], ['Tsjinvali', 'Tskhinvali'], 'Estado de facto con reconocimiento limitado'],
  'MD-SN': ['limited-recognition', 'europe', ['Transnistria', 'Transnistria'], ['Tiráspol', 'Tiraspol'], 'Estado de facto sin reconocimiento'],
  XC: ['limited-recognition', 'europe', ['Chipre del Norte', 'Northern Cyprus'], null, 'Estado de facto reconocido solo por Turquía'],
  XS: ['limited-recognition', 'africa', ['Somalilandia', 'Somaliland'], ['Hargeisa', 'Hargeisa'], 'Estado de facto con reconocimiento limitado'],
  FO: ['territory', 'europe', ['Islas Feroe', 'Faroe Islands'], ['Tórshavn', 'Tórshavn'], 'Territorio autónomo de Dinamarca'],
  GI: ['territory', 'europe', ['Gibraltar', 'Gibraltar'], null, 'Territorio británico de ultramar'],
  IM: ['territory', 'europe', ['Isla de Man', 'Isle of Man'], ['Douglas', 'Douglas'], 'Dependencia de la Corona británica'],
  JE: ['territory', 'europe', ['Jersey', 'Jersey'], ['Saint Helier', 'Saint Helier'], 'Dependencia de la Corona británica'],
  GG: ['territory', 'europe', ['Guernsey', 'Guernsey'], ['Saint Peter Port', 'Saint Peter Port'], 'Dependencia de la Corona británica'],
  GL: ['territory', 'americas', ['Groenlandia', 'Greenland'], ['Nuuk', 'Nuuk'], 'Territorio autónomo de Dinamarca'],
  PR: ['territory', 'americas', ['Puerto Rico', 'Puerto Rico'], ['San Juan', 'San Juan'], 'Territorio no incorporado de los Estados Unidos'],
  AW: ['territory', 'americas', ['Aruba', 'Aruba'], ['Oranjestad', 'Oranjestad'], 'País constituyente del Reino de los Países Bajos'],
  CW: ['territory', 'americas', ['Curazao', 'Curaçao'], ['Willemstad', 'Willemstad'], 'País constituyente del Reino de los Países Bajos'],
  SX: ['territory', 'americas', ['Sint Maarten', 'Sint Maarten'], ['Philipsburg', 'Philipsburg'], 'País constituyente del Reino de los Países Bajos'],
  BM: ['territory', 'americas', ['Bermudas', 'Bermuda'], ['Hamilton', 'Hamilton'], 'Territorio británico de ultramar'],
  KY: ['territory', 'americas', ['Islas Caimán', 'Cayman Islands'], ['George Town', 'George Town'], 'Territorio británico de ultramar'],
  VG: ['territory', 'americas', ['Islas Vírgenes Británicas', 'British Virgin Islands'], ['Road Town', 'Road Town'], 'Territorio británico de ultramar'],
  VI: ['territory', 'americas', ['Islas Vírgenes de los Estados Unidos', 'United States Virgin Islands'], ['Charlotte Amalie', 'Charlotte Amalie'], 'Territorio no incorporado de los Estados Unidos'],
  TC: ['territory', 'americas', ['Islas Turcas y Caicos', 'Turks and Caicos Islands'], ['Cockburn Town', 'Cockburn Town'], 'Territorio británico de ultramar'],
  AI: ['territory', 'americas', ['Anguila', 'Anguilla'], ['The Valley', 'The Valley'], 'Territorio británico de ultramar'],
  MS: ['territory', 'americas', ['Montserrat', 'Montserrat'], ['Brades', 'Brades'], 'Territorio británico de ultramar'],
  FK: ['territory', 'americas', ['Islas Malvinas', 'Falkland Islands'], ['Puerto Argentino/Stanley', 'Stanley'], 'Territorio británico de ultramar, reclamado por Argentina'],
  PM: ['territory', 'americas', ['San Pedro y Miquelón', 'Saint Pierre and Miquelon'], ['San Pedro', 'Saint-Pierre'], 'Colectividad de ultramar de Francia'],
  HK: ['territory', 'asia', ['Hong Kong', 'Hong Kong'], null, 'Región administrativa especial de China'],
  MO: ['territory', 'asia', ['Macao', 'Macau'], null, 'Región administrativa especial de China'],
  'SH-HL': ['territory', 'africa', ['Santa Elena', 'Saint Helena'], ['Jamestown', 'Jamestown'], 'Territorio británico de ultramar'],
  NC: ['territory', 'oceania', ['Nueva Caledonia', 'New Caledonia'], ['Numea', 'Nouméa'], 'Colectividad especial de Francia'],
  PF: ['territory', 'oceania', ['Polinesia Francesa', 'French Polynesia'], ['Papeete', 'Papeete'], 'Colectividad de ultramar de Francia'],
  GU: ['territory', 'oceania', ['Guam', 'Guam'], ['Agaña', 'Hagåtña'], 'Territorio no incorporado de los Estados Unidos'],
  AS: ['territory', 'oceania', ['Samoa Americana', 'American Samoa'], ['Pago Pago', 'Pago Pago'], 'Territorio no incorporado de los Estados Unidos'],
  MP: ['territory', 'oceania', ['Islas Marianas del Norte', 'Northern Mariana Islands'], ['Saipán', 'Saipan'], 'Estado libre asociado a los Estados Unidos'],
  CK: ['territory', 'oceania', ['Islas Cook', 'Cook Islands'], ['Avarua', 'Avarua'], 'Estado en libre asociación con Nueva Zelanda'],
  NU: ['territory', 'oceania', ['Niue', 'Niue'], ['Alofi', 'Alofi'], 'Estado en libre asociación con Nueva Zelanda'],
  TK: ['territory', 'oceania', ['Tokelau', 'Tokelau'], null, 'Territorio dependiente de Nueva Zelanda'],
  NF: ['territory', 'oceania', ['Isla Norfolk', 'Norfolk Island'], ['Kingston', 'Kingston'], 'Territorio externo de Australia'],
  'GB-ENG': ['subnational', 'europe', ['Inglaterra', 'England'], ['Londres', 'London'], 'País constituyente del Reino Unido'],
  'GB-SCT': ['subnational', 'europe', ['Escocia', 'Scotland'], ['Edimburgo', 'Edinburgh'], 'País constituyente del Reino Unido'],
  'GB-WLS': ['subnational', 'europe', ['Gales', 'Wales'], ['Cardiff', 'Cardiff'], 'País constituyente del Reino Unido'],
  AX: ['subnational', 'europe', ['Åland', 'Åland'], ['Mariehamn', 'Mariehamn'], 'Región autónoma de Finlandia'],
  'MD-GA': ['subnational', 'europe', ['Gagauzia', 'Gagauzia'], ['Comrat', 'Comrat'], 'Unidad territorial autónoma de Moldavia'],
  'BQ-BO': ['subnational', 'americas', ['Bonaire', 'Bonaire'], ['Kralendijk', 'Kralendijk'], 'Municipio especial de los Países Bajos'],
  'BQ-SE': ['subnational', 'americas', ['San Eustaquio', 'Sint Eustatius'], ['Oranjestad', 'Oranjestad'], 'Municipio especial de los Países Bajos'],
  'BQ-SA': ['subnational', 'americas', ['Saba', 'Saba'], ['The Bottom', 'The Bottom'], 'Municipio especial de los Países Bajos'],
  'IQ-KR': ['subnational', 'asia', ['Kurdistán iraquí', 'Kurdistan Region'], ['Erbil', 'Erbil'], 'Región autónoma de Irak'],
  XP: ['subnational', 'africa', ['Puntland', 'Puntland'], ['Garowe', 'Garowe'], 'Estado federado de Somalia'],
  XJ: ['subnational', 'africa', ['Jubalandia', 'Jubaland'], ['Kismayo', 'Kismayo'], 'Estado federado de Somalia'],
  XZ: ['subnational', 'africa', ['Zanzíbar', 'Zanzibar'], ['Ciudad de Zanzíbar', 'Zanzibar City'], 'Región semiautónoma de Tanzania'],
  'PG-NSB': ['subnational', 'oceania', ['Bougainville', 'Bougainville'], ['Buka', 'Buka'], 'Región autónoma de Papúa Nueva Guinea'],
};

/** Land neighbours of each extended entity at level 4, as reviewed (D15, D30). The others have none. */
const REVIEWED_NEIGHBOURS: Readonly<Record<string, readonly string[]>> = {
  XK: ['AL', 'RS', 'ME', 'MK'],
  EH: ['MA', 'MR', 'DZ'],
  'GE-AB': ['GE', 'RU'],
  XO: ['GE', 'RU'],
  'MD-SN': ['MD', 'UA'],
  XC: ['CY'],
  XS: ['SO', 'ET', 'DJ', 'XP'],
  XP: ['SO', 'XS', 'ET'],
  XJ: ['SO', 'KE', 'ET'],
  'MD-GA': ['MD', 'UA'],
  'IQ-KR': ['IQ', 'IR', 'TR', 'SY'],
  'GB-ENG': ['GB-SCT', 'GB-WLS'],
  'GB-SCT': ['GB-ENG'],
  'GB-WLS': ['GB-ENG'],
  GI: ['ES'],
  HK: ['CN'],
  MO: ['CN'],
  SX: ['FR'],
};

/** The similar-flag groups of level 4, as reviewed (D30). */
const REVIEWED_GROUPS: readonly (readonly string[])[] = [
  ['AU', 'NZ', 'FJ', 'TV', 'KY', 'VG', 'TC', 'AI', 'MS', 'FK', 'SH-HL', 'BM', 'CK', 'NU'],
  ['NO', 'IS', 'DK', 'FI', 'SE', 'FO', 'AX'],
  ['EG', 'SY', 'IQ', 'YE', 'JO', 'PS', 'SD', 'KW', 'AE', 'EH'],
  ['AT', 'LV', 'PF'],
  ['TR', 'TN', 'XC', 'DZ', 'AZ', 'MR', 'PK', 'MY', 'SG', 'TM', 'UZ', 'LY', 'KM', 'EH'],
  ['CZ', 'PH', 'SX'],
  ['HU', 'BG', 'TJ', 'IQ-KR'],
  ['NL', 'LU', 'PY', 'RU', 'SK', 'SI', 'RS', 'MD-GA'],
  ['CU', 'PR'],
  ['AW', 'CW'],
  ['TZ', 'XZ'],
  ['GB-ENG', 'GG', 'GE', 'JE'],
  ['SO', 'XP'],
  ['XK', 'BA'],
];

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
  it('DATA-07 DATA-04 has the 52 entities of Appendix A, each with its reviewed category and region', () => {
    expect(sorted(codes(extendedEntities))).toEqual(sorted(Object.keys(REVIEWED)));
    for (const entity of extendedEntities) {
      const [category, region] = REVIEWED[entity.code] ?? [];
      expect([entity.category, entity.region], entity.code).toEqual([category, region]);
    }
  });

  it('DATA-07 has 8 states with limited recognition, 31 territories and 13 autonomous regions', () => {
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

  it('DATA-02 D30 every entity has the reviewed name in Spanish and in English', () => {
    for (const entity of extendedEntities) {
      const [es, en] = REVIEWED[entity.code]?.[2] ?? [];
      expect(entity.name, entity.code).toEqual({ es, en });
    }
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

  it('CAP-02 D30 every entity has the reviewed quiz capital, or none', () => {
    for (const entity of extendedEntities) {
      const capital = REVIEWED[entity.code]?.[3];
      expect(entity.capital, entity.code).toEqual(
        capital ? { es: capital[0], en: capital[1] } : null,
      );
    }
    const without = extendedEntities.filter((entity) => !isCapitalEligible(entity));
    expect(sorted(codes(without))).toEqual(sorted(['XC', 'GI', 'HK', 'MO', 'TK']));
  });

  it('CAP-03 D30 only Londres, Oranjestad, Kingston and Georgetown are the quiz capital of two entities', () => {
    for (const language of ['es', 'en'] as const) {
      const holders = new Map<string, string[]>();
      for (const entity of everyEntity) {
        if (entity.capital === null) continue;
        const key = capitalKey(entity.capital[language]);
        holders.set(key, [...(holders.get(key) ?? []), entity.code]);
      }
      const shared = [...holders.values()].filter((entities) => entities.length > 1).map(sorted);
      expect(sorted(shared.map((pair) => pair.join(' ')))).toEqual([
        'AW BQ-SE',
        'GB GB-ENG',
        'GY KY',
        'JM NF',
      ]);
    }
  });

  it('DATA-03 D30 Plymouth (Montserrat) and Arawa (Bougainville) are other capitals, not quiz capitals', () => {
    expect(byCode('MS').otherCapitals).toEqual([{ es: 'Plymouth', en: 'Plymouth' }]);
    expect(byCode('PG-NSB').otherCapitals).toEqual([{ es: 'Arawa', en: 'Arawa' }]);
    const others = extendedEntities.filter((entity) => entity.otherCapitals.length > 0);
    expect(sorted(codes(others))).toEqual(['MS', 'PG-NSB']);
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

  it('DATA-08 D30 every entity has its reviewed status in plain words, in both languages', () => {
    for (const entity of extendedEntities) {
      expect(entity.status.es, entity.code).toBe(REVIEWED[entity.code]?.[4]);
      expect(entity.status.en.trim(), entity.code).not.toBe('');
      expect(entity.status.en, entity.code).not.toBe(entity.status.es);
    }
    expect(byCode('FO')).toMatchObject({
      status: { en: 'Self-governing territory of Denmark' },
    });
  });

  it('SHAPE-04 Puntland and Jubalandia are not in the Shapes games, and have no silhouette', () => {
    const notEligible = extendedEntities.filter((entity) => !entity.shapeEligible);
    expect(sorted(codes(notEligible))).toEqual(['XJ', 'XP']);
    expect(notEligible.map(shapeFileName).filter((file) => bundledShapes.has(file))).toEqual([]);
  });

  it('DATA-05 DATA-06 SHAPE-02 every shape-eligible extended entity has a bundled silhouette, small enough for a phone', () => {
    const eligible = extendedEntities.filter((entity) => entity.shapeEligible);
    expect(eligible).toHaveLength(50);
    expect(eligible.map(shapeFileName).filter((file) => !bundledShapes.has(file))).toEqual([]);
    const tooBig = eligible.filter(
      (entity) => (bundledShapes.get(shapeFileName(entity))?.length ?? 0) > MAX_SHAPE_BYTES,
    );
    expect(codes(tooBig)).toEqual([]);
  });

  it.each(['PF', 'CK', 'TK', 'AS', 'MP'])(
    'SHAPE-01 the islands of %s are drawn with an outline, so each one shows at least as a dot',
    (code) => {
      expect(bundledShapes.get(`${code.toLowerCase()}.svg`)).toMatch(
        /<path [^>]*stroke-width="[3-9]"[^>]*d="M/,
      );
    },
  );

  it('DATA-05 DATA-06 every flag file exists in the bundle', () => {
    const missing = extendedEntities.map(flagFileName).filter((file) => !bundledFlags.has(file));
    expect(missing).toEqual([]);
  });

  it('DATA-05 every flag from Wikimedia Commons is listed in SOURCES.md with its source and licence', () => {
    const rows = flagSources.split('\n').filter((line) => /^\| `[a-z-]+\.svg` \|/.test(line));
    const listed = rows.map((row) => row.slice(3, row.indexOf('.svg')).toUpperCase());
    expect(sorted(listed)).toEqual(sorted(['AF', ...COMMONS_FLAGS]));
    for (const row of rows) {
      expect(row).toContain('https://commons.wikimedia.org/wiki/File:');
      expect(row).toMatch(/\| (Public domain|CC BY-SA [0-9.]+) \|$/);
    }
  });
});

describe('level 4 land borders and similar flags', () => {
  const known = new Set(codes(everyEntity));
  const neighboursOf = (code: string) => sorted(expertRelations.neighbours.get(code) ?? []);
  const groupKey = (group: readonly string[]) => sorted(group).join(' ');

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

  it('LVL-06 D30 every extended entity has exactly its reviewed land neighbours', () => {
    for (const entity of extendedEntities) {
      expect(neighboursOf(entity.code), entity.code).toEqual(
        sorted(REVIEWED_NEIGHBOURS[entity.code] ?? []),
      );
    }
  });

  it('LVL-06 D30 at level 4 a country also borders its extended neighbours (Serbia–Kosovo)', () => {
    expect(neighboursOf('RS')).toContain('XK');
    expect(neighboursOf('MA')).toContain('EH');
    expect(neighboursOf('ES')).toContain('GI');
    expect(neighboursOf('CN')).toEqual(expect.arrayContaining(['HK', 'MO']));
  });

  it('LVL-06 D30 the level 4 similar-flag groups are exactly the reviewed ones', () => {
    expect(sorted(extendedFlagGroups.map(groupKey))).toEqual(sorted(REVIEWED_GROUPS.map(groupKey)));
  });

  it('LVL-06 D30 Jersey is among the red crosses on white, and Escocia has no similar flag', () => {
    expect(expertRelations.similarFlags.get('JE')).toEqual(
      expect.arrayContaining(['GB-ENG', 'GG', 'GE']),
    );
    expect(expertRelations.similarFlags.get('GB-SCT')).toBeUndefined();
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

  it('LVL-06 the 195 countries of levels 1–3 have no extended entity', () => {
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

  it('LVL-06 a round of level 1, 2 or 3, as the app builds it, never asks or offers an extended entity', () => {
    for (const topic of TOPICS) {
      for (const region of REGION_CHOICES) {
        for (const level of LEVELS) {
          for (const seed of [1, 2, 3]) {
            const round = generateRound(
              countries,
              { topic, region, level },
              createRng(seed),
              relations,
            );
            const used = round.flatMap((question) => codes(question.options));
            expect(used.filter((code) => extendedCodes.has(code))).toEqual([]);
          }
        }
      }
    }
  });
});
