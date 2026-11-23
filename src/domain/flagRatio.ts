/** A flag's real proportions (D39), as flag laws write them: height first, then width. */
export interface FlagRatio {
  readonly height: number;
  readonly width: number;
}

const RATIO = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/;

/** Reads "2:3", "189:335" or "1.22:1" (Nepal); anything else is a data error (DATA-06). */
export function parseFlagRatio(text: string): FlagRatio {
  const match = RATIO.exec(text);
  const height = Number(match?.[1]);
  const width = Number(match?.[2]);
  if (!(height > 0 && width > 0)) throw new Error(`Not a flag ratio: "${text}"`);
  return { height, width };
}

/** Width over height, as CSS `aspect-ratio` takes it: 1.5 for a 2:3 flag, 1 for Suiza, under 1 for Nepal. */
export function flagAspect(text: string): number {
  const { height, width } = parseFlagRatio(text);
  return width / height;
}
