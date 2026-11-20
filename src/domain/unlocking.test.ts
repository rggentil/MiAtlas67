import { describe, expect, it } from 'vitest';
import type { GameId } from './games.ts';
import type { PlayedResult } from './playerProgress.ts';
import type { Level, RegionChoice } from './questions.ts';
import type { Stars } from './round.ts';
import { isLevelOpen, levelLocks, nextLevel, previousLevel, unlockedLevel } from './unlocking.ts';

function played(game: GameId, region: RegionChoice, level: Level, stars: Stars): PlayedResult {
  const score = [3, 5, 8, 10][stars] ?? 0;
  return { game, region, level, score, total: 10, stars };
}

describe('previousLevel', () => {
  it('LVL-04 is the level before, and none for Fácil', () => {
    expect(previousLevel(1)).toBeNull();
    expect(previousLevel(2)).toBe(1);
    expect(previousLevel(3)).toBe(2);
  });
});

describe('isLevelOpen', () => {
  it('LVL-04 Fácil is always open, even with no rounds', () => {
    expect(isLevelOpen([], 'FLAG-A', 'europe', 1)).toBe(true);
    expect(isLevelOpen([], 'SHAPE-B', 'world', 1)).toBe(true);
  });

  it('LVL-04 Medio and Difícil are locked with no rounds', () => {
    expect(isLevelOpen([], 'FLAG-A', 'europe', 2)).toBe(false);
    expect(isLevelOpen([], 'FLAG-A', 'europe', 3)).toBe(false);
  });

  it('LVL-04 ★★ in Fácil opens Medio, but not Difícil', () => {
    const rounds = [played('FLAG-A', 'europe', 1, 2)];

    expect(isLevelOpen(rounds, 'FLAG-A', 'europe', 2)).toBe(true);
    expect(isLevelOpen(rounds, 'FLAG-A', 'europe', 3)).toBe(false);
  });

  it('LVL-04 ★★★ opens the next level too', () => {
    expect(isLevelOpen([played('FLAG-A', 'europe', 2, 3)], 'FLAG-A', 'europe', 3)).toBe(true);
  });

  it('LVL-04 one star is not enough, however many rounds', () => {
    const rounds = [played('FLAG-A', 'europe', 1, 1), played('FLAG-A', 'europe', 1, 1)];

    expect(isLevelOpen(rounds, 'FLAG-A', 'europe', 2)).toBe(false);
  });

  it('LVL-04 the best round counts: ★★ once, then a worse round, keeps it open', () => {
    const rounds = [played('FLAG-A', 'europe', 1, 2), played('FLAG-A', 'europe', 1, 0)];

    expect(isLevelOpen(rounds, 'FLAG-A', 'europe', 2)).toBe(true);
  });

  it('LVL-04 each region unlocks on its own, "Mundo" included', () => {
    const rounds = [played('FLAG-A', 'europe', 1, 3)];

    expect(isLevelOpen(rounds, 'FLAG-A', 'africa', 2)).toBe(false);
    expect(isLevelOpen(rounds, 'FLAG-A', 'world', 2)).toBe(false);
  });

  it('LVL-04 GAME-02 each game unlocks on its own', () => {
    const rounds = [played('FLAG-A', 'europe', 1, 3)];

    expect(isLevelOpen(rounds, 'FLAG-B', 'europe', 2)).toBe(false);
    expect(isLevelOpen(rounds, 'CAP-A', 'europe', 2)).toBe(false);
  });

  it('LVL-04 D26 a level where a round was completed stays open without ★★ in the one before', () => {
    const rounds = [played('FLAG-A', 'europe', 1, 1), played('FLAG-A', 'europe', 3, 0)];

    expect(isLevelOpen(rounds, 'FLAG-A', 'europe', 3)).toBe(true);
    expect(isLevelOpen(rounds, 'FLAG-A', 'europe', 2)).toBe(false);
  });

  it('LVL-04 D26 the scenario: ★ in Fácil and Medio, and a round in Difícil, keep Difícil open', () => {
    const rounds = [
      played('FLAG-A', 'europe', 1, 1),
      played('FLAG-A', 'europe', 2, 1),
      played('FLAG-A', 'europe', 3, 0),
    ];

    expect(isLevelOpen(rounds, 'FLAG-A', 'europe', 2)).toBe(true);
    expect(isLevelOpen(rounds, 'FLAG-A', 'europe', 3)).toBe(true);
  });

  it('LVL-04 D26 a round played in a level keeps it open only in its own game and region', () => {
    const rounds = [played('FLAG-A', 'europe', 3, 0)];

    expect(isLevelOpen(rounds, 'FLAG-A', 'africa', 3)).toBe(false);
    expect(isLevelOpen(rounds, 'FLAG-A', 'world', 3)).toBe(false);
    expect(isLevelOpen(rounds, 'FLAG-B', 'europe', 3)).toBe(false);
  });

  it('LVL-04 D26 ★★ in a level kept open by D26 opens the next one', () => {
    const rounds = [played('FLAG-A', 'europe', 2, 2)];

    expect(isLevelOpen(rounds, 'FLAG-A', 'europe', 3)).toBe(true);
  });
});

describe('levelLocks', () => {
  it('LVL-04 LVL-05 lists every level with whether it is open, in order', () => {
    const rounds = [played('CAP-B', 'asia', 1, 2)];

    expect(levelLocks(rounds, 'CAP-B', 'asia')).toEqual([
      { level: 1, open: true },
      { level: 2, open: true },
      { level: 3, open: false },
    ]);
  });
});

describe('nextLevel', () => {
  it('LVL-04 is the level after, and none for the last one', () => {
    expect(nextLevel(1)).toBe(2);
    expect(nextLevel(2)).toBe(3);
    expect(nextLevel(3)).toBeNull();
  });
});

describe('unlockedLevel', () => {
  it('RND-08 LVL-04 a ★★ round in Fácil opens Medio when Medio was locked', () => {
    expect(unlockedLevel([], 'FLAG-A', 'europe', 1, 2)).toBe(2);
    expect(unlockedLevel([played('FLAG-A', 'europe', 1, 1)], 'FLAG-A', 'europe', 1, 3)).toBe(2);
  });

  it('RND-08 a round with fewer than ★★ opens nothing', () => {
    expect(unlockedLevel([], 'FLAG-A', 'europe', 1, 1)).toBeNull();
    expect(unlockedLevel([], 'FLAG-A', 'europe', 1, 0)).toBeNull();
  });

  it('RND-08 nothing when the next level was already open by an earlier ★★', () => {
    expect(unlockedLevel([played('FLAG-A', 'europe', 1, 2)], 'FLAG-A', 'europe', 1, 2)).toBeNull();
  });

  it('RND-08 D26 nothing when the next level was open because a round was played there', () => {
    expect(unlockedLevel([played('FLAG-A', 'europe', 2, 0)], 'FLAG-A', 'europe', 1, 2)).toBeNull();
  });

  it('RND-08 LVL-04 a ★★ round in Medio opens Difícil, unless ★★ in Medio opened it already', () => {
    expect(unlockedLevel([], 'FLAG-A', 'europe', 2, 2)).toBe(3);
    expect(unlockedLevel([played('FLAG-A', 'europe', 2, 2)], 'FLAG-A', 'europe', 2, 2)).toBeNull();
  });

  it('RND-08 the last level opens nothing', () => {
    expect(unlockedLevel([], 'FLAG-A', 'europe', 3, 3)).toBeNull();
  });

  it('RND-08 LVL-04 rounds of another region or game do not count as already open', () => {
    const rounds = [played('FLAG-A', 'africa', 1, 3), played('FLAG-B', 'europe', 1, 3)];

    expect(unlockedLevel(rounds, 'FLAG-A', 'europe', 1, 2)).toBe(2);
  });
});
