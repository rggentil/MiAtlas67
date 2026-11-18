import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { countries } from '../data/countries.ts';
import { relations } from '../data/relations.ts';
import { generateRound } from '../domain/questions.ts';
import { createRng } from '../domain/random.ts';
import { renderAppAsLucia } from '../test/app.tsx';
import { GAME_ENTRIES, FIRST_SCREEN_ENTRIES } from './navigation/backContext.ts';

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
    await renderAppAsLucia();
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
    await renderAppAsLucia();
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

  it('NAV-01 RND-07 "Sí, salir" after Back goes home; Back then goes to "¿Quién juega?" and takes the round\'s history entries away', async () => {
    await renderAppAsLucia();
    await startRound();

    pressBack();
    await userEvent.click(await screen.findByRole('button', { name: 'Sí, salir' }));
    expect(heading()).toHaveTextContent('¿A qué jugamos?');

    pressBack();
    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿Quién juega?');
    });
    // Only the first screen's own entry is left: the next Back asks before leaving (NAV-02).
    await waitFor(() => {
      expect(window.history.state).toEqual({ miatlas: FIRST_SCREEN_ENTRIES });
    });
    // Going there does not open "¿Salir del juego?" by itself: only the player's Back does.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('NAV-01 NAV-02 Back on the home screen goes to "¿Quién juega?", and Back again asks "¿Salir del juego?" (D22)', async () => {
    await renderAppAsLucia();
    expect(heading()).toHaveTextContent('¿A qué jugamos?');

    pressBack();
    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿Quién juega?');
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lucía' })).toBeVisible();

    pressBack();
    expect(await screen.findByRole('dialog', { name: '¿Salir del juego?' })).toBeVisible();
    expect(heading()).toHaveTextContent('¿Quién juega?');
  });

  it('NAV-01 Back on the summary goes home, like "Menú"', async () => {
    await renderAppAsLucia();
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
    // Going home does not open any question by itself.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Back again goes to "¿Quién juega?", and the game removes the round's entries: only its own is left.
    pressBack();
    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿Quién juega?');
    });
    await waitFor(() => {
      expect(window.history.state).toEqual({ miatlas: FIRST_SCREEN_ENTRIES });
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  }, 30_000);

  it('NAV-01 the address stays the same while the game adds and removes its history entry', async () => {
    await renderAppAsLucia();
    await openFlagsGame();
    expect(window.location.search).toBe('?seed=42');

    pressBack();
    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿A qué jugamos?');
    });
    expect(window.location.search).toBe('?seed=42');
    pressBack();
    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿Quién juega?');
    });
    await waitFor(() => {
      expect(window.history.state).toEqual({ miatlas: FIRST_SCREEN_ENTRIES });
    });
    expect(window.location.search).toBe('?seed=42');
  });

  it('NAV-01 Back never adds a history entry by itself, only a tap does (Chrome skips entries added without one)', async () => {
    await renderAppAsLucia();
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
