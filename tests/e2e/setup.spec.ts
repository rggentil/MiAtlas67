import { openLevel, savedPlayerId, saveResults } from './device.ts';
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

      await expect(round.heading).toHaveText('¿De qué país es esta bandera?');
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
      await expect(setup.levelStep.getByRole('button')).toHaveCount(3);
      for (const [index, name] of ['Fácil', 'Medio', 'Difícil'].entries()) {
        await expect(setup.levelStep.getByRole('button').nth(index)).toHaveAccessibleName(
          new RegExp(`^${name}`),
        );
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
        // A new player: the level step has two locked levels too (LVL-05).
        if (step === 'level') await expect(setup.level('Difícil')).toBeDisabled();
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

  test(
    'LVL-04 LVL-05 a new player has Fácil open; Medio and Difícil show a padlock and how to open them, and do nothing when tapped',
    { tag: ['@LVL-04', '@LVL-05'] },
    async ({ page }) => {
      const home = new HomePage(page);
      const setup = new GameSetupPage(page);
      await home.goto();
      await home.openGame('Bandera → País');
      await setup.chooseRegion('Europa');

      await expect(setup.level('Fácil')).toHaveAccessibleName('Fácil');
      await expect(setup.level('Fácil')).toBeEnabled();
      await expect(setup.level('Medio')).toHaveAccessibleName('Medio, bloqueado');
      await expect(setup.level('Medio')).toBeDisabled();
      await expect(setup.level('Medio')).toHaveAccessibleDescription(
        'Consigue ★★ en Fácil para desbloquear',
      );
      await expect(setup.level('Difícil')).toHaveAccessibleName('Difícil, bloqueado');
      await expect(setup.level('Difícil')).toHaveAccessibleDescription(
        'Consigue ★★ en Medio para desbloquear',
      );
      await expect(page.getByText('Consigue ★★ en Fácil para desbloquear')).toBeVisible();

      // force: Playwright waits for an enabled element, and a locked level is reported as disabled.
      await setup.level('Medio').click({ force: true });
      await setup.level('Difícil').click({ force: true });
      await expect(setup.levelStep).toBeVisible();
      await expect(setup.level('Medio')).toHaveAccessibleName('Medio, bloqueado');
      await expect(new RoundPage(page).progressText).toHaveCount(0);
    },
  );

  test(
    'LVL-04 ★★ in "Europa · Fácil" opens "Medio", which plays; "Difícil" and "África · Medio" stay locked',
    { tag: '@LVL-04' },
    async ({ page }) => {
      const home = new HomePage(page);
      const setup = new GameSetupPage(page);
      const round = new RoundPage(page);
      await home.goto('?seed=42');
      await openLevel(page, 'FLAG-A', 'europe', 2);
      await home.openGame('Bandera → País');

      await setup.chooseRegion('Europa');
      await expect(setup.level('Difícil')).toHaveAccessibleName('Difícil, bloqueado');
      await setup.backButton.click();
      await setup.chooseRegion('África');
      await expect(setup.level('Medio')).toHaveAccessibleName('Medio, bloqueado');
      await setup.backButton.click();
      await setup.chooseRegion('Europa');
      await setup.chooseLevel('Medio');

      await expect(round.settings).toHaveText(['Banderas', 'Europa', 'Medio']);
      await expect(round.options).toHaveCount(4);
    },
  );

  test(
    'LVL-04 D26 a level with a round played before unlocking arrived stays open',
    { tag: '@LVL-04' },
    async ({ page }) => {
      const home = new HomePage(page);
      const setup = new GameSetupPage(page);
      await home.goto('?seed=42');
      const lucia = await savedPlayerId(page, 'Lucía');
      expect(lucia).not.toBeNull();
      await saveResults(page, lucia ?? -1, [
        { game: 'FLAG-A', region: 'europe', level: 1, score: 6, stars: 1 },
        { game: 'FLAG-A', region: 'europe', level: 3, score: 4, stars: 0 },
      ]);
      await home.openGame('Bandera → País');
      await setup.chooseRegion('Europa');

      await expect(setup.level('Medio')).toHaveAccessibleName('Medio, bloqueado');
      await expect(setup.level('Difícil')).toHaveAccessibleName('Difícil');
      await expect(setup.level('Difícil')).toBeEnabled();
    },
  );
});
