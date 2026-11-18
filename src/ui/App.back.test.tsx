import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { countries } from '../data/countries.ts';
import { relations } from '../data/relations.ts';
import { generateRound } from '../domain/questions.ts';
import { createRng } from '../domain/random.ts';
import { App } from './App.tsx';
import { GAME_ENTRIES } from './navigation/backContext.ts';

/** The first round of a visit with ?seed=42 in "Europa · Fácil". */
const FIRST_ROUND = generateRound(
  countries,
  { topic: 'flags', region: 'europe', level: 1 },
  createRng(42),
  relations,
);

/** The browser's Back, as the phone's back button does it: the popstate event comes a moment later. */
function pressBack(): void {
  window.history.back();
}

const heading = () => screen.getByRole('heading', { level: 1 });

async function openFlagsGame(): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: /^Bandera → País/ }));
}

async function startRound(): Promise<void> {
  await openFlagsGame();
  await userEvent.click(screen.getByRole('button', { name: 'Europa' }));
  await userEvent.click(screen.getByRole('button', { name: 'Fácil' }));
}

describe('App · the back button (NAV-01)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?seed=42');
  });
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, '', '/');
  });

  it('NAV-01 Back on "¿Qué nivel?" goes to "¿Dónde jugamos?", and Back again goes home', async () => {
    render(<App />);
    await openFlagsGame();
    await userEvent.click(screen.getByRole('button', { name: 'Europa' }));
    expect(screen.getByRole('region', { name: '¿Qué nivel?' })).toBeVisible();

    pressBack();
    expect(await screen.findByRole('region', { name: '¿Dónde jugamos?' })).toBeVisible();
    expect(screen.queryByRole('region', { name: '¿Qué nivel?' })).not.toBeInTheDocument();

    pressBack();
    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿A qué jugamos?');
    });
  });

  it('NAV-01 RND-07 Back in a round asks "¿Salir de la partida?"; Back again closes it and the round goes on', async () => {
    render(<App />);
    await startRound();
    await userEvent.click(
      screen.getByRole('button', { name: FIRST_ROUND[0]?.entity.name.es ?? '' }),
    );

    pressBack();
    const dialog = await screen.findByRole('dialog', { name: '¿Salir de la partida?' });
    expect(dialog).toBeVisible();

    pressBack();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.getByText('1/10')).toBeVisible();
    expect(screen.getByText('Aciertos: 1')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('¡Correcto!');
    expect(screen.getByRole('button', { name: 'Salir de la partida' })).toHaveFocus();
  });

  it('NAV-01 RND-07 "Sí, salir" after Back goes home and takes the game\'s history entry away', async () => {
    render(<App />);
    await startRound();

    pressBack();
    await userEvent.click(await screen.findByRole('button', { name: 'Sí, salir' }));

    expect(heading()).toHaveTextContent('¿A qué jugamos?');
    // The entry the game added is gone, so the next Back leaves the game.
    await waitFor(() => {
      expect(window.history.state).toBeNull();
    });
  });

  it('NAV-01 Back on the summary goes home, like "Menú"', async () => {
    render(<App />);
    await startRound();
    for (const question of FIRST_ROUND) {
      await userEvent.click(screen.getByRole('button', { name: question.entity.name.es }));
      await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    }
    expect(heading()).toHaveTextContent('¡Perfecto!');

    pressBack();
    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿A qué jugamos?');
    });
    // The game removes its entries a moment after going home.
    await waitFor(() => {
      expect(window.history.state).toBeNull();
    });
  }, 30_000);

  it('NAV-01 the address stays the same while the game adds and removes its history entry', async () => {
    render(<App />);
    await openFlagsGame();
    expect(window.location.search).toBe('?seed=42');

    pressBack();
    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿A qué jugamos?');
    });
    expect(window.location.search).toBe('?seed=42');
  });

  it('NAV-01 Back never adds a history entry by itself, only a tap does (Chrome skips entries added without one)', async () => {
    render(<App />);
    await startRound();
    expect(window.history.state).toEqual({ miatlas: GAME_ENTRIES });
    const pushState = vi.spyOn(window.history, 'pushState');

    pressBack();
    await screen.findByRole('dialog', { name: '¿Salir de la partida?' });
    pressBack();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    pressBack();
    await screen.findByRole('dialog', { name: '¿Salir de la partida?' });
    expect(pushState).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Seguir jugando' }));
    expect(pushState).toHaveBeenCalledTimes(GAME_ENTRIES);
    expect(window.history.state).toEqual({ miatlas: GAME_ENTRIES });
  });
});
