import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PlayedResult } from '../../domain/playerProgress.ts';
import { REGION_CHOICES, type Level, type RoundSettings } from '../../domain/questions.ts';
import type { Stars } from '../../domain/round.ts';
import { playableGame } from '../../test/games.ts';
import { renderWithI18n } from '../../test/render.tsx';
import { GameSetupScreen } from './GameSetupScreen.tsx';

const FLAG_A = playableGame('FLAG-A');

function played(region: RoundSettings['region'], level: Level, stars: Stars): PlayedResult {
  return { game: 'FLAG-A', region, level, score: [3, 5, 8, 10][stars] ?? 0, total: 10, stars };
}

/** Rounds of "Bandera → País" that open every level of every region: ★★ in Fácil and in Medio (LVL-04). */
const OPEN_EVERYWHERE: readonly PlayedResult[] = REGION_CHOICES.flatMap((region) => [
  played(region, 1, 2),
  played(region, 2, 2),
]);

function renderSetup(rounds: readonly PlayedResult[] = OPEN_EVERYWHERE) {
  const onStart = vi.fn<(settings: RoundSettings) => void>();
  const onBack = vi.fn();
  renderWithI18n(
    <GameSetupScreen
      game={FLAG_A}
      loadRounds={() => Promise.resolve(rounds)}
      onStart={onStart}
      onBack={onBack}
    />,
  );
  return { onStart, onBack };
}

/** Chooses `region` and waits until its levels are shown: they need the player's rounds (LVL-04). */
async function chooseRegion(region: string) {
  await userEvent.click(screen.getByRole('button', { name: region }));
  await screen.findByRole('button', { name: /^(Fácil|Easy)$/ });
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

    await chooseRegion('Europa');

    expect(choices('¿Qué nivel?')).toEqual(['Fácil', 'Medio', 'Difícil']);
    expect(screen.getByText('Europa')).toBeVisible();
    expect(screen.queryByRole('region', { name: '¿Dónde jugamos?' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '¿Qué nivel?' })).toHaveFocus();
  });

  it('LVL-01 choosing region Europa and level Fácil starts a Flags round of Europa, level Fácil', async () => {
    const { onStart } = renderSetup();

    await chooseRegion('Europa');
    await userEvent.click(screen.getByRole('button', { name: 'Fácil' }));

    expect(onStart).toHaveBeenCalledExactlyOnceWith({ topic: 'flags', region: 'europe', level: 1 });
  });

  it('LVL-02 "Mundo" starts a round of the whole world at the chosen level', async () => {
    const { onStart } = renderSetup();

    await chooseRegion('Mundo');
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
    await chooseRegion('Oceania');
    expect(choices('Which level?')).toEqual(['Easy', 'Medium', 'Hard']);
    expect(screen.getByRole('button', { name: 'Back' })).toBeVisible();
  });
});

describe('GameSetupScreen level locks', () => {
  /** The level step's button whose name starts with `level`, open or locked. */
  function levelButton(level: string) {
    const step = screen.getByRole('region', { name: '¿Qué nivel?' });
    return within(step).getByRole('button', { name: new RegExp(`^${level}`) });
  }

  it('LVL-04 LVL-05 a new player has Fácil open, and Medio and Difícil locked with how to open them', async () => {
    renderSetup([]);

    await chooseRegion('Europa');

    expect(levelButton('Fácil')).toHaveAccessibleName('Fácil');
    expect(levelButton('Fácil')).not.toHaveAttribute('aria-disabled');
    expect(levelButton('Medio')).toHaveAccessibleName('Medio, bloqueado');
    expect(levelButton('Medio')).toHaveAttribute('aria-disabled', 'true');
    expect(levelButton('Medio')).toHaveAccessibleDescription(
      'Consigue ★★ en Fácil para desbloquear',
    );
    expect(levelButton('Difícil')).toHaveAccessibleName('Difícil, bloqueado');
    expect(levelButton('Difícil')).toHaveAccessibleDescription(
      'Consigue ★★ en Medio para desbloquear',
    );
    expect(screen.getByText('Consigue ★★ en Fácil para desbloquear')).toBeVisible();
  });

  it('LVL-04 tapping a locked level starts no round and stays on the level step', async () => {
    const { onStart, onBack } = renderSetup([]);
    await chooseRegion('Europa');

    await userEvent.click(levelButton('Medio'));
    await userEvent.click(levelButton('Difícil'));

    expect(onStart).not.toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();
    expect(screen.getByRole('region', { name: '¿Qué nivel?' })).toBeVisible();
  });

  it('LVL-04 ★★ in Fácil opens Medio, which starts a round; Difícil stays locked', async () => {
    const { onStart } = renderSetup([played('europe', 1, 2)]);
    await chooseRegion('Europa');

    expect(levelButton('Medio')).toHaveAccessibleName('Medio');
    expect(levelButton('Difícil')).toHaveAccessibleName('Difícil, bloqueado');

    await userEvent.click(levelButton('Medio'));
    expect(onStart).toHaveBeenCalledExactlyOnceWith({ topic: 'flags', region: 'europe', level: 2 });
  });

  it('LVL-04 one star in Fácil leaves Medio locked', async () => {
    renderSetup([played('europe', 1, 1)]);
    await chooseRegion('Europa');

    expect(levelButton('Medio')).toHaveAccessibleName('Medio, bloqueado');
  });

  it('LVL-04 ★★ in "Europa" opens nothing in "África" or "Mundo"', async () => {
    renderSetup([played('europe', 1, 3)]);

    await chooseRegion('África');
    expect(levelButton('Medio')).toHaveAccessibleName('Medio, bloqueado');

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    await chooseRegion('Mundo');
    expect(levelButton('Medio')).toHaveAccessibleName('Medio, bloqueado');
  });

  it('LVL-04 GAME-02 ★★ in another game opens nothing in this one', async () => {
    renderSetup([{ ...played('europe', 1, 3), game: 'FLAG-B' }]);
    await chooseRegion('Europa');

    expect(levelButton('Medio')).toHaveAccessibleName('Medio, bloqueado');
  });

  it('LVL-04 D26 a level with a completed round stays open without ★★ in the one before', async () => {
    const { onStart } = renderSetup([played('europe', 1, 1), played('europe', 3, 0)]);
    await chooseRegion('Europa');

    expect(levelButton('Medio')).toHaveAccessibleName('Medio, bloqueado');
    expect(levelButton('Difícil')).toHaveAccessibleName('Difícil');

    await userEvent.click(levelButton('Difícil'));
    expect(onStart).toHaveBeenCalledExactlyOnceWith({ topic: 'flags', region: 'europe', level: 3 });
  });

  it('LVL-04 when the rounds cannot be read, only Fácil is open', async () => {
    renderWithI18n(
      <GameSetupScreen
        game={FLAG_A}
        loadRounds={() => Promise.reject(new Error('Storage is blocked'))}
        onStart={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    await chooseRegion('Europa');

    expect(levelButton('Fácil')).toHaveAccessibleName('Fácil');
    expect(levelButton('Medio')).toHaveAccessibleName('Medio, bloqueado');
  });

  it('LVL-05 NFR-06 in English a locked level says "Get ★★ in Easy to unlock"', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderSetup([]);
    await chooseRegion('Europe');

    const step = screen.getByRole('region', { name: 'Which level?' });
    const medium = within(step).getByRole('button', { name: /^Medium/ });
    expect(medium).toHaveAccessibleName('Medium, locked');
    expect(medium).toHaveAccessibleDescription('Get ★★ in Easy to unlock');
    expect(within(step).getByRole('button', { name: /^Hard/ })).toHaveAccessibleDescription(
      'Get ★★ in Medium to unlock',
    );
  });
});
