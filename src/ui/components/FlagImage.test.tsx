import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { countries } from '../../data/countries.ts';
import { extendedEntities } from '../../data/extended.ts';
import type { Entity } from '../../domain/entity.ts';
import { FlagImage } from './FlagImage.tsx';

function entity(code: string): Entity {
  const found = [...countries, ...extendedEntities].find((candidate) => candidate.code === code);
  if (!found) throw new Error(`No entity ${code}`);
  return found;
}

function renderFlag(code: string) {
  const { container } = render(<FlagImage entity={entity(code)} alt="" />);
  const image = container.querySelector('img');
  const frame = container.firstElementChild;
  if (!image || !frame) throw new Error('No flag drawn');
  return { image, frame };
}

describe('FlagImage (D39)', () => {
  it.each([
    ['CH', 1],
    ['ID', 1.5],
    ['MC', 1.25],
    ['QA', 28 / 11],
    ['NP', 1 / 1.22],
  ])('FLAG-A D39 %s is drawn in its real ratio, width over height %s', (code, aspect) => {
    const { image } = renderFlag(code);

    // The browser writes it as "1.5 / 1".
    const [width = '', height = '1'] = image.style.aspectRatio.split('/');
    expect(Number(width) / Number(height)).toBeCloseTo(aspect, 5);
  });

  it('GAME-03 every flag sits in the same 3:2 frame, so flags side by side take the same room', () => {
    for (const code of ['CH', 'NP', 'QA', 'ID', 'MC', 'GB']) {
      expect(renderFlag(code).frame).toHaveClass('aspect-[3/2]', 'w-full');
    }
  });

  it('NFR-05 the outline follows the flag: a drop shadow on the drawing, not a rectangular outline', () => {
    for (const code of ['JP', 'FI', 'NP']) {
      const { image } = renderFlag(code);
      expect(image).toHaveClass('flag-outline');
      expect(image.className).not.toMatch(/\boutline-/);
    }
  });
});
