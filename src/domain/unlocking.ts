import type { GameId } from './games.ts';
import { bestResult, type PlayedResult } from './playerProgress.ts';
import { LEVELS, type Level, type RegionChoice } from './questions.ts';

/** Stars a level needs to open the next one (LVL-04, D4). */
export const STARS_TO_UNLOCK = 2;

/** A level and whether the player can play it (LVL-04, LVL-05). */
export interface LevelLock {
  readonly level: Level;
  readonly open: boolean;
}

/** The level before `level`, or `null` for the first one, Fácil. */
export function previousLevel(level: Level): Level | null {
  return LEVELS[LEVELS.indexOf(level) - 1] ?? null;
}

/**
 * Whether the player of `rounds` can play `level` of `game` in `region` (LVL-04). Fácil is always open; another
 * level opens when the best round of the level before has ★★. Each game and region ("Mundo" included) unlocks
 * on its own. A level where the player already completed a round stays open, so nobody loses a level played
 * before unlocking arrived (D26).
 */
export function isLevelOpen(
  rounds: readonly PlayedResult[],
  game: GameId,
  region: RegionChoice,
  level: Level,
): boolean {
  const before = previousLevel(level);
  if (before === null) return true;
  const playedHere = rounds.some(
    (round) => round.game === game && round.region === region && round.level === level,
  );
  if (playedHere) return true;
  const best = bestResult(rounds, game, region, before);
  return best !== null && best.stars >= STARS_TO_UNLOCK;
}

/** Every level of `game` in `region`, in order, with whether it is open for the player of `rounds`. */
export function levelLocks(
  rounds: readonly PlayedResult[],
  game: GameId,
  region: RegionChoice,
): LevelLock[] {
  return LEVELS.map((level) => ({ level, open: isLevelOpen(rounds, game, region, level) }));
}
