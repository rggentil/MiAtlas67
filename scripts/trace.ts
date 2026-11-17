// Traceability report (NFR-08): lists every requirement of the product spec with the tests whose titles
// (or Playwright tags) mention it, and highlights the requirements of the current phase that have no test.
//
// Run with: npm run trace            (current phase = the lowest open epic)
//           npm run trace -- --phase 3
//
// The current phase comes from GitHub (the epic's stories, via gh). Without gh the report still lists
// every requirement, only the phase section is missing. In CI the report also goes to the job summary.
import { execSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  buildReport,
  phaseRequirements,
  requirementIds,
  type PhaseInfo,
  type Story,
  type TestCase,
} from './trace-report.ts';

const root = join(import.meta.dirname, '..');

function run(command: string): string {
  return execSync(command, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/** The JSON value printed by a command, ignoring any text before it. */
function jsonFrom(output: string, start: '[' | '{'): unknown {
  return JSON.parse(output.slice(output.indexOf(start)));
}

interface VitestEntry {
  readonly name: string;
  readonly file: string;
  readonly projectName: string;
}

function vitestTests(): TestCase[] {
  const entries = jsonFrom(run('npx vitest list --json'), '[') as VitestEntry[];
  return entries.map((entry) => ({
    layer: entry.projectName === 'component' ? 'component' : 'unit',
    file: relative(root, entry.file).replaceAll('\\', '/'),
    // `vitest list --json` escapes quotes twice: undo it.
    title: entry.name.replaceAll('\\"', '"'),
  }));
}

interface PlaywrightSpec {
  readonly title: string;
  readonly file: string;
  readonly tags: readonly string[];
}

interface PlaywrightSuite {
  readonly title: string;
  readonly specs: readonly PlaywrightSpec[];
  readonly suites?: readonly PlaywrightSuite[];
}

function playwrightTests(): TestCase[] {
  const report = jsonFrom(run('npx playwright test --list --reporter=json'), '{') as {
    suites: PlaywrightSuite[];
  };
  const tests: TestCase[] = [];
  // Top-level suites are files; nested suites are describe blocks.
  const walk = (suite: PlaywrightSuite, path: readonly string[]): void => {
    for (const spec of suite.specs) {
      tests.push({
        layer: 'e2e',
        file: `tests/e2e/${spec.file}`,
        title: [...path, spec.title].join(' › '),
        tags: spec.tags,
      });
    }
    for (const child of suite.suites ?? []) walk(child, [...path, child.title]);
  };
  for (const file of report.suites) walk(file, []);
  return tests;
}

function requestedPhase(): number | null {
  const index = process.argv.indexOf('--phase');
  return index === -1 ? null : Number(process.argv[index + 1]);
}

/** Issue #N is the epic of phase N; the current phase is the lowest open epic. */
function currentPhase(known: ReadonlySet<string>): PhaseInfo {
  const phase =
    requestedPhase() ??
    Math.min(
      ...(
        jsonFrom(run('gh issue list --label epic --state open --limit 50 --json number'), '[') as {
          number: number;
        }[]
      ).map((epic) => epic.number),
    );
  if (!Number.isInteger(phase) || phase <= 0) throw new Error('no open epic found');
  const stories = (
    jsonFrom(
      run(`gh api "repos/{owner}/{repo}/issues/${String(phase)}/sub_issues?per_page=100"`),
      '[',
    ) as {
      number: number;
      body: string | null;
    }[]
  ).map((story): Story => ({ number: story.number, body: story.body ?? '' }));
  return { phase, ids: phaseRequirements(stories, known) };
}

const requirements = requirementIds(readFileSync(join(root, 'docs', '01-product-spec.md'), 'utf8'));
const tests = [...vitestTests(), ...playwrightTests()];

let phase: PhaseInfo | null = null;
let reason = '';
try {
  phase = currentPhase(new Set(requirements));
} catch (error) {
  reason = (error instanceof Error ? error.message : String(error)).split('\n')[0] ?? '';
}

const report = buildReport(requirements, tests, phase, reason);
console.log(report);
const summary = process.env.GITHUB_STEP_SUMMARY;
if (summary) appendFileSync(summary, report);
