import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { formatPlayedAt } from '../../i18n/format.ts';
import type { SavedRound } from '../../storage/store.ts';
import { renderWithI18n } from '../../test/render.tsx';
import { HistoryScreen } from './HistoryScreen.tsx';

const NOV_18 = new Date(2026, 10, 18, 10, 30).getTime();
const NOV_17 = new Date(2026, 10, 17, 18, 5).getTime();

/** Two rounds of Lucía, newest first as the store gives them: "País → Bandera", then "Bandera → País". */
const ROUNDS: SavedRound[] = [
  {
    id: 2,
    playerId: 1,
    playedAt: NOV_18,
    game: 'FLAG-B',
    region: 'americas',
    level: 3,
    score: 10,
    total: 10,
    stars: 3,
    missed: [],
  },
  {
    id: 1,
    playerId: 1,
    playedAt: NOV_17,
    game: 'FLAG-A',
    region: 'europe',
    level: 1,
    score: 8,
    total: 10,
    stars: 2,
    missed: ['PT', 'BE'],
  },
];

function renderHistory(rounds: readonly SavedRound[] = ROUNDS, onBack: () => void = vi.fn()) {
  renderWithI18n(<HistoryScreen loadRounds={() => Promise.resolve(rounds)} onBack={onBack} />);
}

/** The rounds listed, as their text. */
async function listed(): Promise<string[]> {
  const list = await screen.findByRole('list', { name: 'Partidas' });
  return within(list)
    .getAllByRole('listitem')
    .map((item) => item.textContent);
}

const filter = (name: string) =>
  within(screen.getByRole('group', { name: 'Juego' })).getByRole('radio', { name });

describe('HistoryScreen', () => {
  it('HIS-01 HIS-02 an entry shows the date and time, the game, "Europa · Fácil", 8/10 and 2 stars', async () => {
    renderHistory();

    const list = await screen.findByRole('list', { name: 'Partidas' });
    const entry = within(list).getAllByRole('listitem')[1] ?? document.body;
    expect(within(entry).getByText(formatPlayedAt(NOV_17, 'es'))).toBeVisible();
    expect(within(entry).getByText('Bandera → País')).toBeVisible();
    expect(within(entry).getByText('Europa · Fácil')).toBeVisible();
    expect(within(entry).getByText('8/10')).toBeVisible();
    expect(within(entry).getByRole('img', { name: '2 de 3 estrellas' })).toBeVisible();
    expect(within(entry).getByText(formatPlayedAt(NOV_17, 'es')).closest('time')).toHaveAttribute(
      'dateTime',
      new Date(NOV_17).toISOString(),
    );
  });

  it('HIS-02 lists the rounds in the order of the store: newest first', async () => {
    renderHistory();

    const entries = await listed();
    expect(entries).toHaveLength(2);
    expect(entries[0]).toContain('País → Bandera');
    expect(entries[0]).toContain('América · Difícil');
    expect(entries[0]).toContain('10/10');
    expect(entries[1]).toContain('Bandera → País');
  });

  it('HIS-02 the filter offers "Todos" and the games that can be played, "Todos" first', async () => {
    renderHistory();
    await listed();

    expect(
      within(screen.getByRole('group', { name: 'Juego' }))
        .getAllByRole('radio')
        .map((radio) => radio.closest('label')?.textContent),
    ).toEqual(['Todos', 'Bandera → País', 'País → Bandera']);
    expect(filter('Todos')).toBeChecked();
  });

  it('HIS-02 filtering by "País → Bandera" lists only its rounds, and "Todos" lists every round again', async () => {
    renderHistory();
    await listed();

    await userEvent.click(filter('País → Bandera'));
    const flagB = await listed();
    expect(flagB).toHaveLength(1);
    expect(flagB[0]).toContain('País → Bandera');

    await userEvent.click(filter('Todos'));
    expect(await listed()).toHaveLength(2);
  });

  it('HIS-02 a game without rounds says so when it is filtered', async () => {
    renderHistory([ROUNDS[0] ?? ROUNDS[1]] as SavedRound[]);
    await listed();

    await userEvent.click(filter('Bandera → País'));

    expect(screen.getByText('Todavía no hay partidas de este juego.')).toBeVisible();
    expect(screen.queryByRole('list', { name: 'Partidas' })).not.toBeInTheDocument();
  });

  it('HIS-02 with no rounds yet, it says so, with no filter', async () => {
    renderHistory([]);

    expect(await screen.findByText('Todavía no hay partidas.')).toBeVisible();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Juego' })).not.toBeInTheDocument();
  });

  it('HIS-02 while the rounds are being read, it shows neither the list nor "no rounds"', () => {
    renderWithI18n(
      <HistoryScreen loadRounds={() => new Promise(() => undefined)} onBack={vi.fn()} />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Historial' })).toBeVisible();
    expect(screen.queryByText('Todavía no hay partidas.')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('NAV-01 "Volver" goes back', async () => {
    const onBack = vi.fn();
    renderHistory(ROUNDS, onBack);

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it('HIS-02 NFR-06 the history speaks English when English is chosen', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderHistory();

    expect(screen.getByRole('heading', { level: 1, name: 'History' })).toBeVisible();
    const list = await screen.findByRole('list', { name: 'Rounds' });
    const entry = within(list).getAllByRole('listitem')[1] ?? document.body;
    expect(within(entry).getByText(formatPlayedAt(NOV_17, 'en'))).toBeVisible();
    expect(within(entry).getByText('Flag → Country')).toBeVisible();
    expect(within(entry).getByText('Europe · Easy')).toBeVisible();
    expect(within(entry).getByRole('img', { name: '2 of 3 stars' })).toBeVisible();
    expect(
      within(screen.getByRole('group', { name: 'Game' }))
        .getAllByRole('radio')
        .map((radio) => radio.closest('label')?.textContent),
    ).toEqual(['All', 'Flag → Country', 'Country → Flag']);
  });

  it('HIS-02 NFR-06 says "No rounds yet." in English', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderHistory([]);

    expect(await screen.findByText('No rounds yet.')).toBeVisible();
  });
});
