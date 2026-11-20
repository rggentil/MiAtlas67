import { describe, expect, it } from 'vitest';
import type { Entity } from '../domain/entity.ts';
import {
  generateRound,
  REGION_CHOICES,
  TOPICS,
  type Question,
  type RoundSettings,
} from '../domain/questions.ts';
import { createRng } from '../domain/random.ts';
import { countries } from './countries.ts';
import { extendedEntities } from './extended.ts';
import { expertRelations, relations } from './relations.ts';
import { allEntities, newRound } from './rounds.ts';

const SEEDS = Array.from({ length: 20 }, (_, index) => index + 1);
const extendedCodes = new Set(extendedEntities.map((entity) => entity.code));

function codes(entities: readonly Entity[]): string[] {
  return entities.map((entity) => entity.code);
}

/** What a round is made of, in order: the entity asked and the codes of its options. */
function shape(round: readonly Question[]): { asked: string; options: string[] }[] {
  return round.map((question) => ({
    asked: question.entity.code,
    options: codes(question.options),
  }));
}

describe('newRound: the round the app builds from the bundled data', () => {
  it('NFR-07 LVL-07 the app plays every entity: the 195 countries and the 52 of the extended set', () => {
    expect(allEntities).toHaveLength(195 + 52);
    expect(codes(allEntities).filter((code) => extendedCodes.has(code))).toHaveLength(52);
  });

  it('NFR-07 LVL-07 levels 1, 2 and 3 give the same round as the 195 countries with their level 3 relations', () => {
    for (const level of [1, 2, 3] as const) {
      for (const topic of TOPICS) {
        for (const region of REGION_CHOICES) {
          const settings: RoundSettings = { topic, region, level };
          for (const seed of SEEDS) {
            const fromApp = newRound(settings, createRng(seed));
            const fromDomain = generateRound(countries, settings, createRng(seed), relations);
            expect(
              shape(fromApp),
              `${topic} / ${region} / level ${String(level)} / seed ${String(seed)}`,
            ).toEqual(shape(fromDomain));
          }
        }
      }
    }
  });

  it('LVL-07 levels 1, 2 and 3 never ask or offer an extended entity', () => {
    for (const level of [1, 2, 3] as const) {
      for (const topic of TOPICS) {
        for (const region of REGION_CHOICES) {
          for (const seed of SEEDS) {
            const round = newRound({ topic, region, level }, createRng(seed));
            const used = round.flatMap((question) => [
              question.entity.code,
              ...codes(question.options),
            ]);
            expect(
              used.filter((code) => extendedCodes.has(code)),
              `${topic} / ${region} / level ${String(level)} / seed ${String(seed)}`,
            ).toEqual([]);
          }
        }
      }
    }
  });

  it('LVL-07 NFR-07 level 4 gives the same round as every entity with the level 4 relations', () => {
    for (const topic of TOPICS) {
      for (const region of REGION_CHOICES) {
        const settings: RoundSettings = { topic, region, level: 4 };
        for (const seed of SEEDS) {
          const fromApp = newRound(settings, createRng(seed));
          const fromDomain = generateRound(allEntities, settings, createRng(seed), expertRelations);
          expect(shape(fromApp), `${topic} / ${region} / seed ${String(seed)}`).toEqual(
            shape(fromDomain),
          );
        }
      }
    }
  });

  it('LVL-07 level 4 rounds ask extended entities: 5 of the 10 questions of "Bandera → País" in "Mundo"', () => {
    for (const seed of SEEDS) {
      const round = newRound({ topic: 'flags', region: 'world', level: 4 }, createRng(seed));
      expect(round.filter((question) => extendedCodes.has(question.entity.code))).toHaveLength(5);
    }
  });

  it('LVL-07 level 4 rounds offer extended entities as options, beside countries', () => {
    const offered = SEEDS.flatMap((seed) =>
      newRound({ topic: 'flags', region: 'world', level: 4 }, createRng(seed)),
    ).flatMap((question) => codes(question.options));
    expect(offered.some((code) => extendedCodes.has(code))).toBe(true);
    expect(offered.some((code) => !extendedCodes.has(code))).toBe(true);
  });

  it('LVL-06 LVL-07 at level 4 the wrong options of a question about Kosovo include Serbia, its neighbour', () => {
    const aboutKosovo = SEEDS.flatMap((seed) =>
      newRound({ topic: 'flags', region: 'europe', level: 4 }, createRng(seed)),
    ).filter((question) => question.entity.code === 'XK');
    expect(aboutKosovo.length).toBeGreaterThan(0);
    for (const question of aboutKosovo) {
      expect(codes(question.options)).toContain('RS');
    }
  });
});
