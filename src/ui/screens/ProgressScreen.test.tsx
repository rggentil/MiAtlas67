import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { extendedEntities } from '../../data/extended.ts';
import type { GameId } from '../../domain/games.ts';
import type { AnsweredRound } from '../../domain/mastery.ts';
import type { PlayedResult } from '../../domain/playerProgress.ts';
import { isEligible, type Level, type RegionChoice, type Topic } from '../../domain/questions.ts';
import type { Stars } from '../../domain/round.ts';
import { renderWithI18n } from '../../test/render.tsx';

import { ProgressScreen } from './ProgressScreen.tsx';

type ProgressRound = PlayedResult & AnsweredRound;

let nextId = 1;
function played(
  game: GameId,
  region: RegionChoice,
  level: Level,
  score: number,
  stars: Stars,
  answers: { asked?: readonly string[]; missed?: readonly string[] } = {},
): ProgressRound {
  const id = nextId++;
  return { id, playedAt: id, game, region, level, score, total: 10, stars, missed: [], ...answers };
}

function renderProgress(rounds: readonly ProgressRound[], onBack: () => void = vi.fn()) {
  renderWithI18n(<ProgressScreen loadRounds={() => Promise.resolve(rounds)} onBack={onBack} />);
}

/** The table of a game, by its caption. */
async function table(game: string): Promise<HTMLElement> {
  return screen.findByRole('table', { name: game });
}

/** The six games by their Spanish name and English name, with the topic that says what they can ask. */
const GAME_NAMES: readonly { es: string; en: string; topic: Topic }[] = [
  { es: 'Bandera → País', en: 'Flag → Country', topic: 'flags' },
  { es: 'País → Bandera', en: 'Country → Flag', topic: 'flags' },
  { es: 'País → Capital', en: 'Country → Capital', topic: 'capitals' },
  { es: 'Capital → País', en: 'Capital → Country', topic: 'capitals' },
  { es: 'Silueta → País', en: 'Shape → Country', topic: 'shapes' },
  { es: 'País → Silueta', en: 'Country → Shape', topic: 'shapes' },
];

/** How many extended entities a topic can ask: Capitals leave out those without a quiz capital (CAP-02). */
function extendedFor(topic: Topic): number {
  return extendedEntities.filter((entity) => isEligible(entity, topic)).length;
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
    expect(tables).toHaveLength(6);
    expect(tables[0]).toHaveAccessibleName('Bandera → País');
    expect(tables[1]).toHaveAccessibleName('País → Bandera');
    expect(tables[2]).toHaveAccessibleName('País → Capital');
    expect(tables[3]).toHaveAccessibleName('Capital → País');
    expect(tables[4]).toHaveAccessibleName('Silueta → País');
    expect(tables[5]).toHaveAccessibleName('País → Silueta');
    const flagB = within(await table('País → Bandera'));
    expect(flagB.getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Región',
      'Fácil',
      'Medio',
      'Difícil',
      'Experto',
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
    expect(screen.getAllByText('Sin jugar')).toHaveLength(6 * 6 * 4);
  });

  it('HIS-03 when the rounds cannot be read, it shows "Sin jugar" instead of staying blank', async () => {
    renderWithI18n(
      <ProgressScreen
        loadRounds={() => Promise.reject(new Error('Storage is blocked'))}
        onBack={vi.fn()}
      />,
    );

    expect(await screen.findByText('0 estrellas en total')).toBeVisible();
    expect(screen.getAllByText('Sin jugar')).toHaveLength(6 * 6 * 4);
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

  it('HIS-04 every game shows "Países dominados: 0/195" before any country is mastered', async () => {
    renderProgress([]);

    expect(await screen.findAllByText('Países dominados: 0/195')).toHaveLength(6);
  });

  it('HIS-04 Portugal right in 3 rounds of "Bandera → País" in a row: "Países dominados: 1/195" there only', async () => {
    renderProgress([
      played('FLAG-A', 'europe', 1, 10, 3, { asked: ['PT', 'ES'] }),
      played('FLAG-A', 'world', 2, 10, 3, { asked: ['PT'] }),
      played('FLAG-A', 'europe', 3, 9, 2, { asked: ['PT', 'FR'], missed: ['FR'] }),
    ]);

    const flagA = await screen.findByRole('region', { name: 'Bandera → País' });
    const flagB = await screen.findByRole('region', { name: 'País → Bandera' });
    expect(flagA).toHaveTextContent('Países dominados: 1/195');
    expect(flagB).toHaveTextContent('Países dominados: 0/195');
  });

  it('HIS-04 D29 a miss after mastering takes the country out', async () => {
    renderProgress([
      played('FLAG-A', 'europe', 1, 10, 3, { asked: ['PT'] }),
      played('FLAG-A', 'europe', 1, 10, 3, { asked: ['PT'] }),
      played('FLAG-A', 'europe', 1, 10, 3, { asked: ['PT'] }),
      played('FLAG-A', 'europe', 1, 9, 2, { asked: ['PT'], missed: ['PT'] }),
    ]);

    const flagA = await screen.findByRole('region', { name: 'Bandera → País' });
    expect(flagA).toHaveTextContent('Países dominados: 0/195');
  });

  it('HIS-04 D29 rounds saved without the countries asked do not count', async () => {
    renderProgress([
      played('FLAG-A', 'europe', 1, 10, 3),
      played('FLAG-A', 'europe', 1, 10, 3),
      played('FLAG-A', 'europe', 1, 10, 3),
    ]);

    const flagA = await screen.findByRole('region', { name: 'Bandera → País' });
    expect(flagA).toHaveTextContent('Países dominados: 0/195');
  });

  it('HIS-04 NFR-06 in English: "Countries mastered: 1/195"', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderProgress([
      played('FLAG-A', 'europe', 1, 10, 3, { asked: ['PT'] }),
      played('FLAG-A', 'europe', 1, 10, 3, { asked: ['PT'] }),
      played('FLAG-A', 'europe', 1, 10, 3, { asked: ['PT'] }),
    ]);

    const flagA = await screen.findByRole('region', { name: 'Flag → Country' });
    expect(flagA).toHaveTextContent('Countries mastered: 1/195');
    expect(screen.getAllByText('Countries mastered: 0/195')).toHaveLength(5);
  });

  it('HIS-03 LVL-01 a ★★ round in "Oceanía · Experto" shows "2 de 3 estrellas" in the Experto column of that game only', async () => {
    renderProgress([played('FLAG-A', 'oceania', 4, 8, 2)]);

    expect(await cell('Bandera → País', 'Oceanía', 'Experto')).toHaveTextContent(
      '2 de 3 estrellas',
    );
    expect(await cell('Bandera → País', 'Oceanía', 'Difícil')).toHaveTextContent('Sin jugar');
    expect(await cell('País → Bandera', 'Oceanía', 'Experto')).toHaveTextContent('Sin jugar');
    expect(await screen.findByText('2 estrellas en total')).toBeVisible();
  });

  it('HIS-04 every game shows "Países dominados: 0/195" and, apart, "Territorios y otros dominados: 0/N" with the extended entities its topic can ask', async () => {
    renderProgress([]);

    for (const { es, topic } of GAME_NAMES) {
      const game = await screen.findByRole('region', { name: es });
      const extended = extendedFor(topic);
      expect(extended).toBeGreaterThan(0);
      expect(within(game).getByText('Países dominados: 0/195')).toBeVisible();
      expect(
        within(game).getByText(`Territorios y otros dominados: 0/${String(extended)}`),
      ).toBeVisible();
    }
  });

  it('HIS-04 CAP-02 Capitals count fewer extended entities than Flags: those without a quiz capital are out', async () => {
    renderProgress([]);

    expect(extendedFor('capitals')).toBeLessThan(extendedFor('flags'));
    const flagA = await screen.findByRole('region', { name: 'Bandera → País' });
    const capA = await screen.findByRole('region', { name: 'País → Capital' });
    expect(flagA).toHaveTextContent(`dominados: 0/${String(extendedFor('flags'))}`);
    expect(capA).toHaveTextContent(`dominados: 0/${String(extendedFor('capitals'))}`);
  });

  it('HIS-04 Groenlandia right in 3 Experto rounds of "Bandera → País" in a row: "Territorios y otros dominados: 1/N" there only, and the countries stay apart', async () => {
    renderProgress([
      played('FLAG-A', 'americas', 4, 10, 3, { asked: ['GL', 'PT'] }),
      played('FLAG-A', 'world', 4, 10, 3, { asked: ['GL', 'PT'] }),
      played('FLAG-A', 'americas', 4, 10, 3, { asked: ['GL', 'ES'] }),
    ]);

    const flagA = await screen.findByRole('region', { name: 'Bandera → País' });
    const flagB = await screen.findByRole('region', { name: 'País → Bandera' });
    const extended = String(extendedFor('flags'));
    expect(within(flagA).getByText(`Territorios y otros dominados: 1/${extended}`)).toBeVisible();
    // Groenlandia is not a country: it does not count in "Países dominados", where Portugal is not mastered yet.
    expect(within(flagA).getByText('Países dominados: 0/195')).toBeVisible();
    expect(within(flagB).getByText(`Territorios y otros dominados: 0/${extended}`)).toBeVisible();
  });

  it('HIS-04 a country and an extended entity mastered together are counted apart', async () => {
    renderProgress([
      played('FLAG-A', 'americas', 4, 10, 3, { asked: ['GL', 'PT'] }),
      played('FLAG-A', 'world', 4, 10, 3, { asked: ['GL', 'PT'] }),
      played('FLAG-A', 'americas', 4, 10, 3, { asked: ['GL', 'PT'] }),
    ]);

    const flagA = await screen.findByRole('region', { name: 'Bandera → País' });
    expect(within(flagA).getByText('Países dominados: 1/195')).toBeVisible();
    expect(
      within(flagA).getByText(`Territorios y otros dominados: 1/${String(extendedFor('flags'))}`),
    ).toBeVisible();
  });

  it('HIS-04 D29 a miss after mastering takes the extended entity out', async () => {
    renderProgress([
      played('FLAG-A', 'americas', 4, 10, 3, { asked: ['GL'] }),
      played('FLAG-A', 'americas', 4, 10, 3, { asked: ['GL'] }),
      played('FLAG-A', 'americas', 4, 10, 3, { asked: ['GL'] }),
      played('FLAG-A', 'americas', 4, 9, 2, { asked: ['GL'], missed: ['GL'] }),
    ]);

    const flagA = await screen.findByRole('region', { name: 'Bandera → País' });
    expect(flagA).toHaveTextContent(
      `Territorios y otros dominados: 0/${String(extendedFor('flags'))}`,
    );
  });

  it('HIS-04 NFR-06 in English: "Countries mastered" and "Territories and others mastered"', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderProgress([
      played('FLAG-A', 'americas', 4, 10, 3, { asked: ['GL', 'PT'] }),
      played('FLAG-A', 'americas', 4, 10, 3, { asked: ['GL', 'PT'] }),
      played('FLAG-A', 'americas', 4, 10, 3, { asked: ['GL', 'PT'] }),
    ]);

    for (const { en, topic } of GAME_NAMES) {
      const game = await screen.findByRole('region', { name: en });
      const mastered = en === 'Flag → Country' ? 1 : 0;
      expect(
        within(game).getByText(
          `Territories and others mastered: ${String(mastered)}/${String(extendedFor(topic))}`,
        ),
      ).toBeVisible();
    }
    expect(await cell('Flag → Country', 'Europe', 'Expert')).toHaveTextContent('Not played');
  });
});
