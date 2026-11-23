import { describe, expect, it } from 'vitest';
import { loadSoundOn, saveSoundOn, SOUND_STORAGE_KEY } from './storage.ts';

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

describe('sound storage', () => {
  it('SET-02 the sound is on the first time', () => {
    expect(loadSoundOn(() => memoryStorage())).toBe(true);
  });

  it('SET-02 the sound stays off once it was turned off, and on again once turned on', () => {
    const storage = memoryStorage();
    saveSoundOn(false, () => storage);
    expect(storage.getItem(SOUND_STORAGE_KEY)).toBe('off');
    expect(loadSoundOn(() => storage)).toBe(false);
    saveSoundOn(true, () => storage);
    expect(loadSoundOn(() => storage)).toBe(true);
  });

  it('SET-02 an unknown saved value leaves the sound on', () => {
    expect(loadSoundOn(() => memoryStorage({ [SOUND_STORAGE_KEY]: 'loud' }))).toBe(true);
  });

  it('SET-02 with blocked storage the sound is on, and saving does not throw', () => {
    expect(loadSoundOn(blockedStorage)).toBe(true);
    expect(() => {
      saveSoundOn(false, blockedStorage);
    }).not.toThrow();
  });
});
