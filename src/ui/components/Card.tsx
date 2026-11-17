import type { HTMLAttributes } from 'react';
import { toneClasses, type Tone } from './tones.ts';

interface CardProps extends HTMLAttributes<HTMLElement> {
  tone?: Tone;
}

/** Panel with a thick outline and an offset shadow. */
export function Card({ tone = 'paper', className = '', ...props }: CardProps) {
  return (
    <section
      className={`rounded-block border-3 border-ink p-4 shadow-block ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}
