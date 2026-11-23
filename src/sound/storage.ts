/** Whether the sound is on is a per-device preference shared by all profiles, like the language (SET-02, D35). */
export const SOUND_STORAGE_KEY = 'miatlas67.sound';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const browserStorage = (): StorageLike => window.localStorage;

/** Reads the setting: on unless it was turned off. Blocked storage starts with the sound on. */
export function loadSoundOn(getStorage: () => StorageLike = browserStorage): boolean {
  try {
    return getStorage().getItem(SOUND_STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

/** Saves the setting; if storage is blocked, the choice only lasts until the page is reloaded. */
export function saveSoundOn(on: boolean, getStorage: () => StorageLike = browserStorage): void {
  try {
    getStorage().setItem(SOUND_STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // Blocked storage must never break the app.
  }
}
