import { describe, expect, it } from 'vitest';
import { formatProgress } from './progress.ts';

describe('formatProgress', () => {
  it('RND-06 shows the current question and the total as "current/total"', () => {
    expect(formatProgress(3, 10)).toBe('3/10');
  });
});
