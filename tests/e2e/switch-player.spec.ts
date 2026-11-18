import { savedLastPlayer } from './device.ts';
import { expect, test } from './fixtures.ts';
import { HomePage } from './pages/HomePage.ts';
import { NewPlayerPage } from './pages/NewPlayerPage.ts';
import { PlayersPage } from './pages/PlayersPage.ts';

test.describe('Switch player from the home screen', () => {
  let home: HomePage;
  let players: PlayersPage;

  /** "Lucía" and "Pablo" on the device, and Lucía playing on the home screen. */
  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    players = new PlayersPage(page);
    const newPlayer = new NewPlayerPage(page);
    await home.goto();
    await home.switchPlayerButton.click();
    await players.newPlayerButton.click();
    await newPlayer.create('Pablo', 'Búho');
    await expect(home.switchPlayerButton).toHaveAccessibleName('Pablo');
    await home.switchPlayerButton.click();
    await players.choose('Lucía');
    await expect(home.switchPlayerButton).toHaveAccessibleName('Lucía');
  });

  test(
    'PRF-03 PRF-01 NFR-05 the player button "Lucía" opens «¿Quién juega?», and "Pablo" then plays, marked as the last player the next time',
    { tag: ['@PRF-03', '@PRF-01', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      await expect(home.switchPlayerButton).toHaveAccessibleDescription('Cambiar de jugador');
      const box = await home.switchPlayerButton.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(48);
      expect(box?.height).toBeGreaterThanOrEqual(48);
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);

      await home.switchPlayerButton.click();
      await expect(players.heading).toHaveText('¿Quién juega?');
      await expect(players.exitDialog).toBeHidden();

      await players.choose('Pablo');
      await expect(home.heading).toHaveText('¿A qué jugamos?');
      await expect(home.currentPlayer).toHaveText('Pablo');
      await expect(home.currentPlayer.getByRole('img', { name: 'Búho' })).toBeVisible();

      // The game saves who played last in the background: the reload waits until it is saved.
      await expect.poll(() => savedLastPlayer(page)).toBe('Pablo');
      await page.reload();
      await expect(players.player('Pablo')).toHaveAccessibleDescription('Jugó la última vez');
      await expect(players.player('Lucía')).not.toHaveAccessibleDescription(/./);
    },
  );

  test(
    'PRF-03 NFR-05 a 12-letter nickname keeps the player button 48 px high and the home screen within 320 px',
    { tag: ['@PRF-03', '@NFR-05'] },
    async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await home.switchPlayerButton.click();
      await players.newPlayerButton.click();
      await new NewPlayerPage(page).create('Mariaisabela', 'Unicornio');
      await expect(home.switchPlayerButton).toHaveAccessibleName('Mariaisabela');

      const box = await home.switchPlayerButton.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(48);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        320,
      );
    },
  );

  test('PRF-03 tapping the same player keeps playing as "Lucía"', { tag: '@PRF-03' }, async () => {
    await home.switchPlayerButton.click();
    await expect(players.player('Lucía')).toHaveAccessibleDescription('Jugó la última vez');

    await players.choose('Lucía');

    await expect(home.heading).toHaveText('¿A qué jugamos?');
    await expect(home.currentPlayer).toHaveText('Lucía');
    await expect(home.currentPlayer.getByRole('img', { name: 'Zorro' })).toBeVisible();
  });

  test(
    'PRF-03 NAV-02 after the player button, Back on «¿Quién juega?» asks "¿Salir del juego?"',
    { tag: ['@PRF-03', '@NAV-02'] },
    async ({ page }) => {
      await home.switchPlayerButton.click();
      await players.onlyOwnEntryLeft();

      await page.goBack();

      await expect(players.exitDialog).toBeVisible();
    },
  );
});
