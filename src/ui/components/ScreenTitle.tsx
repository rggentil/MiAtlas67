import type { ReactNode } from 'react';
import { useFocusOnMount } from './useFocusOnMount.ts';

interface ScreenTitleProps {
  children: ReactNode;
  className?: string;
}

/** The h1 of a screen. It takes the focus when the screen opens (NFR-05). */
export function ScreenTitle({ children, className = '' }: ScreenTitleProps) {
  const ref = useFocusOnMount<HTMLHeadingElement>();

  return (
    <h1 ref={ref} tabIndex={-1} className={`font-display leading-tight outline-none ${className}`}>
      {children}
    </h1>
  );
}
