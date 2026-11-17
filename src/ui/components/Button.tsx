import type { ComponentPropsWithRef } from 'react';

type Variant = 'primary' | 'secondary';

interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-sun',
  secondary: 'bg-paper',
};

/**
 * Chunky «Bloques» button: at least 48 × 48 px (NFR-05). When pressed, it loses its offset
 * shadow and moves down-right, like a block being pushed.
 */
export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex min-h-14 min-w-12 items-center justify-center gap-2 px-5',
        'rounded-block border-3 border-ink shadow-block',
        'font-display text-xl text-ink',
        'motion-safe:transition-[translate,box-shadow] motion-safe:duration-75',
        'enabled:active:translate-x-1 enabled:active:translate-y-1 enabled:active:shadow-none',
        'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...props}
    />
  );
}
