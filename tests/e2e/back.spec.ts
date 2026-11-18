import { expectedRounds, questionAt } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { RoundPage } from './pages/RoundPage.ts';
import { SummaryPage } from './pages/SummaryPage.ts';

// "Back" is the browser's Back: the phone's back button and the back gesture do the same (NAV-01).
const [FIRST_ROUND = []] = expectedRounds({ topic: 'flags', region: 'europe', level: 1 }, 1);
const FIRST = questionAt(FIRST_ROUND, 0);

test.describe('The back button goes back inside the game', () => {
  let home: HomePage;
  let setup: GameSetupPage;
  let round: RoundPage;
  let summary: SummaryPage;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    setup = new GameSetupPage(page);
    round = new RoundPage(page);
    summary = new SummaryPage(page);
    // A page before the game, so that leaving it with Back can be seen.
    await page.goto('/?before');
    await home.goto('?seed=42');
    await home.openGame('Bandera → País');
  });

  test(
    'NAV-01 Back goes from "¿Qué nivel?" to "¿Dónde jugamos?" and then home',
    { tag: '@NAV-01' },
    async ({ page }) => {
      await setup.chooseRegion('Europa');
      await expect(setup.levelStep).toBeVisible();

      await page.goBack();
      await expect(setup.regionStep).toBeVisible();
      await expect(setup.levelStep).toBeHidden();

      await page.goBack();
      await expect(home.heading).toHaveText('¿A qué jugamos?');
      await expect(page).toHaveURL(/\/\?seed=42$/);
    },
  );

  test(
    'NAV-01 RND-07 Back during a round asks first; Back again closes the question and the round goes on',
    { tag: ['@NAV-01', '@RND-07'] },
    async ({ page }) => {
      await setup.chooseRegion('Europa');
      await setup.chooseLevel('Fácil');
      await round.answer(FIRST.entity.name.es);

      await page.goBack();
      await expect(round.quitDialog).toBeVisible();
      await expect(round.quitDialog.getByRole('button', { name: 'Seguir jugando' })).toBeFocused();

      await page.goBack();
      await expect(round.quitDialog).toBeHidden();
      await expect(round.progressText).toHaveText('1/10');
      await expect(round.score).toHaveText('Aciertos: 1');
      await expect(round.feedback).toHaveText('¡Correcto!');
      await expect(round.quitButton).toBeFocused();
    },
  );

  test(
    'NAV-01 RND-07 confirming "Sí, salir" after Back goes home, and Back then leaves the game',
    { tag: ['@NAV-01', '@RND-07'] },
    async ({ page }) => {
      await setup.chooseRegion('Europa');
      await setup.chooseLevel('Fácil');

      await page.goBack();
      await round.quitDialog.getByRole('button', { name: 'Sí, salir' }).click();
      await expect(home.heading).toHaveText('¿A qué jugamos?');

      // Nothing of the round is left behind: Back leaves the game, to the page before it.
      await page.goBack();
      await expect(page).toHaveURL(/\/\?before$/);
    },
  );

  test(
    'NAV-01 RND-08 Back on the summary goes home, like "Menú"',
    { tag: ['@NAV-01', '@RND-08'] },
    async ({ page }) => {
      await setup.chooseRegion('Europa');
      await setup.chooseLevel('Fácil');
      await round.playRound(FIRST_ROUND, []);
      await expect(summary.heading).toHaveText('¡Perfecto!');

      await page.goBack();
      await expect(home.heading).toHaveText('¿A qué jugamos?');

      await page.goBack();
      await expect(page).toHaveURL(/\/\?before$/);
    },
  );

  test(
    'NAV-01 RND-08 after "Menú", Back on the home screen leaves the game: no finished round comes back',
    { tag: ['@NAV-01', '@RND-08'] },
    async ({ page }) => {
      await setup.chooseRegion('Europa');
      await setup.chooseLevel('Fácil');
      await round.playRound(FIRST_ROUND, []);
      await summary.menuButton.click();
      await expect(home.heading).toHaveText('¿A qué jugamos?');

      await page.goBack();
      await expect(page).toHaveURL(/\/\?before$/);
    },
  );
});
