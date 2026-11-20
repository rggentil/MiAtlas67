import type { Game, GameId } from '../domain/games.ts';
import type { Topic } from '../domain/questions.ts';

/** A game with a playable screen: its topic has questions in the domain. */
export interface PlayableGame extends Game {
  readonly topic: Topic;
}

/** Games with a playable screen: all six since epic 5. */
const PLAYABLE_GAMES: ReadonlySet<GameId> = new Set<GameId>([
  'FLAG-A',
  'FLAG-B',
  'CAP-A',
  'CAP-B',
  'SHAPE-A',
  'SHAPE-B',
]);

/** Playable games open from the home screen; the others show "Pronto" (GAME-01). */
export function isPlayable(game: Game): game is PlayableGame {
  return PLAYABLE_GAMES.has(game.id);
}
