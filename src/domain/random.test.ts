import { describe, expect, it } from 'vitest';
import { createRng, parseSeed, resolveSeed, type Rng } from './random.ts';

function take(rng: Rng, count: number): number[] {
  return Array.from({ length: count }, () => rng.next());
}

describe('createRng', () => {
  it('NFR-07 two generators with the same seed produce the same sequence', () => {
    expect(take(createRng(42), 100)).toEqual(take(createRng(42), 100));
  });

  it('NFR-07 generators with different seeds produce different sequences', () => {
    expect(take(createRng(42), 100)).not.toEqual(take(createRng(43), 100));
  });

  it('NFR-07 numbers are in [0, 1)', () => {
    for (const value of take(createRng(7), 1000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('NFR-07 int(n) returns integers in [0, n) and reaches every value', () => {
    const rng = createRng(1);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const value = rng.int(6);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(6);
      seen.add(value);
    }
    expect(seen.size).toBe(6);
  });

  it('NFR-07 int(n) rejects a bound that is not a positive integer', () => {
    const rng = createRng(1);
    expect(() => rng.int(0)).toThrow(RangeError);
    expect(() => rng.int(2.5)).toThrow(RangeError);
  });
});

describe('parseSeed', () => {
  it('NFR-07 reads the seed from "?seed=42"', () => {
    expect(parseSeed('?seed=42')).toBe(42);
    expect(parseSeed('?lang=en&seed=0')).toBe(0);
  });

  it('NFR-07 ignores a missing or invalid seed', () => {
    for (const search of ['', '?seed=', '?seed=abc', '?seed=-1', '?seed=1.5', '?seed=4294967296']) {
      expect(parseSeed(search)).toBeNull();
    }
  });
});

describe('resolveSeed', () => {
  const randomSeed = () => 999;

  it('NFR-07 uses the URL seed in dev and test builds', () => {
    expect(resolveSeed('?seed=42', { allowUrlSeed: true, randomSeed })).toBe(42);
  });

  it('NFR-07 falls back to a random seed when the URL has none', () => {
    expect(resolveSeed('', { allowUrlSeed: true, randomSeed })).toBe(999);
  });

  it('NFR-07 ignores the URL seed in production', () => {
    expect(resolveSeed('?seed=42', { allowUrlSeed: false, randomSeed })).toBe(999);
  });
});
