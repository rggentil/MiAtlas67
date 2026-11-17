import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nContext, type I18nValue } from './context.ts';
import { dictionaries, type MessageKey } from './dictionaries.ts';
import { formatMessage, type MessageParams } from './format.ts';
import type { Language } from './languages.ts';
import { loadLanguage, saveLanguage } from './storage.ts';

/** Provides the current language to the whole UI; switching re-renders without reloading (SET-01). */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => loadLanguage());

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    saveLanguage(next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      language,
      setLanguage,
      t: (key: MessageKey, params?: MessageParams) =>
        formatMessage(dictionaries[language][key], params),
    }),
    [language, setLanguage],
  );

  return <I18nContext value={value}>{children}</I18nContext>;
}
