import { createContext, useContext } from 'react';
import type { MessageKey } from './dictionaries.ts';
import type { MessageParams } from './format.ts';
import type { Language } from './languages.ts';

export interface I18nValue {
  language: Language;
  setLanguage: (language: Language) => void;
  /** Translates a UI text key into the current language, filling placeholders such as `{name}`. */
  t: (key: MessageKey, params?: MessageParams) => string;
}

export const I18nContext = createContext<I18nValue | null>(null);

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>');
  return value;
}
