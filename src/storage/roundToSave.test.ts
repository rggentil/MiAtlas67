import { describe, expect, it } from 'vitest';
import { countries } from '../data/countries.ts';
import type { Entity } from '../domain/entity.ts';
import { roundToSave } from './store.ts';

function country(code: string): Entity {
  const found = countries.find((entity) => entity.code === code);
  if (!found) throw new Error(`No country ${code}`);
  return found;
}

describe('roundToSave', () => {
  it('HIS-01 keeps who played, when, the game, region and level, the score of its questions and the stars', () => {
    const saved = roundToSave(
      { playerId: 3, playedAt: 1_795_000_000_000, game: 'FLAG-A', region: 'europe', level: 1 },
      {
        score: 8,
        total: 10,
        stars: 2,
        missed: [country('PT'), country('BE')],
        asked: [country('ES'), country('PT'), country('BE')],
      },
    );

    expect(saved).toEqual({
      playerId: 3,
      playedAt: 1_795_000_000_000,
      game: 'FLAG-A',
      region: 'europe',
      level: 1,
      score: 8,
      total: 10,
      stars: 2,
      missed: ['PT', 'BE'],
      asked: ['ES', 'PT', 'BE'],
    });
  });

  it('HIS-01 keeps the missed entities by code, in the order they were asked', () => {
    const saved = roundToSave(
      { playerId: 1, playedAt: 0, game: 'FLAG-B', region: 'world', level: 3 },
      {
        score: 7,
        total: 10,
        stars: 1,
        missed: [country('ES'), country('FR'), country('IT')],
        asked: [country('ES'), country('FR'), country('IT')],
      },
    );

    expect(saved.missed).toEqual(['ES', 'FR', 'IT']);
  });

  it('HIS-01 HIS-04 keeps every entity asked by code, in question order', () => {
    const saved = roundToSave(
      { playerId: 1, playedAt: 0, game: 'CAP-A', region: 'europe', level: 1 },
      {
        score: 2,
        total: 3,
        stars: 1,
        missed: [country('FR')],
        asked: [country('PT'), country('FR'), country('IT')],
      },
    );

    expect(saved.asked).toEqual(['PT', 'FR', 'IT']);
  });

  it('HIS-01 a perfect round keeps no missed entity', () => {
    const saved = roundToSave(
      { playerId: 1, playedAt: 0, game: 'FLAG-A', region: 'asia', level: 2 },
      { score: 10, total: 10, stars: 3, missed: [], asked: [country('ES')] },
    );

    expect(saved.missed).toEqual([]);
  });
});
