interface ProgressBarProps {
  value: number;
  max: number;
  /** Accessible name, e.g. "Progreso de la partida". */
  label: string;
}

/** Round progress (RND-06), exposed to assistive technology as a progressbar. */
export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-6 w-full overflow-hidden rounded-full border-3 border-ink bg-paper"
    >
      <div
        className={`h-full bg-sun ${percent > 0 && percent < 100 ? 'border-r-3 border-ink' : ''}`}
        style={{ width: `${String(percent)}%` }}
      />
    </div>
  );
}
