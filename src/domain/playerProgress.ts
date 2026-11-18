import type { GameId } from './games.ts';
import { LEVELS, REGION_CHOICES, type Level, type RegionChoice } from './questions.ts';
import type { Stars } from './round.ts';

/** What progress needs of a completed round: where it was played and how it went (HIS-01). */
export interface PlayedResult {
  readonly game: GameId;
  readonly region: RegionChoice;
  readonly level: Level;
  readonly score: number;
  readonly total: number;
  readonly stars: Stars;
}

/** The best result of a player in one game, region and level (SCR-03). */
export interface BestResult {
  readonly score: number;
  readonly total: number;
  readonly stars: Stars;
}

/** One cell of a game's progress table: a region and a level, with its best stars or `null` if not played. */
export interface ProgressCell {
  readonly region: RegionChoice;
  readonly level: Level;
  readonly stars: Stars | null;
}

/** The progress of a player in one game: a cell for every region and level, regions first (HIS-03). */
export interface GameProgress {
  readonly game: GameId;
  readonly cells: readonly ProgressCell[];
}

/**
 * The best result of `rounds` in `game`, `region` and `level` (SCR-03, GAME-02): the highest score, or `null`
 * when it was never played there. Rounds of other games, regions or levels do not count.
 */
export function bestResult(
  rounds: readonly PlayedResult[],
  game: GameId,
  region: RegionChoice,
  level: Level,
): BestResult | null {
  let best: BestResult | null = null;
  for (const round of rounds) {
    if (round.game !== game || round.region !== region || round.level !== level) continue;
    if (best === null || round.score > best.score) {
      best = { score: round.score, total: round.total, stars: round.stars };
    }
  }
  return best;
}

/** The best stars of every region and level of each of `games` (HIS-03): one table per game. */
export function progressOf(
  rounds: readonly PlayedResult[],
  games: readonly GameId[],
): GameProgress[] {
  return games.map((game) => ({
    game,
    cells: REGION_CHOICES.flatMap((region) =>
      LEVELS.map((level) => ({
        region,
        level,
        stars: bestResult(rounds, game, region, level)?.stars ?? null,
      })),
    ),
  }));
}

/** The sum of the best stars of every game, region and level played (HIS-03). */
export function totalStars(progress: readonly GameProgress[]): number {
  return progress.reduce(
    (sum, game) => sum + game.cells.reduce((cells, cell) => cells + (cell.stars ?? 0), 0),
    0,
  );
}
