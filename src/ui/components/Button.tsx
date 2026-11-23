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
 *
 * With `aria-disabled` it stays focusable, so a screen reader can still find it and hear why it is not
 * available (a locked level, LVL-05). It then looks flat: a dashed outline on the sky colour, no shadow, and it
 * does not move when pressed. Its text keeps full contrast.
 */
export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const unavailable = props['aria-disabled'] === true || props['aria-disabled'] === 'true';
  return (
    <button
      type={type}
      className={[
        // The side padding stays at 20 px with larger text, so a button still fits a 360 px phone (NFR-05).
        'inline-flex min-h-14 min-w-12 items-center justify-center gap-2 px-[min(1.25rem,20px)]',
        'rounded-block border-3 border-ink',
        'font-display text-xl text-ink',
        'motion-safe:transition-[translate,box-shadow] motion-safe:duration-75',
        unavailable
          ? 'cursor-not-allowed border-dashed bg-sky'
          : [
              'shadow-block',
              'enabled:active:translate-x-1 enabled:active:translate-y-1 enabled:active:shadow-none',
              variantClasses[variant],
            ].join(' '),
        'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      ].join(' ')}
      {...props}
    />
  );
}
