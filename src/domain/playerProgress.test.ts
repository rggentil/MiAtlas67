import { describe, expect, it } from 'vitest';
import type { GameId } from './games.ts';
import {
  bestResult,
  isNewRecord,
  progressOf,
  totalStars,
  type PlayedResult,
} from './playerProgress.ts';
import { LEVELS, REGION_CHOICES, type Level, type RegionChoice } from './questions.ts';
import type { Stars } from './round.ts';

function played(
  game: GameId,
  region: RegionChoice,
  level: Level,
  score: number,
  stars: Stars,
): PlayedResult {
  return { game, region, level, score, total: 10, stars };
}

function cell(
  progress: ReturnType<typeof progressOf>,
  game: GameId,
  region: RegionChoice,
  level: Level,
) {
  return progress
    .find((entry) => entry.game === game)
    ?.cells.find((entry) => entry.region === region && entry.level === level);
}

describe('bestResult', () => {
  it('SCR-03 is the highest score of the player in that game, region and level', () => {
    const rounds = [
      played('FLAG-A', 'europe', 1, 5, 1),
      played('FLAG-A', 'europe', 1, 10, 3),
      played('FLAG-A', 'europe', 1, 8, 2),
    ];

    expect(bestResult(rounds, 'FLAG-A', 'europe', 1)).toEqual({ score: 10, total: 10, stars: 3 });
  });

  it('SCR-03 is null when the game, region and level were never played', () => {
    expect(bestResult([], 'FLAG-A', 'europe', 1)).toBeNull();
  });

  it('GAME-02 SCR-03 rounds of another game, region or level do not count', () => {
    const rounds = [
      played('FLAG-B', 'europe', 1, 10, 3),
      played('FLAG-A', 'asia', 1, 10, 3),
      played('FLAG-A', 'europe', 2, 10, 3),
      played('FLAG-A', 'europe', 1, 6, 1),
    ];

    expect(bestResult(rounds, 'FLAG-A', 'europe', 1)).toEqual({ score: 6, total: 10, stars: 1 });
    expect(bestResult(rounds, 'FLAG-A', 'africa', 1)).toBeNull();
  });

  it('SCR-03 a lower round after the best one does not lower it', () => {
    const rounds = [played('FLAG-A', 'europe', 1, 9, 2), played('FLAG-A', 'europe', 1, 4, 0)];

    expect(bestResult(rounds, 'FLAG-A', 'europe', 1)).toEqual({ score: 9, total: 10, stars: 2 });
  });
});

describe('progressOf', () => {
  it('HIS-03 has one table per game, with every region and level, regions first', () => {
    const progress = progressOf([], ['FLAG-A', 'FLAG-B']);

    expect(progress.map((entry) => entry.game)).toEqual(['FLAG-A', 'FLAG-B']);
    expect(progress[0]?.cells.map(({ region, level }) => `${region}-${String(level)}`)).toEqual(
      REGION_CHOICES.flatMap((region) => LEVELS.map((level) => `${region}-${String(level)}`)),
    );
  });

  it('HIS-03 SCR-03 1 star and later 3 stars in "Europa · Fácil" show 3 stars', () => {
    const progress = progressOf(
      [played('FLAG-A', 'europe', 1, 5, 1), played('FLAG-A', 'europe', 1, 10, 3)],
      ['FLAG-A'],
    );

    expect(cell(progress, 'FLAG-A', 'europe', 1)?.stars).toBe(3);
  });

  it('HIS-03 a region and level never played has no stars (null), unlike a round with 0 stars', () => {
    const progress = progressOf([played('FLAG-A', 'europe', 1, 2, 0)], ['FLAG-A']);

    expect(cell(progress, 'FLAG-A', 'asia', 2)?.stars).toBeNull();
    expect(cell(progress, 'FLAG-A', 'europe', 1)?.stars).toBe(0);
  });

  it('GAME-02 the stars of one game do not show in the other', () => {
    const progress = progressOf([played('FLAG-A', 'europe', 1, 10, 3)], ['FLAG-A', 'FLAG-B']);

    expect(cell(progress, 'FLAG-B', 'europe', 1)?.stars).toBeNull();
  });
});

describe('totalStars', () => {
  it('HIS-03 3 stars in "Europa · Fácil", 2 in "África · Fácil" and 1 in the other game make 6', () => {
    const progress = progressOf(
      [
        played('FLAG-A', 'europe', 1, 10, 3),
        played('FLAG-A', 'africa', 1, 8, 2),
        played('FLAG-B', 'europe', 1, 5, 1),
      ],
      ['FLAG-A', 'FLAG-B'],
    );

    expect(totalStars(progress)).toBe(6);
  });

  it('HIS-03 counts only the best stars of each region and level, not every round', () => {
    const progress = progressOf(
      [played('FLAG-A', 'europe', 1, 5, 1), played('FLAG-A', 'europe', 1, 10, 3)],
      ['FLAG-A'],
    );

    expect(totalStars(progress)).toBe(3);
  });

  it('HIS-03 is 0 with no rounds', () => {
    expect(totalStars(progressOf([], ['FLAG-A', 'FLAG-B']))).toBe(0);
  });
});

describe('isNewRecord', () => {
  const BEST_6 = [played('FLAG-A', 'europe', 1, 6, 1), played('FLAG-A', 'europe', 1, 4, 0)];

  it('RND-08 SCR-03 8/10 after a best of 6/10 is a new personal best', () => {
    expect(isNewRecord(BEST_6, 'FLAG-A', 'europe', 1, 8)).toBe(true);
  });

  it('RND-08 D23 a tie with the best is not a record', () => {
    expect(isNewRecord(BEST_6, 'FLAG-A', 'europe', 1, 6)).toBe(false);
  });

  it('RND-08 a lower score is not a record', () => {
    expect(isNewRecord(BEST_6, 'FLAG-A', 'europe', 1, 5)).toBe(false);
  });

  it('RND-08 D23 the first round of a game, region and level is not a record: there is nothing to beat', () => {
    expect(isNewRecord([], 'FLAG-A', 'europe', 1, 5)).toBe(false);
    expect(isNewRecord([], 'FLAG-A', 'europe', 1, 10)).toBe(false);
  });

  it('GAME-02 SCR-03 records are per game, region and level: other bests do not count', () => {
    const rounds = [
      played('FLAG-A', 'europe', 1, 10, 3),
      played('FLAG-B', 'europe', 2, 10, 3),
      played('FLAG-A', 'asia', 2, 10, 3),
      played('FLAG-A', 'europe', 2, 4, 0),
    ];

    expect(isNewRecord(rounds, 'FLAG-A', 'europe', 2, 6)).toBe(true);
    expect(isNewRecord(rounds, 'FLAG-A', 'europe', 1, 9)).toBe(false);
  });
});
