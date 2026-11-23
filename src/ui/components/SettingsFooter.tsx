import { useI18n } from '../../i18n/context.ts';
import { Button } from './Button.tsx';
import { LanguageSwitch } from './LanguageSwitch.tsx';

interface SettingsFooterProps {
  /** "Acerca de": sources, licences and the neutrality statement (DATA-05, DATA-08, D33). */
  onOpenAbout: () => void;
}

/** The footer of the home screen and of "¿Quién juega?": the language (SET-01) and "Acerca de". */
export function SettingsFooter({ onOpenAbout }: SettingsFooterProps) {
  const { t } = useI18n();

  return (
    <footer className="mt-auto flex flex-col items-center gap-4 pt-4 text-center">
      <LanguageSwitch />
      <Button variant="secondary" onClick={onOpenAbout}>
        {t('about.title')}
      </Button>
    </footer>
  );
}
