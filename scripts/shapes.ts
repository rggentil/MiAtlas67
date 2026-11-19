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
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson';
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
/** Pieces smaller than this (in square drawing units) would be specks: they are left out. */
const MIN_PIECE_AREA = 1.5;

export interface Override {
  /** Another distance than GAP_KM for this country. */
  readonly gapKm?: number;
  /** Natural Earth pieces named here are drawn together with the country (de facto vs official lines). */
  readonly mergeWith?: readonly string[];
}

/** Changes to the default rule, each one decided by the product owner in the shapes review (#79). */
export const OVERRIDES: Readonly<Record<string, Override>> = {
  // Malaysia: Borneo (Sabah and Sarawak) is ~600 km from the peninsula and part of the main territory.
  MY: { gapKm: 800 },
};

const geometries = topology.objects.countries.geometries;

function countryGeometry(
  code: string,
  override: Override | undefined,
): Feature<Polygon | MultiPolygon> {
  const numeric = iso.alpha2ToNumeric(code);
  const own = geometries.filter((geometry) => geometry.id === numeric);
  if (own.length === 0)
    throw new Error(`Natural Earth has no shape for ${code} (${String(numeric)})`);
  const extra = (override?.mergeWith ?? []).map((name) => {
    const found = geometries.find(
      (geometry) => (geometry.properties as { name?: string } | undefined)?.name === name,
    );
    if (!found) throw new Error(`Natural Earth has no piece named ${name}`);
    return found;
  });
  return {
    type: 'Feature',
    properties: {},
    geometry: merge(topology, [...own, ...extra] as never) as MultiPolygon,
  };
}

function polygonsOf(geometry: Polygon | MultiPolygon): Position[][][] {
  return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
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

/** The silhouette as an SVG document: one ink-filled path, no label and no neighbours (SHAPE-01). */
export function silhouette(
  code: string,
  override: Override | undefined = OVERRIDES[code],
): { svg: string; dropped: number } {
  const geometry = countryGeometry(code, override).geometry;
  const pieces = polygonsOf(geometry);
  const kept = mainTerritory(pieces, override?.gapKm ?? GAP_KM);
  const shape: Feature<MultiPolygon> = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'MultiPolygon', coordinates: kept },
  };
  const [lon, lat] = geoCentroid(shape);
  const projection = geoAzimuthalEqualArea()
    .rotate([-lon, -lat])
    .fitExtent(
      [
        [MARGIN, MARGIN],
        [SIZE - MARGIN, SIZE - MARGIN],
      ],
      shape,
    );
  const rings = ringsOf(geoPath(projection)(shape) ?? '')
    .map((ring) => simplify(ring, TOLERANCE))
    .filter((ring) => ring.length >= 3 && ringArea(ring) >= MIN_PIECE_AREA);
  const d = rings
    .map((ring) => `M${ring.map(([x, y]) => `${round(x)} ${round(y)}`).join('L')}Z`)
    .join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(SIZE)} ${String(SIZE)}">` +
    `<path fill="#1a1a2e" fill-rule="evenodd" d="${d}"/></svg>\n`;
  return { svg, dropped: pieces.length - kept.length };
}
