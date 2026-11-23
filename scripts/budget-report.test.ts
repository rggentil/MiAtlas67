import { describe, expect, it } from 'vitest';
import { BUDGETS, budgetReport, checkBudget, KB, MB, type BuildSizes } from './budget-report.ts';

const file = (path: string, bytes: number, gzipBytes = bytes) => ({ path, bytes, gzipBytes });

/** Today's build, roughly: 137 KB of script and 9.5 KB of CSS gzipped, 3 MB offline. */
const TODAY: BuildSizes = {
  firstScreenScripts: [file('assets/index-a.js', 438 * KB, 137 * KB)],
  firstScreenStyles: [file('assets/index-b.css', 30 * KB, 9.5 * KB)],
  offlineFiles: [file('index.html', 2 * KB), file('assets/flags.svg', 3 * MB)],
};

describe('size budget (NFR-03, NFR-02, D38)', () => {
  it('NFR-03 D38 the budgets are 200 KB of script and 20 KB of CSS gzipped, and 5 MB offline', () => {
    expect(BUDGETS).toEqual({
      firstScreenScript: 200 * KB,
      firstScreenStyle: 20 * KB,
      offline: 5 * MB,
    });
  });

  it("NFR-03 today's build is within every budget, and the report says so with the sizes", () => {
    const lines = checkBudget(TODAY);

    expect(lines.map((line) => line.over)).toEqual([false, false, false]);
    expect(budgetReport(lines)).toBe(
      [
        '✓ JavaScript of the first screen (gzipped): 137.0 KB of 200.0 KB',
        '✓ CSS of the first screen (gzipped): 9.5 KB of 20.0 KB',
        '✓ Files stored for offline play: 3.00 MB of 5.00 MB',
      ].join('\n'),
    );
  });

  it('NFR-03 a script over the budget fails, naming its file, its size and the budget; preloaded chunks count too', () => {
    const lines = checkBudget({
      ...TODAY,
      firstScreenScripts: [
        file('assets/index-a.js', 500 * KB, 150 * KB),
        file('assets/vendor-c.js', 200 * KB, 60 * KB),
      ],
    });

    expect(lines[0]?.over).toBe(true);
    expect(budgetReport(lines)).toContain(
      '✗ JavaScript of the first screen (gzipped): 210.0 KB, over the 200.0 KB budget (assets/index-a.js 150.0 KB, assets/vendor-c.js 60.0 KB)',
    );
  });

  it('NFR-03 the CSS over its budget fails the same way', () => {
    const lines = checkBudget({
      ...TODAY,
      firstScreenStyles: [file('assets/index-b.css', 90 * KB, 21 * KB)],
    });

    expect(lines[1]?.over).toBe(true);
    expect(budgetReport(lines)).toContain(
      '✗ CSS of the first screen (gzipped): 21.0 KB, over the 20.0 KB budget (assets/index-b.css 21.0 KB)',
    );
  });

  it('NFR-02 the files stored offline over 5 MB fail, counted as stored (not gzipped)', () => {
    const many = Array.from({ length: 600 }, (_, index) =>
      file(`assets/f${String(index)}.svg`, 9 * KB, 1 * KB),
    );
    const lines = checkBudget({ ...TODAY, offlineFiles: many });

    expect(lines[2]?.size).toBe(600 * 9 * KB);
    expect(lines[2]?.over).toBe(true);
    expect(budgetReport(lines)).toContain(
      '✗ Files stored for offline play: 5.27 MB, over the 5.00 MB budget (assets/f0.svg 9.0 KB, assets/f1.svg 9.0 KB, assets/f2.svg 9.0 KB, assets/f3.svg 9.0 KB, assets/f4.svg 9.0 KB, and 595 more files)',
    );
  });

  it('NFR-03 exactly on the budget is within it', () => {
    const lines = checkBudget({
      ...TODAY,
      firstScreenScripts: [file('assets/index-a.js', 600 * KB, 200 * KB)],
    });

    expect(lines[0]?.over).toBe(false);
  });
});
