import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';

test.describe('Home screen', { tag: '@GAME-01' }, () => {
  test('GAME-01 shows six games grouped by topic', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await expect(home.heading).toHaveText('¿A qué jugamos?');
    await expect(home.topics).toHaveCount(3);
    for (const topic of ['Banderas', 'Capitales', 'Siluetas']) {
      await expect(home.topic(topic)).toBeVisible();
      await expect(home.topic(topic).getByRole('button')).toHaveCount(2);
    }
  });

  test('GAME-01 only the Flags games can be opened in this phase', async ({ page }) => {
    const home = new HomePage(page);
    const game = new GameSetupPage(page);
    await home.goto();

    for (const name of ['Bandera → País', 'País → Bandera']) {
      await home.openGame(name);
      await expect(game.heading).toHaveText(name);
      await game.backButton.click();
      await expect(home.heading).toHaveText('¿A qué jugamos?');
    }

    for (const name of ['País → Capital', 'Capital → País', 'Silueta → País', 'País → Silueta']) {
      await expect(home.game(name)).toBeDisabled();
      await expect(home.game(name)).toContainText('Pronto');
    }
  });

  test(
    'NFR-05 every button of the home screen has a touch target of at least 48 × 48 px',
    { tag: '@NFR-05' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();
      await expect(home.heading).toBeVisible();

      const buttons = await page.getByRole('button').all();
      expect(buttons.length).toBeGreaterThanOrEqual(6);
      for (const button of buttons) {
        const box = await button.boundingBox();
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(48);
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
      }
    },
  );

  test(
    'NFR-05 the home screen and a game screen have no accessibility violations',
    { tag: '@NFR-05' },
    async ({ page, makeAxeBuilder }) => {
      const home = new HomePage(page);
      await home.goto();
      await expect(home.heading).toBeVisible();
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);

      await home.openGame('Bandera → País');
      await expect(new GameSetupPage(page).heading).toBeVisible();
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );
});
