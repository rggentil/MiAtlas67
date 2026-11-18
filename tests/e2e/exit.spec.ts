import type { Page } from '@playwright/test';
import { expectedRounds } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { RoundPage } from './pages/RoundPage.ts';
import { SummaryPage } from './pages/SummaryPage.ts';

// "Back" is the browser's Back: the phone's back button and the back gesture do the same (NAV-01).
// Playwright's goBack() goes to the previous history entry directly, while Chrome's own back button skips
// entries a page added without a tap; the component tests check that the game never adds one that way.
const [FIRST_ROUND = []] = expectedRounds({ topic: 'flags', region: 'europe', level: 1 }, 1);
const GAME_ADDRESS = /\/\?seed=42$/;
const PAGE_BEFORE = /\/\?before$/;

/** Waits until the game keeps only the home screen's own history entry (it trims the others a moment after
 * going home). */
async function onlyHomeEntryLeft(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => window.history.state as unknown))
    .toEqual({ miatlas: 1 });
}

test.describe('Back on the home screen asks before leaving the game', () => {
  let home: HomePage;
  let setup: GameSetupPage;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    setup = new GameSetupPage(page);
    // A page before the game, so that leaving it with Back can be seen.
    await page.goto('/?before');
    await home.goto('?seed=42');
    await expect(home.heading).toHaveText('¿A qué jugamos?');
  });

  /** A tap in the game: open "Bandera → País" and come back with "Volver". */
  async function tapAround(page: Page): Promise<void> {
    await home.openGame('Bandera → País');
    await setup.backButton.click();
    await expect(home.heading).toHaveText('¿A qué jugamos?');
    await onlyHomeEntryLeft(page);
  }

  test(
    'NAV-02 after a tap, Back on the home screen asks "¿Salir del juego?" and stays in the game',
    { tag: '@NAV-02' },
    async ({ page, makeAxeBuilder }) => {
      await tapAround(page);

      await page.goBack();

      await expect(home.exitDialog).toBeVisible();
      await expect(home.exitDialog).toContainText('Pulsa atrás otra vez para salir.');
      // One button only: a web page cannot close itself, so there is no "Sí, salir" (D20).
      await expect(home.exitDialog.getByRole('button')).toHaveText(['Seguir jugando']);
      await expect(home.exitStayButton).toBeFocused();
      await expect(page).toHaveURL(GAME_ADDRESS);
      const box = await home.exitStayButton.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(48);
      expect(box?.height).toBeGreaterThanOrEqual(48);
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'NAV-02 Back again leaves the game, to the page before it',
    { tag: '@NAV-02' },
    async ({ page }) => {
      await tapAround(page);
      await page.goBack();
      await expect(home.exitDialog).toBeVisible();

      await page.goBack();

      await expect(page).toHaveURL(PAGE_BEFORE);
    },
  );

  test(
    'NAV-02 "Seguir jugando" closes the question, and Back asks again',
    { tag: '@NAV-02' },
    async ({ page }) => {
      await tapAround(page);
      await page.goBack();

      await home.exitStayButton.click();

      await expect(home.exitDialog).toBeHidden();
      await expect(home.heading).toBeFocused();
      await page.goBack();
      await expect(home.exitDialog).toBeVisible();
      await expect(page).toHaveURL(GAME_ADDRESS);
    },
  );

  test(
    'NAV-02 RND-08 after "Menú", Back asks first, and no finished round comes back',
    { tag: ['@NAV-02', '@RND-08'] },
    async ({ page }) => {
      const round = new RoundPage(page);
      const summary = new SummaryPage(page);
      await home.openGame('Bandera → País');
      await setup.chooseRegion('Europa');
      await setup.chooseLevel('Fácil');
      await round.playRound(FIRST_ROUND, []);
      await summary.menuButton.click();
      await expect(home.heading).toHaveText('¿A qué jugamos?');
      await onlyHomeEntryLeft(page);

      await page.goBack();
      await expect(home.exitDialog).toBeVisible();
      await expect(home.heading).toHaveText('¿A qué jugamos?');

      await page.goBack();
      await expect(page).toHaveURL(PAGE_BEFORE);
    },
  );

  test(
    'NAV-02 Back before the first tap leaves the game without asking',
    { tag: '@NAV-02' },
    async ({ page }) => {
      await page.goBack();

      await expect(page).toHaveURL(PAGE_BEFORE);
    },
  );

  test(
    'NAV-02 SET-01 in English: "Leave the game?", "Press Back again to leave." and "Keep playing"',
    { tag: ['@NAV-02', '@SET-01'] },
    async ({ page }) => {
      await home.chooseLanguage('English');
      await expect(home.heading).toHaveText('What shall we play?');

      await page.goBack();

      const dialog = page.getByRole('dialog', { name: 'Leave the game?' });
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('Press Back again to leave.');
      await expect(dialog.getByRole('button')).toHaveText(['Keep playing']);
    },
  );
});
