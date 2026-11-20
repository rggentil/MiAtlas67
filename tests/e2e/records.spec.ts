import type { Page } from '@playwright/test';
import { savedPlayerId, saveResults } from './device.ts';
import { expect, test } from './fixtures.ts';
import { HomePage } from './pages/HomePage.ts';
import { NewPlayerPage } from './pages/NewPlayerPage.ts';
import { PlayersPage } from './pages/PlayersPage.ts';
import { RecordsPage } from './pages/RecordsPage.ts';

/** A finished "Bandera → País" round in "Europa · Fácil" with `score`, to save straight into the database. */
function europeEasy(score: number) {
  const stars = score === 10 ? 3 : score >= 8 ? 2 : score >= 5 ? 1 : 0;
  return { game: 'FLAG-A', region: 'europe', level: 1, score, stars } as const;
}

test.describe('Family records', () => {
  let home: HomePage;
  let records: RecordsPage;

  /** Lucía (created by HomePage.goto) and Pablo, who plays now; returns their ids. */
  async function luciaAndPablo(page: Page): Promise<{ lucia: number; pablo: number }> {
    await home.switchPlayerButton.click();
    await new PlayersPage(page).newPlayerButton.click();
    await new NewPlayerPage(page).create('Pablo', 'Búho');
    await expect(home.heading).toHaveText('¿A qué jugamos?');
    return {
      lucia: (await savedPlayerId(page, 'Lucía')) ?? -1,
      pablo: (await savedPlayerId(page, 'Pablo')) ?? -1,
    };
  }

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    records = new RecordsPage(page);
    await home.goto();
  });

  test(
    'HIS-05 NAV-01 NFR-05 "Récords" opens "Récords de la familia"; "Volver" and Back go home',
    { tag: ['@HIS-05', '@NAV-01', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      await home.recordsButton.click();

      await expect(records.heading).toHaveText('Récords de la familia');
      await expect(records.tables).toHaveCount(6);
      await expect(records.cell('Bandera → País', 'Europa', 'Fácil')).toHaveText('Sin récord');
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
      for (const button of await page.getByRole('button').all()) {
        const box = await button.boundingBox();
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(48);
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
      }

      await records.backButton.click();
      await expect(home.heading).toHaveText('¿A qué jugamos?');

      await home.recordsButton.click();
      await expect(records.heading).toHaveText('Récords de la familia');
      await page.goBack();
      await expect(home.heading).toHaveText('¿A qué jugamos?');
    },
  );

  test(
    'HIS-05 D28 NFR-05 the best score of the family, with who holds it; a tie keeps the first holder',
    { tag: ['@HIS-05', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      const { lucia, pablo } = await luciaAndPablo(page);
      // Pablo's 9/10 is saved first, so Lucía's 9/10 is a tie and the record stays his.
      await saveResults(page, pablo, [europeEasy(9)]);
      await saveResults(page, lucia, [europeEasy(9), { ...europeEasy(8), region: 'africa' }]);

      await home.recordsButton.click();

      const europe = records.cell('Bandera → País', 'Europa', 'Fácil');
      await expect(europe).toContainText('9/10');
      await expect(europe).toContainText('Pablo');
      await expect(europe).not.toContainText('Lucía');
      await expect(records.cell('Bandera → País', 'África', 'Fácil')).toHaveText('8/10Lucía');
      await expect(records.cell('País → Bandera', 'Europa', 'Fácil')).toHaveText('Sin récord');
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'HIS-05 PRF-04 a record of a deleted player goes to the best of the others',
    { tag: ['@HIS-05', '@PRF-04'] },
    async ({ page }) => {
      const { lucia, pablo } = await luciaAndPablo(page);
      await saveResults(page, pablo, [europeEasy(10)]);
      await saveResults(page, lucia, [europeEasy(8)]);
      await home.recordsButton.click();
      await expect(records.cell('Bandera → País', 'Europa', 'Fácil')).toHaveText('10/10Pablo');

      await records.backButton.click();
      await home.switchPlayerButton.click();
      const players = new PlayersPage(page);
      await players.editButton('Pablo').click();
      const form = new NewPlayerPage(page);
      await form.deleteButton.click();
      await form.deleteDialog('Pablo').getByRole('button', { name: 'Sí, borrar' }).click();
      await players.choose('Lucía');
      await home.recordsButton.click();

      await expect(records.cell('Bandera → País', 'Europa', 'Fácil')).toHaveText('8/10Lucía');
    },
  );

  test(
    'HIS-05 NFR-06 in English: "Family records" and "No record"',
    { tag: ['@HIS-05', '@NFR-06'] },
    async ({ page }) => {
      await home.chooseLanguage('English');
      await page.getByRole('button', { name: 'Records' }).click();

      await expect(records.heading).toHaveText('Family records');
      await expect(page.getByRole('table', { name: 'Flag → Country' })).toBeVisible();
      await expect(page.getByText('No record').first()).toBeVisible();
    },
  );
});
