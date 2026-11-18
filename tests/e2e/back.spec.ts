import type { Page } from '@playwright/test';
import { expectedRounds, questionAt } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { RoundPage } from './pages/RoundPage.ts';
import { SummaryPage } from './pages/SummaryPage.ts';

// "Back" is the browser's Back: the phone's back button and the back gesture do the same (NAV-01).
// Playwright's goBack() goes to the previous history entry directly, while Chrome's own back button skips
// entries a page added without a tap; the component tests check that the game never adds one that way.
const [FIRST_ROUND = []] = expectedRounds({ topic: 'flags', region: 'europe', level: 1 }, 1);
const FIRST = questionAt(FIRST_ROUND, 0);
const GAME_ADDRESS = /\/\?seed=42$/;
const PAGE_BEFORE = /\/\?before$/;

/** Waits until the game keeps only the home screen's own history entry (it trims the others a moment after
 * going home). */
async function onlyHomeEntryLeft(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => window.history.state as unknown))
    .toEqual({ miatlas: 1 });
}

test.describe('The back button goes back inside the game', () => {
  let home: HomePage;
  let setup: GameSetupPage;
  let round: RoundPage;
  let summary: SummaryPage;

  /** Home is where Back leaves the game: it asks "¿Salir del juego?" first (NAV-02), and Back again leaves. */
  async function backAsksThenLeaves(page: Page): Promise<void> {
    await onlyHomeEntryLeft(page);
    await page.goBack();
    await expect(home.exitDialog).toBeVisible();
    await expect(page).toHaveURL(GAME_ADDRESS);

    await page.goBack();
    await expect(page).toHaveURL(PAGE_BEFORE);
  }

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    setup = new GameSetupPage(page);
    round = new RoundPage(page);
    summary = new SummaryPage(page);
    // A page before the game, so that leaving it with Back can be seen.
    await page.goto('/?before');
    await home.goto('?seed=42');
    await home.openGame('Bandera → País');
    await expect(page).toHaveURL(GAME_ADDRESS);
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
      await expect(page).toHaveURL(GAME_ADDRESS);

      await page.goBack();
      await expect(home.heading).toHaveText('¿A qué jugamos?');
      await expect(home.exitDialog).toBeHidden();
      await expect(page).toHaveURL(GAME_ADDRESS);
    },
  );

  test(
    'NAV-01 NAV-02 after "Volver" to the home screen, Back asks before leaving the game',
    { tag: ['@NAV-01', '@NAV-02'] },
    async ({ page }) => {
      await setup.backButton.click();
      await expect(home.heading).toHaveText('¿A qué jugamos?');

      await backAsksThenLeaves(page);
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
      await expect(round.stayButton).toBeFocused();
      await expect(page).toHaveURL(GAME_ADDRESS);

      await page.goBack();
      await expect(round.quitDialog).toBeHidden();
      await expect(round.progressText).toHaveText('1/10');
      await expect(round.score).toHaveText('Aciertos: 1');
      await expect(round.feedback).toHaveText('¡Correcto!');
      await expect(round.quitButton).toBeFocused();

      // A third Back without a tap in between still stays in the game and asks again.
      await page.goBack();
      await expect(round.quitDialog).toBeVisible();
      await expect(page).toHaveURL(GAME_ADDRESS);
    },
  );

  test(
    'NAV-01 RND-07 NAV-02 confirming "Sí, salir" after Back goes home, and Back then asks before leaving',
    { tag: ['@NAV-01', '@RND-07', '@NAV-02'] },
    async ({ page }) => {
      await setup.chooseRegion('Europa');
      await setup.chooseLevel('Fácil');

      await page.goBack();
      await round.confirmQuitButton.click();
      await expect(home.heading).toHaveText('¿A qué jugamos?');

      // Nothing of the round is left behind.
      await backAsksThenLeaves(page);
    },
  );

  test(
    'NAV-01 Back on the summary goes home, like "Menú"',
    { tag: '@NAV-01' },
    async ({ page }) => {
      await setup.chooseRegion('Europa');
      await setup.chooseLevel('Fácil');
      await round.playRound(FIRST_ROUND, []);
      await expect(summary.heading).toHaveText('¡Perfecto!');
      await expect(page).toHaveURL(GAME_ADDRESS);

      await page.goBack();
      await expect(home.heading).toHaveText('¿A qué jugamos?');
      await expect(home.exitDialog).toBeHidden();
      await expect(page).toHaveURL(GAME_ADDRESS);

      await backAsksThenLeaves(page);
    },
  );

  test(
    'NAV-01 NAV-02 a reload in the middle of the game opens home, and Back then asks before leaving',
    { tag: ['@NAV-01', '@NAV-02'] },
    async ({ page }) => {
      await setup.chooseRegion('Europa');

      await page.reload();
      await expect(home.heading).toHaveText('¿A qué jugamos?');

      await backAsksThenLeaves(page);
    },
  );

  test(
    'NAV-01 NAV-02 Forward after going home with Back stays home, and Back then asks before leaving',
    { tag: ['@NAV-01', '@NAV-02'] },
    async ({ page }) => {
      await page.goBack();
      await expect(home.heading).toHaveText('¿A qué jugamos?');
      await onlyHomeEntryLeft(page);

      await page.goForward();
      await expect(home.heading).toHaveText('¿A qué jugamos?');
      await expect(page).toHaveURL(GAME_ADDRESS);

      await backAsksThenLeaves(page);
    },
  );
});
