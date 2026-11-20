import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { countries } from '../data/countries.ts';
import { relations } from '../data/relations.ts';
import { generateRound, type Level, type Question } from '../domain/questions.ts';
import { createRng } from '../domain/random.ts';
import type { Stars } from '../domain/round.ts';
import type { GameStore, PlayerData } from '../storage/store.ts';
import { deviceWith, LUCIA, renderApp } from '../test/app.tsx';

const PABLO: PlayerData = { nickname: 'Pablo', avatar: 'owl' };
const LEVEL_NAMES = { 1: 'Fácil', 2: 'Medio', 3: 'Difícil' } as const;

/** The first `count` rounds of a visit with ?seed=42 in "Europa" at `level`. */
function rounds(level: Level, count: number): Question[][] {
  const rng = createRng(42);
  return Array.from({ length: count }, () =>
    generateRound(countries, { topic: 'flags', region: 'europe', level }, rng, relations),
  );
}

/** A best result already saved on the device for `playerId` in "Bandera → País", "Europa". */
async function best(store: GameStore, playerId: number, level: Level, score: number) {
  const stars: Stars = score === 10 ? 3 : score >= 8 ? 2 : score >= 5 ? 1 : 0;
  await store.rounds.add({
    playerId,
    playedAt: 1_000,
    game: 'FLAG-A',
    region: 'europe',
    level,
    score,
    total: 10,
    stars,
    missed: [],
  });
}

/** Plays a whole "Bandera → País" round with `score` correct answers: the first ones are missed. */
async function finishWith(questions: readonly Question[], score: number): Promise<void> {
  for (const [index, question] of questions.entries()) {
    const wrong = question.options.find((option) => option.code !== question.entity.code);
    const chosen = index < questions.length - score ? wrong : question.entity;
    await userEvent.click(screen.getByRole('button', { name: chosen?.name.es ?? '' }));
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  }
}

async function startRound(nickname: string, level: Level): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: nickname }));
  await userEvent.click(screen.getByRole('button', { name: /^Bandera → País/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Europa' }));
  // The levels show once the player's rounds are read: they say which ones are open (LVL-04).
  await userEvent.click(await screen.findByRole('button', { name: LEVEL_NAMES[level] }));
}

/** The id of a player on the device, by nickname. */
async function idOf(store: GameStore, nickname: string): Promise<number> {
  const player = (await store.players.list()).find((found) => found.nickname === nickname);
  if (!player) throw new Error(`${nickname} is not on the device`);
  return player.id;
}

/** Waits until the round just played is saved: by then the summary knows whether it is a record. */
async function saved(store: GameStore, playerId: number, count: number): Promise<void> {
  await waitFor(async () => {
    expect(await store.rounds.listByPlayer(playerId)).toHaveLength(count);
  });
}

describe('App · "¡Nuevo récord!" in the round summary (RND-08, SCR-03, D23)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?seed=42');
  });
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('RND-08 SCR-03 with a best of 6/10, finishing with 8/10 shows "¡Nuevo récord!"', async () => {
    const store = await deviceWith();
    await best(store, 1, 1, 6);
    await renderApp(store);
    const [round = []] = rounds(1, 1);
    await startRound('Lucía', 1);

    await finishWith(round, 8);

    expect(screen.getByText('8/10')).toBeVisible();
    expect(await screen.findByText('¡Nuevo récord!')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('¡Nuevo récord!');
  }, 30_000);

  it.each([8, 7])(
    'RND-08 D23 with a best of 8/10, finishing with %i/10 is not a record',
    async (score) => {
      const store = await deviceWith();
      await best(store, 1, 1, 8);
      await renderApp(store);
      const [round = []] = rounds(1, 1);
      await startRound('Lucía', 1);

      await finishWith(round, score);
      await saved(store, 1, 2);

      expect(screen.getByText(`${String(score)}/10`)).toBeVisible();
      expect(screen.queryByText('¡Nuevo récord!')).not.toBeInTheDocument();
    },
    30_000,
  );

  it('RND-08 D23 the first round of a game, region and level is not a record', async () => {
    const store = await deviceWith();
    await renderApp(store);
    const [round = []] = rounds(1, 1);
    await startRound('Lucía', 1);

    await finishWith(round, 5);
    await saved(store, 1, 1);

    expect(screen.queryByText('¡Nuevo récord!')).not.toBeInTheDocument();
  }, 30_000);

  it("SCR-03 records are per player: Pablo's 10/10 does not stop Lucía's 8/10 from beating her 6/10", async () => {
    const store = await deviceWith({ players: [LUCIA, PABLO] });
    await best(store, await idOf(store, 'Pablo'), 1, 10);
    await best(store, await idOf(store, 'Lucía'), 1, 6);
    await renderApp(store);
    const [round = []] = rounds(1, 1);
    await startRound('Lucía', 1);

    await finishWith(round, 8);

    expect(await screen.findByText('¡Nuevo récord!')).toBeVisible();
  }, 30_000);

  it('GAME-02 SCR-03 records are per game, region and level: 6/10 beats the 4/10 of "Europa · Medio", whatever "Fácil" has', async () => {
    const store = await deviceWith();
    await best(store, 1, 1, 10);
    await best(store, 1, 2, 4);
    await renderApp(store);
    const [round = []] = rounds(2, 1);
    await startRound('Lucía', 2);

    await finishWith(round, 6);

    expect(await screen.findByText('¡Nuevo récord!')).toBeVisible();
  }, 30_000);

  it('RND-08 "Jugar otra vez" with a better score than the round before is a record; the first one was not', async () => {
    const store = await deviceWith();
    await renderApp(store);
    const [first = [], second = []] = rounds(1, 2);
    await startRound('Lucía', 1);
    await finishWith(first, 6);
    await saved(store, 1, 1);
    expect(screen.queryByText('¡Nuevo récord!')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Jugar otra vez' }));
    await finishWith(second, 9);

    expect(await screen.findByText('¡Nuevo récord!')).toBeVisible();
  }, 60_000);

  it('RND-08 a record of one round is not carried into the next: "Jugar otra vez" with a lower score shows none', async () => {
    const store = await deviceWith();
    await best(store, 1, 1, 6);
    await renderApp(store);
    const [first = [], second = []] = rounds(1, 2);
    await startRound('Lucía', 1);
    await finishWith(first, 8);
    expect(await screen.findByText('¡Nuevo récord!')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Jugar otra vez' }));
    await finishWith(second, 7);
    await saved(store, 1, 3);

    expect(screen.getByText('7/10')).toBeVisible();
    expect(screen.queryByText('¡Nuevo récord!')).not.toBeInTheDocument();
  }, 60_000);

  it('RND-08 a record found late belongs to its own round: it does not show on the summary of the next one', async () => {
    const store = await deviceWith();
    await best(store, 1, 1, 8);
    const read = store.rounds.listByPlayer.bind(store.rounds);
    await renderApp(store);
    const [first = [], second = []] = rounds(1, 2);
    await startRound('Lucía', 1);
    // From now on, every read of the earlier rounds waits until the test lets it go, in order.
    const held: (() => void)[] = [];
    store.rounds.listByPlayer = (playerId) =>
      new Promise((resolve) => {
        held.push(() => {
          resolve(read(playerId));
        });
      });
    await finishWith(first, 9);
    await userEvent.click(screen.getByRole('button', { name: 'Jugar otra vez' }));
    await finishWith(second, 5);
    expect(screen.getByText('5/10')).toBeVisible();

    // The first round's record is found now, while the summary of the second round is open.
    await waitFor(() => {
      expect(held).toHaveLength(1);
    });
    held.shift()?.();
    await waitFor(() => {
      expect(held).toHaveLength(1);
    });
    held.shift()?.();
    await waitFor(async () => {
      expect(await read(1)).toHaveLength(3);
    });

    expect(screen.getByText('5/10')).toBeVisible();
    expect(screen.queryByText('¡Nuevo récord!')).not.toBeInTheDocument();
  }, 60_000);

  it('HIS-01 when the earlier rounds cannot be read, the round is still saved, without a record', async () => {
    const store = await deviceWith();
    await best(store, 1, 1, 6);
    const read = store.rounds.listByPlayer.bind(store.rounds);
    store.rounds.listByPlayer = () => Promise.reject(new Error('Storage is blocked'));
    await renderApp(store);
    const [round = []] = rounds(1, 1);
    await startRound('Lucía', 1);

    await finishWith(round, 8);

    await waitFor(async () => {
      expect(await read(1)).toHaveLength(2);
    });
    expect(screen.queryByText('¡Nuevo récord!')).not.toBeInTheDocument();
  }, 30_000);

  it('RND-08 the record is announced in the status message that was there, empty, when the summary opened', async () => {
    const store = await deviceWith();
    await best(store, 1, 1, 6);
    const read = store.rounds.listByPlayer.bind(store.rounds);
    await renderApp(store);
    const [round = []] = rounds(1, 1);
    await startRound('Lucía', 1);
    // From now on, the read of the earlier rounds waits until the test lets it go.
    let finishReading: () => void = () => undefined;
    store.rounds.listByPlayer = (playerId) =>
      new Promise((resolve) => {
        finishReading = () => {
          resolve(read(playerId));
        };
      });
    await finishWith(round, 8);
    const status = screen.getByRole('status', { hidden: true });
    expect(status).toBeEmptyDOMElement();

    finishReading();

    await waitFor(() => {
      expect(status).toHaveTextContent('¡Nuevo récord!');
    });
    expect(screen.getByRole('status')).toBe(status);
  }, 30_000);
});
