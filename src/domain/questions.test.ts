import { describe, expect, it } from 'vitest';
import { countries } from '../data/countries.ts';
import { relations } from '../data/relations.ts';
import type { Entity, Region, Tier } from './entity.ts';
import {
  generateRound,
  LEVELS,
  OPTIONS_PER_LEVEL,
  QUESTIONS_PER_ROUND,
  REGION_CHOICES,
  TOPICS,
  type Question,
  type RoundSettings,
} from './questions.ts';
import { createRng } from './random.ts';

const SEEDS = Array.from({ length: 50 }, (_, index) => index + 1);

function rounds(settings: RoundSettings, entities: readonly Entity[] = countries): Question[][] {
  return SEEDS.map((seed) => generateRound(entities, settings, createRng(seed), relations));
}

function questionsOf(settings: RoundSettings, entities: readonly Entity[] = countries): Question[] {
  return rounds(settings, entities).flat();
}

function wrongOptions(question: Question): Entity[] {
  return question.options.filter((option) => option.code !== question.entity.code);
}

function codes(entities: readonly Entity[]): string[] {
  return entities.map((entity) => entity.code);
}

function entity(code: string, overrides: Partial<Entity> = {}): Entity {
  return {
    code,
    name: { es: code, en: code },
    capital: { es: `Capital ${code}`, en: `Capital ${code}` },
    otherCapitals: [],
    region: 'europe',
    category: 'un-member',
    tier: 1,
    ...overrides,
  };
}

function fixture(count: number, overrides: Partial<Entity> = {}): Entity[] {
  return Array.from({ length: count }, (_, index) => entity(`X${String(index)}`, overrides));
}

describe('generateRound', () => {
  it.each([
    [1, 3],
    [2, 4],
    [3, 6],
  ] as const)('§7 a round of level %i has %i options per question', (level, options) => {
    for (const question of questionsOf({ topic: 'flags', region: 'world', level })) {
      expect(question.options).toHaveLength(options);
    }
  });

  it('RND-01 a round asks 10 different entities', () => {
    for (const round of rounds({ topic: 'flags', region: 'world', level: 3 })) {
      expect(round).toHaveLength(QUESTIONS_PER_ROUND);
      expect(new Set(codes(round.map((question) => question.entity))).size).toBe(10);
    }
  });

  it('RND-02 the correct answer appears exactly once and no option is duplicated', () => {
    for (const question of questionsOf({ topic: 'capitals', region: 'world', level: 3 })) {
      const optionCodes = codes(question.options);
      expect(optionCodes.filter((code) => code === question.entity.code)).toHaveLength(1);
      expect(new Set(optionCodes).size).toBe(optionCodes.length);
    }
  });

  it('RND-02 options are shuffled: the correct answer can be in any position', () => {
    const positions = new Set(
      questionsOf({ topic: 'flags', region: 'world', level: 3 }).map((question) =>
        codes(question.options).indexOf(question.entity.code),
      ),
    );
    expect([...positions].sort()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it.each([
    [1, [1]],
    [2, [1, 2]],
    [3, [1, 2, 3]],
  ] as const)('§7 a round of level %i only uses entities of tiers %j', (level, tiers) => {
    for (const region of ['world', 'europe'] as const) {
      for (const question of questionsOf({ topic: 'flags', region, level })) {
        for (const shown of question.options) {
          expect(tiers as readonly Tier[]).toContain(shown.tier);
        }
      }
    }
  });

  it('LVL-02 at level 2 in "Mundo" the wrong options are from the same region as the answer', () => {
    for (const question of questionsOf({ topic: 'flags', region: 'world', level: 2 })) {
      for (const wrong of wrongOptions(question)) {
        expect(wrong.region).toBe(question.entity.region);
      }
    }
  });

  it('LVL-06 at level 3 the wrong options are similar flags first, then neighbours, then the same region', () => {
    for (const question of questionsOf({ topic: 'flags', region: 'world', level: 3 })) {
      const similar = relations.similarFlags.get(question.entity.code) ?? [];
      const neighbours = (relations.neighbours.get(question.entity.code) ?? []).filter(
        (code) => !similar.includes(code),
      );
      const wrong = wrongOptions(question);
      const similarShown = wrong.filter((option) => similar.includes(option.code));
      const neighboursShown = wrong.filter((option) => neighbours.includes(option.code));
      expect(similarShown).toHaveLength(Math.min(5, similar.length));
      expect(neighboursShown).toHaveLength(Math.min(5 - similarShown.length, neighbours.length));
      for (const option of wrong) {
        if (!similar.includes(option.code) && !neighbours.includes(option.code)) {
          expect(option.region).toBe(question.entity.region);
        }
      }
    }
  });

  it('LVL-06 Capitals games at level 3 use neighbours, then the same region, but not similar flags', () => {
    for (const question of questionsOf({ topic: 'capitals', region: 'world', level: 3 })) {
      const neighbours = relations.neighbours.get(question.entity.code) ?? [];
      const wrong = wrongOptions(question);
      const neighboursShown = wrong.filter((option) => neighbours.includes(option.code));
      expect(neighboursShown).toHaveLength(Math.min(5, neighbours.length));
      for (const option of wrong) {
        if (!neighbours.includes(option.code)) expect(option.region).toBe(question.entity.region);
      }
    }
  });

  it('LVL-06 the flags of Rumanía, Andorra and Moldavia are wrong options for the flag of Chad', () => {
    const aboutChad = Array.from({ length: 400 }, (_, index) => index + 1)
      .flatMap((seed) =>
        generateRound(
          countries,
          { topic: 'flags', region: 'world', level: 3 },
          createRng(seed),
          relations,
        ),
      )
      .filter((question) => question.entity.code === 'TD');
    expect(aboutChad.length).toBeGreaterThan(0);
    for (const question of aboutChad) {
      expect(codes(question.options)).toEqual(expect.arrayContaining(['RO', 'AD', 'MD']));
    }
  });

  it('LVL-06 a region round at level 3 only offers countries of that region', () => {
    for (const question of questionsOf({ topic: 'flags', region: 'africa', level: 3 })) {
      expect(question.options.every((option) => option.region === 'africa')).toBe(true);
    }
  });

  it('§7 at level 1 in "Mundo" the wrong options come from the whole pool, not only the same region', () => {
    const mixed = questionsOf({ topic: 'flags', region: 'world', level: 1 }).some((question) =>
      wrongOptions(question).some((wrong) => wrong.region !== question.entity.region),
    );
    expect(mixed).toBe(true);
  });

  it('LVL-02 region "Mundo" asks entities from all five regions', () => {
    const asked = questionsOf({ topic: 'flags', region: 'world', level: 1 });
    expect(new Set(asked.map((question) => question.entity.region))).toEqual(
      new Set<Region>(['europe', 'africa', 'americas', 'asia', 'oceania']),
    );
  });

  it('LVL-02 a region round only asks and offers entities of that region', () => {
    for (const question of questionsOf({ topic: 'flags', region: 'asia', level: 2 })) {
      for (const shown of question.options) {
        expect(shown.region).toBe('asia');
      }
    }
  });

  it('LVL-03 "Oceanía" at level 1 still has 10 questions, topped up tier by tier', () => {
    // Oceanía has 1 tier-1 country (Australia) and 3 tier-2 countries, so tier 3 fills the rest.
    for (const round of rounds({ topic: 'flags', region: 'oceania', level: 1 })) {
      const asked = round.map((question) => question.entity);
      expect(asked).toHaveLength(10);
      expect(codes(asked)).toEqual(expect.arrayContaining(['AU', 'FJ', 'NZ', 'PG']));
      expect(asked.filter((e) => e.tier === 3)).toHaveLength(6);
      expect(asked.every((e) => e.region === 'oceania')).toBe(true);
    }
  });

  it('LVL-03 "África" at level 1 is topped up with the next tier only', () => {
    // África has 5 tier-1 countries: the other 5 come from tier 2, none from tier 3.
    for (const round of rounds({ topic: 'flags', region: 'africa', level: 1 })) {
      const tiers = round.map((question) => question.entity.tier);
      expect(tiers.filter((tier) => tier === 1)).toHaveLength(5);
      expect(tiers.filter((tier) => tier === 2)).toHaveLength(5);
    }
  });

  it('LVL-03 the top-up varies between rounds', () => {
    const asked = new Set(
      questionsOf({ topic: 'flags', region: 'oceania', level: 1 }).map((q) => q.entity.code),
    );
    expect(asked.size).toBeGreaterThan(10);
  });

  it('DATA-03 other capitals of the asked country are never offered as wrong options', () => {
    const palestine = entity('PS', {
      capital: { es: 'Jerusalén Este', en: 'East Jerusalem' },
      otherCapitals: [{ es: 'Ramala', en: 'Ramallah' }],
    });
    const ramallahState = entity('RA', { capital: { es: 'Ramala', en: 'Ramallah' } });
    const entities = [palestine, ramallahState, ...fixture(8)];

    const aboutPalestine = questionsOf(
      { topic: 'capitals', region: 'europe', level: 1 },
      entities,
    ).filter((question) => question.entity.code === 'PS');
    expect(aboutPalestine.length).toBeGreaterThan(0);
    for (const question of aboutPalestine) {
      expect(codes(question.options)).not.toContain('RA');
    }
  });

  it('CAP-02 Capitals rounds never ask or offer an entity without a quiz capital', () => {
    const entities = [
      ...fixture(10),
      entity('HK', { capital: null }),
      entity('MO', { capital: null }),
    ];
    for (const question of questionsOf(
      { topic: 'capitals', region: 'europe', level: 1 },
      entities,
    )) {
      expect(question.options.every((option) => option.capital !== null)).toBe(true);
    }
    const flagCodes = questionsOf({ topic: 'flags', region: 'europe', level: 1 }, entities).flatMap(
      (question) => codes(question.options),
    );
    expect(flagCodes).toEqual(expect.arrayContaining(['HK', 'MO']));
  });

  it('NFR-07 the same seed produces the same round', () => {
    const settings: RoundSettings = { topic: 'capitals', region: 'world', level: 2 };
    const first = generateRound(countries, settings, createRng(42), relations);
    const second = generateRound(countries, settings, createRng(42), relations);
    expect(first.map((q) => codes(q.options))).toEqual(second.map((q) => codes(q.options)));
  });

  it('RND-01 refuses to build a round from fewer than 10 eligible entities', () => {
    expect(() =>
      generateRound(
        fixture(9),
        { topic: 'flags', region: 'europe', level: 1 },
        createRng(1),
        relations,
      ),
    ).toThrow(/10 entities/);
  });

  it('RND-02 refuses to build a question without enough wrong options', () => {
    // One Oceanía entity among European ones: at level 2 it has no same-region wrong options.
    const entities = [...fixture(9), entity('OC', { region: 'oceania' })];
    expect(() =>
      generateRound(
        entities,
        { topic: 'flags', region: 'world', level: 2 },
        createRng(1),
        relations,
      ),
    ).toThrow(/wrong options/);
  });
});

describe('generateRound with the bundled countries', () => {
  it('RND-01 RND-02 every game, region and level gives valid rounds', () => {
    for (const topic of TOPICS) {
      for (const region of REGION_CHOICES) {
        for (const level of LEVELS) {
          for (const seed of SEEDS.slice(0, 20)) {
            const round = generateRound(
              countries,
              { topic, region, level },
              createRng(seed),
              relations,
            );
            expect(new Set(codes(round.map((q) => q.entity))).size).toBe(QUESTIONS_PER_ROUND);
            for (const question of round) {
              expect(new Set(codes(question.options)).size).toBe(OPTIONS_PER_LEVEL[level]);
              expect(codes(question.options)).toContain(question.entity.code);
            }
          }
        }
      }
    }
  });
});
