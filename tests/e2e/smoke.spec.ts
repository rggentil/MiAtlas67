import { expect, test } from './fixtures.ts';
import { HomePage } from './pages/HomePage.ts';

test.describe('App start', { tag: '@smoke' }, () => {
  test('opens, and a new player reaches the home screen', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();
    await expect(home.heading).toHaveText('¿A qué jugamos?');
  });
});
