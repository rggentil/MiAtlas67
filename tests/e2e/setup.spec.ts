import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { RoundPage } from './pages/RoundPage.ts';

test.describe('Choose region and level', () => {
  test(
    'LVL-01 choosing "Europa" and "Fácil" starts a Flags round of Europa, level Fácil',
    { tag: '@LVL-01' },
    async ({ page, makeAxeBuilder }) => {
      const home = new HomePage(page);
      const setup = new GameSetupPage(page);
      const round = new RoundPage(page);
      await home.goto('?seed=42');

      await home.openGame('Bandera → País');
      await setup.chooseRegion('Europa');
      await setup.chooseLevel('Fácil');

      await expect(round.heading).toHaveText('¿De qué país es?');
      await expect(round.settings).toHaveText(['Banderas', 'Europa', 'Fácil']);
      await expect(round.progressText).toHaveText('1/10');
      await expect(round.progressBar).toHaveAttribute('aria-valuenow', '1');
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'LVL-02 the regions are Mundo, Europa, África, América, Asia and Oceanía, all open',
    { tag: '@LVL-02' },
    async ({ page }) => {
      const home = new HomePage(page);
      const setup = new GameSetupPage(page);
      await home.goto();

      await home.openGame('País → Bandera');

      await expect(setup.heading).toHaveText('País → Bandera');
      await expect(setup.regionStep.getByRole('button')).toHaveText([
        'Mundo',
        'Europa',
        'África',
        'América',
        'Asia',
        'Oceanía',
      ]);
      for (const region of await setup.regionStep.getByRole('button').all()) {
        await expect(region).toBeEnabled();
      }
    },
  );

  test(
    'LVL-01 after a region, the levels are Fácil, Medio and Difícil; "Volver" goes back a step',
    { tag: '@LVL-01' },
    async ({ page }) => {
      const home = new HomePage(page);
      const setup = new GameSetupPage(page);
      await home.goto();
      await home.openGame('Bandera → País');

      await setup.chooseRegion('Oceanía');
      await expect(setup.levelStep.getByRole('button')).toHaveText(['Fácil', 'Medio', 'Difícil']);
      for (const level of await setup.levelStep.getByRole('button').all()) {
        await expect(level).toBeEnabled();
      }
      await expect(setup.regionStep).toHaveCount(0);

      await setup.backButton.click();
      await expect(setup.regionStep).toBeVisible();
      await setup.backButton.click();
      await expect(home.heading).toHaveText('¿A qué jugamos?');
    },
  );

  test(
    'NFR-05 both setup steps have no accessibility violations and 48 × 48 px buttons',
    { tag: '@NFR-05' },
    async ({ page, makeAxeBuilder }) => {
      const home = new HomePage(page);
      const setup = new GameSetupPage(page);
      await home.goto();
      await home.openGame('Bandera → País');

      for (const step of ['region', 'level'] as const) {
        await expect(step === 'region' ? setup.regionStep : setup.levelStep).toBeVisible();
        expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
        for (const button of await page.getByRole('button').all()) {
          const box = await button.boundingBox();
          expect(box?.width ?? 0).toBeGreaterThanOrEqual(48);
          expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
        }
        if (step === 'region') await setup.chooseRegion('Europa');
      }
    },
  );
});
