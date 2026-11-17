/** Matches the URL of the bundled flag of `code`: "/…/es.svg", with "?no-inline" in dev and test builds. */
export function flagFile(code: string): RegExp {
  return new RegExp(String.raw`/${code.toLowerCase()}\.svg(\?no-inline)?$`);
}
