import { useI18n } from '../../i18n/context.ts';
import { Button } from './Button.tsx';
import { ModalDialog } from './ModalDialog.tsx';
import { useFocusOnMount } from './useFocusOnMount.ts';

interface QuitDialogProps {
  onStay: () => void;
  onQuit: () => void;
}

/**
 * "¿Salir de la partida?" (RND-07). The safe choice, "Seguir jugando", has the focus; Escape also keeps
 * playing. The round behind it is inert while it is open.
 */
export function QuitDialog({ onStay, onQuit }: QuitDialogProps) {
  const { t } = useI18n();
  const stayRef = useFocusOnMount<HTMLButtonElement>();

  return (
    <ModalDialog title={t('quit.title')} text={t('quit.text')} onEscape={onStay}>
      <Button ref={stayRef} onClick={onStay}>
        {t('quit.stay')}
      </Button>
      <Button variant="secondary" onClick={onQuit}>
        {t('quit.confirm')}
      </Button>
    </ModalDialog>
  );
}
