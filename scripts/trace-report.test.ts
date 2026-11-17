import { describe, expect, it } from 'vitest';
import {
  buildReport,
  mentionedIds,
  phaseRequirements,
  requirementIds,
  type TestCase,
} from './trace-report.ts';

const SPEC = `
- **RND-01** A round has 10 questions.
- **RND-02** Options are shuffled. See also RND-01.
| **FLAG-A** A flag is shown | **FLAG-B** A country name is shown |
- **NFR-08** Quality.
| D14 | a decision, not a requirement |
`;

const KNOWN = new Set([
  'RND-01',
  'RND-02',
  'FLAG-A',
  'FLAG-B',
  'NFR-08',
  'DATA-01',
  'DATA-02',
  'DATA-03',
]);

describe('traceability report', () => {
  it('NFR-08 reads every requirement ID defined in the spec, once and in order', () => {
    expect(requirementIds(SPEC)).toEqual(['RND-01', 'RND-02', 'FLAG-A', 'FLAG-B', 'NFR-08']);
  });

  it('NFR-08 finds the known IDs mentioned in a test title or tag', () => {
    expect(mentionedIds('RND-01 RND-02 every round is valid @FLAG-A', KNOWN)).toEqual([
      'RND-01',
      'RND-02',
      'FLAG-A',
    ]);
    expect(
      mentionedIds('FLAG-AB is not FLAG-A, and §7 or D14 are not requirements', KNOWN),
    ).toEqual(['FLAG-A']);
  });

  it('NFR-08 expands ranges such as "DATA-01 … DATA-03"', () => {
    expect(mentionedIds('DATA-01 … DATA-03, RND-02', KNOWN)).toEqual([
      'DATA-01',
      'DATA-02',
      'DATA-03',
      'RND-02',
    ]);
    expect(mentionedIds('DATA-01...DATA-02', KNOWN)).toEqual(['DATA-01', 'DATA-02']);
  });

  it('NFR-08 takes the phase requirements from the Traceability line of its stories', () => {
    const stories = [
      {
        number: 17,
        body: '**User story:** RND-02 is not counted here\n\n**Traceability:** RND-01, FLAG-A · [spec](x)',
      },
      { number: 18, body: '**Traceability:** RND-01, D14' },
      { number: 19, body: 'No traceability line' },
    ];
    expect(phaseRequirements(stories, KNOWN)).toEqual(
      new Map([
        ['RND-01', [17, 18]],
        ['FLAG-A', [17]],
      ]),
    );
  });

  describe('buildReport', () => {
    const requirements = ['RND-01', 'RND-02', 'FLAG-A', 'NFR-08'];
    const tests: TestCase[] = [
      {
        layer: 'unit',
        file: 'src/domain/round.test.ts',
        title: 'round › RND-01 a round has 10 questions',
      },
      { layer: 'unit', file: 'src/domain/questions.test.ts', title: 'RND-01 RND-02 valid rounds' },
      {
        layer: 'e2e',
        file: 'tests/e2e/flags.spec.ts',
        title: 'Flags › RND-01 plays a round',
        tags: ['FLAG-A'],
      },
    ];
    const phase = {
      phase: 2,
      ids: new Map([
        ['RND-01', [18]],
        ['NFR-08', [19]],
      ]),
    };
    const report = buildReport(requirements, tests, phase);

    it('NFR-08 lists every requirement with its tests per layer', () => {
      expect(report).toContain('| RND-01 | 2 | – | 1 |');
      expect(report).toContain('| RND-02 | 1 | – | – |');
      expect(report).toContain('| FLAG-A | – | – | 1 |');
      expect(report).toContain(
        '- unit · src/domain/round.test.ts › round › RND-01 a round has 10 questions',
      );
      expect(report).toContain('- e2e · tests/e2e/flags.spec.ts › Flags › RND-01 plays a round');
    });

    it('NFR-08 summarizes the totals', () => {
      expect(report).toContain('4 requirements in the spec · 3 with tests · 1 without');
    });

    it('NFR-08 highlights the requirements of the current phase that have no test', () => {
      expect(report).toContain('## Phase 2 (epic #2)');
      expect(report).toContain('2 requirements traced by its stories · 1 with tests · 1 without');
      expect(report).toContain('- ⚠️ **NFR-08** has no test yet (traced by #19)');
      expect(report).toContain('| ⚠️ NFR-08 | – | – | – |');
    });

    it('NFR-08 says so when the phase is unknown', () => {
      expect(buildReport(requirements, tests, null, 'gh is not logged in')).toContain(
        'Phase information unavailable: gh is not logged in',
      );
    });

    it('NFR-08 celebrates a phase with no gaps', () => {
      const covered = { phase: 2, ids: new Map([['RND-01', [18]]]) };
      expect(buildReport(requirements, tests, covered)).toContain(
        'Every requirement of phase 2 has tests.',
      );
    });
  });
});
