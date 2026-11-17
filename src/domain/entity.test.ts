import { describe, expect, it } from 'vitest';
import { flagFileName, isCapitalEligible, type Entity } from './entity.ts';

const spain: Entity = {
  code: 'ES',
  name: { es: 'España', en: 'Spain' },
  capital: { es: 'Madrid', en: 'Madrid' },
  otherCapitals: [],
  region: 'europe',
  category: 'un-member',
  tier: 1,
};

describe('entity', () => {
  it('CAP-02 an entity with a quiz capital can be asked in Capitals games', () => {
    expect(isCapitalEligible(spain)).toBe(true);
  });

  it('CAP-02 an entity without a quiz capital is left out of Capitals games', () => {
    expect(isCapitalEligible({ ...spain, code: 'MC', capital: null })).toBe(false);
  });

  it('DATA-05 the flag file is named after the lower-case code', () => {
    expect(flagFileName(spain)).toBe('es.svg');
  });
});
