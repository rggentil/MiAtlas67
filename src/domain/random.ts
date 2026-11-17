/**
 * Seeded random generator (NFR-07). Every random choice of the game goes through an `Rng`,
 * so the same seed always produces the same game. The domain never calls `Math.random`.
 */
export interface Rng {
  /** Next number in [0, 1). */
  next(): number;
  /** Next integer in [0, maxExclusive); `maxExclusive` must be a positive integer. */
  int(maxExclusive: number): number;
}

/** Seeds are unsigned 32-bit integers. */
const MAX_SEED = 0xffffffff;

/** Mulberry32: small, fast and good enough for a quiz game (not for cryptography). */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  }

  return {
    next,
    int(maxExclusive: number): number {
      if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
        throw new RangeError(
          `maxExclusive must be a positive integer, got ${String(maxExclusive)}`,
        );
      }
      return Math.floor(next() * maxExclusive);
    },
  };
}

/** Reads `seed` from a URL query string such as `?seed=42`; `null` when missing or not a 32-bit unsigned integer. */
export function parseSeed(search: string): number | null {
  const raw = new URLSearchParams(search).get('seed');
  if (raw === null || !/^\d+$/.test(raw)) return null;
  const seed = Number(raw);
  return seed <= MAX_SEED ? seed : null;
}

export interface SeedOptions {
  /** True only in dev and test builds: production ignores `?seed=` (NFR-07). */
  readonly allowUrlSeed: boolean;
  /** Source of a fresh seed when the URL gives none (or it is not allowed). */
  readonly randomSeed: () => number;
}

/** The seed for the game: the URL seed when allowed and valid, otherwise a random one. */
export function resolveSeed(search: string, options: SeedOptions): number {
  const urlSeed = options.allowUrlSeed ? parseSeed(search) : null;
  return urlSeed ?? options.randomSeed();
}
