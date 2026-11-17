import { resolveSeed } from '../domain/random.ts';

/** A fresh unsigned 32-bit seed from the browser's crypto API (no Math.random). */
function cryptoSeed(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] ?? 0;
}

/**
 * The seed for a new game (NFR-07). Dev and test builds honour `?seed=42` so tests are deterministic;
 * the production build always picks a random seed.
 */
export function getGameSeed(search: string = window.location.search): number {
  return resolveSeed(search, { allowUrlSeed: !import.meta.env.PROD, randomSeed: cryptoSeed });
}
