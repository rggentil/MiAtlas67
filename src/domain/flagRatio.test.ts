import { describe, expect, it } from 'vitest';
import { flagAspect, parseFlagRatio } from './flagRatio.ts';

describe('flag ratio (D39)', () => {
  it('DATA-06 D39 reads a ratio written height:width, as flag laws write it', () => {
    expect(parseFlagRatio('2:3')).toEqual({ height: 2, width: 3 });
    expect(parseFlagRatio('189:335')).toEqual({ height: 189, width: 335 });
  });

  it('DATA-06 D39 reads decimals: Nepal is taller than wide, Togo is 1 to the golden ratio', () => {
    expect(parseFlagRatio('1.22:1')).toEqual({ height: 1.22, width: 1 });
    expect(parseFlagRatio('1:1.618')).toEqual({ height: 1, width: 1.618 });
  });

  it('DATA-06 D39 the aspect is width over height: Suiza 1, a 2:3 flag 1.5, Nepal under 1', () => {
    expect(flagAspect('1:1')).toBe(1);
    expect(flagAspect('2:3')).toBe(1.5);
    expect(flagAspect('1.22:1')).toBeLessThan(1);
  });

  it.each(['', '2', '2:3:4', '0:3', '2:0', '-2:3', 'a:b', '2:3 '])(
    'DATA-06 rejects a ratio that is not two positive numbers: %j',
    (text) => {
      expect(() => parseFlagRatio(text)).toThrow(/ratio/);
    },
  );
});
