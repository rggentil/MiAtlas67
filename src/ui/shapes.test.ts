import { describe, expect, it } from 'vitest';
import { countries } from '../data/countries.ts';
import { extendedEntities } from '../data/extended.ts';
import { hasShape } from './shapes.ts';

describe('silhouette files', () => {
  it('SHAPE-04 every entity has a silhouette but Puntland and Jubalandia', () => {
    const without = [...countries, ...extendedEntities]
      .filter((entity) => !hasShape(entity))
      .map((entity) => entity.code);

    expect(without.sort()).toEqual(['XJ', 'XP']);
  });
});
