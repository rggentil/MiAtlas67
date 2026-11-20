import { describe, expect, it } from 'vitest';
import { buildRelations, parseBorder } from './relations.ts';

describe('buildRelations', () => {
  it('LVL-06 a border pair makes both countries neighbours of each other', () => {
    const { neighbours } = buildRelations(
      [
        ['ES', 'FR'],
        ['ES', 'PT'],
        ['FR', 'ES'],
      ],
      [],
    );
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

  it('LVL-06 a border can join codes with a hyphen of their own, such as Inglaterra and Escocia', () => {
    const { neighbours } = buildRelations([['GB-ENG', 'GB-SCT']], []);
    expect(neighbours.get('GB-ENG')).toEqual(['GB-SCT']);
    expect(neighbours.get('GB-SCT')).toEqual(['GB-ENG']);
  });

  it('DATA-06 a border written as "ES-FR" is read as a pair, and a malformed one is rejected', () => {
    expect(parseBorder('ES-FR')).toEqual(['ES', 'FR']);
    expect(() => parseBorder('ES')).toThrow(/Invalid border "ES"/);
    expect(() => parseBorder('ES-FR-PT')).toThrow(/Invalid border/);
  });
});
