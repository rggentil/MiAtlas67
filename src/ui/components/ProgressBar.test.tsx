import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressBar } from './ProgressBar.tsx';

describe('ProgressBar', () => {
  it('RND-06 exposes the round progress to assistive technology', () => {
    render(<ProgressBar value={3} max={10} label="Progreso de la partida" />);
    const bar = screen.getByRole('progressbar', { name: 'Progreso de la partida' });
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '10');
  });
});
