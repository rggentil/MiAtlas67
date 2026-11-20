import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { RecordRound } from '../../domain/familyRecords.ts';
import type { GameId } from '../../domain/games.ts';
import type { Level, RegionChoice } from '../../domain/questions.ts';
import type { Player } from '../../storage/store.ts';
import { renderWithI18n } from '../../test/render.tsx';
import { RecordsScreen } from './RecordsScreen.tsx';

const LUCIA: Player = { id: 1, nickname: 'Lucía', avatar: 'fox' };
const PABLO: Player = { id: 2, nickname: 'Pablo', avatar: 'owl' };

let nextId = 1;
function played(
  playerId: number,
  playedAt: number,
  score: number,
  where: { game?: GameId; region?: RegionChoice; level?: Level } = {},
): RecordRound {
  const stars = score === 10 ? 3 : score >= 8 ? 2 : score >= 5 ? 1 : 0;
  return {
    id: nextId++,
    playerId,
    playedAt,
    game: where.game ?? 'FLAG-A',
    region: where.region ?? 'europe',
    level: where.level ?? 1,
    score,
    total: 10,
    stars,
  };
}

function renderRecords(
  rounds: readonly RecordRound[],
  players: readonly Player[] = [LUCIA, PABLO],
  onBack = vi.fn(),
) {
  renderWithI18n(
    <RecordsScreen loadRounds={() => Promise.resolve(rounds)} players={players} onBack={onBack} />,
  );
  return { onBack };
}

/** The cell of a region and level in the table of a game, e.g. "Europa", "Fácil". */
async function cell(game: string, region: string, level: string) {
  const table = await screen.findByRole('table', { name: game });
  const levels = within(table)
    .getAllByRole('columnheader')
    .map((header) => header.textContent);
  const row = within(table).getByRole('rowheader', { name: region }).closest('tr');
  if (!row) throw new Error('No row ' + region);
  const found = within(row).getAllByRole('cell')[levels.indexOf(level) - 1];
  if (!found) throw new Error('No cell ' + level);
  return found;
}

describe('RecordsScreen', () => {
  it('HIS-05 GAME-02 shows "Récords de la familia" with a table for each of the six games', async () => {
    renderRecords([]);

    expect(screen.getByRole('heading', { level: 1, name: 'Récords de la familia' })).toBeVisible();
    expect(await screen.findAllByRole('table')).toHaveLength(6);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Bandera → País',
      'País → Bandera',
      'País → Capital',
      'Capital → País',
      'Silueta → País',
      'País → Silueta',
    ]);
    const first = await screen.findByRole('table', { name: 'Bandera → País' });
    expect(
      within(first)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Región', 'Fácil', 'Medio', 'Difícil']);
    expect(
      within(first)
        .getAllByRole('rowheader')
        .map((h) => h.textContent),
    ).toEqual(['Mundo', 'Europa', 'África', 'América', 'Asia', 'Oceanía']);
    // Nobody has played: every place of every game says so.
    expect(screen.getAllByText('Sin récord')).toHaveLength(6 * 6 * 3);
  });

  it('HIS-05 the best score of the family, with the nickname and avatar of who holds it', async () => {
    renderRecords([played(1, 1_000, 8), played(2, 2_000, 9)]);

    const record = await cell('Bandera → País', 'Europa', 'Fácil');
    expect(record).toHaveTextContent('9 de 10,Pablo');
    expect(within(record).getByText('9/10')).toBeVisible();
    expect(within(record).getByText('Pablo')).toBeVisible();
    expect(record.querySelector('img')).toHaveAttribute('src', expect.stringContaining('owl'));
  });

  it('HIS-05 D28 a tie keeps the player who reached it first, even when that round was saved later', async () => {
    const yesterday = { ...played(2, 1_000, 9), id: 900 };
    const today = { ...played(1, 2_000, 9), id: 100 };
    renderRecords([today, yesterday]);

    expect(await cell('Bandera → País', 'Europa', 'Fácil')).toHaveTextContent('9 de 10,Pablo');
  });

  it('HIS-05 beating a record changes its holder', async () => {
    renderRecords([played(2, 1_000, 9), played(1, 2_000, 10)]);

    const record = await cell('Bandera → País', 'Europa', 'Fácil');
    expect(record).toHaveTextContent('10 de 10,Lucía');
    expect(record.querySelector('img')).toHaveAttribute('src', expect.stringContaining('fox'));
  });

  it('HIS-05 GAME-02 places nobody played say "Sin récord"; games, regions and levels do not mix', async () => {
    renderRecords([played(2, 1_000, 10)]);

    expect(await cell('Bandera → País', 'Europa', 'Fácil')).toHaveTextContent('10 de 10,Pablo');
    expect(await cell('País → Bandera', 'Europa', 'Fácil')).toHaveTextContent('Sin récord');
    expect(await cell('Bandera → País', 'África', 'Fácil')).toHaveTextContent('Sin récord');
    expect(await cell('Bandera → País', 'Europa', 'Medio')).toHaveTextContent('Sin récord');
  });

  it('PRF-04 HIS-05 rounds of a player who is no longer on the device do not count', async () => {
    renderRecords([played(2, 1_000, 9), played(1, 2_000, 8)], [LUCIA]);

    expect(await cell('Bandera → País', 'Europa', 'Fácil')).toHaveTextContent('8 de 10,Lucía');
  });

  it('HIS-05 when the rounds cannot be read, every place says "Sin récord"', async () => {
    renderWithI18n(
      <RecordsScreen
        loadRounds={() => Promise.reject(new Error('Storage is blocked'))}
        players={[LUCIA]}
        onBack={vi.fn()}
      />,
    );

    expect(await cell('Bandera → País', 'Europa', 'Fácil')).toHaveTextContent('Sin récord');
  });

  it('HIS-05 NAV-01 "Volver" goes back', async () => {
    const { onBack } = renderRecords([]);

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it('HIS-05 NFR-06 in English: "Family records" and "No record"', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderRecords([played(1, 1_000, 7)]);

    expect(screen.getByRole('heading', { level: 1, name: 'Family records' })).toBeVisible();
    expect(await cell('Flag → Country', 'Europe', 'Easy')).toHaveTextContent('7 of 10,Lucía');
    expect(await cell('Flag → Country', 'Africa', 'Easy')).toHaveTextContent('No record');
  });
});
