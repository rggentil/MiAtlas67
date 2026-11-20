import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { geoContains } from 'd3-geo';
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';
import { describe, expect, it } from 'vitest';
import { countries } from '../src/data/countries.ts';
import { extendedEntities } from '../src/data/extended.ts';
import { OVERRIDES, silhouette } from './shapes.ts';

const root = join(import.meta.dirname, '..');

function read(...path: string[]): string {
  return readFileSync(join(root, ...path), 'utf8');
}

const naturalEarth = JSON.parse(read('scripts', 'data', 'extended-ne.json')) as FeatureCollection<
  Polygon | MultiPolygon,
  { code: string; parts: string[] }
>;
const westernSahara = JSON.parse(read('scripts', 'data', 'western-sahara.json')) as Record<
  'MA' | 'EH',
  Position[]
>;
/** 27° 40′ N, where Morocco ends and the Western Sahara begins (D31). */
const SPLIT_LATITUDE = 27.6667;
/** Towns of Moldova, [longitude, latitude]: Bender on the right bank of the Dniester, Tiraspol on the left. */
const BENDER: [number, number] = [29.4746, 46.83];
const TIRASPOL: [number, number] = [29.6433, 46.8403];
const CHISINAU: [number, number] = [28.8638, 47.0105];

function sorted(values: readonly string[]): string[] {
  return [...values].sort();
}

function latitudes(ring: readonly Position[]): number[] {
  return ring.map(([, latitude]) => latitude ?? Number.NaN);
}

function naturalEarthFeature(code: string): Feature<Polygon | MultiPolygon> {
  const feature = naturalEarth.features.find((candidate) => candidate.properties.code === code);
  if (!feature) throw new Error(`No Natural Earth extract for ${code}`);
  return feature;
}

/** The pieces of a silhouette: each subpath of its SVG starts with "M". */
function pieces(svg: string): number {
  return svg.match(/M/g)?.length ?? 0;
}

describe('silhouettes of the extended set (#94)', () => {
  it.each(extendedEntities.filter((entity) => entity.shapeEligible).map((entity) => entity.code))(
    'DATA-05 DATA-06 the build script draws the bundled silhouette of %s again, the same',
    (code) => {
      expect(silhouette(code).svg).toBe(
        read('src', 'assets', 'shapes', `${code.toLowerCase()}.svg`),
      );
    },
  );

  it('SHAPE-02 Santa Elena leaves out Ascension and Tristan da Cunha, more than 500 km away', () => {
    expect(silhouette('SH-HL').dropped).toBe(3);
  });

  it('SHAPE-01 D31 Tokelau is drawn with the 2 atolls Natural Earth has, each one visible', () => {
    expect(pieces(read('src', 'assets', 'shapes', 'tk.svg'))).toBe(2);
  });

  it('SHAPE-02 D31 Morocco leaves out the whole Western Sahara, which is drawn whole: the line is 27° 40′ N', () => {
    expect(Math.min(...latitudes(westernSahara.MA))).toBeCloseTo(SPLIT_LATITUDE, 4);
    expect(Math.max(...latitudes(westernSahara.EH))).toBeCloseTo(SPLIT_LATITUDE, 4);
    // The whole territory reaches La Güera, at the south end, not only the strip east of the berm.
    expect(Math.min(...latitudes(westernSahara.EH))).toBeLessThan(21);
    expect(OVERRIDES.MA?.outline).toEqual(westernSahara.MA);
    expect(OVERRIDES.EH?.outline).toEqual(westernSahara.EH);
    // Morocco is drawn so at every level, not only at Experto.
    expect(countries.find((country) => country.code === 'MA')?.shapeEligible).toBe(true);
    expect(silhouette('MA').svg).toBe(read('src', 'assets', 'shapes', 'ma.svg'));
  });

  it.each(['PF', 'CK'])(
    'SHAPE-02 D31 %s keeps every island group, which the general rule would leave out',
    (code) => {
      expect(silhouette(code).dropped).toBe(0);
      expect(silhouette(code, {}).dropped).toBeGreaterThan(0);
    },
  );

  it('SHAPE-02 D31 Transnistria is drawn with Bender, on the right bank of the Dniester, the line it controls de facto', () => {
    const transnistria = naturalEarthFeature('MD-SN');
    expect(geoContains(transnistria, BENDER)).toBe(true);
    expect(geoContains(transnistria, TIRASPOL)).toBe(true);
    expect(geoContains(transnistria, CHISINAU)).toBe(false);
  });

  it('DATA-05 every silhouette not drawn from world-atlas is credited in SOURCES.md', () => {
    const sources = read('src', 'assets', 'shapes', 'SOURCES.md');
    // The other sources: the Natural Earth extract and the outlines drawn instead of world-atlas.
    const outlined = Object.entries(OVERRIDES)
      .filter(([, override]) => override.outline !== undefined)
      .map(([code]) => code);
    expect(sorted(outlined)).toEqual(['EH', 'MA', 'VA']);
    const files = [
      ...naturalEarth.features.map((feature) => feature.properties.code),
      ...outlined,
    ].map((code) => `\`${code.toLowerCase()}.svg\``);
    expect(files.filter((file) => !sources.includes(file))).toEqual([]);
    expect(sources).toContain('https://www.naturalearthdata.com/');
    expect(sources).toContain('Public domain (Natural Earth)');
  });
});
