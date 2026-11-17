import { afterEach, describe, expect, it, vi } from 'vitest';
import { getGameSeed } from './gameSeed.ts';

describe('getGameSeed', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('NFR-07 a dev or test build uses the seed from "?seed=42"', () => {
    vi.stubEnv('PROD', false);
    expect(getGameSeed('?seed=42')).toBe(42);
  });

  it('NFR-07 the production build ignores "?seed=42" and picks a random seed', () => {
    vi.stubEnv('PROD', true);
    const seeds = Array.from({ length: 5 }, () => getGameSeed('?seed=42'));
    expect(seeds.every((seed) => Number.isInteger(seed) && seed >= 0 && seed < 2 ** 32)).toBe(true);
    // Five random 32-bit seeds that all equal 42 would be a 1-in-2^160 coincidence.
    expect(seeds.some((seed) => seed !== 42)).toBe(true);
  });
});
