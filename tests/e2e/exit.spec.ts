import { expectedRounds } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { NewPlayerPage } from './pages/NewPlayerPage.ts';
import { PlayersPage } from './pages/PlayersPage.ts';
import { RoundPage } from './pages/RoundPage.ts';
import { SummaryPage } from './pages/SummaryPage.ts';

// "Back" is the browser's Back: the phone's back button and the back gesture do the same (NAV-01).
// Playwright's goBack() goes to the previous history entry directly, while Chrome's own back button skips
// entries a page added without a tap; the component tests check that the game never adds one that way.
const [FIRST_ROUND = []] = expectedRounds({ topic: 'flags', region: 'europe', level: 1 }, 1);
const GAME_ADDRESS = /\/\?seed=42$/;
const PAGE_BEFORE = /\/\?before$/;

test.describe('Back on «¿Quién juega?» asks before leaving the game', () => {
  let players: PlayersPage;
  let newPlayer: NewPlayerPage;

  test.beforeEach(async ({ page }) => {
    players = new PlayersPage(page);
    newPlayer = new NewPlayerPage(page);
    // A page before the game, so that leaving it with Back can be seen.
    await page.goto('/?before');
    await players.goto('?seed=42');
  });

  /** A tap in the game: open "Nuevo jugador" and come back with "Volver". */
  async function tapAround(): Promise<void> {
    await players.newPlayerButton.click();
    await newPlayer.backButton.click();
    await expect(players.heading).toHaveText('¿Quién juega?');
    await players.onlyOwnEntryLeft();
    // Coming back does not open the question by itself: only the player's Back does.
    await expect(players.exitDialog).toBeHidden();
  }

  test(
    'NAV-02 after a tap, Back on «¿Quién juega?» asks "¿Salir del juego?" and stays in the game',
    { tag: '@NAV-02' },
    async ({ page, makeAxeBuilder }) => {
      await tapAround();

      await page.goBack();

      await expect(players.exitDialog).toBeVisible();
      await expect(players.exitDialog).toContainText('Pulsa atrás otra vez para salir.');
      // One button only: a web page cannot close itself, so there is no "Sí, salir" (D20).
      await expect(players.exitDialog.getByRole('button')).toHaveText(['Seguir jugando']);
      await expect(players.exitStayButton).toBeFocused();
      await expect(page).toHaveURL(GAME_ADDRESS);
      const box = await players.exitStayButton.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(48);
      expect(box?.height).toBeGreaterThanOrEqual(48);
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'NAV-02 Back again leaves the game, to the page before it',
    { tag: '@NAV-02' },
    async ({ page }) => {
      await tapAround();
      await page.goBack();
      await expect(players.exitDialog).toBeVisible();

      await page.goBack();

      await expect(page).toHaveURL(PAGE_BEFORE);
    },
  );

  test(
    'NAV-02 while the question is open, the page behind cannot be reached, and after taps in it Back still leaves',
    { tag: '@NAV-02' },
    async ({ page }) => {
      await tapAround();
      await page.goBack();
      await expect(players.exitStayButton).toBeFocused();

      for (let press = 0; press < 4; press++) {
        await page.keyboard.press('Tab');
        const outside = await page.evaluate(() => {
          const active = document.activeElement;
          return active !== null && active !== document.body && !active.closest('[role="dialog"]');
        });
        expect(outside).toBe(false);
      }
      await players.exitDialog.getByText('Pulsa atrás otra vez para salir.').click();
      await expect(players.exitDialog).toBeVisible();

      // As the question says: Back again leaves, whatever was tapped in it.
      await page.goBack();
      await expect(page).toHaveURL(PAGE_BEFORE);
    },
  );

  test(
    'NAV-02 "Seguir jugando" closes the question, and Back asks again',
    { tag: '@NAV-02' },
    async ({ page }) => {
      await tapAround();
      await page.goBack();

      await players.exitStayButton.click();

      await expect(players.exitDialog).toBeHidden();
      await expect(players.heading).toBeFocused();
      await page.goBack();
      await expect(players.exitDialog).toBeVisible();
      await expect(page).toHaveURL(GAME_ADDRESS);
    },
  );

  test(
    'NAV-01 NAV-02 Back on the home screen goes to «¿Quién juega?», and Back again asks "¿Salir del juego?" (D22)',
    { tag: ['@NAV-01', '@NAV-02'] },
    async ({ page }) => {
      const home = new HomePage(page);
      await players.newPlayerButton.click();
      await newPlayer.create('Lucía', 'Zorro');
      await expect(home.heading).toHaveText('¿A qué jugamos?');

      await page.goBack();
      await expect(players.heading).toHaveText('¿Quién juega?');
      await expect(players.exitDialog).toBeHidden();
      await expect(players.player('Lucía')).toBeVisible();

      await page.goBack();
      await expect(players.exitDialog).toBeVisible();
      await expect(page).toHaveURL(GAME_ADDRESS);

      await page.goBack();
      await expect(page).toHaveURL(PAGE_BEFORE);
    },
  );

  test(
    'NAV-02 NAV-01 after "Menú", Back goes to «¿Quién juega?» and then asks first, and no finished round comes back',
    { tag: ['@NAV-02', '@NAV-01'] },
    async ({ page }) => {
      const home = new HomePage(page);
      const setup = new GameSetupPage(page);
      const round = new RoundPage(page);
      const summary = new SummaryPage(page);
      await players.newPlayerButton.click();
      await newPlayer.create('Lucía', 'Zorro');
      await home.openGame('Bandera → País');
      await setup.chooseRegion('Europa');
      await setup.chooseLevel('Fácil');
      await round.playRound(FIRST_ROUND, []);
      await summary.menuButton.click();
      await expect(home.heading).toHaveText('¿A qué jugamos?');

      await page.goBack();
      await expect(players.heading).toHaveText('¿Quién juega?');
      await players.onlyOwnEntryLeft();
      await expect(players.exitDialog).toBeHidden();

      await page.goBack();
      await expect(players.exitDialog).toBeVisible();
      await expect(players.heading).toHaveText('¿Quién juega?');

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
      await page.getByText('English', { exact: true }).click();
      await expect(players.heading).toHaveText("Who's playing?");

      await page.goBack();

      const dialog = players.exitDialogNamed('Leave the game?');
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('Press Back again to leave.');
      await expect(dialog.getByRole('button')).toHaveText(['Keep playing']);
    },
  );
});
