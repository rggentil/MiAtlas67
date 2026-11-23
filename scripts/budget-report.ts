// The size budget of the build (NFR-03, NFR-02, D38): pure rules, so they can be unit tested. The files are
// read from dist/ by scripts/budget.ts.

export const KB = 1024;
export const MB = 1024 * KB;

/** The budgets approved in D38. */
export const BUDGETS = {
  /** The JavaScript the first screen loads, gzipped, as it travels over the network. */
  firstScreenScript: 200 * KB,
  /** The CSS the first screen loads, gzipped. */
  firstScreenStyle: 20 * KB,
  /** Everything the service worker stores for offline play, as stored on the device. */
  offline: 5 * MB,
} as const;

export interface BuiltFile {
  /** Path inside dist/, e.g. "assets/index-abc.js". */
  readonly path: string;
  readonly bytes: number;
  readonly gzipBytes: number;
}

export interface BuildSizes {
  /** The scripts index.html loads: its module script and the chunks it preloads. */
  readonly firstScreenScripts: readonly BuiltFile[];
  /** The style sheets index.html loads. */
  readonly firstScreenStyles: readonly BuiltFile[];
  /** The files the service worker precaches. */
  readonly offlineFiles: readonly BuiltFile[];
}

export interface BudgetLine {
  readonly name: string;
  readonly size: number;
  readonly budget: number;
  readonly files: readonly string[];
  readonly over: boolean;
}

export function formatSize(bytes: number): string {
  return bytes >= MB ? `${(bytes / MB).toFixed(2)} MB` : `${(bytes / KB).toFixed(1)} KB`;
}

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

/** Each budget with its measured size; `over` when the size is above the budget. */
export function checkBudget(sizes: BuildSizes): BudgetLine[] {
  const line = (name: string, size: number, budget: number, files: readonly BuiltFile[]) => ({
    name,
    size,
    budget,
    files: files.map((file) => file.path),
    over: size > budget,
  });
  return [
    line(
      'JavaScript of the first screen (gzipped)',
      sum(sizes.firstScreenScripts.map((file) => file.gzipBytes)),
      BUDGETS.firstScreenScript,
      sizes.firstScreenScripts,
    ),
    line(
      'CSS of the first screen (gzipped)',
      sum(sizes.firstScreenStyles.map((file) => file.gzipBytes)),
      BUDGETS.firstScreenStyle,
      sizes.firstScreenStyles,
    ),
    line(
      'Files stored for offline play',
      sum(sizes.offlineFiles.map((file) => file.bytes)),
      BUDGETS.offline,
      sizes.offlineFiles,
    ),
  ];
}

/** One line per budget: "✓ name: size of budget", or "✗ … over the budget: files". */
export function budgetReport(lines: readonly BudgetLine[]): string {
  return lines
    .map((line) => {
      const measure = `${formatSize(line.size)} of ${formatSize(line.budget)}`;
      if (!line.over) return `✓ ${line.name}: ${measure}`;
      const files =
        line.files.length <= 5 ? line.files.join(', ') : `${String(line.files.length)} files`;
      return `✗ ${line.name}: ${formatSize(line.size)}, over the ${formatSize(line.budget)} budget (${files})`;
    })
    .join('\n');
}
