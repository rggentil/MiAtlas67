/** Relations between entities used by the "tricky" wrong options of levels 3 and 4 (LVL-06). */
export interface Relations {
  /** Code → codes of the entities that share a land border with it. */
  readonly neighbours: ReadonlyMap<string, readonly string[]>;
  /** Code → codes of the entities whose flag is easy to confuse with its flag. */
  readonly similarFlags: ReadonlyMap<string, readonly string[]>;
}

/** The two entities a land border joins, in any order. */
export type BorderPair = readonly [string, string];

function link(map: Map<string, string[]>, from: string, to: string): void {
  const linked = map.get(from) ?? [];
  if (from !== to && !linked.includes(to)) map.set(from, [...linked, to]);
}

/** Reads a border between two country codes written as "ES-FR". */
export function parseBorder(pair: string): BorderPair {
  const [a, b, ...rest] = pair.split('-');
  if (a === undefined || b === undefined || rest.length > 0) {
    throw new Error(`Invalid border "${pair}": expected two codes such as "ES-FR"`);
  }
  return [a, b];
}

/** Builds the lookups from border pairs and groups of similar flags. Both are symmetric. */
export function buildRelations(
  borders: readonly BorderPair[],
  similarFlagGroups: readonly (readonly string[])[],
): Relations {
  const neighbours = new Map<string, string[]>();
  for (const [a, b] of borders) {
    link(neighbours, a, b);
    link(neighbours, b, a);
  }
  const similarFlags = new Map<string, string[]>();
  for (const group of similarFlagGroups) {
    for (const a of group) for (const b of group) link(similarFlags, a, b);
  }
  return { neighbours, similarFlags };
}
