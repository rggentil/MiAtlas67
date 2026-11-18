import { describe, expect, it } from 'vitest';
import { formatMessage, formatPlayedAt } from './format.ts';

describe('formatMessage', () => {
  it('NFR-06 fills the placeholders of a UI text', () => {
    expect(formatMessage('¡Uy! Era {name}', { name: 'Portugal' })).toBe('¡Uy! Era Portugal');
    expect(formatMessage('Aciertos: {n}', { n: 3 })).toBe('Aciertos: 3');
  });

  it('NFR-06 leaves a text without placeholders, or with an unknown one, unchanged', () => {
    expect(formatMessage('¡Correcto!')).toBe('¡Correcto!');
    expect(formatMessage('Hola {who}', { name: 'x' })).toBe('Hola {who}');
  });
});

describe('formatPlayedAt', () => {
  // 18 November 2026 at 10:30 in the local time of the machine that runs the test.
  const PLAYED_AT = new Date(2026, 10, 18, 10, 30).getTime();

  it('HIS-02 shows the date and time of a round in Spanish', () => {
    expect(formatPlayedAt(PLAYED_AT, 'es')).toMatch(/^18 nov\.? 2026, 10:30$/);
  });

  it('HIS-02 NFR-06 shows the date and time of a round in English, day first', () => {
    expect(formatPlayedAt(PLAYED_AT, 'en')).toMatch(/^18 Nov 2026, 10:30$/);
  });
});
