import { describe, expect, it } from 'vitest';
import { GAME_TOPICS, GAMES, gamesOfTopic } from './games.ts';

describe('games', () => {
  it('GAME-01 there are six games: each topic in both directions', () => {
    expect(GAMES.map((game) => game.id)).toEqual([
      'FLAG-A',
      'FLAG-B',
      'CAP-A',
      'CAP-B',
      'SHAPE-A',
      'SHAPE-B',
    ]);
  });

  it('GAME-01 each topic groups its two games, direction A first', () => {
    expect(GAME_TOPICS).toEqual(['flags', 'capitals', 'shapes']);
    for (const topic of GAME_TOPICS) {
      const games = gamesOfTopic(topic);
      expect(games.map((game) => game.direction)).toEqual(['A', 'B']);
      expect(games.every((game) => game.topic === topic)).toBe(true);
    }
  });
});
