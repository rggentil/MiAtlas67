import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PlayerData } from '../storage/store.ts';
import { deviceWith, LUCIA, renderApp } from '../test/app.tsx';

const PABLO: PlayerData = { nickname: 'Pablo', avatar: 'owl' };

const heading = () => screen.getByRole('heading', { level: 1 });

/** The player button of the home screen, inside "Jugador". */
function playerButton(): HTMLElement {
  return within(screen.getByRole('group', { name: 'Jugador' })).getByRole('button');
}

/** Opens the game on a device with Lucía and Pablo, and plays as Lucía. */
async function playAsLucia() {
  const store = await renderApp(await deviceWith({ players: [LUCIA, PABLO] }));
  await userEvent.click(screen.getByRole('button', { name: 'Lucía' }));
  expect(heading()).toHaveTextContent('¿A qué jugamos?');
  return store;
}

describe('App · switch player from the home screen (PRF-03)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?seed=42');
  });
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('PRF-03 tapping the player button "Lucía" opens "¿Quién juega?"; tapping "Pablo" goes home as Pablo, the last player next time', async () => {
    const store = await playAsLucia();

    await userEvent.click(playerButton());
    expect(heading()).toHaveTextContent('¿Quién juega?');
    expect(heading()).toHaveFocus();
    // Going there does not ask "¿Salir del juego?": only Back does.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Pablo' }));

    expect(heading()).toHaveTextContent('¿A qué jugamos?');
    expect(playerButton()).toHaveAccessibleName('Pablo');
    expect(within(playerButton()).getByRole('img', { name: 'Búho' })).toBeVisible();
    await waitFor(async () => {
      expect(await store.players.lastPlayerId()).toBe(2);
    });

    // The next time the game opens.
    cleanup();
    await renderApp(store);
    expect(screen.getByRole('button', { name: 'Pablo' })).toHaveAccessibleDescription(
      'Jugó la última vez',
    );
    expect(screen.getByRole('button', { name: 'Lucía' })).not.toHaveAccessibleDescription();
  });

  it('PRF-03 opened from the home screen, "¿Quién juega?" marks who is playing now', async () => {
    await playAsLucia();

    await userEvent.click(playerButton());

    expect(screen.getByRole('button', { name: 'Lucía' })).toHaveAccessibleDescription(
      'Jugó la última vez',
    );
  });

  it('PRF-03 tapping the same player keeps playing as "Lucía"', async () => {
    const store = await playAsLucia();
    await userEvent.click(playerButton());

    await userEvent.click(screen.getByRole('button', { name: 'Lucía' }));

    expect(heading()).toHaveTextContent('¿A qué jugamos?');
    expect(playerButton()).toHaveAccessibleName('Lucía');
    expect(await store.players.lastPlayerId()).toBe(1);
  });

  it('PRF-03 NAV-02 after switching, Back on "¿Quién juega?" still asks "¿Salir del juego?"', async () => {
    await playAsLucia();
    await userEvent.click(playerButton());

    window.history.back();

    expect(await screen.findByRole('dialog', { name: '¿Salir del juego?' })).toBeVisible();
  });

  it('PRF-03 the player is switched from the home screen only: no step of a game and no round has the player button', async () => {
    await playAsLucia();

    await userEvent.click(screen.getByRole('button', { name: /^Bandera → País/ }));
    expect(screen.getByRole('region', { name: '¿Dónde jugamos?' })).toBeVisible();
    expect(screen.queryByRole('group', { name: 'Jugador' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Europa' }));
    expect(screen.getByRole('region', { name: '¿Qué nivel?' })).toBeVisible();
    expect(screen.queryByRole('group', { name: 'Jugador' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Fácil' }));

    expect(screen.getByText('1/10')).toBeVisible();
    expect(screen.queryByRole('group', { name: 'Jugador' })).not.toBeInTheDocument();
  });
});
