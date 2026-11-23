import { FLAG_RATIOS } from '../data/flagRatios.ts';
import { flagAspect } from '../domain/flagRatio.ts';
import { flagFileName, type Entity } from '../domain/entity.ts';

const FLAG_DIRECTORY = '../assets/flags/';

/**
 * URL of every bundled flag (DATA-05), by path. Nothing is fetched from another site (NFR-04).
 * `?no-inline`: each flag stays its own file instead of a data URL inside the JavaScript bundle.
 */
const FLAG_URLS = import.meta.glob<string>('../assets/flags/*.svg', {
  eager: true,
  query: '?no-inline',
  import: 'default',
});

/** The bundled flag of an entity; a missing file is a data error (DATA-06). */
export function flagUrl(entity: Entity): string {
  const url = FLAG_URLS[`${FLAG_DIRECTORY}${flagFileName(entity)}`];
  if (url === undefined) throw new Error(`No flag file for ${entity.code}`);
  return url;
}

/** Width over height of an entity's flag, in its real ratio (D39); a missing ratio is a data error (DATA-06). */
export function flagAspectOf(entity: Entity): number {
  const ratio = FLAG_RATIOS[entity.code];
  if (ratio === undefined) throw new Error(`No flag ratio for ${entity.code}`);
  return flagAspect(ratio);
}
