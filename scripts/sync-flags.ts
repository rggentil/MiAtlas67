// Downloads the flag of every country and extended entity from Wikimedia Commons into src/assets/flags, optimised
// with svgo, so the flags are bundled with the app (DATA-05, D39), and lists them in its SOURCES.md.
// Run with: npm run data:flags. It needs the network; the game never does (NFR-04).
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { optimize } from 'svgo';
import { countries } from '../src/data/countries.ts';
import { extendedEntities } from '../src/data/extended.ts';
import { FLAG_RATIOS } from '../src/data/flagRatios.ts';
import { flagAspect } from '../src/domain/flagRatio.ts';
import { flagFileName } from '../src/domain/entity.ts';
import { FLAG_FILES } from './flag-files.ts';
import { flagSourcesMarkdown } from './flag-sources-md.ts';
import { svgAspect } from './svg-aspect.ts';

const root = join(import.meta.dirname, '..');
const target = join(root, 'src', 'assets', 'flags');
/** Wikimedia asks automated clients to say who they are; a generic name, no personal contact. */
const USER_AGENT = 'MiAtlas67-data-script/1.0 (build-time flag sync)';
/** How far the drawing may be from the recorded ratio: Commons files round their sizes. */
const TOLERANCE = 0.01;

/** The optimised SVG, keeping the viewBox so the flag scales to any size. */
function optimise(svg: string): string {
  const { data } = optimize(svg, {
    multipass: true,
    plugins: [{ name: 'preset-default', params: { overrides: { removeViewBox: false } } }],
  });
  if (/\sviewBox="/.test(data.slice(0, data.indexOf('>')))) return data;
  // A file sized only by width and height would not scale in an <img>: give it the viewBox of that size.
  const width = /<svg\b[^>]*\swidth="([\d.]+)"/.exec(data)?.[1];
  const height = /<svg\b[^>]*\sheight="([\d.]+)"/.exec(data)?.[1];
  if (width === undefined || height === undefined) throw new Error('No size to scale from');
  return data.replace('<svg', `<svg viewBox="0 0 ${width} ${height}"`);
}

async function download(file: string): Promise<string> {
  const address = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}`;
  const response = await fetch(address, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${file}: HTTP ${String(response.status)}`);
  const text = await response.text();
  if (!text.includes('<svg')) throw new Error(`${file}: not an SVG`);
  return text;
}

const problems: string[] = [];
for (const entity of [...countries, ...extendedEntities]) {
  const source = FLAG_FILES[entity.code];
  const ratio = FLAG_RATIOS[entity.code];
  if (source === undefined || ratio === undefined) {
    problems.push(`${entity.code}: no file or ratio recorded`);
    continue;
  }
  try {
    const svg = optimise(await download(source.file));
    const drawn = svgAspect(svg);
    if (Math.abs(drawn / flagAspect(ratio) - 1) > TOLERANCE) {
      problems.push(`${entity.code}: drawn ${drawn.toFixed(3)}, recorded ${ratio}`);
    }
    writeFileSync(join(target, flagFileName(entity)), svg);
  } catch (error) {
    problems.push(`${entity.code}: ${String(error)}`);
  }
  // Gently: one file at a time, as Wikimedia's API etiquette asks.
  await new Promise((resolve) => setTimeout(resolve, 100));
}

writeFileSync(join(target, 'SOURCES.md'), flagSourcesMarkdown());

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Downloaded ${String(Object.keys(FLAG_FILES).length)} flags from Wikimedia Commons`);
