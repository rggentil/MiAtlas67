import { useI18n } from '../../i18n/context.ts';
import { Button } from './Button.tsx';
import { ModalDialog } from './ModalDialog.tsx';
import { useFocusOnMount } from './useFocusOnMount.ts';

/**
 * "¿Salir del juego?" (NAV-02): Back on the home screen asks first, and Back again leaves. There is no
 * "Sí, salir": a web page cannot close itself, and there may be no page before the game to go to (D20).
 * "Seguir jugando" has the focus; Escape also closes the question.
 */
export function ExitDialog({ onStay }: { onStay: () => void }) {
  const { t } = useI18n();
  const stayRef = useFocusOnMount<HTMLButtonElement>();

  return (
    <ModalDialog title={t('exit.title')} text={t('exit.text')} onEscape={onStay}>
      <Button ref={stayRef} onClick={onStay}>
        {t('exit.stay')}
      </Button>
    </ModalDialog>
  );
}
