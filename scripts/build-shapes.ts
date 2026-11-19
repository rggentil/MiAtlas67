// Builds the silhouette of every shape-eligible country from Natural Earth (public domain, via world-atlas)
// into src/assets/shapes, so the shapes are bundled with the app (DATA-05). Run with: npm run data:shapes
// (`npm run data:shapes -- MY ES` rebuilds only those countries). The rules are in shapes.ts.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { countries } from '../src/data/countries.ts';
import { shapeFileName } from '../src/domain/entity.ts';
import { silhouette } from './shapes.ts';

const target = join(import.meta.dirname, '..', 'src', 'assets', 'shapes');
mkdirSync(target, { recursive: true });
const report: string[] = [];
const only = new Set(process.argv.slice(2).map((code) => code.toUpperCase()));
for (const entity of countries) {
  if (!entity.shapeEligible || (only.size > 0 && !only.has(entity.code))) continue;
  const { svg, dropped } = silhouette(entity.code);
  writeFileSync(join(target, shapeFileName(entity)), svg);
  report.push(
    `${entity.code}\t${String(svg.length)} B\t${String(dropped)} overseas pieces left out`,
  );
}
console.log(report.join('\n'));
console.log(`Built ${String(report.length)} silhouettes into src/assets/shapes`);
