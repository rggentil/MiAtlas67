import { describe, expect, it } from 'vitest';
import { countries } from './countries.ts';
import { landBorders } from './neighbours.ts';
import { relations } from './relations.ts';
import { similarFlagGroups } from './similarFlags.ts';

const codes = new Set(countries.map((country) => country.code));

describe('relations dataset', () => {
  it('DATA-06 every land border joins two different countries of the dataset, once', () => {
    const seen = new Set<string>();
    for (const pair of landBorders) {
      const [a = '', b = ''] = pair.split('-');
      expect(codes, pair).toContain(a);
      expect(codes, pair).toContain(b);
      expect(a < b, `${pair} is written in alphabetical order`).toBe(true);
      expect(seen, pair).not.toContain(pair);
      seen.add(pair);
    }
  });

  it('DATA-06 every similar-flag group has at least two countries of the dataset, without repeats', () => {
    for (const group of similarFlagGroups) {
      expect(group.length).toBeGreaterThanOrEqual(2);
      expect(new Set(group).size).toBe(group.length);
      for (const code of group) expect(codes).toContain(code);
    }
  });

  it.each([
    ['ES', ['PT', 'FR', 'AD', 'MA']],
    ['DE', ['DK', 'PL', 'CZ', 'AT', 'CH', 'FR', 'LU', 'BE', 'NL']],
    ['BR', ['UY', 'AR', 'PY', 'BO', 'PE', 'CO', 'VE', 'GY', 'SR', 'FR']],
    ['CN', ['KP', 'RU', 'MN', 'KZ', 'KG', 'TJ', 'AF', 'PK', 'IN', 'NP', 'BT', 'MM', 'LA', 'VN']],
    ['ZA', ['NA', 'BW', 'ZW', 'MZ', 'SZ', 'LS']],
  ] as const)('LVL-06 %s has the expected land neighbours', (code, expected) => {
    expect([...(relations.neighbours.get(code) ?? [])].sort()).toEqual([...expected].sort());
  });

  it('LVL-06 island countries have no land neighbours', () => {
    for (const code of ['JP', 'AU', 'NZ', 'IS', 'CU', 'MG', 'CY', 'MT']) {
      expect(relations.neighbours.get(code), code).toBeUndefined();
    }
  });

  it('D15 territories inside the EU count, dependent territories outside it do not', () => {
    expect(relations.neighbours.get('FR')).toEqual(expect.arrayContaining(['BR', 'SR']));
    expect(relations.neighbours.get('ES')).toContain('MA');
    expect(relations.neighbours.get('GB')).not.toContain('ES');
    expect(relations.neighbours.get('CY')).toBeUndefined();
    expect(relations.neighbours.get('DK')).not.toContain('CA');
  });
});
