/** Matches the URL of the bundled silhouette of `code`: "/…/shapes/es.svg", maybe with a query ("?no-inline"). */
export function shapeFile(code: string): RegExp {
  return new RegExp(String.raw`/shapes/${code.toLowerCase()}(-[\w-]+)?\.svg(\?[\w=&-]*)?$`);
}
