import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Accessible name: the button shows only an icon. */
  label: string;
  icon: ReactNode;
}

/** Square «Bloques» button with only an icon, e.g. "Volver" or "Salir de la partida" (48 × 48 px, NFR-05). */
export function IconButton({
  label,
  icon,
  className = '',
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={[
        'inline-flex size-12 flex-none items-center justify-center',
        'rounded-xl border-3 border-ink bg-paper text-ink shadow-block-sm',
        'motion-safe:transition-[translate,box-shadow] motion-safe:duration-75',
        'active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
        'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent',
        className,
      ].join(' ')}
      {...props}
    >
      {icon}
    </button>
  );
}
