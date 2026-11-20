import type { GameId } from './games.ts';
import type { PlayedResult } from './playerProgress.ts';
import { LEVELS, REGION_CHOICES, type Level, type RegionChoice } from './questions.ts';

/** A completed round of any player on the device, as the family records need it (HIS-05). */
export interface RecordRound extends PlayedResult {
  /** Saving order: the first of two rounds saved in the same millisecond has the lower id. */
  readonly id: number;
  readonly playerId: number;
  readonly playedAt: number;
}

/** The best score of the family in one game, region and level, and the player who holds it (HIS-05). */
export interface FamilyRecord {
  readonly score: number;
  readonly total: number;
  readonly playerId: number;
  readonly playedAt: number;
}

/** One cell of a game's records table: a region and a level, with its record or `null` if nobody played there. */
export interface RecordCell {
  readonly region: RegionChoice;
  readonly level: Level;
  readonly record: FamilyRecord | null;
}

/** The records of one game: a cell for every region and level, regions first. */
export interface GameRecords {
  readonly game: GameId;
  readonly cells: readonly RecordCell[];
}

/** True when `a` was played before `b`; in the same millisecond, the round saved first. */
function earlier(a: RecordRound, b: RecordRound): boolean {
  return a.playedAt < b.playedAt || (a.playedAt === b.playedAt && a.id < b.id);
}

/**
 * The family record of `game`, `region` and `level` (HIS-05): the highest score of any player there, or `null`
 * when nobody played there. A tie does not take the record away: the player who reached that score first keeps
 * it (D28).
 */
export function familyRecord(
  rounds: readonly RecordRound[],
  game: GameId,
  region: RegionChoice,
  level: Level,
): FamilyRecord | null {
  let best: RecordRound | null = null;
  for (const round of rounds) {
    if (round.game !== game || round.region !== region || round.level !== level) continue;
    if (
      best === null ||
      round.score > best.score ||
      (round.score === best.score && earlier(round, best))
    ) {
      best = round;
    }
  }
  return (
    best && {
      score: best.score,
      total: best.total,
      playerId: best.playerId,
      playedAt: best.playedAt,
    }
  );
}

/** The family records of every region and level of each of `games` (HIS-05): one table per game. */
export function familyRecordsOf(
  rounds: readonly RecordRound[],
  games: readonly GameId[],
): GameRecords[] {
  return games.map((game) => ({
    game,
    cells: REGION_CHOICES.flatMap((region) =>
      LEVELS.map((level) => ({ region, level, record: familyRecord(rounds, game, region, level) })),
    ),
  }));
}
