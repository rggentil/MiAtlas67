import { describe, expect, it } from 'vitest';
import {
  flagFileName,
  isCapitalEligible,
  REGIONS,
  shapeFileName,
  type Entity,
} from '../domain/entity.ts';
import { countries } from './countries.ts';

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

/** A silhouette bigger than this would weigh too much on a phone: the build script simplifies it. */
const MAX_SHAPE_BYTES = 20_000;

function codes(entities: readonly Entity[]): string[] {
  return entities.map((entity) => entity.code);
}

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

  it('DATA-05 DATA-06 SHAPE-02 every shape-eligible country has a bundled silhouette, small enough for a phone', () => {
    const eligible = countries.filter((country) => country.shapeEligible);
    const missing = eligible.map(shapeFileName).filter((file) => !bundledShapes.has(file));
    expect(missing).toEqual([]);
    const tooBig = eligible.filter(
      (country) => (bundledShapes.get(shapeFileName(country))?.length ?? 0) > MAX_SHAPE_BYTES,
    );
    expect(codes(tooBig)).toEqual([]);
  });

  it('SHAPE-01 a silhouette is only ink outlines: no text, no image, no neighbouring country', () => {
    for (const [file, svg] of bundledShapes) {
      expect(svg, file).toMatch(
        /^<svg [^>]*viewBox="0 0 200 200">(<path [^>]*d="M[^"]+"\/>){1,3}<\/svg>\n?$/,
      );
      const colours = svg.match(/(fill|stroke)="[^"]*"/g) ?? [];
      expect(
        colours.filter((colour) => !/"(#1a1a2e|none)"$/.test(colour)),
        file,
      ).toEqual([]);
    }
  });

  it.each(['MV', 'TV', 'MH', 'KI', 'FM'])(
    'SHAPE-01 the islands of %s are drawn with an outline, so each one shows at least as a dot',
    (code) => {
      expect(bundledShapes.get(`${code.toLowerCase()}.svg`)).toMatch(
        /<path [^>]*stroke-width="[3-9]"[^>]*d="M/,
      );
    },
  );

  it('SHAPE-02 Spain shows the Canary Islands in a framed box (D25)', () => {
    expect(bundledShapes.get('es.svg')).toMatch(
      /<path fill="none" stroke="#1a1a2e" [^>]*d="M[^"]+Z"\/>/,
    );
  });

  it('SHAPE-03 every country has a silhouette in the Shapes games, microstates included (D25)', () => {
    expect(countries.filter((country) => !country.shapeEligible).map((c) => c.code)).toEqual([]);
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

  it('DATA-09 D18 the names that take an article are the ones the product owner reviewed', () => {
    const withArticle = (language: 'es' | 'en', article: string) =>
      countries
        .filter((c) => c.article?.[language] === article)
        .map((c) => c.code)
        .sort();

    expect(withArticle('es', 'el')).toEqual(['GB', 'LB']);
    expect(withArticle('es', 'la')).toEqual(['CD', 'CF', 'CG', 'DO']);
    // Países Bajos follows the RAE; the other plural names go without an article (D18, v1.7).
    expect(withArticle('es', 'los')).toEqual(['NL']);
    expect(countries.filter((c) => c.article?.es !== undefined)).toHaveLength(7);
    expect(withArticle('en', 'the')).toEqual(
      [
        'AE',
        'BS',
        'CD',
        'CF',
        'CG',
        'DO',
        'GB',
        'GM',
        'KM',
        'MH',
        'MV',
        'NL',
        'PH',
        'SB',
        'US',
      ].sort(),
    );
    expect(countries.filter((c) => c.article?.en !== undefined)).toHaveLength(15);
  });

  it('DATA-09 a name whose own first word is an article has no article of its own', () => {
    const startsWithArticle = countries.filter((c) => /^(El|La|Los|Las) /.test(c.name.es));
    expect(startsWithArticle.map((c) => [c.code, c.article?.es])).toEqual([['SV', undefined]]);
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
