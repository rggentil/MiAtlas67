import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';

const script = join(import.meta.dirname, 'budget.ts');
const folders: string[] = [];

/**
 * A small build as Vite and the service worker write it: index.html with a module script, a preloaded chunk and
 * a style sheet; sw.js with its precache list. `scriptBytes` of random content, which gzip cannot shrink.
 */
function fixtureBuild(scriptBytes: number): string {
  const dist = mkdtempSync(join(tmpdir(), 'budget-'));
  folders.push(dist);
  mkdirSync(join(dist, 'assets'));
  writeFileSync(
    join(dist, 'index.html'),
    [
      '<link rel="stylesheet" crossorigin href="/assets/index-b.css">',
      '<script type="module" crossorigin src="/assets/index-a.js"></script>',
      '<link rel="modulepreload" crossorigin href="/assets/vendor-c.js">',
    ].join('\n'),
  );
  writeFileSync(join(dist, 'assets', 'index-a.js'), randomBytes(scriptBytes));
  writeFileSync(join(dist, 'assets', 'vendor-c.js'), 'export const a = 1;'.repeat(50));
  writeFileSync(join(dist, 'assets', 'index-b.css'), 'body{color:red}'.repeat(50));
  writeFileSync(
    join(dist, 'sw.js'),
    'define(["./workbox"],(function(s){s.precacheAndRoute([{url:"index.html",revision:"1"},{url:"assets/index-a.js",revision:null},{url:"assets/index-b.css",revision:null}],{})}));',
  );
  return dist;
}

function runBudget(dist: string) {
  return spawnSync(process.execPath, [script, dist], { encoding: 'utf8' });
}

afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

describe('npm run budget (NFR-03, D38)', () => {
  it('NFR-03 a build within the budget passes, counting the module script and its preloaded chunk', () => {
    const result = runBudget(fixtureBuild(10 * 1024));

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(
      /✓ JavaScript of the first screen \(gzipped\): 10\.\d KB of 200\.0 KB/,
    );
    expect(result.stdout).toContain('✓ CSS of the first screen (gzipped)');
    expect(result.stdout).toContain('✓ Files stored for offline play');
  });

  it('NFR-03 a build over the budget fails, naming the file, its size and the budget', () => {
    const result = runBudget(fixtureBuild(260 * 1024));

    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(
      /✗ JavaScript of the first screen \(gzipped\): 260\.\d KB, over the 200\.0 KB budget \(assets\/index-a\.js 260\.\d KB, assets\/vendor-c\.js/,
    );
  });

  it('NFR-03 without a build it fails and says so', () => {
    const empty = mkdtempSync(join(tmpdir(), 'budget-'));
    folders.push(empty);

    const result = runBudget(empty);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('run npm run build first');
  });
});
