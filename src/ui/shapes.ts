import { shapeFileName, type Entity } from '../domain/entity.ts';

const SHAPE_DIRECTORY = '../assets/shapes/';

/**
 * URL of every bundled silhouette (DATA-05), by path. Nothing is fetched from another site (NFR-04).
 * `?no-inline`: each silhouette stays its own file instead of a data URL inside the JavaScript bundle.
 */
const SHAPE_URLS = import.meta.glob<string>('../assets/shapes/*.svg', {
  eager: true,
  query: '?no-inline',
  import: 'default',
});

/** Whether the entity has a bundled silhouette: Puntland and Jubalandia have none (SHAPE-04). */
export function hasShape(entity: Entity): boolean {
  return `${SHAPE_DIRECTORY}${shapeFileName(entity)}` in SHAPE_URLS;
}

/** The bundled silhouette of a shape-eligible entity; a missing file is a data error (DATA-06). */
export function shapeUrl(entity: Entity): string {
  const url = SHAPE_URLS[`${SHAPE_DIRECTORY}${shapeFileName(entity)}`];
  if (url === undefined) throw new Error(`No silhouette file for ${entity.code}`);
  return url;
}
