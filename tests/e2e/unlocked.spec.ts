import { savedPlayerId, savedRoundsOf } from './device.ts';
import { expectedRound } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { RoundPage } from './pages/RoundPage.ts';
import { SummaryPage } from './pages/SummaryPage.ts';

test.describe('«¡Nivel desbloqueado!» in the round summary', () => {
  test(
    'RND-08 LVL-04 NFR-05 8/10 in "Europa · Fácil" shows "¡Nivel desbloqueado! Medio", and "Menú" then finds Medio open',
    { tag: ['@RND-08', '@LVL-04', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      const home = new HomePage(page);
      const setup = new GameSetupPage(page);
      const summary = new SummaryPage(page);
      await home.goto('?seed=42');
      const lucia = (await savedPlayerId(page, 'Lucía')) ?? -1;
      await home.openGame('Bandera → País');
      await setup.chooseRegion('Europa');
      await expect(setup.level('Medio')).toHaveAccessibleName('Medio, bloqueado');
      await setup.chooseLevel('Fácil');

      // The first two questions are missed: 8/10, ★★.
      await new RoundPage(page).playRound(
        expectedRound({ topic: 'flags', region: 'europe', level: 1 }),
        [0, 1],
      );

      await expect(summary.score('8/10')).toBeVisible();
      await expect(summary.unlocked).toHaveText('¡Nivel desbloqueado! Medio');
      await expect(summary.newRecord).toHaveCount(0);
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);

      await expect.poll(() => savedRoundsOf(page, lucia)).toBe(1);
      await summary.menuButton.click();
      await home.openGame('Bandera → País');
      await setup.chooseRegion('Europa');
      await expect(setup.level('Medio')).toHaveAccessibleName('Medio');
      await expect(setup.level('Difícil')).toHaveAccessibleName('Difícil, bloqueado');
    },
  );

  test(
    'RND-08 7/10 in "Europa · Fácil" opens nothing: no "¡Nivel desbloqueado!"',
    { tag: '@RND-08' },
    async ({ page }) => {
      const home = new HomePage(page);
      const setup = new GameSetupPage(page);
      const summary = new SummaryPage(page);
      await home.goto('?seed=42');
      const lucia = (await savedPlayerId(page, 'Lucía')) ?? -1;
      await home.openGame('Bandera → País');
      await setup.chooseRegion('Europa');
      await setup.chooseLevel('Fácil');

      await new RoundPage(page).playRound(
        expectedRound({ topic: 'flags', region: 'europe', level: 1 }),
        [0, 1, 2],
      );

      await expect(summary.score('7/10')).toBeVisible();
      // The summary knows what the round opened before the round is saved.
      await expect.poll(() => savedRoundsOf(page, lucia)).toBe(1);
      await expect(summary.unlocked).toHaveCount(0);
    },
  );
});
