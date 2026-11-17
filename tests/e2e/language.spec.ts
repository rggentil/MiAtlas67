import { expect, test } from './fixtures.ts';
import { HomePage } from './pages/HomePage.ts';

test.describe('Language', { tag: '@SET-01' }, () => {
  test('SET-01 the app starts in Spanish', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await expect(home.heading).toHaveText('¿A qué jugamos?');
    await expect(home.languageOption('Español')).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });

  test('SET-01 switching to English changes the texts without reloading the page', async ({
    page,
  }) => {
    const home = new HomePage(page);
    await home.goto();
    // Marker on the window object: it disappears if the page reloads.
    await page.evaluate(() => {
      Object.assign(window, { __noReloadMarker: true });
    });

    await home.chooseLanguage('English');

    await expect(home.heading).toHaveText('What shall we play?');
    await expect(home.topic('Flags')).toBeVisible();
    await expect(home.game('Flag → Country')).toBeEnabled();
    await expect(home.languageOption('English')).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(await page.evaluate(() => '__noReloadMarker' in window)).toBe(true);
  });

  test('SET-01 the chosen language is remembered after a reload', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();
    await home.chooseLanguage('English');
    await expect(home.heading).toHaveText('What shall we play?');

    await page.reload();

    await expect(home.heading).toHaveText('What shall we play?');
    await expect(home.languageOption('English')).toBeChecked();
  });

  test(
    'NFR-05 the home screen in English has no accessibility violations',
    { tag: '@NFR-05' },
    async ({ page, makeAxeBuilder }) => {
      const home = new HomePage(page);
      await home.goto();
      await home.chooseLanguage('English');
      await expect(home.heading).toHaveText('What shall we play?');
      const results = await makeAxeBuilder().analyze();
      expect(results.violations).toEqual([]);
    },
  );
});
