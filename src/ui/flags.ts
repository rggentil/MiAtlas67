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
