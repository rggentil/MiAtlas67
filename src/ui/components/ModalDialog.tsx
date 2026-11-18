import { useEffect, useId, type ReactNode } from 'react';

interface ModalDialogProps {
  title: string;
  text: string;
  /** Escape does the safe choice, the dialog's first button. */
  onEscape: () => void;
  /** The buttons, the safe choice first. */
  children: ReactNode;
}

/**
 * An in-page modal dialog, not the browser's confirm box: a title, a sentence and its buttons. The screen
 * behind it makes itself inert while it is open.
 */
export function ModalDialog({ title, text, onEscape, children }: ModalDialogProps) {
  const titleId = useId();
  const textId = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onEscape();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onEscape]);

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
          {title}
        </h2>
        <p id={textId} className="text-lg font-bold">
          {text}
        </p>
        <div className="flex flex-col gap-3">{children}</div>
      </div>
    </div>
  );
}
