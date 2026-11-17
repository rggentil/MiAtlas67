import type { HTMLAttributes } from 'react';
import { toneClasses, type Tone } from './tones.ts';

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

/** Small rounded label, e.g. the topic, region or level of a round. */
export function Chip({ tone = 'paper', className = '', ...props }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border-2 border-ink px-3 py-0.5 text-sm font-black ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}
