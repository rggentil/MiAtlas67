import { flagFile } from '../../src/test/flags.ts';
import { expectedRounds, questionAt } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { RoundPage } from './pages/RoundPage.ts';
import { SummaryPage } from './pages/SummaryPage.ts';

// Every test plays "Bandera → País" in "Europa · Fácil" with seed 42 to the end.
const [FIRST_ROUND = [], SECOND_ROUND = []] = expectedRounds(
  { topic: 'flags', region: 'europe', level: 1 },
  2,
);

test.describe('Round summary', () => {
  let round: RoundPage;
  let summary: SummaryPage;

  test.beforeEach(async ({ page }) => {
    const home = new HomePage(page);
    const setup = new GameSetupPage(page);
    round = new RoundPage(page);
    summary = new SummaryPage(page);
    await home.goto('?seed=42');
    await home.openGame('Bandera → País');
    await setup.chooseRegion('Europa');
    await setup.chooseLevel('Fácil');
  });

  test(
    'SCR-01 SCR-02 RND-08 8 correct answers: "8/10", 2 stars and the 2 missed countries',
    { tag: ['@SCR-01', '@SCR-02', '@RND-08'] },
    async ({ makeAxeBuilder }) => {
      await round.playRound(FIRST_ROUND, [1, 6]);

      await expect(summary.score('8/10')).toBeVisible();
      await expect(summary.stars).toHaveAccessibleName('2 de 3 estrellas');
      await expect(summary.missed).toHaveText([
        questionAt(FIRST_ROUND, 1).entity.name.es,
        questionAt(FIRST_ROUND, 6).entity.name.es,
      ]);
      await expect(summary.missed.first().locator('img')).toHaveAttribute(
        'src',
        flagFile(questionAt(FIRST_ROUND, 1).entity.code),
      );
      await expect(summary.celebration).toHaveCount(0);
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'RND-08 SCR-02 a perfect round: 3 stars, a celebration and no list of missed countries',
    { tag: ['@RND-08', '@SCR-02'] },
    async ({ page, makeAxeBuilder }) => {
      await round.playRound(FIRST_ROUND, []);

      await expect(summary.heading).toHaveText('¡Perfecto!');
      await expect(summary.score('10/10')).toBeVisible();
      await expect(summary.stars).toHaveAccessibleName('3 de 3 estrellas');
      await expect(summary.celebration).toBeVisible();
      await expect(page.getByRole('list', { name: 'Para repasar' })).toHaveCount(0);
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'RND-08 "Jugar otra vez" starts a new Flags round of Europa · Fácil',
    { tag: '@RND-08' },
    async () => {
      await round.playRound(FIRST_ROUND, [0]);
      await summary.playAgainButton.click();

      await expect(round.settings).toHaveText(['Banderas', 'Europa', 'Fácil']);
      await expect(round.progressText).toHaveText('1/10');
      await expect(round.score).toHaveText('Aciertos: 0');
      await expect(round.options).toHaveText(
        questionAt(SECOND_ROUND, 0).options.map((option) => option.name.es),
      );
    },
  );

  test('RND-08 "Menú" goes back to the home screen', { tag: '@RND-08' }, async ({ page }) => {
    await round.playRound(FIRST_ROUND, [0]);
    await summary.menuButton.click();

    await expect(new HomePage(page).heading).toHaveText('¿A qué jugamos?');
  });

  test(
    'NFR-05 every button of the summary has a touch target of at least 48 × 48 px',
    { tag: '@NFR-05' },
    async ({ page }) => {
      await round.playRound(FIRST_ROUND, [0]);
      await expect(summary.playAgainButton).toBeVisible();

      for (const button of await page.getByRole('button').all()) {
        const box = await button.boundingBox();
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(48);
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
      }
    },
  );
});
