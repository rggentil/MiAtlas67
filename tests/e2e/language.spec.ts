import { expect, test } from './fixtures.ts';
import { StartPage } from './pages/StartPage.ts';

test.describe('Language', { tag: '@SET-01' }, () => {
  test('SET-01 the app starts in Spanish', async ({ page }) => {
    const start = new StartPage(page);
    await start.goto();

    await expect(start.heading).toHaveText('Hola MiAtlas67');
    await expect(start.languageOption('Español')).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });

  test('SET-01 switching to English changes the texts without reloading the page', async ({
    page,
  }) => {
    const start = new StartPage(page);
    await start.goto();
    // Marker on the window object: it disappears if the page reloads.
    await page.evaluate(() => {
      Object.assign(window, { __noReloadMarker: true });
    });

    await start.chooseLanguage('English');

    await expect(start.heading).toHaveText('Hello MiAtlas67');
    await expect(start.tagline).toHaveText('Flags, capitals and shapes of the world');
    await expect(start.languageOption('English')).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(await page.evaluate(() => '__noReloadMarker' in window)).toBe(true);
  });

  test('SET-01 the chosen language is remembered after a reload', async ({ page }) => {
    const start = new StartPage(page);
    await start.goto();
    await start.chooseLanguage('English');
    await expect(start.heading).toHaveText('Hello MiAtlas67');

    await page.reload();

    await expect(start.heading).toHaveText('Hello MiAtlas67');
    await expect(start.languageOption('English')).toBeChecked();
  });

  test(
    'NFR-05 the start page in English has no accessibility violations',
    { tag: '@NFR-05' },
    async ({ page, makeAxeBuilder }) => {
      const start = new StartPage(page);
      await start.goto();
      await start.chooseLanguage('English');
      await expect(start.heading).toHaveText('Hello MiAtlas67');
      const results = await makeAxeBuilder().analyze();
      expect(results.violations).toEqual([]);
    },
  );
});
