// The size budget of the build (NFR-03, NFR-02, D38): run after `npm run build` with `npm run budget`.
// It reads dist/ and fails when the first screen's JavaScript or CSS, gzipped, or the files stored for offline
// play are over their budget; the message names the files, their size and the budget.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { budgetReport, checkBudget, type BuiltFile } from './budget-report.ts';

const dist = join(import.meta.dirname, '..', process.argv[2] ?? 'dist');
const BASE = process.env.VITE_BASE ?? '/';

function built(path: string): BuiltFile {
  const content = readFileSync(join(dist, path));
  return { path, bytes: content.length, gzipBytes: gzipSync(content, { level: 9 }).length };
}

/** "/MiAtlas67/assets/x.js" or "./assets/x.js" → "assets/x.js". */
function inDist(url: string): string {
  const path = url.startsWith(BASE) ? url.slice(BASE.length) : url.replace(/^\.?\//, '');
  return decodeURIComponent(path);
}

if (!existsSync(join(dist, 'index.html'))) {
  console.error(`No build in ${dist}: run npm run build first`);
  process.exit(1);
}

const html = readFileSync(join(dist, 'index.html'), 'utf8');
const scripts = [
  ...html.matchAll(/<script[^>]*type="module"[^>]*src="([^"]+)"/g),
  ...html.matchAll(/<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g),
].map((match) => inDist(match[1] ?? ''));
const styles = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map((match) =>
  inDist(match[1] ?? ''),
);
const worker = readFileSync(join(dist, 'sw.js'), 'utf8');
const stored = [...worker.matchAll(/\{url:"([^"]+)",revision:/g)].map((match) => match[1] ?? '');

if (scripts.length === 0 || styles.length === 0 || stored.length === 0) {
  console.error('Could not find the scripts, styles or stored files of the build');
  process.exit(1);
}

const lines = checkBudget({
  firstScreenScripts: scripts.map(built),
  firstScreenStyles: styles.map(built),
  offlineFiles: stored.map(built),
});
console.log(budgetReport(lines));
if (lines.some((line) => line.over)) process.exit(1);
