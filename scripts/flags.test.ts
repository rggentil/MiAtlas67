import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { countries } from '../src/data/countries.ts';
import { extendedEntities } from '../src/data/extended.ts';
import { FLAG_RATIOS } from '../src/data/flagRatios.ts';
import { NAMED_FLAGS, type Licence } from '../src/data/sources.ts';
import { flagFileName } from '../src/domain/entity.ts';
import { flagAspect } from '../src/domain/flagRatio.ts';
import { FLAG_FILES } from './flag-files.ts';
import { commonsAddress, flagSourcesMarkdown } from './flag-sources-md.ts';
import { svgAspect } from './svg-aspect.ts';

const root = join(import.meta.dirname, '..');
const flags = join(root, 'src', 'assets', 'flags');
const entities = [...countries, ...extendedEntities];
const codes = entities.map((entity) => entity.code).sort();

function svgOf(code: string): string {
  const entity = entities.find((candidate) => candidate.code === code);
  if (!entity) throw new Error(`No entity ${code}`);
  return readFileSync(join(flags, flagFileName(entity)), 'utf8');
}

/** Licences that ask for the work to be credited by name (D39). */
const CREDIT_REQUIRED: readonly Licence[] = ['CC BY-SA 4.0', 'CC BY-SA 3.0', 'OGL-om 1.0'];

describe('flag ratios (DATA-01, DATA-06, D39)', () => {
  it('DATA-06 every entity has a ratio recorded, and every ratio is an entity', () => {
    expect(Object.keys(FLAG_RATIOS).sort()).toEqual(codes);
  });

  it('DATA-06 the ratio of each flag file, from its own drawing, matches the one recorded', () => {
    const off = codes.flatMap((code) => {
      const recorded = flagAspect(FLAG_RATIOS[code] ?? '');
      const drawn = svgAspect(svgOf(code));
      return Math.abs(drawn / recorded - 1) > 0.01
        ? [`${code}: drawn ${drawn.toFixed(3)}, recorded ${FLAG_RATIOS[code] ?? ''}`]
        : [];
    });

    expect(off).toEqual([]);
  });

  it('DATA-06 D39 the ratios the product owner reviewed: 107 flags 2:3, 75 1:2, 23 3:5 and 42 others', () => {
    const count = (ratio: string) => codes.filter((code) => FLAG_RATIOS[code] === ratio).length;

    expect(count('2:3')).toBe(107);
    expect(count('1:2')).toBe(75);
    expect(count('3:5')).toBe(23);
    expect(codes.length - count('2:3') - count('1:2') - count('3:5')).toBe(42);
  });

  it('DATA-06 D39 Suiza and Ciudad del Vaticano are square; Nepal is the only flag taller than wide', () => {
    expect(FLAG_RATIOS.CH).toBe('1:1');
    expect(FLAG_RATIOS.VA).toBe('1:1');
    expect(codes.filter((code) => flagAspect(FLAG_RATIOS[code] ?? '') < 1)).toEqual(['NP']);
  });

  it('DATA-06 D17 D39 Indonesia (2:3) and Mónaco (4:5) no longer have the same proportions', () => {
    expect(FLAG_RATIOS.ID).toBe('2:3');
    expect(FLAG_RATIOS.MC).toBe('4:5');
  });

  it('DATA-06 D39 Mongolia and Sri Lanka are longer than the old 4:3 frame', () => {
    expect(FLAG_RATIOS.MN).toBe('1:2');
    expect(FLAG_RATIOS.LK).toBe('1:2');
  });

  it('DATA-06 D39 a flag with two ratios keeps the one of its law; Reino Unido is 3:5', () => {
    expect(FLAG_RATIOS.BE).toBe('13:15');
    expect(FLAG_RATIOS.KH).toBe('16:25');
    expect(FLAG_RATIOS.US).toBe('10:19');
    expect(FLAG_RATIOS.GB).toBe('3:5');
  });
});

describe('flag files (DATA-05, D39)', () => {
  it('DATA-05 every entity has its Wikimedia Commons file recorded, and every file is an entity', () => {
    expect(Object.keys(FLAG_FILES).sort()).toEqual(codes);
  });

  it('DATA-06 the flags folder holds exactly one SVG per entity', () => {
    const files = readdirSync(flags).filter((file) => file.endsWith('.svg'));

    expect(files.sort()).toEqual(entities.map(flagFileName).sort());
  });

  it('DATA-05 D13 D30 D39 the files of the flags in de facto use the product owner chose', () => {
    expect(FLAG_FILES.HN?.file).toBe('Flag of Honduras (1949–2022, 2026–present).svg');
    expect(FLAG_FILES.PM?.file).toBe('Flag of Saint-Pierre and Miquelon.svg');
    expect(FLAG_FILES.GB?.file).toBe('Flag of the United Kingdom (3-5).svg');
    expect(FLAG_FILES.AF?.file).toBe('Flag of the Taliban.svg');
    expect(FLAG_FILES.NC?.file).toBe('Flag of FLNKS.svg');
    expect(FLAG_FILES.EH?.file).toBe('Flag of the Sahrawi Arab Democratic Republic.svg');
  });

  it('NFR-04 every flag scales and is a plain drawing: a viewBox, no script, no event, no outside reference', () => {
    const unsafe = codes.filter((code) => {
      const svg = svgOf(code);
      const tag = /<svg\b[^>]*>/.exec(svg)?.[0] ?? '';
      return (
        !/\sviewBox="/.test(tag) ||
        /<script|<foreignObject|\son[a-z]+=|href="(?!#)|url\((?!#)/i.test(svg)
      );
    });

    expect(unsafe).toEqual([]);
  });
});

describe('flag credits (DATA-05, D39)', () => {
  it('DATA-05 src/assets/flags/SOURCES.md lists every file with its source and licence, as the script writes it', () => {
    expect(readFileSync(join(flags, 'SOURCES.md'), 'utf8')).toBe(flagSourcesMarkdown());
  });

  it('DATA-05 "Acerca de" names exactly the flags whose licence asks for a credit, with the same licence and author', () => {
    const required = Object.entries(FLAG_FILES)
      .filter(([, source]) => CREDIT_REQUIRED.includes(source.licence ?? 'public-domain'))
      .map(([code, source]) => ({
        code,
        licence: source.licence,
        author: source.author,
        address: commonsAddress(source.file),
      }));

    expect(required.map((flag) => flag.code).sort()).toEqual(['BQ-SA', 'BQ-SE', 'OM']);
    expect(
      NAMED_FLAGS.map((flag) => ({
        code: flag.code,
        licence: flag.licence,
        author: flag.author,
        address: flag.address,
      })).sort((a, b) => a.code.localeCompare(b.code)),
    ).toEqual(required.sort((a, b) => a.code.localeCompare(b.code)));
  });

  it('DATA-05 every other flag is public domain or CC0', () => {
    const others = Object.values(FLAG_FILES).filter(
      (source) => !CREDIT_REQUIRED.includes(source.licence ?? 'public-domain'),
    );

    expect(others).toHaveLength(244);
    expect(others.every((source) => [undefined, 'CC0'].includes(source.licence))).toBe(true);
  });
});
