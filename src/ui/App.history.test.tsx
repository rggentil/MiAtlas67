import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { countries } from '../data/countries.ts';
import { relations } from '../data/relations.ts';
import { generateRound, type Question, type RoundSettings } from '../domain/questions.ts';
import { createRng } from '../domain/random.ts';
import { formatPlayedAt } from '../i18n/format.ts';
import type { GameStore, PlayerData, RoundData } from '../storage/store.ts';
import { deviceWith, LUCIA, renderApp, renderAppAsLucia } from '../test/app.tsx';

const SETTINGS: RoundSettings = { topic: 'flags', region: 'europe', level: 1 };
const PABLO: PlayerData = { nickname: 'Pablo', avatar: 'owl' };

/** The first two rounds of a visit with ?seed=42 in "Europa · Fácil". */
function firstTwoRounds(): [Question[], Question[]] {
  const rng = createRng(42);
  return [
    generateRound(countries, SETTINGS, rng, relations),
    generateRound(countries, SETTINGS, rng, relations),
  ];
}

const heading = () => screen.getByRole('heading', { level: 1 });

function wrongOption(question: Question) {
  const wrong = question.options.find((option) => option.code !== question.entity.code);
  if (!wrong) throw new Error('A question always has wrong options');
  return wrong;
}

/** Opens a Flags game in "Europa · Fácil" from the home screen. */
async function startRound(game: 'Bandera → País' | 'País → Bandera'): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: (name) => name.startsWith(game) }));
  await userEvent.click(screen.getByRole('button', { name: 'Europa' }));
  await userEvent.click(screen.getByRole('button', { name: 'Fácil' }));
}

/**
 * Answers the 10 questions, the ones at `wrongAt` wrongly. In "Bandera → País" the answers are country
 * names; in "País → Bandera" they are flag cards, "Opción 1" to "Opción 4".
 */
async function play(
  game: 'FLAG-A' | 'FLAG-B',
  questions: readonly Question[],
  wrongAt: readonly number[] = [],
): Promise<void> {
  for (const [index, question] of questions.entries()) {
    const chosen = wrongAt.includes(index) ? wrongOption(question) : question.entity;
    const name =
      game === 'FLAG-A' ? chosen.name.es : `Opción ${String(question.options.indexOf(chosen) + 1)}`;
    await userEvent.click(screen.getByRole('button', { name }));
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
  }
}

async function openHistory(): Promise<HTMLElement[]> {
  await userEvent.click(screen.getByRole('button', { name: 'Historial' }));
  expect(heading()).toHaveTextContent('Historial');
  const list = await screen.findByRole('list', { name: 'Partidas' });
  return within(list).getAllByRole('listitem');
}

function savedRound(playerId: number, game: 'FLAG-A' | 'FLAG-B', playedAt: number): RoundData {
  return {
    playerId,
    playedAt,
    game,
    region: 'europe',
    level: 1,
    score: 6,
    total: 10,
    stars: 1,
    missed: [],
  };
}

async function roundsOf(store: GameStore, playerId: number) {
  return store.rounds.listByPlayer(playerId);
}

describe('App · history of the rounds played (HIS-01, HIS-02, RND-07)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?seed=42');
  });
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('HIS-01 HIS-02 a round of "Bandera → País" in "Europa · Fácil" with 8 correct answers is the first entry of "Historial"', async () => {
    const [round] = firstTwoRounds();
    const store = await renderAppAsLucia();
    const before = Date.now();
    await startRound('Bandera → País');

    await play('FLAG-A', round, [2, 5]);
    await userEvent.click(screen.getByRole('button', { name: 'Menú' }));
    const [first] = await openHistory();

    const [saved] = await roundsOf(store, 1);
    expect(saved?.playedAt).toBeGreaterThanOrEqual(before);
    expect(saved?.playedAt).toBeLessThanOrEqual(Date.now());
    const entry = within(first ?? document.body);
    expect(entry.getByText(formatPlayedAt(saved?.playedAt ?? 0, 'es'))).toBeVisible();
    expect(entry.getByText('Bandera → País')).toBeVisible();
    expect(entry.getByText('Europa · Fácil')).toBeVisible();
    expect(entry.getByText('8/10')).toBeVisible();
    expect(entry.getByRole('img', { name: '2 de 3 estrellas' })).toBeVisible();
  }, 30_000);

  it('HIS-01 the saved round keeps the 2 entities that were missed, in the order they were asked', async () => {
    const [round] = firstTwoRounds();
    const store = await renderAppAsLucia();
    await startRound('Bandera → País');

    await play('FLAG-A', round, [2, 5]);

    await waitFor(async () => {
      expect(await roundsOf(store, 1)).toHaveLength(1);
    });
    const [saved] = await roundsOf(store, 1);
    expect(saved).toMatchObject({
      playerId: 1,
      game: 'FLAG-A',
      region: 'europe',
      level: 1,
      score: 8,
      total: 10,
      stars: 2,
      missed: [round[2]?.entity.code, round[5]?.entity.code],
    });
  }, 30_000);

  it('HIS-02 after a round of "Bandera → País" and then one of "País → Bandera", "País → Bandera" is listed first', async () => {
    const [first, second] = firstTwoRounds();
    await renderAppAsLucia();
    await startRound('Bandera → País');
    await play('FLAG-A', first);
    await userEvent.click(screen.getByRole('button', { name: 'Menú' }));
    await startRound('País → Bandera');
    await play('FLAG-B', second, [0]);
    await userEvent.click(screen.getByRole('button', { name: 'Menú' }));

    const entries = await openHistory();

    expect(entries.map((entry) => within(entry).getByText(/→/).textContent)).toEqual([
      'País → Bandera',
      'Bandera → País',
    ]);
    expect(entries[0]).toHaveTextContent('9/10');
    expect(entries[1]).toHaveTextContent('10/10');
  }, 60_000);

  it('HIS-02 each player sees only their own history', async () => {
    const store = await deviceWith({ players: [LUCIA, PABLO] });
    await store.rounds.add(savedRound(1, 'FLAG-B', 1_000));
    await store.rounds.add(savedRound(2, 'FLAG-A', 2_000));
    await renderApp(store);
    await userEvent.click(screen.getByRole('button', { name: 'Pablo' }));

    const entries = await openHistory();

    expect(entries).toHaveLength(1);
    expect(entries[0]).toHaveTextContent('Bandera → País');
    expect(entries[0]).not.toHaveTextContent('País → Bandera');
  });

  it('RND-07 a quit round is not saved: "Historial" says there are no rounds yet', async () => {
    const [round] = firstTwoRounds();
    const store = await renderAppAsLucia();
    await startRound('Bandera → País');
    await userEvent.click(screen.getByRole('button', { name: round[0]?.entity.name.es ?? '' }));

    await userEvent.click(screen.getByRole('button', { name: 'Salir de la partida' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, salir' }));
    await userEvent.click(screen.getByRole('button', { name: 'Historial' }));

    expect(await screen.findByText('Todavía no hay partidas.')).toBeVisible();
    expect(await roundsOf(store, 1)).toEqual([]);
  });

  it('HIS-01 the history survives closing the game: the round is there after opening it again', async () => {
    const [round] = firstTwoRounds();
    const store = await renderAppAsLucia();
    await startRound('Bandera → País');
    await play('FLAG-A', round);
    await waitFor(async () => {
      expect(await roundsOf(store, 1)).toHaveLength(1);
    });

    cleanup();
    await renderApp(store);
    await userEvent.click(screen.getByRole('button', { name: 'Lucía' }));
    const entries = await openHistory();

    expect(entries).toHaveLength(1);
    expect(entries[0]).toHaveTextContent('10/10');
  }, 30_000);

  it('HIS-02 "Historial" waits for a round that is still being saved, so it is always listed', async () => {
    const [round] = firstTwoRounds();
    const store = await deviceWith();
    const save = store.rounds.add.bind(store.rounds);
    let finishSaving: () => void = () => undefined;
    store.rounds.add = (data) =>
      new Promise((resolve) => {
        finishSaving = () => {
          resolve(save(data));
        };
      });
    await renderApp(store);
    await userEvent.click(screen.getByRole('button', { name: 'Lucía' }));
    await startRound('Bandera → País');
    await play('FLAG-A', round);
    await userEvent.click(screen.getByRole('button', { name: 'Menú' }));

    await userEvent.click(screen.getByRole('button', { name: 'Historial' }));
    expect(screen.queryByText('Todavía no hay partidas.')).not.toBeInTheDocument();
    finishSaving();

    const list = await screen.findByRole('list', { name: 'Partidas' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
  }, 30_000);

  it('HIS-01 when a round cannot be saved, the summary still shows and the game goes on', async () => {
    const [round] = firstTwoRounds();
    const store = await deviceWith();
    store.rounds.add = () => Promise.reject(new Error('Storage is full'));
    await renderApp(store);
    await userEvent.click(screen.getByRole('button', { name: 'Lucía' }));
    await startRound('Bandera → País');

    await play('FLAG-A', round);

    expect(heading()).toHaveTextContent('¡Perfecto!');
    await userEvent.click(screen.getByRole('button', { name: 'Menú' }));
    await userEvent.click(screen.getByRole('button', { name: 'Historial' }));
    expect(await screen.findByText('Todavía no hay partidas.')).toBeVisible();
  }, 30_000);

  it('NAV-01 "Volver" and the back button go from "Historial" to the home screen', async () => {
    await renderAppAsLucia();
    await userEvent.click(screen.getByRole('button', { name: 'Historial' }));
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(heading()).toHaveTextContent('¿A qué jugamos?');

    await userEvent.click(screen.getByRole('button', { name: 'Historial' }));
    window.history.back();

    await waitFor(() => {
      expect(heading()).toHaveTextContent('¿A qué jugamos?');
    });
  });
});
