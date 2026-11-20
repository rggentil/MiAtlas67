import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { countries } from '../data/countries.ts';
import { relations } from '../data/relations.ts';
import { generateRound, type Level, type Question } from '../domain/questions.ts';
import { createRng } from '../domain/random.ts';
import type { Stars } from '../domain/round.ts';
import type { GameStore } from '../storage/store.ts';
import { deviceWith, renderApp } from '../test/app.tsx';

const LEVEL_NAMES = { 1: 'Fácil', 2: 'Medio', 3: 'Difícil', 4: 'Experto' } as const;

/** The first `count` rounds of a visit with ?seed=42 in "Europa" at `level`. */
function rounds(level: Level, count: number): Question[][] {
  const rng = createRng(42);
  return Array.from({ length: count }, () =>
    generateRound(countries, { topic: 'flags', region: 'europe', level }, rng, relations),
  );
}

/** A round of "Bandera → País" in "Europa" already saved on the device for Lucía (id 1). */
async function saved(store: GameStore, level: Level, score: number) {
  const stars: Stars = score === 10 ? 3 : score >= 8 ? 2 : score >= 5 ? 1 : 0;
  await store.rounds.add({
    playerId: 1,
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

/** From the home screen: "Bandera → País", "Europa", then waits for the levels. Returns the level step. */
async function openEurope() {
  await userEvent.click(screen.getByRole('button', { name: /^Bandera → País/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Europa' }));
  const step = screen.getByRole('region', { name: '¿Qué nivel?' });
  await within(step).findByRole('button', { name: 'Fácil' });
  return step;
}

async function startRound(level: Level): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: 'Lucía' }));
  const step = await openEurope();
  await userEvent.click(within(step).getByRole('button', { name: LEVEL_NAMES[level] }));
}

async function savedCount(store: GameStore, count: number): Promise<void> {
  await waitFor(async () => {
    expect(await store.rounds.listByPlayer(1)).toHaveLength(count);
  });
}

describe('App · «¡Nivel desbloqueado!» in the round summary (RND-08, LVL-04)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?seed=42');
  });
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('RND-08 LVL-04 8/10 in Fácil, with Medio locked, shows "¡Nivel desbloqueado! Medio"; "Menú" then finds Medio open', async () => {
    const store = await deviceWith();
    await renderApp(store);
    const [round = []] = rounds(1, 1);
    await startRound(1);

    await finishWith(round, 8);

    expect(await screen.findByText('¡Nivel desbloqueado! Medio')).toBeVisible();
    await savedCount(store, 1);
    await userEvent.click(screen.getByRole('button', { name: 'Menú' }));
    const step = await openEurope();
    expect(within(step).getByRole('button', { name: /^Medio/ })).toHaveAccessibleName('Medio');
    expect(within(step).getByRole('button', { name: /^Difícil/ })).toHaveAccessibleName(
      'Difícil, bloqueado',
    );
  }, 30_000);

  it('RND-08 7/10 in Fácil opens nothing and shows no "¡Nivel desbloqueado!"', async () => {
    const store = await deviceWith();
    await renderApp(store);
    const [round = []] = rounds(1, 1);
    await startRound(1);

    await finishWith(round, 7);
    await savedCount(store, 1);

    expect(screen.getByText('7/10')).toBeVisible();
    expect(screen.queryByText(/Nivel desbloqueado/)).not.toBeInTheDocument();
  }, 30_000);

  it('RND-08 with Medio already open by an earlier ★★, another ★★ round shows no "¡Nivel desbloqueado!"', async () => {
    const store = await deviceWith();
    await saved(store, 1, 8);
    await renderApp(store);
    const [round = []] = rounds(1, 1);
    await startRound(1);

    await finishWith(round, 8);
    await savedCount(store, 2);

    expect(screen.getByText('8/10')).toBeVisible();
    expect(screen.queryByText(/Nivel desbloqueado/)).not.toBeInTheDocument();
  }, 30_000);

  it('RND-08 D26 with Medio open because it was played, a ★★ round in Fácil shows no "¡Nivel desbloqueado!"', async () => {
    const store = await deviceWith();
    await saved(store, 2, 3);
    await renderApp(store);
    const [round = []] = rounds(1, 1);
    await startRound(1);

    await finishWith(round, 8);
    await savedCount(store, 2);

    expect(screen.getByText('8/10')).toBeVisible();
    expect(screen.queryByText(/Nivel desbloqueado/)).not.toBeInTheDocument();
  }, 30_000);

  it('RND-08 Difícil is the last level: ★★★ there opens nothing', async () => {
    const store = await deviceWith();
    await saved(store, 3, 2);
    await renderApp(store);
    const [round = []] = rounds(3, 1);
    await startRound(3);

    await finishWith(round, 10);
    await savedCount(store, 2);

    expect(await screen.findByText('¡Nuevo récord!')).toBeVisible();
    expect(screen.queryByText(/Nivel desbloqueado/)).not.toBeInTheDocument();
  }, 30_000);

  it('RND-08 a new record and a level unlocked show together: 9/10 after a best of 6/10', async () => {
    const store = await deviceWith();
    await saved(store, 1, 6);
    await renderApp(store);
    const [round = []] = rounds(1, 1);
    await startRound(1);

    await finishWith(round, 9);

    expect(await screen.findByText('¡Nivel desbloqueado! Medio')).toBeVisible();
    expect(screen.getByText('¡Nuevo récord!')).toBeVisible();
    await savedCount(store, 2);
  }, 30_000);

  it('HIS-01 RND-08 when the earlier rounds cannot be read, the round is saved without "¡Nivel desbloqueado!"', async () => {
    const store = await deviceWith();
    await saved(store, 1, 9);
    await renderApp(store);
    const [round = []] = rounds(1, 1);
    await startRound(1);
    const read = store.rounds.listByPlayer.bind(store.rounds);
    store.rounds.listByPlayer = () => Promise.reject(new Error('Storage is blocked'));

    await finishWith(round, 8);

    await waitFor(async () => {
      expect(await read(1)).toHaveLength(2);
    });
    expect(screen.getByText('8/10')).toBeVisible();
    expect(screen.queryByText(/Nivel desbloqueado/)).not.toBeInTheDocument();
  }, 30_000);
});
