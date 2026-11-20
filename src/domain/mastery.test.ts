import { describe, expect, it } from 'vitest';
import type { Entity } from './entity.ts';
import type { GameId } from './games.ts';
import { masteredCodes, masteryOf, type AnsweredRound } from './mastery.ts';

let nextId = 1;
/** A round of `game` played at `playedAt` that asked `asked` and missed `missed`. */
function round(
  playedAt: number,
  asked: readonly string[] | undefined,
  missed: readonly string[] = [],
  game: GameId = 'FLAG-A',
): AnsweredRound {
  return { id: nextId++, game, playedAt, missed, ...(asked ? { asked } : {}) };
}

function entity(code: string, extra: Partial<Entity> = {}): Entity {
  return {
    code,
    name: { es: code, en: code },
    capital: { es: code, en: code },
    otherCapitals: [],
    region: 'europe',
    category: 'un-member',
    tier: 1,
    shapeEligible: true,
    ...extra,
  };
}

describe('masteredCodes', () => {
  it('HIS-04 three right answers in a row master a country', () => {
    const rounds = [round(1, ['PT']), round(2, ['PT', 'ES']), round(3, ['PT'])];

    expect([...masteredCodes(rounds, 'FLAG-A')]).toEqual(['PT']);
  });

  it('HIS-04 two right answers are not enough', () => {
    const rounds = [round(1, ['PT']), round(2, ['PT'])];

    expect(masteredCodes(rounds, 'FLAG-A').has('PT')).toBe(false);
  });

  it('HIS-04 rounds count in the order they were played, whatever order they come in', () => {
    // Played: right, right, wrong. The newest-first list must not read it as wrong, right, right.
    const rounds = [round(3, ['PT'], ['PT']), round(2, ['PT']), round(1, ['PT'])];

    expect(masteredCodes(rounds, 'FLAG-A').has('PT')).toBe(false);
  });

  it('HIS-04 D29 a miss takes a mastered country out, until 3 right answers in a row again', () => {
    const mastered = [round(1, ['PT']), round(2, ['PT']), round(3, ['PT'])];
    const missed = [...mastered, round(4, ['PT'], ['PT'])];
    const twoAgain = [...missed, round(5, ['PT']), round(6, ['PT'])];
    const threeAgain = [...twoAgain, round(7, ['PT'])];

    expect(masteredCodes(mastered, 'FLAG-A').has('PT')).toBe(true);
    expect(masteredCodes(missed, 'FLAG-A').has('PT')).toBe(false);
    expect(masteredCodes(twoAgain, 'FLAG-A').has('PT')).toBe(false);
    expect(masteredCodes(threeAgain, 'FLAG-A').has('PT')).toBe(true);
  });

  it('HIS-04 GAME-02 each game on its own', () => {
    const rounds = [
      round(1, ['PT']),
      round(2, ['PT']),
      round(3, ['PT']),
      round(4, ['PT'], ['PT'], 'FLAG-B'),
    ];

    expect(masteredCodes(rounds, 'FLAG-A').has('PT')).toBe(true);
    expect(masteredCodes(rounds, 'FLAG-B').has('PT')).toBe(false);
  });

  it('HIS-04 a wrong option is not an answer: only the country asked counts', () => {
    // Portugal was only offered as an option in the round about Brasil: it was never asked.
    const rounds = [round(1, ['PT']), round(2, ['BR'], ['BR']), round(3, ['PT']), round(4, ['PT'])];

    expect(masteredCodes(rounds, 'FLAG-A').has('PT')).toBe(true);
  });

  it('HIS-04 D29 rounds saved without the countries asked do not count', () => {
    const rounds = [round(1, undefined), round(2, undefined), round(3, undefined)];

    expect(masteredCodes(rounds, 'FLAG-A').size).toBe(0);
  });

  it('HIS-04 rounds played in the same millisecond keep the order they were saved in', () => {
    const rounds = [
      { ...round(1, ['PT']), id: 1 },
      { ...round(1, ['PT']), id: 2 },
      { ...round(1, ['PT'], ['PT']), id: 3 },
    ];

    expect(masteredCodes(rounds, 'FLAG-A').has('PT')).toBe(false);
  });
});

describe('masteryOf', () => {
  it('HIS-04 counts the mastered countries of a game out of the countries it can ask', () => {
    const countries = [entity('PT'), entity('ES'), entity('FR')];
    const rounds = [round(1, ['PT', 'ES']), round(2, ['PT', 'ES']), round(3, ['PT'])];

    expect(masteryOf(rounds, 'FLAG-A', countries)).toEqual({ mastered: 1, total: 3 });
  });

  it('HIS-04 CAP-02 a Capitals game counts only the countries with a quiz capital', () => {
    const countries = [entity('PT'), entity('XX', { capital: null })];

    expect(masteryOf([], 'CAP-A', countries)).toEqual({ mastered: 0, total: 1 });
    expect(masteryOf([], 'FLAG-A', countries)).toEqual({ mastered: 0, total: 2 });
  });

  it('HIS-04 extended entities are not counted among the countries', () => {
    const countries = [entity('PT'), entity('GI', { category: 'territory' })];
    const rounds = [round(1, ['GI']), round(2, ['GI']), round(3, ['GI'])];

    expect(masteryOf(rounds, 'FLAG-A', countries)).toEqual({ mastered: 0, total: 1 });
  });
});
