/** Topics of the home screen (spec §6). Shapes is shown before its data arrives (epic 5). */
export const GAME_TOPICS = ['flags', 'capitals', 'shapes'] as const;
export type GameTopic = (typeof GAME_TOPICS)[number];

/** A "¿Qué es?": identify the thing shown · B "¿Cuál es?": find the thing that belongs to a country (spec §4). */
export type Direction = 'A' | 'B';

const GAME_LIST = [
  { id: 'FLAG-A', topic: 'flags', direction: 'A' },
  { id: 'FLAG-B', topic: 'flags', direction: 'B' },
  { id: 'CAP-A', topic: 'capitals', direction: 'A' },
  { id: 'CAP-B', topic: 'capitals', direction: 'B' },
  { id: 'SHAPE-A', topic: 'shapes', direction: 'A' },
  { id: 'SHAPE-B', topic: 'shapes', direction: 'B' },
] as const;

export type GameId = (typeof GAME_LIST)[number]['id'];

/** A game is a topic played in one direction (spec §6). */
export interface Game {
  readonly id: GameId;
  readonly topic: GameTopic;
  readonly direction: Direction;
}

/** The six games: every topic in both directions (GAME-01, D9). */
export const GAMES: readonly Game[] = GAME_LIST;

/** The two games of a topic, direction A first. */
export function gamesOfTopic(topic: GameTopic): Game[] {
  return GAMES.filter((game) => game.topic === topic);
}
