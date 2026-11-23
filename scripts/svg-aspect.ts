// The proportions of an SVG file from its own drawing, for the flag ratio checks (DATA-06, D39).

function numberAttribute(svgTag: string, name: string): number | undefined {
  const value = new RegExp(`\\s${name}="([\\d.]+)(?:px)?"`).exec(svgTag)?.[1];
  return value === undefined ? undefined : Number(value);
}

/**
 * Width over height of an SVG: its `width` and `height` when it has both, as a browser sizes it, otherwise its
 * `viewBox`. Throws when it has neither, since such a file has no proportions of its own.
 */
export function svgAspect(svg: string): number {
  const tag = /<svg\b[^>]*>/.exec(svg)?.[0] ?? '';
  const width = numberAttribute(tag, 'width');
  const height = numberAttribute(tag, 'height');
  if (width && height) return width / height;
  const box = /\sviewBox="([^"]+)"/
    .exec(tag)?.[1]
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);
  const [, , boxWidth, boxHeight] = box ?? [];
  if (boxWidth && boxHeight) return boxWidth / boxHeight;
  throw new Error('The SVG has no width and height or viewBox');
}
