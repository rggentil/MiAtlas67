import { useEffect, useId } from 'react';
import { useI18n } from '../../i18n/context.ts';
import { Button } from './Button.tsx';
import { useFocusOnMount } from './useFocusOnMount.ts';

interface QuitDialogProps {
  onStay: () => void;
  onQuit: () => void;
}

/**
 * "¿Salir de la partida?" (RND-07): an in-page modal dialog, not the browser's confirm box. The safe choice,
 * "Seguir jugando", has the focus; Escape also keeps playing. The page behind it is inert while it is open.
 */
export function QuitDialog({ onStay, onQuit }: QuitDialogProps) {
  const { t } = useI18n();
  const titleId = useId();
  const textId = useId();
  const stayRef = useFocusOnMount<HTMLButtonElement>();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onStay();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onStay]);

  return (
    <div className="fixed inset-0 z-10 flex items-end justify-center bg-ink/60 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={textId}
        className="flex w-full max-w-sm flex-col gap-4 rounded-block border-3 border-ink bg-paper p-5 shadow-block"
      >
        <h2 id={titleId} className="font-display text-3xl leading-tight">
          {t('quit.title')}
        </h2>
        <p id={textId} className="text-lg font-bold">
          {t('quit.text')}
        </p>
        <div className="flex flex-col gap-3">
          <Button ref={stayRef} onClick={onStay}>
            {t('quit.stay')}
          </Button>
          <Button variant="secondary" onClick={onQuit}>
            {t('quit.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}
