import { describe, expect, it } from 'vitest';
import { familyRecord, familyRecordsOf, type RecordRound } from './familyRecords.ts';
import type { GameId } from './games.ts';
import { LEVELS, REGION_CHOICES, type Level, type RegionChoice } from './questions.ts';

function played(
  playerId: number,
  playedAt: number,
  score: number,
  where: { game?: GameId; region?: RegionChoice; level?: Level } = {},
): RecordRound {
  const stars = score === 10 ? 3 : score >= 8 ? 2 : score >= 5 ? 1 : 0;
  return {
    id: playedAt,
    playerId,
    playedAt,
    game: where.game ?? 'FLAG-A',
    region: where.region ?? 'europe',
    level: where.level ?? 1,
    score,
    total: 10,
    stars,
  };
}

describe('familyRecord', () => {
  it('HIS-05 is the best score of every player in that game, region and level, with who holds it', () => {
    const rounds = [played(1, 1_000, 8), played(2, 2_000, 9), played(1, 3_000, 6)];

    expect(familyRecord(rounds, 'FLAG-A', 'europe', 1)).toEqual({
      score: 9,
      total: 10,
      playerId: 2,
      playedAt: 2_000,
    });
  });

  it('HIS-05 D28 a tie keeps the player who reached it first', () => {
    const rounds = [played(1, 5_000, 9), played(2, 2_000, 9), played(3, 9_000, 9)];

    expect(familyRecord(rounds, 'FLAG-A', 'europe', 1)?.playerId).toBe(2);
  });

  it('HIS-05 D28 the date decides a tie, not the saving order: the older round wins even if saved later', () => {
    const older = { ...played(2, 1_000, 9), id: 50 };
    const newer = { ...played(1, 2_000, 9), id: 10 };

    expect(familyRecord([newer, older], 'FLAG-A', 'europe', 1)?.playerId).toBe(2);
  });

  it('HIS-05 D28 a tie in the same millisecond keeps the round saved first', () => {
    const first = { ...played(2, 1_000, 9), id: 7 };
    const second = { ...played(1, 1_000, 9), id: 8 };

    expect(familyRecord([second, first], 'FLAG-A', 'europe', 1)?.playerId).toBe(2);
  });

  it('HIS-05 beating the record changes its holder', () => {
    const rounds = [played(2, 1_000, 9), played(1, 2_000, 10)];

    expect(familyRecord(rounds, 'FLAG-A', 'europe', 1)).toMatchObject({ score: 10, playerId: 1 });
  });

  it('HIS-05 GAME-02 other games, regions and levels do not count', () => {
    const rounds = [
      played(2, 1_000, 10, { game: 'FLAG-B' }),
      played(2, 1_000, 10, { region: 'africa' }),
      played(2, 1_000, 10, { level: 2 }),
      played(1, 2_000, 4),
    ];

    expect(familyRecord(rounds, 'FLAG-A', 'europe', 1)).toMatchObject({ score: 4, playerId: 1 });
  });

  it('HIS-05 nobody has played there: no record', () => {
    expect(familyRecord([], 'FLAG-A', 'europe', 1)).toBeNull();
  });
});

describe('familyRecordsOf', () => {
  it('HIS-05 GAME-02 gives every game a cell per region and level, regions first', () => {
    const records = familyRecordsOf(
      [played(2, 1_000, 9, { region: 'asia', level: 3 })],
      ['FLAG-A', 'CAP-B'],
    );

    expect(records.map((game) => game.game)).toEqual(['FLAG-A', 'CAP-B']);
    expect(records[0]?.cells).toHaveLength(REGION_CHOICES.length * LEVELS.length);
    expect(records[0]?.cells.slice(0, 3).map((cell) => [cell.region, cell.level])).toEqual([
      ['world', 1],
      ['world', 2],
      ['world', 3],
    ]);
    const asia = records[0]?.cells.find((cell) => cell.region === 'asia' && cell.level === 3);
    expect(asia?.record).toMatchObject({ score: 9, playerId: 2 });
    expect(records[1]?.cells.every((cell) => cell.record === null)).toBe(true);
  });
});
