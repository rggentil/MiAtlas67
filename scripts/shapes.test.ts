import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';
import { describe, expect, it } from 'vitest';
import { countries } from '../src/data/countries.ts';
import { extendedEntities } from '../src/data/extended.ts';
import { shapeFileName } from '../src/domain/entity.ts';
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

function latitudes(ring: readonly Position[]): number[] {
  return ring.map(([, latitude]) => latitude ?? Number.NaN);
}

describe('silhouettes of the extended set (#94)', () => {
  it('DATA-05 DATA-06 the build script draws every bundled silhouette of the extended set again, the same', () => {
    for (const entity of extendedEntities.filter((candidate) => candidate.shapeEligible)) {
      expect(silhouette(entity.code).svg, entity.code).toBe(
        read('src', 'assets', 'shapes', shapeFileName(entity)),
      );
    }
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

  it('SHAPE-02 D31 Transnistria is drawn with Bender, the line it controls de facto', () => {
    const transnistria = naturalEarth.features.find(
      (feature) => feature.properties.code === 'MD-SN',
    );
    expect(transnistria?.properties.parts).toContain('Bender');
  });

  it('DATA-05 every silhouette from scripts/data is credited in SOURCES.md, with Natural Earth', () => {
    const sources = read('src', 'assets', 'shapes', 'SOURCES.md');
    const files = [
      ...naturalEarth.features.map((feature) => feature.properties.code),
      'MA',
      'EH',
    ].map((code) => `\`${code.toLowerCase()}.svg\``);
    expect(files.filter((file) => !sources.includes(file))).toEqual([]);
    expect(sources).toContain('https://www.naturalearthdata.com/');
    expect(sources).toContain('Public domain (Natural Earth)');
  });
});
