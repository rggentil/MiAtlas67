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

/** A closed padlock: a level that is not open yet (LVL-05). */
export function LockIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </StrokeIcon>
  );
}

/** An open padlock: a level that a round has just opened (RND-08). */
export function UnlockIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.5-2" />
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

/** A pencil: edit a player (PRF-04). */
export function EditIcon(props: IconProps) {
  return (
    <StrokeIcon strokeWidth={2.6} {...props}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </StrokeIcon>
  );
}

/** Two arrows going opposite ways: change who plays (PRF-03). */
export function SwitchIcon(props: IconProps) {
  return (
    <StrokeIcon strokeWidth={2.8} {...props}>
      <path d="M4 8h15" />
      <path d="m15 4 4 4-4 4" />
      <path d="M20 16H5" />
      <path d="m9 12-4 4 4 4" />
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

/** A speaker with sound waves: the sound is on (SET-02). */
export function SoundOnIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6" />
      <path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" />
    </StrokeIcon>
  );
}

/** A speaker crossed out: the sound is off (SET-02). */
export function SoundOffIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" />
      <path d="M16 9.5l5 5" />
      <path d="M21 9.5l-5 5" />
    </StrokeIcon>
  );
}
