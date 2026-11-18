import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { countries } from '../data/countries.ts';
import { relations } from '../data/relations.ts';
import type { GameId } from '../domain/games.ts';
import { generateRound, type Level, type RegionChoice } from '../domain/questions.ts';
import { createRng } from '../domain/random.ts';
import type { Stars } from '../domain/round.ts';
import type { GameStore, PlayerData } from '../storage/store.ts';
import { deviceWith, LUCIA, renderApp } from '../test/app.tsx';

const PABLO: PlayerData = { nickname: 'Pablo', avatar: 'owl' };

async function save(
  store: GameStore,
  playerId: number,
  game: GameId,
  region: RegionChoice,
  level: Level,
  stars: Stars,
): Promise<void> {
  const score = [3, 5, 8, 10][stars] ?? 0;
  await store.rounds.add({
    playerId,
    playedAt: Date.now(),
    game,
    region,
    level,
    score,
    total: 10,
    stars,
    missed: [],
  });
}

/** Plays as `nickname` and opens "Progreso" from the home screen. */
async function openProgress(nickname: string): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: nickname }));
  await userEvent.click(screen.getByRole('button', { name: 'Progreso' }));
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Progreso');
}

/** The cell of a region and a level in the table of a game. */
async function cell(game: string, region: string, level: 'Fácil' | 'Medio' | 'Difícil') {
  const table = await screen.findByRole('table', { name: game });
  const row = within(table)
    .getAllByRole('row')
    .find((candidate) => within(candidate).queryByRole('rowheader', { name: region }));
  const column = ['Fácil', 'Medio', 'Difícil'].indexOf(level);
  const found = row ? within(row).getAllByRole('cell')[column] : undefined;
  if (!found) throw new Error(`No cell for ${region} and ${level}`);
  return found;
}

describe('App · progress: stars per game, region and level (HIS-03, SCR-03, GAME-02)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?seed=42');
  });
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('HIS-03 SCR-03 1 star and later 3 stars in "Europa · Fácil": "Bandera → País" shows 3 stars there', async () => {
    const store = await deviceWith();
    await save(store, 1, 'FLAG-A', 'europe', 1, 1);
    await save(store, 1, 'FLAG-A', 'europe', 1, 3);
    await renderApp(store);

    await openProgress('Lucía');

    expect(await cell('Bandera → País', 'Europa', 'Fácil')).toHaveTextContent('3 de 3 estrellas');
  });

  it('HIS-03 a game, region and level never played shows "Sin jugar"', async () => {
    const store = await deviceWith();
    await save(store, 1, 'FLAG-A', 'europe', 1, 3);
    await renderApp(store);

    await openProgress('Lucía');

    expect(await cell('Bandera → País', 'Asia', 'Medio')).toHaveTextContent('Sin jugar');
  });

  it('HIS-03 3 + 2 stars in "Bandera → País" and 1 in "País → Bandera" make 6 stars in total', async () => {
    const store = await deviceWith();
    await save(store, 1, 'FLAG-A', 'europe', 1, 3);
    await save(store, 1, 'FLAG-A', 'africa', 1, 2);
    await save(store, 1, 'FLAG-B', 'europe', 1, 1);
    await renderApp(store);

    await openProgress('Lucía');

    expect(await screen.findByText('6 estrellas en total')).toBeVisible();
  });

  it("HIS-03 each player sees their own progress: Pablo's 3 stars are not Lucía's", async () => {
    const store = await deviceWith({ players: [LUCIA, PABLO] });
    const pablo = (await store.players.list()).find((player) => player.nickname === 'Pablo');
    if (!pablo) throw new Error('Pablo is not on the device');
    await save(store, pablo.id, 'FLAG-A', 'europe', 1, 3);
    await renderApp(store);

    await openProgress('Lucía');

    expect(await cell('Bandera → País', 'Europa', 'Fácil')).toHaveTextContent('Sin jugar');
    expect(screen.getByText('0 estrellas en total')).toBeVisible();

    // And Pablo does see his 3 stars: the rounds above are really his.
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    await userEvent.click(
      within(screen.getByRole('group', { name: 'Jugador' })).getByRole('button'),
    );
    await openProgress('Pablo');
    expect(await cell('Bandera → País', 'Europa', 'Fácil')).toHaveTextContent('3 de 3 estrellas');
  });

  it('HIS-03 SCR-03 a perfect round just played shows 3 stars in "Europa · Fácil"', async () => {
    const round = generateRound(
      countries,
      { topic: 'flags', region: 'europe', level: 1 },
      createRng(42),
      relations,
    );
    await renderApp(await deviceWith());
    await userEvent.click(screen.getByRole('button', { name: 'Lucía' }));
    await userEvent.click(screen.getByRole('button', { name: /^Bandera → País/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Europa' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fácil' }));
    for (const question of round) {
      await userEvent.click(screen.getByRole('button', { name: question.entity.name.es }));
      await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    }
    await userEvent.click(screen.getByRole('button', { name: 'Menú' }));

    await userEvent.click(screen.getByRole('button', { name: 'Progreso' }));

    expect(await cell('Bandera → País', 'Europa', 'Fácil')).toHaveTextContent('3 de 3 estrellas');
    expect(screen.getByText('3 estrellas en total')).toBeVisible();
  }, 30_000);

  it('NAV-01 "Volver" and the back button go from "Progreso" to the home screen', async () => {
    await renderApp(await deviceWith());
    await openProgress('Lucía');
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('¿A qué jugamos?');

    await userEvent.click(screen.getByRole('button', { name: 'Progreso' }));
    window.history.back();

    expect(await screen.findByRole('heading', { level: 1, name: '¿A qué jugamos?' })).toBeVisible();
  });
});
