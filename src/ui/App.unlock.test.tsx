import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Level } from '../domain/questions.ts';
import type { Stars } from '../domain/round.ts';
import type { GameStore, PlayerData } from '../storage/store.ts';
import { deviceWith, LUCIA, renderApp } from '../test/app.tsx';

const PABLO: PlayerData = { nickname: 'Pablo', avatar: 'owl' };

/** A round of "Bandera → País" in "Europa" already saved on the device for `playerId`. */
async function saved(store: GameStore, playerId: number, level: Level, stars: Stars) {
  await store.rounds.add({
    playerId,
    playedAt: 1_000,
    game: 'FLAG-A',
    region: 'europe',
    level,
    score: [3, 5, 8, 10][stars] ?? 0,
    total: 10,
    stars,
    missed: [],
  });
}

/** Chooses `nickname` on «¿Quién juega?», then "Bandera → País" and "Europa"; returns the level step. */
async function levelsOf(nickname: string) {
  await userEvent.click(screen.getByRole('button', { name: nickname }));
  await userEvent.click(screen.getByRole('button', { name: /^Bandera → País/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Europa' }));
  const step = screen.getByRole('region', { name: '¿Qué nivel?' });
  await within(step).findByRole('button', { name: 'Fácil' });
  return step;
}

describe('App · level locks (LVL-04)', () => {
  it('LVL-04 the player who plays unlocks for herself: Lucía has Medio open, Pablo does not', async () => {
    const store = await deviceWith({ players: [LUCIA, PABLO] });
    await saved(store, 1, 1, 3);
    await renderApp(store);

    const lucia = await levelsOf('Lucía');
    expect(within(lucia).getByRole('button', { name: /^Medio/ })).toHaveAccessibleName('Medio');

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    await userEvent.click(screen.getByRole('button', { name: /Lucía/ }));
    const pablo = await levelsOf('Pablo');
    expect(within(pablo).getByRole('button', { name: /^Medio/ })).toHaveAccessibleName(
      'Medio, bloqueado',
    );
  });

  it('LVL-04 a round that reaches ★★ opens the next level as soon as the player is back on the level step', async () => {
    const store = await deviceWith();
    await renderApp(store);
    const before = await levelsOf('Lucía');
    expect(within(before).getByRole('button', { name: /^Medio/ })).toHaveAccessibleName(
      'Medio, bloqueado',
    );

    await saved(store, 1, 1, 2);
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    await userEvent.click(screen.getByRole('button', { name: /^Bandera → País/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Europa' }));

    const after = screen.getByRole('region', { name: '¿Qué nivel?' });
    expect(await within(after).findByRole('button', { name: 'Medio' })).toBeVisible();
  });
});
