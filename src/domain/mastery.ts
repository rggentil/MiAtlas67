import { isCountry, type Entity } from './entity.ts';
import { GAMES, type GameId } from './games.ts';
import { isEligible } from './questions.ts';

/** Right answers in a row that master an entity (spec §4, HIS-04). */
export const MASTERY_STREAK = 3;

/** What the countries mastered need of a saved round (HIS-01, HIS-04). */
export interface AnsweredRound {
  /** Saving order: the first of two rounds saved in the same millisecond has the lower id. */
  readonly id: number;
  readonly game: GameId;
  readonly playedAt: number;
  /** Codes of the entities asked; rounds saved before the counter arrived have none (D29). */
  readonly asked?: readonly string[];
  readonly missed: readonly string[];
}

/** A game's countries mastered, out of the countries the game can ask. */
export interface Mastery {
  readonly mastered: number;
  readonly total: number;
}

/** Which entities a counter counts: the 195 countries, or the extended set of level 4 apart (HIS-04). */
export type MasterySet = 'countries' | 'extended';

/**
 * The codes mastered in `game` (HIS-04, D29): entities whose last 3 answers there, in any region and level, were
 * right. A miss takes an entity out until it is answered right 3 times in a row again. Only the entity asked
 * counts, not the wrong options, and rounds without the entities asked do not count.
 */
export function masteredCodes(rounds: readonly AnsweredRound[], game: GameId): Set<string> {
  const played = rounds
    .filter((round) => round.game === game && round.asked !== undefined)
    .sort((a, b) => a.playedAt - b.playedAt || a.id - b.id);
  const streaks = new Map<string, number>();
  for (const round of played) {
    for (const code of round.asked ?? []) {
      streaks.set(code, round.missed.includes(code) ? 0 : (streaks.get(code) ?? 0) + 1);
    }
  }
  return new Set(
    [...streaks].filter(([, streak]) => streak >= MASTERY_STREAK).map(([code]) => code),
  );
}

/**
 * "Países dominados: 37/195" for `game` (HIS-04): the countries mastered out of the countries of `entities` the
 * game can ask. With `'extended'`, the extended entities instead, counted apart (level 4 Experto):
 * "Territorios y otros dominados: 3/52".
 */
export function masteryOf(
  rounds: readonly AnsweredRound[],
  game: GameId,
  entities: readonly Entity[],
  set: MasterySet = 'countries',
): Mastery {
  const topic = GAMES.find((candidate) => candidate.id === game)?.topic;
  const counted = entities.filter(
    (entity) =>
      isCountry(entity) === (set === 'countries') &&
      topic !== undefined &&
      isEligible(entity, topic),
  );
  const mastered = masteredCodes(rounds, game);
  return {
    mastered: counted.filter((entity) => mastered.has(entity.code)).length,
    total: counted.length,
  };
}
