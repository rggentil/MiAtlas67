import type { Locator } from '@playwright/test';
import { savedPlayerId, savedRoundsOf, saveRounds } from './device.ts';
import { expect, test } from './fixtures.ts';
import { HomePage } from './pages/HomePage.ts';
import { NewPlayerPage } from './pages/NewPlayerPage.ts';
import { PlayersPage } from './pages/PlayersPage.ts';

async function expectTouchTarget(target: Locator): Promise<void> {
  const box = await target.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(48);
  expect(box?.height).toBeGreaterThanOrEqual(48);
}

test.describe('Edit and delete a player', () => {
  let home: HomePage;
  let players: PlayersPage;
  let form: NewPlayerPage;
  /** Lucía's id in the database, to find her rounds after she is renamed or deleted. */
  let lucia: number;

  /** "Lucía" and "Pablo" on the device, seen on «¿Quién juega?». */
  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    players = new PlayersPage(page);
    form = new NewPlayerPage(page);
    await home.goto();
    await home.switchPlayerButton.click();
    await players.newPlayerButton.click();
    await form.create('Pablo', 'Búho');
    await home.switchPlayerButton.click();
    await expect(players.playerButtons).toHaveText([/^Lucía/, /^Pablo/]);
    lucia = (await savedPlayerId(page, 'Lucía')) ?? -1;
    expect(lucia).toBeGreaterThan(0);
  });

  test(
    'PRF-04 NFR-05 Lucía, with 2 rounds, becomes "Lu" with "Panda" and keeps her rounds',
    { tag: ['@PRF-04', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      await saveRounds(page, lucia, 2);
      await expectTouchTarget(players.editButton('Lucía'));

      await players.editButton('Lucía').click();
      await expect(form.heading).toHaveText('Editar jugador');
      await expect(form.nicknameInput).toHaveValue('Lucía');
      await expect(form.avatar('Zorro')).toBeChecked();
      await expectTouchTarget(form.deleteButton);
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
      await form.edit('Lu', 'Panda');

      await expect(players.heading).toHaveText('¿Quién juega?');
      await expect(players.playerButtons).toHaveText([/^Lu$/, /^Pablo/]);
      expect(await savedRoundsOf(page, lucia)).toBe(2);

      await players.choose('Lu');
      await expect(home.currentPlayer).toHaveText('Lu');
      await expect(home.currentPlayer.getByRole('img', { name: 'Panda' })).toBeVisible();
    },
  );

  test(
    'PRF-04 PRF-02 the new nickname must be valid: "pablo" is taken, and Lucía keeps "Lucía"',
    { tag: ['@PRF-04', '@PRF-02'] },
    async ({ page }) => {
      await players.editButton('Lucía').click();

      await form.edit('pablo', 'Panda');

      await expect(form.message('Ya hay un jugador que se llama así')).toBeVisible();
      await expect(form.heading).toHaveText('Editar jugador');
      await page.reload();
      await expect(players.playerButtons).toHaveText([/^Lucía/, /^Pablo/]);
    },
  );

  test(
    'PRF-04 NFR-04 NFR-05 "Sí, borrar" deletes Lucía and her 3 rounds from the device',
    { tag: ['@PRF-04', '@NFR-04', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      await saveRounds(page, lucia, 3);
      const pablo = (await savedPlayerId(page, 'Pablo')) ?? -1;
      await saveRounds(page, pablo, 1);
      await players.editButton('Lucía').click();

      await form.deleteButton.click();

      const dialog = form.deleteDialog('Lucía');
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('También se borra el historial de Lucía.');
      await expect(dialog.getByRole('button')).toHaveText(['No, volver', 'Sí, borrar']);
      await expect(dialog.getByRole('button', { name: 'No, volver' })).toBeFocused();
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);

      await dialog.getByRole('button', { name: 'Sí, borrar' }).click();

      await expect(players.heading).toHaveText('¿Quién juega?');
      await expect(players.playerButtons).toHaveText([/^Pablo/]);
      expect(await savedPlayerId(page, 'Lucía')).toBeNull();
      expect(await savedRoundsOf(page, lucia)).toBe(0);
      expect(await savedRoundsOf(page, pablo)).toBe(1);
      await page.reload();
      await expect(players.playerButtons).toHaveText([/^Pablo/]);
    },
  );

  test(
    'PRF-04 NAV-01 "No, volver", Escape and the back button close "¿Borrar a Lucía?" without deleting',
    { tag: ['@PRF-04', '@NAV-01'] },
    async ({ page }) => {
      await saveRounds(page, lucia, 3);
      await players.editButton('Lucía').click();
      const dialog = form.deleteDialog('Lucía');

      await form.deleteButton.click();
      await dialog.getByRole('button', { name: 'No, volver' }).click();
      await expect(dialog).toBeHidden();
      await expect(form.deleteButton).toBeFocused();

      await form.deleteButton.click();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();

      await form.deleteButton.click();
      await page.goBack();
      await expect(dialog).toBeHidden();
      await expect(form.heading).toHaveText('Editar jugador');

      await page.goBack();
      await expect(players.playerButtons).toHaveText([/^Lucía/, /^Pablo/]);
      expect(await savedRoundsOf(page, lucia)).toBe(3);
    },
  );
});
