import { describe, expect, it } from 'vitest';
import { formatMessage } from './format.ts';

describe('formatMessage', () => {
  it('NFR-06 fills the placeholders of a UI text', () => {
    expect(formatMessage('¡Casi! Era {name}', { name: 'Portugal' })).toBe('¡Casi! Era Portugal');
    expect(formatMessage('Aciertos: {n}', { n: 3 })).toBe('Aciertos: 3');
  });

  it('NFR-06 leaves a text without placeholders, or with an unknown one, unchanged', () => {
    expect(formatMessage('¡Correcto!')).toBe('¡Correcto!');
    expect(formatMessage('Hola {who}', { name: 'x' })).toBe('Hola {who}');
  });
});
