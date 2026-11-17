import { expect, test } from './fixtures.ts';
import { StartPage } from './pages/StartPage.ts';

test.describe('Start page', { tag: '@smoke' }, () => {
  test('shows the welcome heading', async ({ page }) => {
    const start = new StartPage(page);
    await start.goto();
    await expect(start.heading).toBeVisible();
  });

  test(
    'NFR-05 has no accessibility violations',
    { tag: '@NFR-05' },
    async ({ page, makeAxeBuilder }) => {
      const start = new StartPage(page);
      await start.goto();
      await expect(start.heading).toBeVisible();
      const results = await makeAxeBuilder().analyze();
      expect(results.violations).toEqual([]);
    },
  );
});
