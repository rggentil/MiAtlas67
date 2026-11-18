import { useI18n } from '../../i18n/context.ts';
import { Button } from './Button.tsx';
import { ModalDialog } from './ModalDialog.tsx';
import { useFocusOnMount } from './useFocusOnMount.ts';

interface DeletePlayerDialogProps {
  /** Who would be deleted, as the question names them: "¿Borrar a Lucía?". */
  nickname: string;
  onKeep: () => void;
  onDelete: () => void;
}

/**
 * "¿Borrar a Lucía?" (PRF-04): deleting a player also deletes their history (NFR-04), so it asks first. The
 * safe choice, "No, volver", has the focus; Escape also keeps the player. The form behind it is inert.
 */
export function DeletePlayerDialog({ nickname, onKeep, onDelete }: DeletePlayerDialogProps) {
  const { t } = useI18n();
  const keepRef = useFocusOnMount<HTMLButtonElement>();

  return (
    <ModalDialog
      title={t('deletePlayer.title', { name: nickname })}
      text={t('deletePlayer.text', { name: nickname })}
      onEscape={onKeep}
    >
      <Button ref={keepRef} onClick={onKeep}>
        {t('deletePlayer.keep')}
      </Button>
      <Button variant="secondary" onClick={onDelete}>
        {t('deletePlayer.confirm')}
      </Button>
    </ModalDialog>
  );
}
