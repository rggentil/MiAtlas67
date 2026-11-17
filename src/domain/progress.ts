/** Progress label shown during a round, e.g. "3/10" (RND-06). */
export function formatProgress(current: number, total: number): string {
  return `${String(current)}/${String(total)}`;
}
