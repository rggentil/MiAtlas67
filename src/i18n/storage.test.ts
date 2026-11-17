import { describe, expect, it } from 'vitest';
import { LANGUAGE_STORAGE_KEY, loadLanguage, saveLanguage } from './storage.ts';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

const blockedStorage = () => {
  throw new DOMException('Storage is disabled', 'SecurityError');
};

describe('language storage', () => {
  it('SET-01 starts in Spanish when nothing is saved', () => {
    expect(loadLanguage(() => memoryStorage())).toBe('es');
  });

  it('SET-01 returns the saved language', () => {
    const storage = memoryStorage();
    saveLanguage('en', () => storage);
    expect(loadLanguage(() => storage)).toBe('en');
  });

  it('SET-01 ignores an unknown saved value and starts in Spanish', () => {
    const storage = memoryStorage({ [LANGUAGE_STORAGE_KEY]: 'fr' });
    expect(loadLanguage(() => storage)).toBe('es');
  });

  it('SET-01 starts in Spanish when storage is blocked', () => {
    expect(loadLanguage(blockedStorage)).toBe('es');
  });

  it('SET-01 saving with blocked storage does not throw', () => {
    expect(() => {
      saveLanguage('en', blockedStorage);
    }).not.toThrow();
  });
});
