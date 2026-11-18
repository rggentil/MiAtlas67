import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';
import { HomePage } from './pages/HomePage.ts';
import { NewPlayerPage } from './pages/NewPlayerPage.ts';
import { PlayersPage } from './pages/PlayersPage.ts';

const AVATARS = [
  'Zorro',
  'Panda',
  'Rana',
  'León',
  'Pingüino',
  'Pulpo',
  'Unicornio',
  'Dinosaurio',
  'Gato',
  'Perro',
  'Búho',
];

async function expectTouchTarget(target: Locator): Promise<void> {
  const box = await target.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(48);
  expect(box?.height).toBeGreaterThanOrEqual(48);
}

test.describe('«¿Quién juega?»: create a player and choose who plays', () => {
  let players: PlayersPage;
  let newPlayer: NewPlayerPage;
  let home: HomePage;

  test.beforeEach(async ({ page }) => {
    players = new PlayersPage(page);
    newPlayer = new NewPlayerPage(page);
    home = new HomePage(page);
    await players.goto();
  });

  /** Creates a player from "¿Quién juega?" and comes back to it with Back (NAV-01, D22). */
  async function addPlayer(page: Page, nickname: string, avatar: string): Promise<void> {
    await players.newPlayerButton.click();
    await newPlayer.create(nickname, avatar);
    await expect(home.currentPlayer).toContainText(nickname);
    await page.goBack();
    await expect(players.heading).toHaveText('¿Quién juega?');
  }

  test(
    'PRF-01 the first time on this device, "¿Quién juega?" has only the button "Nuevo jugador"',
    { tag: ['@PRF-01', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      await expect(page.getByRole('main').getByRole('button')).toHaveText(['+Nuevo jugador']);
      await expect(players.list).toBeHidden();
      await expectTouchTarget(players.newPlayerButton);
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'PRF-02 PRF-01 creating "Lucía" with "Zorro" goes home, and she is on "¿Quién juega?" the next time',
    { tag: ['@PRF-02', '@PRF-01'] },
    async ({ page }) => {
      await players.newPlayerButton.click();
      await newPlayer.create('Lucía', 'Zorro');

      await expect(home.heading).toHaveText('¿A qué jugamos?');
      await expect(home.currentPlayer).toHaveText('Lucía');
      await expect(home.currentPlayer.getByRole('img', { name: 'Zorro' })).toBeVisible();

      await page.reload();
      await expect(players.heading).toHaveText('¿Quién juega?');
      await expect(players.list.getByRole('button')).toHaveText([/^Lucía/]);
      await expect(players.player('Lucía')).toHaveAccessibleDescription('Jugó la última vez');
    },
  );

  test(
    'PRF-02 NFR-05 asks only for a nickname and one of 11 animals, with big targets and no axe violations',
    { tag: ['@PRF-02', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      await players.newPlayerButton.click();

      await expect(newPlayer.heading).toHaveText('Nuevo jugador');
      await expect(page.getByRole('textbox')).toHaveCount(1);
      await expect(newPlayer.nicknameInput).toBeVisible();
      await expect(page.getByRole('spinbutton')).toHaveCount(0);
      await expect(page.getByRole('combobox')).toHaveCount(0);
      await expect(newPlayer.avatars.getByRole('radio')).toHaveCount(AVATARS.length);
      for (const name of AVATARS) {
        await expect(newPlayer.avatar(name)).toHaveCount(1);
      }
      await expect(page.getByRole('radio')).toHaveCount(AVATARS.length);
      // Every avatar picture is bundled with the game and loads. They are decorative (the radio button
      // carries the animal's name), so they have no role to find them by.
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              [...document.images].filter((image) => image.complete && image.naturalWidth > 0)
                .length,
          ),
        )
        .toBe(AVATARS.length);
      await expectTouchTarget(newPlayer.createButton);
      await expectTouchTarget(newPlayer.backButton);
      await expectTouchTarget(newPlayer.nicknameInput);
      for (const name of AVATARS) {
        await expectTouchTarget(newPlayer.avatar(name));
      }
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  for (const [nickname, message] of [
    ['', 'Escribe un nombre'],
    ['Superlucianita', 'Como mucho 12 letras'],
    ['lucia', 'Ya hay un jugador que se llama así'],
  ] as const) {
    test(
      `PRF-02 the nickname "${nickname}" says "${message}" and no player is created`,
      { tag: '@PRF-02' },
      async ({ page, makeAxeBuilder }) => {
        await addPlayer(page, 'Lucía', 'Zorro');
        await players.newPlayerButton.click();

        await newPlayer.create(nickname, 'Rana');

        await expect(newPlayer.message(message)).toBeVisible();
        await expect(newPlayer.nicknameInput).toHaveAccessibleDescription(message);
        await expect(newPlayer.nicknameInput).toBeFocused();
        await expect(newPlayer.heading).toHaveText('Nuevo jugador');
        expect((await makeAxeBuilder().analyze()).violations).toEqual([]);

        await newPlayer.backButton.click();
        await expect(players.list.getByRole('button')).toHaveText([/^Lucía/]);
      },
    );
  }

  test(
    'PRF-02 NAV-01 "Volver" or the back button goes back to "¿Quién juega?" and no player is created',
    { tag: ['@PRF-02', '@NAV-01'] },
    async ({ page }) => {
      await players.newPlayerButton.click();
      await newPlayer.nicknameInput.fill('Pablo');
      await newPlayer.backButton.click();
      await expect(players.heading).toHaveText('¿Quién juega?');
      await expect(players.list).toBeHidden();

      await players.newPlayerButton.click();
      await newPlayer.nicknameInput.fill('Pablo');
      await page.goBack();
      await expect(players.heading).toHaveText('¿Quién juega?');
      await expect(players.exitDialog).toBeHidden();
      await expect(players.list).toBeHidden();

      await page.reload();
      await expect(players.newPlayerButton).toBeVisible();
      await expect(players.list).toBeHidden();
    },
  );

  test(
    'PRF-01 tapping "Pablo" goes home with him, and he is marked as the last player, with a label',
    { tag: '@PRF-01' },
    async ({ page }) => {
      await addPlayer(page, 'Lucía', 'Zorro');
      await addPlayer(page, 'Pablo', 'Búho');
      await page.reload();
      await expect(players.list.getByRole('button')).toHaveText([/^Lucía/, /^Pablo/]);

      await players.choose('Lucía');
      await expect(home.currentPlayer).toHaveText('Lucía');
      await page.goBack();
      await players.choose('Pablo');
      await expect(home.heading).toHaveText('¿A qué jugamos?');
      await expect(home.currentPlayer).toHaveText('Pablo');
      await expect(home.currentPlayer.getByRole('img', { name: 'Búho' })).toBeVisible();

      await page.reload();
      await expect(players.player('Pablo')).toHaveAccessibleDescription('Jugó la última vez');
      await expect(players.player('Lucía')).not.toHaveAccessibleDescription('Jugó la última vez');
      await expect(page.getByText('Jugó la última vez')).toHaveCount(1);
      await expect(players.list.getByRole('listitem').nth(1)).toContainText('Jugó la última vez');
      await expect(page.getByText('Jugó la última vez')).toBeVisible();
    },
  );

  test(
    'PRF-05 NFR-05 with 8 players there is no "Nuevo jugador", and a note says that up to 8 fit',
    { tag: ['@PRF-05', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      test.slow();
      for (let number = 1; number <= 8; number++) {
        await expect(players.newPlayerButton).toBeVisible();
        await addPlayer(page, `Jugador ${String(number)}`, AVATARS[number - 1] ?? 'Zorro');
      }

      await page.reload();
      await expect(players.list.getByRole('button')).toHaveCount(8);
      await expect(players.newPlayerButton).toHaveCount(0);
      await expect(players.fullNote).toBeVisible();
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'PRF-01 NFR-05 NFR-06 "¿Quién juega?" and "Nuevo jugador" in English have no axe violations',
    { tag: ['@PRF-01', '@NFR-05', '@NFR-06'] },
    async ({ page, makeAxeBuilder }) => {
      await addPlayer(page, 'Lucía', 'Zorro');
      await page.getByText('English', { exact: true }).click();
      await expect(players.heading).toHaveText("Who's playing?");
      await expect(page.getByRole('button', { name: 'Lucía' })).toHaveAccessibleDescription(
        'Played last',
      );
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);

      await page.getByRole('button', { name: 'New player' }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('New player');
      await page.getByRole('button', { name: 'Create' }).click();
      await expect(page.getByText('Write a name', { exact: true })).toBeVisible();
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );
});
