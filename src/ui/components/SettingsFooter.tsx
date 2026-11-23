import { useI18n } from '../../i18n/context.ts';
import { Button } from './Button.tsx';
import { LanguageSwitch } from './LanguageSwitch.tsx';

interface SettingsFooterProps {
  /** "Atlas": browse the entities of a region, without a player (ATL-01, ATL-02, D34). */
  onOpenAtlas: () => void;
  /** "Acerca de": sources, licences and the neutrality statement (DATA-05, DATA-08, D33). */
  onOpenAbout: () => void;
}

/**
 * The footer of the home screen and of "¿Quién juega?": the language (SET-01), the Atlas and "Acerca de", which
 * open without a player.
 */
export function SettingsFooter({ onOpenAtlas, onOpenAbout }: SettingsFooterProps) {
  const { t } = useI18n();

  return (
    <footer className="mt-auto flex flex-col items-center gap-4 pt-4 text-center">
      <LanguageSwitch />
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={onOpenAtlas}>
          {t('atlas.title')}
        </Button>
        <Button variant="secondary" onClick={onOpenAbout}>
          {t('about.title')}
        </Button>
      </div>
    </footer>
  );
}
