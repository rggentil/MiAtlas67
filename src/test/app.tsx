import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';
import { createMemoryStore } from '../storage/memoryStore.ts';
import type { GameStore, PlayerData } from '../storage/store.ts';
import { App } from '../ui/App.tsx';

/** The player most tests play with. */
export const LUCIA: PlayerData = { nickname: 'Lucía', avatar: 'fox' };

interface Device {
  /** The players on the device, created in this order (ids 1, 2…). */
  players?: readonly PlayerData[];
  /** The nickname of who played last on the device. */
  lastPlayer?: string;
}

/** A fresh in-memory device with those players, as the game would find it on the phone. */
export async function deviceWith({
  players = [LUCIA],
  lastPlayer,
}: Device = {}): Promise<GameStore> {
  const store = createMemoryStore();
  for (const data of players) {
    const player = await store.players.create(data);
    if (player.nickname === lastPlayer) await store.players.setLastPlayerId(player.id);
  }
  return store;
}

/**
 * Renders the whole game on `store` (by default a device with "Lucía"). It opens on "¿Quién juega?" and
 * returns once the players are on screen.
 */
export async function renderApp(store?: GameStore): Promise<GameStore> {
  const device = store ?? (await deviceWith());
  render(<App store={device} />);
  // Before the players are read, "¿Quién juega?" has no button in its main area (the footer has its own).
  await waitFor(() => {
    expect(within(screen.getByRole('main')).queryAllByRole('button')).not.toHaveLength(0);
  });
  return device;
}

/** Renders the game and chooses "Lucía": tests of the game screens start on the home screen. */
export async function renderAppAsLucia(): Promise<GameStore> {
  const store = await renderApp();
  await userEvent.click(screen.getByRole('button', { name: LUCIA.nickname }));
  return store;
}
