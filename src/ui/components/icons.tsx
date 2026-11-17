import type { ReactNode, SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & { size?: number };

/** Stroke icon of the «Bloques» theme. Decorative: the text next to it carries the meaning. */
function StrokeIcon({
  size = 22,
  strokeWidth = 2.5,
  children,
  ...props
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M5 21V4" />
      <path d="M5 4h12l-2.5 4.5L17 13H5" />
    </StrokeIcon>
  );
}

export function CapitalIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M3 21h18" />
      <path d="M5 21v-9" />
      <path d="M9.5 21v-9" />
      <path d="M14.5 21v-9" />
      <path d="M19 21v-9" />
      <path d="M2 10 12 4l10 6" />
    </StrokeIcon>
  );
}

export function ShapeIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3z" />
      <path d="M9 3v15" />
      <path d="M15 6v15" />
    </StrokeIcon>
  );
}

export function BackIcon(props: IconProps) {
  return (
    <StrokeIcon strokeWidth={3} {...props}>
      <path d="M19 12H5" />
      <path d="m11 5-7 7 7 7" />
    </StrokeIcon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <StrokeIcon strokeWidth={3} {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </StrokeIcon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <StrokeIcon strokeWidth={3.5} {...props}>
      <path d="M20 6 9 17l-5-5" />
    </StrokeIcon>
  );
}

export function NextIcon(props: IconProps) {
  return (
    <StrokeIcon strokeWidth={3.2} {...props}>
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </StrokeIcon>
  );
}

/**
 * A star of the round's rating (SCR-02), drawn on a dark (ink) background: filled in sun yellow, or only a
 * white outline. Both stand out from the ink, and from each other, well beyond 3:1 (WCAG 1.4.11).
 * `data-filled` exposes the state to tests: the icon itself is hidden from assistive technology.
 */
export function StarIcon({ filled, size = 22 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      data-filled={filled}
      className={filled ? 'fill-sun stroke-sun' : 'fill-ink stroke-paper'}
      strokeWidth={1.8}
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
