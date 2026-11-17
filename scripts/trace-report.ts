// Pure part of the traceability report (NFR-08): which spec requirements are mentioned by which tests.
// scripts/trace.ts gathers the inputs (spec, test titles, the current phase's stories) and prints the report.

export type Layer = 'unit' | 'component' | 'e2e';

export interface TestCase {
  readonly layer: Layer;
  /** Path relative to the repository root. */
  readonly file: string;
  /** Full title, including the describe blocks. */
  readonly title: string;
  /** Playwright tags, without the "@". */
  readonly tags?: readonly string[];
}

export interface Story {
  readonly number: number;
  readonly body: string;
}

export interface PhaseInfo {
  readonly phase: number;
  /** Requirement ID → the stories of the phase that trace it. */
  readonly ids: ReadonlyMap<string, readonly number[]>;
}

/** A requirement is defined in the spec in bold: **RND-01**, **FLAG-A**. */
const DEFINITION = /\*\*([A-Z]+-[A-Z0-9]+)\*\*/g;
const ID = /\b[A-Z]+-[A-Z0-9]+\b/g;
/** "DATA-01 … DATA-06", "DATA-01...DATA-06" or "DATA-01–DATA-06". */
const RANGE = /\b([A-Z]+)-(\d+)\s*(?:…|\.{2,3}|–)\s*\1-(\d+)\b/g;

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

/** Every requirement ID defined in the spec, once, in order of appearance. */
export function requirementIds(spec: string): string[] {
  return unique([...spec.matchAll(DEFINITION)].flatMap((match) => match[1] ?? []));
}

/** The known requirement IDs mentioned in a text, with ranges expanded. */
export function mentionedIds(text: string, known: ReadonlySet<string>): string[] {
  const expanded = text.replace(RANGE, (_whole, prefix: string, from: string, to: string) => {
    const ids: string[] = [];
    for (let n = Number(from); n <= Number(to); n++) {
      ids.push(`${prefix}-${String(n).padStart(from.length, '0')}`);
    }
    return ids.join(' ');
  });
  return unique(expanded.match(ID) ?? []).filter((id) => known.has(id));
}

/** Requirement IDs on the "**Traceability:**" line of each story, with the stories that trace them. */
export function phaseRequirements(
  stories: readonly Story[],
  known: ReadonlySet<string>,
): Map<string, number[]> {
  const ids = new Map<string, number[]>();
  for (const story of stories) {
    const line = story.body.split(/\r?\n/).find((text) => text.startsWith('**Traceability:**'));
    if (line === undefined) continue;
    for (const id of mentionedIds(line, known)) {
      ids.set(id, [...(ids.get(id) ?? []), story.number]);
    }
  }
  return ids;
}

function count(tests: readonly TestCase[], layer: Layer): string {
  const n = tests.filter((test) => test.layer === layer).length;
  return n === 0 ? '–' : String(n);
}

/** The report in Markdown: totals, the gaps of the current phase, a table and the tests per requirement. */
export function buildReport(
  requirements: readonly string[],
  tests: readonly TestCase[],
  phase: PhaseInfo | null,
  phaseUnavailableReason = 'unknown reason',
): string {
  const known = new Set(requirements);
  const testsById = new Map<string, TestCase[]>(requirements.map((id) => [id, []]));
  for (const test of tests) {
    for (const id of mentionedIds([test.title, ...(test.tags ?? [])].join(' '), known)) {
      testsById.get(id)?.push(test);
    }
  }
  const testsOf = (id: string): TestCase[] => testsById.get(id) ?? [];
  const covered = requirements.filter((id) => testsOf(id).length > 0);
  const gaps = phase ? [...phase.ids.keys()].filter((id) => testsOf(id).length === 0) : [];

  const lines = [
    '# Traceability report',
    '',
    `${String(requirements.length)} requirements in the spec · ${String(covered.length)} with tests · ` +
      `${String(requirements.length - covered.length)} without.`,
    '',
  ];

  if (phase) {
    const p = String(phase.phase);
    lines.push(
      `## Phase ${p} (epic #${p})`,
      '',
      `${String(phase.ids.size)} requirements traced by its stories · ` +
        `${String(phase.ids.size - gaps.length)} with tests · ${String(gaps.length)} without.`,
      '',
    );
    if (gaps.length === 0) lines.push(`Every requirement of phase ${p} has tests.`);
    for (const id of gaps) {
      const stories = (phase.ids.get(id) ?? []).map((n) => `#${String(n)}`).join(', ');
      lines.push(`- ⚠️ **${id}** has no test yet (traced by ${stories})`);
    }
  } else {
    lines.push(`Phase information unavailable: ${phaseUnavailableReason}`);
  }

  lines.push(
    '',
    '## All requirements',
    '',
    '| Requirement | Unit | Component | E2E |',
    '|---|---:|---:|---:|',
  );
  for (const id of requirements) {
    const label = gaps.includes(id) ? `⚠️ ${id}` : id;
    const own = testsOf(id);
    lines.push(
      `| ${label} | ${count(own, 'unit')} | ${count(own, 'component')} | ${count(own, 'e2e')} |`,
    );
  }

  lines.push('', '## Tests per requirement');
  for (const id of covered) {
    lines.push(
      '',
      `### ${id}`,
      '',
      ...testsOf(id).map((t) => `- ${t.layer} · ${t.file} › ${t.title}`),
    );
  }
  return `${lines.join('\n')}\n`;
}
