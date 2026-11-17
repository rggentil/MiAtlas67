import { useI18n } from '../../i18n/context.ts';
import { LANGUAGE_NAMES, LANGUAGES } from '../../i18n/languages.ts';

/** Language setting (SET-01): native radio buttons styled as «Bloques» chips. */
export function LanguageSwitch() {
  const { language, setLanguage, t } = useI18n();

  return (
    <fieldset className="flex flex-col items-center gap-2">
      <legend className="mb-2 text-sm font-black text-ink-muted">{t('settings.language')}</legend>
      <div className="flex gap-3">
        {LANGUAGES.map((option) => (
          <label key={option} lang={option} className="cursor-pointer">
            <input
              type="radio"
              name="language"
              value={option}
              checked={language === option}
              onChange={() => {
                setLanguage(option);
              }}
              className="peer sr-only"
            />
            <span
              className={[
                'inline-flex min-h-12 min-w-12 items-center justify-center px-4',
                'rounded-full border-3 border-ink bg-paper font-black shadow-block-sm',
                'peer-checked:bg-sun',
                'peer-focus-visible:outline-4 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
              ].join(' ')}
            >
              {LANGUAGE_NAMES[option]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
