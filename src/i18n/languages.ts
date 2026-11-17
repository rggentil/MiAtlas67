/** Languages shipped in v1 (NFR-06). Spanish is the default (SET-01, D1). */
export const LANGUAGES = ['es', 'en'] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'es';

/** Each language is always shown in its own language, so anyone can find theirs. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  es: 'Español',
  en: 'English',
};

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}
