import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { RoundSettings } from '../../domain/questions.ts';
import { playableGame } from '../../test/games.ts';
import { renderWithI18n } from '../../test/render.tsx';
import { GameSetupScreen } from './GameSetupScreen.tsx';

const FLAG_A = playableGame('FLAG-A');

function renderSetup(onStart = vi.fn<(settings: RoundSettings) => void>(), onBack = vi.fn()) {
  renderWithI18n(<GameSetupScreen game={FLAG_A} onStart={onStart} onBack={onBack} />);
  return { onStart, onBack };
}

function choices(stepName: string): string[] {
  const step = screen.getByRole('region', { name: stepName });
  return within(step)
    .getAllByRole('button')
    .map((button) => button.textContent);
}

describe('GameSetupScreen', () => {
  it('LVL-02 offers the regions Mundo, Europa, África, América, Asia and Oceanía', () => {
    renderSetup();

    expect(screen.getByRole('heading', { level: 1, name: 'Bandera → País' })).toBeVisible();
    expect(choices('¿Dónde jugamos?')).toEqual([
      'Mundo',
      'Europa',
      'África',
      'América',
      'Asia',
      'Oceanía',
    ]);
    expect(screen.queryByRole('region', { name: '¿Qué nivel?' })).not.toBeInTheDocument();
  });

  it('LVL-01 after choosing a region, offers the levels Fácil, Medio and Difícil', async () => {
    renderSetup();

    await userEvent.click(screen.getByRole('button', { name: 'Europa' }));

    expect(choices('¿Qué nivel?')).toEqual(['Fácil', 'Medio', 'Difícil']);
    expect(screen.getByText('Europa')).toBeVisible();
    expect(screen.queryByRole('region', { name: '¿Dónde jugamos?' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '¿Qué nivel?' })).toHaveFocus();
  });

  it('LVL-01 choosing region Europa and level Fácil starts a Flags round of Europa, level Fácil', async () => {
    const { onStart } = renderSetup();

    await userEvent.click(screen.getByRole('button', { name: 'Europa' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fácil' }));

    expect(onStart).toHaveBeenCalledExactlyOnceWith({ topic: 'flags', region: 'europe', level: 1 });
  });

  it('LVL-02 "Mundo" starts a round of the whole world at the chosen level', async () => {
    const { onStart } = renderSetup();

    await userEvent.click(screen.getByRole('button', { name: 'Mundo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Difícil' }));

    expect(onStart).toHaveBeenCalledExactlyOnceWith({ topic: 'flags', region: 'world', level: 3 });
  });

  it('LVL-01 "Volver" goes from the levels back to the regions, and from the regions back home', async () => {
    const { onStart, onBack } = renderSetup();

    await userEvent.click(screen.getByRole('button', { name: 'Asia' }));
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(screen.getByRole('region', { name: '¿Dónde jugamos?' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: '¿Dónde jugamos?' })).toHaveFocus();
    expect(onBack).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('LVL-01 the setup screen speaks English when English is chosen', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderSetup();

    expect(screen.getByRole('heading', { level: 1, name: 'Flag → Country' })).toBeVisible();
    expect(choices('Where shall we play?')).toEqual([
      'World',
      'Europe',
      'Africa',
      'Americas',
      'Asia',
      'Oceania',
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'Oceania' }));
    expect(choices('Which level?')).toEqual(['Easy', 'Medium', 'Hard']);
    expect(screen.getByRole('button', { name: 'Back' })).toBeVisible();
  });
});
