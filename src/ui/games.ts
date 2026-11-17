import type { Game, GameId } from '../domain/games.ts';

/** Games with a playable screen so far: Flags (epic 3). Capitals and Shapes arrive in epic 5. */
const PLAYABLE_GAMES: ReadonlySet<GameId> = new Set<GameId>(['FLAG-A', 'FLAG-B']);

/** Playable games open from the home screen; the others show "Pronto" (GAME-01). */
export function isPlayable(game: Game): boolean {
  return PLAYABLE_GAMES.has(game.id);
}
