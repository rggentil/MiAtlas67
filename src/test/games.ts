import { GAMES, type GameId } from '../domain/games.ts';
import { isPlayable, type PlayableGame } from '../ui/games.ts';

/** A playable game by its id, for tests: FLAG-A or FLAG-B so far. */
export function playableGame(id: GameId): PlayableGame {
  const game = GAMES.find((candidate) => candidate.id === id);
  if (!game || !isPlayable(game)) throw new Error(`${id} is not playable`);
  return game;
}
