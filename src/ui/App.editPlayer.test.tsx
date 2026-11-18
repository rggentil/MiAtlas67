import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { GameStore, PlayerData, RoundData } from '../storage/store.ts';
import { deviceWith, LUCIA, renderApp } from '../test/app.tsx';

const PABLO: PlayerData = { nickname: 'Pablo', avatar: 'owl' };
const LUCIA_ID = 1;

const heading = () => screen.getByRole('heading', { level: 1 });

/** A finished round of `playerId`, as the game saves it (HIS-01). */
function round(playerId: number, playedAt: number): RoundData {
  return {
    playerId,
    playedAt,
    game: 'FLAG-A',
    region: 'europe',
    level: 1,
    score: 8,
    total: 10,
    stars: 2,
    missed: ['PT', 'BE'],
  };
}

/** A device with Lucía, who has `rounds` saved rounds, and Pablo, who has one. */
async function deviceWithRounds(rounds: number): Promise<GameStore> {
  const store = await deviceWith({ players: [LUCIA, PABLO] });
  for (let index = 0; index < rounds; index++) await store.rounds.add(round(LUCIA_ID, index + 1));
  await store.rounds.add(round(2, 100));
  return store;
}

async function editLucia(): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: 'Editar a Lucía' }));
  expect(heading()).toHaveTextContent('Editar jugador');
}

/** The avatar picture of a player's button on "¿Quién juega?" (decorative there: the nickname names it). */
function avatarFileOf(nickname: string): string | null {
  const button = screen.getByRole('button', { name: nickname });
  return button.querySelector('img')?.getAttribute('src') ?? null;
}

describe('App · edit and delete a player (PRF-04, NFR-04)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?seed=42');
  });
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('PRF-04 Lucía, with 2 rounds, becomes "Lu" with "Panda": «¿Quién juega?» shows her so, and she keeps her rounds', async () => {
    const store = await renderApp(await deviceWithRounds(2));
    await editLucia();

    await userEvent.clear(screen.getByRole('textbox', { name: 'Nombre' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Lu');
    await userEvent.click(screen.getByRole('radio', { name: 'Panda' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿Quién juega?');
    });
    expect(screen.getByRole('button', { name: 'Lu' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Lucía' })).not.toBeInTheDocument();
    expect(avatarFileOf('Lu')).toMatch(/\/panda\.svg(\?no-inline)?$/);
    expect(await store.players.list()).toEqual([
      { id: LUCIA_ID, nickname: 'Lu', avatar: 'panda' },
      { id: 2, ...PABLO },
    ]);
    expect(await store.rounds.listByPlayer(LUCIA_ID)).toHaveLength(2);

    // And she plays as "Lu" with the panda.
    await userEvent.click(screen.getByRole('button', { name: 'Lu' }));
    const player = screen.getByRole('group', { name: 'Jugador' });
    expect(player).toHaveTextContent('Lu');
    expect(within(player).getByRole('img', { name: 'Panda' })).toBeVisible();
  });

  it('PRF-04 the new nickname must be valid: "pablo" is taken, and Lucía keeps "Lucía"', async () => {
    const store = await renderApp(await deviceWithRounds(0));
    await editLucia();

    await userEvent.clear(screen.getByRole('textbox', { name: 'Nombre' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Nombre' }), 'pablo');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByText('Ya hay un jugador que se llama así')).toBeVisible();
    expect(heading()).toHaveTextContent('Editar jugador');
    expect((await store.players.list())[0]).toEqual({ id: LUCIA_ID, ...LUCIA });

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByRole('button', { name: 'Lucía' })).toBeVisible();
  });

  it('PRF-04 NFR-04 "Sí, borrar" deletes Lucía and her 3 rounds; Pablo and his round stay', async () => {
    const store = await renderApp(await deviceWithRounds(3));
    expect(await store.rounds.listByPlayer(LUCIA_ID)).toHaveLength(3);
    await editLucia();

    await userEvent.click(screen.getByRole('button', { name: 'Borrar jugador' }));
    expect(screen.getByRole('dialog', { name: '¿Borrar a Lucía?' })).toHaveAccessibleDescription(
      'También se borra el historial de Lucía.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sí, borrar' }));

    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿Quién juega?');
    });
    expect(screen.queryByRole('button', { name: 'Lucía' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pablo' })).toBeVisible();
    expect(await store.players.list()).toEqual([{ id: 2, ...PABLO }]);
    expect(await store.rounds.listByPlayer(LUCIA_ID)).toEqual([]);
    expect(await store.rounds.listByPlayer(2)).toHaveLength(1);
  });

  it('PRF-04 "No, volver" keeps Lucía and her rounds', async () => {
    const store = await renderApp(await deviceWithRounds(3));
    await editLucia();
    await userEvent.click(screen.getByRole('button', { name: 'Borrar jugador' }));

    await userEvent.click(screen.getByRole('button', { name: 'No, volver' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(heading()).toHaveTextContent('Editar jugador');
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByRole('button', { name: 'Lucía' })).toBeVisible();
    expect(await store.players.list()).toHaveLength(2);
    expect(await store.rounds.listByPlayer(LUCIA_ID)).toHaveLength(3);
  });

  it('PRF-04 NAV-01 the phone\'s back button closes "¿Borrar a Lucía?" without deleting; Back again goes to «¿Quién juega?»', async () => {
    const store = await renderApp(await deviceWithRounds(3));
    await editLucia();
    await userEvent.click(screen.getByRole('button', { name: 'Borrar jugador' }));

    window.history.back();

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(heading()).toHaveTextContent('Editar jugador');
    expect(await store.rounds.listByPlayer(LUCIA_ID)).toHaveLength(3);

    window.history.back();
    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿Quién juega?');
    });
    expect(screen.getByRole('button', { name: 'Lucía' })).toBeVisible();
    expect(await store.players.list()).toHaveLength(2);
  });

  it('PRF-04 deleting the player who played last leaves nobody marked; deleting who plays now needs a new choice', async () => {
    const store = await renderApp(await deviceWithRounds(1));
    await userEvent.click(screen.getByRole('button', { name: 'Lucía' }));
    await userEvent.click(
      within(screen.getByRole('group', { name: 'Jugador' })).getByRole('button'),
    );
    await editLucia();

    await userEvent.click(screen.getByRole('button', { name: 'Borrar jugador' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, borrar' }));

    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿Quién juega?');
    });
    expect(screen.queryByText('Jugó la última vez')).not.toBeInTheDocument();
    expect(await store.players.lastPlayerId()).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Pablo' }));
    expect(screen.getByRole('group', { name: 'Jugador' })).toHaveTextContent('Pablo');
  });
});
