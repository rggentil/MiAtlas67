import { countries } from '../../src/data/countries.ts';
import { extendedEntities } from '../../src/data/extended.ts';
import { isEligible } from '../../src/domain/questions.ts';
import { flagFile } from '../../src/test/flags.ts';
import { openLevel, savedPlayerId, savedRoundsOf, saveResults } from './device.ts';
import { expectedRound } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HistoryPage } from './pages/HistoryPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { ProgressPage } from './pages/ProgressPage.ts';
import { RecordsPage } from './pages/RecordsPage.ts';
import { RoundPage } from './pages/RoundPage.ts';
import { SummaryPage } from './pages/SummaryPage.ts';

// Background: I am playing "Bandera → País" in "Oceanía · Experto" with seed 42.
const ROUND = expectedRound({ topic: 'flags', region: 'oceania', level: 4 });
const EXTENDED_CODES = new Set(extendedEntities.map((entity) => entity.code));
const COUNTRY_CODES = new Set(countries.map((entity) => entity.code));

/** The code of the entity whose flag is shown, read from the flag's file name: "…/gl.svg" is "GL". */
function flagCode(src: string | null): string {
  const code = /\/([^/]+)\.svg(\?no-inline)?$/.exec(src ?? '')?.[1];
  if (code === undefined) throw new Error(`The flag "${src ?? ''}" has no file name`);
  return code.toUpperCase();
}

test.describe('Level 4 Experto', () => {
  let home: HomePage;
  let setup: GameSetupPage;
  let round: RoundPage;
  let summary: SummaryPage;
  /** Lucía's id in the database. */
  let lucia: number;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    setup = new GameSetupPage(page);
    round = new RoundPage(page);
    summary = new SummaryPage(page);
    await home.goto('?seed=42');
    const saved = await savedPlayerId(page, 'Lucía');
    expect(saved).not.toBeNull();
    lucia = saved ?? -1;
  });

  /** From the home screen: "Bandera → País", "Oceanía", "Experto". */
  async function startExperto(): Promise<void> {
    await home.openGame('Bandera → País');
    await setup.chooseRegion('Oceanía');
    await setup.chooseLevel('Experto');
  }

  test(
    'LVL-04 LVL-05 NFR-05 Experto comes after Difícil, locked with how to open it until a ★★ round in Difícil is on the device',
    { tag: ['@LVL-04', '@LVL-05', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      // ★★ in Fácil and Medio: Difícil is open, but Experto needs ★★ in Difícil itself.
      await openLevel(page, 'FLAG-A', 'oceania', 3);
      await home.openGame('Bandera → País');

      await setup.chooseRegion('Oceanía');

      await expect(setup.levelStep.getByRole('button')).toHaveCount(4);
      await expect(setup.levelStep.getByRole('button').nth(2)).toHaveAccessibleName('Difícil');
      await expect(setup.levelStep.getByRole('button').nth(3)).toHaveAccessibleName(
        'Experto, bloqueado',
      );
      await expect(setup.level('Experto')).toBeDisabled();
      await expect(setup.level('Experto')).toHaveAccessibleDescription(
        'Consigue ★★ en Difícil para desbloquear',
      );
      await expect(page.getByText('Consigue ★★ en Difícil para desbloquear')).toBeVisible();
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);

      // force: Playwright waits for an enabled element, and a locked level is reported as disabled.
      await setup.level('Experto').click({ force: true });
      await expect(setup.levelStep).toBeVisible();
      await expect(setup.level('Experto')).toHaveAccessibleName('Experto, bloqueado');
      await expect(round.progressText).toHaveCount(0);

      // A ★★ round in Difícil arrives: the next time the game opens, Experto is open and plays.
      await setup.backButton.click();
      await setup.backButton.click();
      await expect(home.heading).toHaveText('¿A qué jugamos?');
      await saveResults(page, lucia, [
        { game: 'FLAG-A', region: 'oceania', level: 3, score: 8, stars: 2 },
      ]);
      await home.openGame('Bandera → País');
      await setup.chooseRegion('Oceanía');

      await expect(setup.level('Experto')).toHaveAccessibleName('Experto');
      await expect(setup.level('Experto')).toBeEnabled();
      await setup.chooseLevel('Experto');
      await expect(round.settings).toHaveText(['Banderas', 'Oceanía', 'Experto']);
    },
  );

  test(
    'LVL-07 RND-02 NFR-05 a round of "Oceanía · Experto" with seed 42 asks 5 extended entities and 5 countries, each with 6 options',
    { tag: ['@LVL-07', '@RND-02', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      await openLevel(page, 'FLAG-A', 'oceania', 4);
      await startExperto();
      await expect(round.heading).toHaveText('¿De qué país es esta bandera?');

      const asked: string[] = [];
      for (const [index, question] of ROUND.entries()) {
        await expect(round.progressText).toHaveText(`${String(index + 1)}/10`);
        // The flag shown is the one the domain asks for with this seed (NFR-07).
        await expect(round.flag).toHaveAttribute('src', flagFile(question.entity.code));
        asked.push(flagCode(await round.flag.getAttribute('src')));
        await expect(round.options).toHaveCount(6);
        await expect(round.options).toHaveText(question.options.map((option) => option.name.es));
        if (index === 0) expect((await makeAxeBuilder().analyze()).violations).toEqual([]);

        await round.answer(question.entity.name.es);
        await expect(round.feedback).toHaveText('¡Correcto!');
        if (index === 0) expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
        await round.nextButton.click();
      }

      // Half of the round comes from the extended set, the other half from the 195 countries (D27).
      expect(asked.filter((code) => EXTENDED_CODES.has(code))).toHaveLength(5);
      expect(asked.filter((code) => COUNTRY_CODES.has(code))).toHaveLength(5);
      expect(new Set(asked).size).toBe(10);
      await expect(summary.score('10/10')).toBeVisible();
    },
  );

  test(
    'HIS-01 HIS-03 HIS-05 NFR-05 a finished Experto round is in the history, in the Experto column of "Progreso" and in "Récords"',
    { tag: ['@HIS-01', '@HIS-03', '@HIS-05', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      const history = new HistoryPage(page);
      const progress = new ProgressPage(page);
      const records = new RecordsPage(page);
      await openLevel(page, 'FLAG-A', 'oceania', 4);
      const before = await savedRoundsOf(page, lucia);
      await startExperto();

      await round.playRound(ROUND, []);

      await expect(summary.score('10/10')).toBeVisible();
      await expect.poll(() => savedRoundsOf(page, lucia)).toBe(before + 1);
      await summary.menuButton.click();

      await home.historyButton.click();
      const entry = history.entries.filter({ hasText: 'Oceanía · Experto' });
      await expect(entry).toHaveCount(1);
      await expect(entry).toContainText('Bandera → País');
      await expect(entry).toContainText('10/10');
      await expect(entry.getByRole('img', { name: '3 de 3 estrellas' })).toBeVisible();
      await history.backButton.click();

      await home.progressButton.click();
      await expect(progress.heading).toHaveText('Progreso');
      await expect(progress.table('Bandera → País').getByRole('columnheader')).toHaveText([
        'Región',
        'Fácil',
        'Medio',
        'Difícil',
        'Experto',
      ]);
      await expect(progress.cell('Bandera → País', 'Oceanía', 'Experto')).toHaveText(
        '3 de 3 estrellas',
      );
      await expect(progress.cell('Bandera → País', 'Oceanía', 'Difícil')).toHaveText(
        '2 de 3 estrellas',
      );
      await expect(progress.cell('Bandera → País', 'Europa', 'Experto')).toHaveText('Sin jugar');
      await expect(progress.cell('País → Bandera', 'Oceanía', 'Experto')).toHaveText('Sin jugar');
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
      await page.goBack();

      await home.recordsButton.click();
      await expect(records.table('Bandera → País').getByRole('columnheader')).toHaveText([
        'Región',
        'Fácil',
        'Medio',
        'Difícil',
        'Experto',
      ]);
      await expect(records.cell('Bandera → País', 'Oceanía', 'Experto')).toContainText(
        '10 de 10,Lucía',
      );
      await expect(records.cell('Bandera → País', 'Europa', 'Experto')).toHaveText('Sin récord');
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'HIS-04 D29 3 right answers in a row in Experto rounds master Groenlandia: counted apart from the countries, per game',
    { tag: '@HIS-04' },
    async ({ page }) => {
      const progress = new ProgressPage(page);
      const extendedIn = (topic: 'flags' | 'capitals') =>
        extendedEntities.filter((entity) => isEligible(entity, topic)).length;
      const right = { game: 'FLAG-A', region: 'americas', level: 4, score: 10, stars: 3 } as const;
      await saveResults(page, lucia, [
        { ...right, asked: ['GL', 'PT'] },
        { ...right, region: 'world', asked: ['GL', 'PT'] },
        { ...right, asked: ['GL', 'PT'] },
        // "País → Capital": Groenlandia right twice, then missed.
        { ...right, game: 'CAP-A', asked: ['GL'] },
        { ...right, game: 'CAP-A', asked: ['GL'] },
        { ...right, game: 'CAP-A', asked: ['GL'], missed: ['GL'], score: 9, stars: 2 },
      ]);

      await home.progressButton.click();

      await expect(progress.mastered('Bandera → País')).toHaveText('Países dominados: 1/195');
      await expect(progress.masteredExtended('Bandera → País')).toHaveText(
        `Territorios y otros dominados: 1/${String(extendedIn('flags'))}`,
      );
      await expect(progress.masteredExtended('País → Bandera')).toHaveText(
        `Territorios y otros dominados: 0/${String(extendedIn('flags'))}`,
      );
      await expect(progress.masteredExtended('País → Capital')).toHaveText(
        `Territorios y otros dominados: 0/${String(extendedIn('capitals'))}`,
      );
    },
  );
});
