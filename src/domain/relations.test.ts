import { describe, expect, it } from 'vitest';
import { buildRelations } from './relations.ts';

describe('buildRelations', () => {
  it('LVL-06 a border pair makes both countries neighbours of each other', () => {
    const { neighbours } = buildRelations(['ES-FR', 'ES-PT', 'FR-ES'], []);
    expect(neighbours.get('ES')).toEqual(['FR', 'PT']);
    expect(neighbours.get('FR')).toEqual(['ES']);
    expect(neighbours.get('PT')).toEqual(['ES']);
    expect(neighbours.get('JP')).toBeUndefined();
  });

  it('LVL-06 a flag is similar to every other flag of its groups, never to itself', () => {
    const { similarFlags } = buildRelations(
      [],
      [
        ['IT', 'MX'],
        ['IE', 'CI', 'IT'],
      ],
    );
    expect(similarFlags.get('IT')).toEqual(['MX', 'IE', 'CI']);
    expect(similarFlags.get('MX')).toEqual(['IT']);
    expect(similarFlags.get('CI')).toEqual(['IE', 'IT']);
  });

  it('DATA-06 a malformed border pair is rejected', () => {
    expect(() => buildRelations(['ES'], [])).toThrow(/Invalid border "ES"/);
    expect(() => buildRelations(['ES-FR-PT'], [])).toThrow(/Invalid border/);
  });
});
