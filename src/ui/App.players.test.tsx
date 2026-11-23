import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PlayerData } from '../storage/store.ts';
import { deviceWith, LUCIA, renderApp } from '../test/app.tsx';

const PABLO: PlayerData = { nickname: 'Pablo', avatar: 'owl' };

const heading = () => screen.getByRole('heading', { level: 1 });

/** The browser's Back, as the phone's back button does it: the popstate event comes a moment later. */
function pressBack(): void {
  window.history.back();
}

/** The player shown on the home screen: avatar and nickname. */
function currentPlayer(): HTMLElement {
  return screen.getByRole('group', { name: 'Jugador' });
}

async function createPlayer(nickname: string, avatar: string): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: 'Nuevo jugador' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Nombre' }), nickname);
  await userEvent.click(screen.getByRole('radio', { name: avatar }));
  await userEvent.click(screen.getByRole('button', { name: 'Crear' }));
}

describe('App · who plays (PRF-01, PRF-02, PRF-05)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?seed=42');
  });
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('PRF-01 the first time on a device, the game opens on "¿Quién juega?" with only "Nuevo jugador"', async () => {
    await renderApp(await deviceWith({ players: [] }));

    expect(heading()).toHaveTextContent('¿Quién juega?');
    // The footer holds the settings and "Acerca de" (D33).
    const main = within(screen.getByRole('main'));
    expect(main.getAllByRole('button').map((button) => button.textContent)).toEqual([
      '+Nuevo jugador',
    ]);
  });

  it('PRF-02 creating "Lucía" with "Zorro" goes home, which shows her, and she is there the next time', async () => {
    const store = await renderApp(await deviceWith({ players: [] }));

    await createPlayer('Lucía', 'Zorro');

    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿A qué jugamos?');
    });
    expect(currentPlayer()).toHaveTextContent('Lucía');
    expect(within(currentPlayer()).getByRole('img', { name: 'Zorro' })).toBeVisible();
    expect(await store.players.list()).toEqual([{ id: 1, nickname: 'Lucía', avatar: 'fox' }]);

    // The next time the game opens, on the same device.
    cleanup();
    await renderApp(store);
    expect(heading()).toHaveTextContent('¿Quién juega?');
    expect(screen.getByRole('button', { name: 'Lucía' })).toHaveAccessibleDescription(
      'Jugó la última vez',
    );
  });

  it.each([
    ['', 'Escribe un nombre'],
    ['Superlucianita', 'Como mucho 12 letras'],
    ['lucia', 'Ya hay un jugador que se llama así'],
  ])('PRF-02 the nickname "%s" says "%s" and no player is created', async (nickname, message) => {
    const store = await renderApp();
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo jugador' }));

    if (nickname !== '') await userEvent.type(screen.getByRole('textbox'), nickname);
    await userEvent.click(screen.getByRole('button', { name: 'Crear' }));

    expect(screen.getByText(message)).toBeVisible();
    expect(heading()).toHaveTextContent('Nuevo jugador');
    expect(await store.players.list()).toEqual([{ id: 1, ...LUCIA }]);
  });

  it('PRF-02 NAV-01 "Volver" goes back to "¿Quién juega?" and no player is created', async () => {
    const store = await renderApp();
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo jugador' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Pablo');

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(heading()).toHaveTextContent('¿Quién juega?');
    expect(heading()).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Pablo' })).not.toBeInTheDocument();
    expect(await store.players.list()).toHaveLength(1);
  });

  it('PRF-02 NAV-01 the phone\'s back button goes back to "¿Quién juega?" and no player is created', async () => {
    const store = await renderApp();
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo jugador' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Pablo');

    pressBack();

    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿Quién juega?');
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await store.players.list()).toHaveLength(1);
  });

  it('PRF-01 tapping "Pablo" goes home, which shows him, and he is now the last player', async () => {
    const store = await renderApp(await deviceWith({ players: [LUCIA, PABLO] }));

    await userEvent.click(screen.getByRole('button', { name: 'Pablo' }));

    expect(heading()).toHaveTextContent('¿A qué jugamos?');
    expect(currentPlayer()).toHaveTextContent('Pablo');
    expect(within(currentPlayer()).getByRole('img', { name: 'Búho' })).toBeVisible();
    await waitFor(async () => {
      expect(await store.players.lastPlayerId()).toBe(2);
    });
  });

  it('PRF-01 the player who played last on this device is marked when the game opens', async () => {
    await renderApp(await deviceWith({ players: [LUCIA, PABLO], lastPlayer: 'Pablo' }));

    expect(screen.getByRole('button', { name: 'Pablo' })).toHaveAccessibleDescription(
      'Jugó la última vez',
    );
    expect(screen.getByRole('button', { name: 'Lucía' })).not.toHaveAccessibleDescription();
  });

  it('PRF-05 with 8 players there is no "Nuevo jugador", and a note says that up to 8 fit', async () => {
    const players = Array.from({ length: 8 }, (_, index) => ({
      nickname: `Jugador ${String(index + 1)}`,
      avatar: 'fox',
    }));
    await renderApp(await deviceWith({ players }));

    expect(screen.getAllByRole('button', { name: /^Jugador \d$/ })).toHaveLength(8);
    expect(screen.queryByRole('button', { name: 'Nuevo jugador' })).not.toBeInTheDocument();
    expect(screen.getByText('En este dispositivo caben 8 jugadores como mucho.')).toBeVisible();
  });

  it('PRF-02 a double tap on "Crear" while the player is being saved creates only one', async () => {
    const store = await deviceWith({ players: [] });
    const save = store.players.create.bind(store.players);
    let finishSaving: () => void = () => undefined;
    store.players.create = (data) =>
      new Promise((resolve) => {
        finishSaving = () => {
          resolve(save(data));
        };
      });
    await renderApp(store);
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo jugador' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Pablo');

    await userEvent.dblClick(screen.getByRole('button', { name: 'Crear' }));
    finishSaving();

    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿A qué jugamos?');
    });
    expect(await store.players.list()).toEqual([{ id: 1, nickname: 'Pablo', avatar: 'fox' }]);
  });

  it('PRF-02 a second player is added after the first one, and goes home as who plays', async () => {
    const store = await renderApp();

    await createPlayer('Pablo', 'Zorro');

    await waitFor(() => {
      expect(currentPlayer()).toHaveTextContent('Pablo');
    });
    expect(await store.players.list()).toEqual([
      { id: 1, ...LUCIA },
      { id: 2, nickname: 'Pablo', avatar: 'fox' },
    ]);
    expect(await store.players.lastPlayerId()).toBe(2);
  });
});
