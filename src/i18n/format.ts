import type { Language } from './languages.ts';

export type MessageParams = Readonly<Record<string, string | number>>;

/** Replaces each `{name}` of a UI text with its value; unknown placeholders stay as they are. */
export function formatMessage(template: string, params: MessageParams = {}): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = params[name];
    return value === undefined ? placeholder : String(value);
  });
}

/** The locale of each UI language for dates: Spain's Spanish, and British English (day before month). */
const DATE_LOCALES: Record<Language, string> = { es: 'es-ES', en: 'en-GB' };

/** When a round was played, as the history shows it: "18 nov 2026, 10:30" (HIS-01, HIS-02). */
export function formatPlayedAt(playedAt: number, language: Language): string {
  return new Intl.DateTimeFormat(DATE_LOCALES[language], {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(playedAt);
}
