import { savedPlayerId, saveResults } from './device.ts';
import { expectedRound } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { NewPlayerPage } from './pages/NewPlayerPage.ts';
import { PlayersPage } from './pages/PlayersPage.ts';
import { ProgressPage } from './pages/ProgressPage.ts';
import { RoundPage } from './pages/RoundPage.ts';
import { SummaryPage } from './pages/SummaryPage.ts';

test.describe('Progress: stars per game, region and level', () => {
  let home: HomePage;
  let progress: ProgressPage;
  /** Lucía's id in the database. */
  let lucia: number;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    progress = new ProgressPage(page);
    await home.goto('?seed=42');
    const saved = await savedPlayerId(page, 'Lucía');
    expect(saved).not.toBeNull();
    lucia = saved ?? -1;
  });

  test(
    'HIS-03 SCR-03 GAME-02 NFR-05 1 star and later 3 stars in "Europa · Fácil" show 3 stars; "Asia · Medio" says "Sin jugar"',
    { tag: ['@HIS-03', '@SCR-03', '@GAME-02', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      await saveResults(page, lucia, [
        { game: 'FLAG-A', region: 'europe', level: 1, score: 5, stars: 1 },
        { game: 'FLAG-A', region: 'europe', level: 1, score: 10, stars: 3 },
      ]);
      for (const button of [home.progressButton, home.historyButton]) {
        const box = await button.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(48);
        expect(box?.height).toBeGreaterThanOrEqual(48);
      }

      await home.progressButton.click();

      await expect(progress.heading).toHaveText('Progreso');
      await expect(progress.cell('Bandera → País', 'Europa', 'Fácil')).toHaveText(
        '3 de 3 estrellas',
      );
      await expect(progress.cell('Bandera → País', 'Asia', 'Medio')).toHaveText('Sin jugar');
      await expect(progress.tables).toHaveCount(4);
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'HIS-03 GAME-02 3 + 2 stars in "Bandera → País" and 1 in "País → Bandera" make 6 stars in total',
    { tag: ['@HIS-03', '@GAME-02'] },
    async ({ page }) => {
      await saveResults(page, lucia, [
        { game: 'FLAG-A', region: 'europe', level: 1, score: 10, stars: 3 },
        { game: 'FLAG-A', region: 'africa', level: 1, score: 8, stars: 2 },
        { game: 'FLAG-B', region: 'europe', level: 1, score: 5, stars: 1 },
      ]);

      await home.progressButton.click();

      await expect(progress.total('6 estrellas en total')).toBeVisible();
      await expect(progress.cell('País → Bandera', 'Europa', 'Fácil')).toHaveText(
        '1 de 3 estrellas',
      );
      await expect(progress.cell('Bandera → País', 'África', 'Fácil')).toHaveText(
        '2 de 3 estrellas',
      );
    },
  );

  test('HIS-03 each player sees their own progress', { tag: '@HIS-03' }, async ({ page }) => {
    const players = new PlayersPage(page);
    await home.switchPlayerButton.click();
    await players.newPlayerButton.click();
    await new NewPlayerPage(page).create('Pablo', 'Búho');
    const pablo = await savedPlayerId(page, 'Pablo');
    expect(pablo).not.toBeNull();
    await saveResults(page, pablo ?? -1, [
      { game: 'FLAG-A', region: 'europe', level: 1, score: 10, stars: 3 },
    ]);
    await home.switchPlayerButton.click();
    await players.choose('Lucía');

    await home.progressButton.click();

    await expect(progress.cell('Bandera → País', 'Europa', 'Fácil')).toHaveText('Sin jugar');
    await expect(progress.total('0 estrellas en total')).toBeVisible();

    // And Pablo does see his 3 stars: the round above is really his.
    await page.goBack();
    await home.switchPlayerButton.click();
    await players.choose('Pablo');
    await home.progressButton.click();
    await expect(progress.cell('Bandera → País', 'Europa', 'Fácil')).toHaveText('3 de 3 estrellas');
  });

  test(
    'HIS-03 SCR-03 a perfect round just played shows its 3 stars',
    { tag: ['@HIS-03', '@SCR-03'] },
    async ({ page }) => {
      const setup = new GameSetupPage(page);
      const round = new RoundPage(page);
      await home.openGame('Bandera → País');
      await setup.chooseRegion('Europa');
      await setup.chooseLevel('Fácil');
      await round.playRound(expectedRound({ topic: 'flags', region: 'europe', level: 1 }), []);
      await new SummaryPage(page).menuButton.click();

      await home.progressButton.click();

      await expect(progress.cell('Bandera → País', 'Europa', 'Fácil')).toHaveText(
        '3 de 3 estrellas',
      );
      await expect(progress.total('3 estrellas en total')).toBeVisible();
    },
  );
});
