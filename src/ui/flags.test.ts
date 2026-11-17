import { describe, expect, it } from 'vitest';
import { countries } from '../data/countries.ts';
import type { Entity } from '../domain/entity.ts';
import { flagFile } from '../test/flags.ts';
import { flagUrl } from './flags.ts';

describe('flag images', () => {
  it('DATA-05 every country shows its own bundled flag file', () => {
    for (const country of countries) {
      expect(flagUrl(country), country.code).toMatch(flagFile(country.code));
    }
  });

  it('DATA-06 an entity without a flag file is an error, not a broken image', () => {
    const [first] = countries;
    if (!first) throw new Error('The dataset is empty');
    const unknown: Entity = { ...first, code: 'ZZ' };
    expect(() => flagUrl(unknown)).toThrow('ZZ');
  });
});
