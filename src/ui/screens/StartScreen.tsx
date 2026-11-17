import { useI18n } from '../../i18n/context.ts';
import { Chip } from '../components/Chip.tsx';
import { LanguageSwitch } from '../components/LanguageSwitch.tsx';

/** Temporary start page of the walking skeleton; the home screen with the six games replaces it (#20). */
export function StartScreen() {
  const { t } = useI18n();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="font-display text-5xl leading-tight">
        {t('app.greeting')} MiAtlas
        <span className="ml-1 rounded-xl border-3 border-ink bg-accent px-2">67</span>
      </h1>
      <p className="text-lg font-extrabold text-ink-muted">{t('app.tagline')}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Chip tone="flags">{t('topic.flags')}</Chip>
        <Chip tone="capitals">{t('topic.capitals')}</Chip>
        <Chip tone="shapes">{t('topic.shapes')}</Chip>
      </div>
      <LanguageSwitch />
    </main>
  );
}
