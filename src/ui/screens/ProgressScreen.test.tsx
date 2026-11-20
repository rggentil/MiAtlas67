import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { GameId } from '../../domain/games.ts';
import type { PlayedResult } from '../../domain/playerProgress.ts';
import type { Level, RegionChoice } from '../../domain/questions.ts';
import type { Stars } from '../../domain/round.ts';
import { renderWithI18n } from '../../test/render.tsx';

import { ProgressScreen } from './ProgressScreen.tsx';

function played(
  game: GameId,
  region: RegionChoice,
  level: Level,
  score: number,
  stars: Stars,
): PlayedResult {
  return { game, region, level, score, total: 10, stars };
}

function renderProgress(rounds: readonly PlayedResult[], onBack: () => void = vi.fn()) {
  renderWithI18n(<ProgressScreen loadRounds={() => Promise.resolve(rounds)} onBack={onBack} />);
}

/** The table of a game, by its caption. */
async function table(game: string): Promise<HTMLElement> {
  return screen.findByRole('table', { name: game });
}

/** The cell of a region (row) and a level (column) in a game's table. */
async function cell(game: string, region: string, level: string): Promise<HTMLElement> {
  const rows = within(await table(game)).getAllByRole('row');
  const header = rows[0];
  if (!header) throw new Error('No header row');
  const column = within(header)
    .getAllByRole('columnheader')
    .findIndex((th) => th.textContent === level);
  const row = rows.find((candidate) =>
    within(candidate).queryByRole('rowheader', { name: region }),
  );
  if (!row || column < 1) throw new Error(`No cell for ${region} and ${level}`);
  const found = within(row).getAllByRole('cell')[column - 1];
  if (!found) throw new Error(`No cell for ${region} and ${level}`);
  return found;
}

describe('ProgressScreen', () => {
  it('HIS-03 SCR-03 1 star and later 3 stars in "Europa · Fácil": "Bandera → País" shows 3 stars there', async () => {
    renderProgress([played('FLAG-A', 'europe', 1, 5, 1), played('FLAG-A', 'europe', 1, 10, 3)]);

    const europeEasy = await cell('Bandera → País', 'Europa', 'Fácil');
    expect(europeEasy).toHaveTextContent('3 de 3 estrellas');
    expect([...europeEasy.querySelectorAll('svg')].map((star) => star.dataset.filled)).toEqual([
      'true',
      'true',
      'true',
    ]);
  });

  it('HIS-03 2 stars are drawn as 2 filled stars and 1 empty one, and written "2 de 3 estrellas"', async () => {
    renderProgress([played('FLAG-A', 'europe', 1, 8, 2)]);

    const europeEasy = await cell('Bandera → País', 'Europa', 'Fácil');
    expect(europeEasy).toHaveTextContent('2 de 3 estrellas');
    expect([...europeEasy.querySelectorAll('svg')].map((star) => star.dataset.filled)).toEqual([
      'true',
      'true',
      'false',
    ]);
  });

  it('HIS-03 a region and level not played yet shows "Sin jugar"', async () => {
    renderProgress([played('FLAG-A', 'europe', 1, 10, 3)]);

    expect(await cell('Bandera → País', 'Asia', 'Medio')).toHaveTextContent('Sin jugar');
  });

  it('HIS-03 a round with 0 stars is played: it shows "0 de 3 estrellas", not "Sin jugar"', async () => {
    renderProgress([played('FLAG-A', 'africa', 2, 3, 0)]);

    const africaMedium = await cell('Bandera → País', 'África', 'Medio');
    expect(africaMedium).toHaveTextContent('0 de 3 estrellas');
    expect([...africaMedium.querySelectorAll('svg')].map((star) => star.dataset.filled)).toEqual([
      'false',
      'false',
      'false',
    ]);
    expect(africaMedium).not.toHaveTextContent('Sin jugar');
  });

  it('HIS-03 3 stars + 2 stars in "Bandera → País" and 1 star in "País → Bandera" make 6 stars in total', async () => {
    renderProgress([
      played('FLAG-A', 'europe', 1, 10, 3),
      played('FLAG-A', 'africa', 1, 8, 2),
      played('FLAG-B', 'europe', 1, 5, 1),
    ]);

    expect(await screen.findByText('6 estrellas en total')).toBeVisible();
  });

  it('HIS-03 one star in total is written in the singular', async () => {
    renderProgress([played('FLAG-B', 'europe', 1, 5, 1)]);

    expect(await screen.findByText('1 estrella en total')).toBeVisible();
  });

  it('HIS-03 GAME-02 one table per playable game, each with every region and level', async () => {
    renderProgress([played('FLAG-A', 'europe', 1, 10, 3)]);

    await table('Bandera → País');
    const tables = screen.getAllByRole('table');
    expect(tables).toHaveLength(5);
    expect(tables[0]).toHaveAccessibleName('Bandera → País');
    expect(tables[1]).toHaveAccessibleName('País → Bandera');
    expect(tables[2]).toHaveAccessibleName('País → Capital');
    expect(tables[3]).toHaveAccessibleName('Capital → País');
    expect(tables[4]).toHaveAccessibleName('Silueta → País');
    const flagB = within(await table('País → Bandera'));
    expect(flagB.getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Región',
      'Fácil',
      'Medio',
      'Difícil',
    ]);
    expect(flagB.getAllByRole('rowheader').map((th) => th.textContent)).toEqual([
      'Mundo',
      'Europa',
      'África',
      'América',
      'Asia',
      'Oceanía',
    ]);
    // The stars of "Bandera → País" do not show in the other game (GAME-02).
    expect(await cell('País → Bandera', 'Europa', 'Fácil')).toHaveTextContent('Sin jugar');
  });

  it('HIS-03 with no rounds, every cell says "Sin jugar" and the total is 0', async () => {
    renderProgress([]);

    expect(await screen.findByText('0 estrellas en total')).toBeVisible();
    expect(screen.getAllByText('Sin jugar')).toHaveLength(5 * 6 * 3);
  });

  it('HIS-03 when the rounds cannot be read, it shows "Sin jugar" instead of staying blank', async () => {
    renderWithI18n(
      <ProgressScreen
        loadRounds={() => Promise.reject(new Error('Storage is blocked'))}
        onBack={vi.fn()}
      />,
    );

    expect(await screen.findByText('0 estrellas en total')).toBeVisible();
    expect(screen.getAllByText('Sin jugar')).toHaveLength(5 * 6 * 3);
  });

  it('NAV-01 "Volver" goes back', async () => {
    const onBack = vi.fn();
    renderProgress([], onBack);

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it('HIS-03 NFR-06 the progress speaks English when English is chosen', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderProgress([played('FLAG-A', 'europe', 1, 8, 2)]);

    expect(screen.getByRole('heading', { level: 1, name: 'Progress' })).toBeVisible();
    expect(await screen.findByText('2 stars in total')).toBeVisible();
    expect(await cell('Flag → Country', 'Europe', 'Easy')).toHaveTextContent('2 of 3 stars');
    expect(await cell('Flag → Country', 'Asia', 'Medium')).toHaveTextContent('Not played');
    expect(within(await table('Flag → Country')).getAllByRole('columnheader')[0]).toHaveTextContent(
      'Region',
    );
  });
});
