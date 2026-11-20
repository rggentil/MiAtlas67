// How a country's silhouette is drawn from Natural Earth (public domain, via world-atlas). See build-shapes.ts.
//
// Each silhouette keeps the main territory only (SHAPE-02): the islands and pieces that lie more than
// GAP_KM away from the main landmass (and from every piece already kept) are left out, so France goes
// without French Guiana and Spain without the Canary Islands, while archipelagos such as Indonesia stay whole.
// OVERRIDES below change that rule for single countries; the product owner reviews every result.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { geoArea, geoAzimuthalEqualArea, geoCentroid, geoDistance, geoPath } from 'd3-geo';
import type { GeoProjection } from 'd3-geo';
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';
import { merge } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';

const require = createRequire(import.meta.url);
const iso = require('i18n-iso-countries') as {
  alpha2ToNumeric: (code: string) => string | undefined;
};

const root = join(import.meta.dirname, '..');
const topology = JSON.parse(
  readFileSync(join(root, 'node_modules', 'world-atlas', 'countries-10m.json'), 'utf8'),
) as Topology<{ countries: GeometryCollection<{ name: string }> }>;

const EARTH_RADIUS_KM = 6371;
/** A piece farther than this from the kept territory is overseas (SHAPE-02). */
const GAP_KM = 500;
/** Size of the square the silhouette is drawn in, and the margin around it. */
const SIZE = 200;
const MARGIN = 8;
/** Douglas–Peucker tolerance in drawing units: 0.35 of 200 keeps the coast recognizable. */
const TOLERANCE = 0.6;
/** Pieces smaller than this (in square drawing units) are small islands, drawn with an outline (see draw). */
const SMALL_PIECE_AREA = 20;
/** Outline of the small islands, so the smallest one is still a dot of this size (bigger in island countries). */
const DOT_STROKE = 3;
const ISLAND_COUNTRY_DOT_STROKE = 5;
/** Rings smaller than this after simplifying are left out (holes) or drawn as a dot (small islands). */
const MIN_HOLE_AREA = 1.5;
/** In a country with a mainland, smaller islands (in square drawing units) are specks and are left out. */
const MIN_ISLAND_AREA = 0.3;
/** A country whose largest piece covers less than this (of 200 × 200) is an island country (SHAPE-02). */
const ISLAND_COUNTRY_AREA = 3000;
/** The box of the overseas pieces drawn apart (Override.inset). */
const INSET_WIDTH = 64;
const INSET_HEIGHT = 34;

export interface Override {
  /** Another distance than GAP_KM for this country. */
  readonly gapKm?: number;
  /** Natural Earth pieces named here are drawn together with the country (de facto vs official lines). */
  readonly mergeWith?: readonly string[];
  /**
   * The outline to draw instead of world-atlas: when its rounding flattens a tiny country, or when the product
   * owner chose another line than Natural Earth's (Morocco and the Western Sahara, D31).
   */
  readonly outline?: readonly Position[];
  /** The overseas pieces are drawn in a small framed box in the bottom-left corner, as in the maps of Spain. */
  readonly inset?: boolean;
}

/**
 * Morocco and the Western Sahara split at 27° 40′ N (D31), from world-atlas Morocco and "W. Sahara" with mapshaper:
 * Natural Earth draws the de facto line, so its Morocco takes in the west of the territory. See SOURCES.md.
 */
const westernSahara = JSON.parse(
  readFileSync(join(root, 'scripts', 'data', 'western-sahara.json'), 'utf8'),
) as { MA: Position[]; EH: Position[] };

/** Changes to the default rule, each one decided by the product owner in the shapes reviews (#79, D25; #94, D31). */
export const OVERRIDES: Readonly<Record<string, Override>> = {
  // Malaysia: Borneo (Sabah and Sarawak) is ~600 km from the peninsula and part of the main territory.
  MY: { gapKm: 800 },
  // Vatican City: world-atlas rounds it to a line and Natural Earth has a plain 7-point polygon. The outline
  // of OpenStreetMap (relation 36989, © OpenStreetMap contributors, ODbL) shows its walls and St Peter's Square.
  VA: {
    outline: JSON.parse(
      readFileSync(join(root, 'scripts', 'data', 'va-osm.json'), 'utf8'),
    ) as Position[],
  },
  // Spain: the Canary Islands in a box, as Spanish maps draw them.
  ES: { inset: true },
  // Ecuador with the Galápagos, India with the Andaman and Nicobar Islands.
  EC: { gapKm: 1300 },
  IN: { gapKm: 1400 },
  // De facto lines drawn as part of the country they belong to officially.
  SO: { mergeWith: ['Somaliland'] },
  CY: { mergeWith: ['N. Cyprus', 'Cyprus U.N. Buffer Zone'] },
  // Island countries spread over the ocean: every island group, as on a map of the country.
  KI: { gapKm: 2500 },
  FM: { gapKm: 1200 },
  // Seychelles: the granitic islands around Mahé, as maps of the country show it; the far atolls are specks.
  SC: { gapKm: 100 },
  RS: { mergeWith: ['Kosovo'] },
  // Morocco without the Western Sahara (D25), and the Western Sahara whole, as maps draw it (D31).
  MA: { outline: westernSahara.MA },
  EH: { outline: westernSahara.EH },
  // Territories spread over the ocean, like Kiribati: French Polynesia with the Austral Islands, the Cook
  // Islands with the northern group (D31).
  PF: { gapKm: 2500 },
  CK: { gapKm: 1500 },
};

const geometries = topology.objects.countries.geometries;

/** Extended entities that world-atlas has under a name instead of an ISO numeric code (#94). */
const WORLD_ATLAS_NAMES: Readonly<Record<string, string>> = {
  XK: 'Kosovo',
  XC: 'N. Cyprus',
  XS: 'Somaliland',
  'SH-HL': 'Saint Helena',
};

/**
 * Extended entities that world-atlas does not have (the UK nations, Abjasia, Zanzíbar…): Natural Earth 1:10m
 * admin-1 units and disputed areas, dissolved per entity. Provenance in src/assets/shapes/SOURCES.md.
 */
const naturalEarth = JSON.parse(
  readFileSync(join(root, 'scripts', 'data', 'extended-ne.json'), 'utf8'),
) as FeatureCollection<Polygon | MultiPolygon, { code: string }>;

function countryGeometry(
  code: string,
  override: Override | undefined,
): Feature<Polygon | MultiPolygon> {
  if (override?.outline) {
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [[...override.outline]] },
    };
  }
  const extract = naturalEarth.features.find((feature) => feature.properties.code === code);
  if (extract) return { type: 'Feature', properties: {}, geometry: extract.geometry };
  const name = WORLD_ATLAS_NAMES[code];
  const numeric = iso.alpha2ToNumeric(code);
  const own = geometries.filter((geometry) =>
    name === undefined
      ? geometry.id === numeric
      : geometry.properties !== undefined &&
        'name' in geometry.properties &&
        geometry.properties.name === name,
  );
  if (own.length === 0)
    throw new Error(`Natural Earth has no shape for ${code} (${String(numeric)})`);
  const extra = (override?.mergeWith ?? []).map((name) => {
    const found = geometries.find(
      (geometry) =>
        geometry.properties !== undefined &&
        'name' in geometry.properties &&
        geometry.properties.name === name,
    );
    if (!found) throw new Error(`Natural Earth has no piece named ${name}`);
    return found;
  });
  return {
    type: 'Feature',
    properties: {},
    geometry: merge(topology, [...own, ...extra] as never),
  };
}

/**
 * The pieces (polygons) of a geometry. A piece wound the wrong way would cover the whole globe but itself
 * (a few Maldives atolls in Natural Earth): its rings are turned around.
 */
function polygonsOf(geometry: Polygon | MultiPolygon): Position[][][] {
  const pieces = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  return pieces.map((piece) =>
    geoArea(asFeature(piece)) > 2 * Math.PI ? piece.map((ring) => [...ring].reverse()) : piece,
  );
}

function asFeature(rings: Position[][]): Feature<Polygon> {
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: rings } };
}

/** Shortest distance in km between the outer rings of two pieces, measured on every 4th vertex. */
function gapKm(a: Position[][], b: Position[][]): number {
  const sample = (ring: Position[] | undefined): Position[] =>
    (ring ?? []).filter((_, index) => index % 8 === 0);
  let shortest = Infinity;
  for (const p of sample(a[0])) {
    for (const q of sample(b[0])) {
      const d = geoDistance(p as [number, number], q as [number, number]) * EARTH_RADIUS_KM;
      if (d < shortest) shortest = d;
    }
  }
  return shortest;
}

/** The main landmass and every piece chained to it by gaps of at most `maxGap` km (SHAPE-02). */
function mainTerritory(pieces: Position[][][], maxGap: number): Position[][][] {
  const byArea = [...pieces].sort((a, b) => geoArea(asFeature(b)) - geoArea(asFeature(a)));
  const [main, ...rest] = byArea;
  if (!main) return [];
  const kept = [main];
  let pending = rest;
  let grew = true;
  while (grew) {
    grew = false;
    const next: Position[][][] = [];
    for (const piece of pending) {
      if (kept.some((k) => gapKm(k, piece) <= maxGap)) {
        kept.push(piece);
        grew = true;
      } else {
        next.push(piece);
      }
    }
    pending = next;
  }
  return kept;
}

/** Douglas–Peucker on a projected ring. */
function simplify(points: readonly [number, number][], tolerance: number): [number, number][] {
  if (points.length < 3) return [...points];
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return [...points];
  let farthest = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const p = points[i];
    if (!p) continue;
    const dx = last[0] - first[0];
    const dy = last[1] - first[1];
    const length = Math.hypot(dx, dy) || 1;
    const distance =
      Math.abs(dy * p[0] - dx * p[1] + last[0] * first[1] - last[1] * first[0]) / length;
    if (distance > farthest) {
      farthest = distance;
      index = i;
    }
  }
  if (farthest <= tolerance) return [first, last];
  return [
    ...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(index), tolerance),
  ];
}

function ringArea(points: readonly [number, number][]): number {
  let area = 0;
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length];
    if (q) area += p[0] * q[1] - q[0] * p[1];
  });
  return Math.abs(area) / 2;
}

/** Parses the absolute M/L/Z path d3 writes into rings of points. */
function ringsOf(path: string): [number, number][][] {
  return path
    .split('Z')
    .map((ring) =>
      [...ring.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)].map(
        (m) => [Number(m[1]), Number(m[2])] as [number, number],
      ),
    )
    .filter((ring) => ring.length > 0);
}

const round = (n: number): string => String(Math.round(n * 10) / 10);

type Ring = [number, number][];

/** The pieces drawn by a projection: big pieces as they are, small ones apart so they get a minimum size. */
interface Drawn {
  readonly big: Ring[];
  readonly small: Ring[];
}

function centre(ring: Ring): [number, number] {
  const sum = ring.reduce(([x, y], [px, py]) => [x + px, y + py], [0, 0]);
  return [sum[0] / ring.length, sum[1] / ring.length];
}

/** A small piece that simplifies to almost nothing becomes a tiny square: the stroke turns it into a dot. */
function speck(ring: Ring): Ring {
  const [x, y] = centre(ring);
  const h = 0.3;
  return [
    [x - h, y - h],
    [x + h, y - h],
    [x + h, y + h],
    [x - h, y + h],
  ];
}

function draw(pieces: readonly Position[][][], projection: GeoProjection, keepAll: boolean): Drawn {
  const path = geoPath(projection);
  const big: Ring[] = [];
  const small: Ring[] = [];
  for (const piece of pieces) {
    const rings = ringsOf(path(asFeature(piece)) ?? '');
    const [outer, ...holes] = rings;
    if (!outer) continue;
    const area = ringArea(outer);
    if (area >= SMALL_PIECE_AREA) {
      big.push(
        ...[outer, ...holes]
          .map((ring) => simplify(ring, TOLERANCE))
          .filter((ring) => ring.length >= 3 && ringArea(ring) >= MIN_HOLE_AREA),
      );
      continue;
    }
    if (!keepAll && area < MIN_ISLAND_AREA) continue;
    const ring = simplify(outer, keepAll ? TOLERANCE / 3 : TOLERANCE);
    small.push(ring.length >= 3 && ringArea(ring) >= MIN_HOLE_AREA ? ring : speck(outer));
  }
  return { big, small };
}

const toD = (rings: readonly Ring[]): string =>
  rings.map((ring) => `M${ring.map(([x, y]) => `${round(x)} ${round(y)}`).join('L')}Z`).join('');

function projectionFor(pieces: readonly Position[][][], box: [[number, number], [number, number]]) {
  const shape: Feature<MultiPolygon> = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'MultiPolygon', coordinates: [...pieces] },
  };
  const [lon, lat] = geoCentroid(shape);
  return geoAzimuthalEqualArea().rotate([-lon, -lat]).fitExtent(box, shape);
}

/**
 * The silhouette as an SVG document, in ink and with no label and no neighbours (SHAPE-01): the big pieces
 * filled, the small islands filled and outlined so that each one shows as at least a dot, and, for Spain,
 * the frame of the box with the Canary Islands.
 */
export function silhouette(
  code: string,
  override: Override | undefined = OVERRIDES[code],
): { svg: string; dropped: number } {
  const pieces = polygonsOf(countryGeometry(code, override).geometry);
  const kept = mainTerritory(pieces, override?.gapKm ?? GAP_KM);
  const overseas = pieces.filter((piece) => !kept.includes(piece));
  const inset = override?.inset === true && overseas.length > 0;

  const projection = projectionFor(kept, [
    [MARGIN, MARGIN],
    [SIZE - MARGIN, SIZE - MARGIN],
  ]);
  const largest = Math.max(
    ...kept.map((piece) => ringArea(ringsOf(geoPath(projection)(asFeature(piece)) ?? '')[0] ?? [])),
  );
  // An island country (no piece fills much of the drawing) keeps every island, however small.
  const islandCountry = largest < ISLAND_COUNTRY_AREA;
  const main = draw(kept, projection, islandCountry);
  const parts = [main];
  let frame = '';
  if (inset) {
    const x0 = MARGIN;
    const y1 = SIZE - MARGIN;
    const x1 = x0 + INSET_WIDTH;
    const y0 = y1 - INSET_HEIGHT;
    const pad = 4;
    parts.push(
      draw(
        overseas,
        projectionFor(overseas, [
          [x0 + pad, y0 + pad],
          [x1 - pad, y1 - pad],
        ]),
        true,
      ),
    );
    frame = `M${String(x0)} ${String(y0)}H${String(x1)}V${String(y1)}H${String(x0)}Z`;
  }

  const ink = '#1a1a2e';
  const big = toD(parts.flatMap((part) => part.big));
  const small = toD(parts.flatMap((part) => part.small));
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(SIZE)} ${String(SIZE)}">` +
    (big ? `<path fill="${ink}" fill-rule="evenodd" d="${big}"/>` : '') +
    (small
      ? `<path fill="${ink}" stroke="${ink}" stroke-width="${String(islandCountry ? ISLAND_COUNTRY_DOT_STROKE : DOT_STROKE)}" stroke-linejoin="round" d="${small}"/>`
      : '') +
    (frame ? `<path fill="none" stroke="${ink}" stroke-width="1.5" d="${frame}"/>` : '') +
    '</svg>\n';
  return { svg, dropped: inset ? 0 : overseas.length };
}
