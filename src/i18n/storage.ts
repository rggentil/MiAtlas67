import { DEFAULT_LANGUAGE, isLanguage, type Language } from './languages.ts';

/** The language is a per-device preference shared by all profiles (SET-01). */
export const LANGUAGE_STORAGE_KEY = 'miatlas67.language';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const browserStorage = (): StorageLike => window.localStorage;

/**
 * Reads the saved language. Storage can be missing or blocked (private mode, disabled site data):
 * then the app simply starts in Spanish.
 */
export function loadLanguage(getStorage: () => StorageLike = browserStorage): Language {
  try {
    const saved = getStorage().getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(saved) ? saved : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

/** Saves the language; if storage is blocked, the choice only lasts until the page is reloaded. */
export function saveLanguage(
  language: Language,
  getStorage: () => StorageLike = browserStorage,
): void {
  try {
    getStorage().setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Blocked storage must never break the app.
  }
}
