import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { countries } from '../data/countries.ts';
import { relations } from '../data/relations.ts';
import { generateRound } from '../domain/questions.ts';
import { createRng } from '../domain/random.ts';
import type { PlayerData } from '../storage/store.ts';
import { deviceWith, LUCIA, renderApp } from '../test/app.tsx';

const PABLO: PlayerData = { nickname: 'Pablo', avatar: 'owl' };

/** The cell "Europa · Fácil" of the "Bandera → País" records. */
async function europeEasy() {
  const table = await screen.findByRole('table', { name: 'Bandera → País' });
  const row = within(table).getByRole('rowheader', { name: 'Europa' }).closest('tr');
  if (!row) throw new Error('No row Europa');
  return within(row).getAllByRole('cell')[0];
}

describe('App · family records (HIS-05)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/?seed=42');
  });
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('HIS-05 the records show every player: Lucía sees the 9/10 of Pablo', async () => {
    const store = await deviceWith({ players: [LUCIA, PABLO] });
    await store.rounds.add({
      playerId: 2,
      playedAt: 1_000,
      game: 'FLAG-A',
      region: 'europe',
      level: 1,
      score: 9,
      total: 10,
      stars: 2,
      missed: [],
    });
    await renderApp(store);
    await userEvent.click(screen.getByRole('button', { name: 'Lucía' }));

    await userEvent.click(screen.getByRole('button', { name: 'Récords' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Récords de la familia' })).toBeVisible();
    expect(await europeEasy()).toHaveTextContent('9 de 10,Pablo');
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByRole('heading', { level: 1, name: '¿A qué jugamos?' })).toBeVisible();
  });

  it('HIS-05 a round just played is in the records: 8/10 of Lucía in "Europa · Fácil"', async () => {
    const store = await deviceWith();
    await renderApp(store);
    const questions = generateRound(
      countries,
      { topic: 'flags', region: 'europe', level: 1 },
      createRng(42),
      relations,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Lucía' }));
    await userEvent.click(screen.getByRole('button', { name: /^Bandera → País/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Europa' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Fácil' }));
    for (const [index, question] of questions.entries()) {
      const wrong = question.options.find((option) => option.code !== question.entity.code);
      const chosen = index < 2 ? wrong : question.entity;
      await userEvent.click(screen.getByRole('button', { name: chosen?.name.es ?? '' }));
      await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    }
    await userEvent.click(screen.getByRole('button', { name: 'Menú' }));

    await userEvent.click(screen.getByRole('button', { name: 'Récords' }));

    expect(await europeEasy()).toHaveTextContent('8 de 10,Lucía');
  }, 30_000);
});
