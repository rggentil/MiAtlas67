import { useEffect, useRef, type ReactNode } from 'react';

interface ScreenTitleProps {
  children: ReactNode;
  className?: string;
}

/**
 * The h1 of a screen. It takes the focus when the screen opens, so keyboard and screen-reader users
 * start reading the new screen from its title (NFR-05).
 */
export function ScreenTitle({ children, className = '' }: ScreenTitleProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <h1 ref={ref} tabIndex={-1} className={`font-display leading-tight outline-none ${className}`}>
      {children}
    </h1>
  );
}
