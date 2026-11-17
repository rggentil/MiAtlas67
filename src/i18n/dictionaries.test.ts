import { describe, expect, it } from 'vitest';
import { dictionaries, type Dictionary } from './dictionaries.ts';

describe('dictionaries', () => {
  it('NFR-06 Spanish and English have exactly the same keys', () => {
    expect(Object.keys(dictionaries.en).sort()).toEqual(Object.keys(dictionaries.es).sort());
  });

  it('NFR-06 no text is empty in any language', () => {
    for (const dictionary of Object.values(dictionaries)) {
      for (const text of Object.values(dictionary)) {
        expect(text.trim()).not.toBe('');
      }
    }
  });

  it('NFR-06 a dictionary with a missing key does not typecheck', () => {
    // Compile-time check: if Dictionary ever stopped requiring every key, the
    // expect-error directive below would become unused and "npm run typecheck" would fail.
    // @ts-expect-error 'home.soon' and the other keys are missing
    const incomplete: Dictionary = { 'home.title': 'Hi' };
    expect(incomplete).toBeDefined();
  });
});
