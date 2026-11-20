import { savedMissedOf, savedPlayerId, savedRoundsOf, saveRounds } from './device.ts';
import { expectedRounds, questionAt } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HistoryPage } from './pages/HistoryPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { NewPlayerPage } from './pages/NewPlayerPage.ts';
import { PlayersPage } from './pages/PlayersPage.ts';
import { RoundPage } from './pages/RoundPage.ts';
import { SummaryPage } from './pages/SummaryPage.ts';

// The first two rounds of a visit with ?seed=42 in "Europa · Fácil" (NFR-07).
const [FIRST_ROUND = [], SECOND_ROUND = []] = expectedRounds(
  { topic: 'flags', region: 'europe', level: 1 },
  2,
);
/** The game's clock while playing: 18 November 2026 at 10:30, in the browser's time zone. */
const PLAYED_AT = new Date(2026, 10, 18, 10, 30);

test.describe('History of the rounds played', () => {
  let home: HomePage;
  let setup: GameSetupPage;
  let round: RoundPage;
  let summary: SummaryPage;
  let history: HistoryPage;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    setup = new GameSetupPage(page);
    round = new RoundPage(page);
    summary = new SummaryPage(page);
    history = new HistoryPage(page);
    await page.clock.setFixedTime(PLAYED_AT);
    await home.goto('?seed=42');
  });

  async function startRound(game: 'Bandera → País' | 'País → Bandera'): Promise<void> {
    await home.openGame(game);
    await setup.chooseRegion('Europa');
    await setup.chooseLevel('Fácil');
  }

  test(
    'HIS-01 HIS-02 NFR-05 a round with 8 correct answers is the first entry: date and time, game, "Europa · Fácil", 8/10, 2 stars',
    { tag: ['@HIS-01', '@HIS-02', '@NFR-05'] },
    async ({ makeAxeBuilder }) => {
      await startRound('Bandera → País');
      await round.playRound(FIRST_ROUND, [2, 5]);
      await summary.menuButton.click();

      await home.historyButton.click();

      await expect(history.heading).toHaveText('Historial');
      await expect(history.entries).toHaveCount(1);
      const entry = history.entries.first();
      await expect(entry).toContainText(/18 nov\.? 2026, 10:30/);
      await expect(entry).toContainText('Bandera → País');
      await expect(entry).toContainText('Europa · Fácil');
      await expect(entry).toContainText('8/10');
      await expect(entry.getByRole('img', { name: '2 de 3 estrellas' })).toBeVisible();
      await expect(history.filterOption('Todos')).toBeChecked();
      // The filter chips are the tap targets of their visually hidden radio buttons.
      for (const name of [
        'Todos',
        'Bandera → País',
        'País → Bandera',
        'País → Capital',
        'Capital → País',
        'Silueta → País',
        'País → Silueta',
      ]) {
        const box = await history.filter.getByText(name, { exact: true }).boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(48);
        expect(box?.width).toBeGreaterThanOrEqual(48);
      }
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test(
    'HIS-01 the saved round keeps the 2 entities that were missed',
    { tag: '@HIS-01' },
    async ({ page }) => {
      await startRound('Bandera → País');
      await round.playRound(FIRST_ROUND, [2, 5]);

      // The game saves in the background: wait until the round is there.
      const lucia = (await savedPlayerId(page, 'Lucía')) ?? -1;
      await expect
        .poll(() => savedMissedOf(page, lucia))
        .toEqual([
          [questionAt(FIRST_ROUND, 2).entity.code, questionAt(FIRST_ROUND, 5).entity.code],
        ]);
    },
  );

  test(
    'HIS-02 newest first, and the filter "País → Bandera" lists only its rounds until "Todos"',
    { tag: '@HIS-02' },
    async ({ page }) => {
      await startRound('Bandera → País');
      await round.playRound(FIRST_ROUND, []);
      await summary.menuButton.click();
      // A minute later, the second round.
      await page.clock.setFixedTime(new Date(PLAYED_AT.getTime() + 60_000));
      await startRound('País → Bandera');
      await round.playFlagBRound(SECOND_ROUND, [0]);
      await summary.menuButton.click();
      await home.historyButton.click();

      await expect(history.entries).toHaveCount(2);
      await expect(history.entries.nth(0)).toContainText('País → Bandera');
      await expect(history.entries.nth(0)).toContainText('9/10');
      await expect(history.entries.nth(0)).toContainText(/10:31/);
      await expect(history.entries.nth(1)).toContainText('Bandera → País');
      await expect(history.entries.nth(1)).toContainText('10/10');

      await history.chooseFilter('País → Bandera');
      await expect(history.filterOption('País → Bandera')).toBeChecked();
      await expect(history.entries).toHaveCount(1);
      await expect(history.entries.first()).toContainText('País → Bandera');

      await history.chooseFilter('Todos');
      await expect(history.entries).toHaveCount(2);
    },
  );

  test(
    'HIS-02 NFR-05 a game without rounds says so, with no axe violations',
    { tag: ['@HIS-02', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      await saveRounds(page, (await savedPlayerId(page, 'Lucía')) ?? -1, 1, 'FLAG-A');
      await home.historyButton.click();
      await expect(history.entries).toHaveCount(1);

      await history.chooseFilter('País → Bandera');

      await expect(page.getByText('Todavía no hay partidas de este juego.')).toBeVisible();
      await expect(history.rounds).toBeHidden();
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  test('HIS-02 each player sees only their own history', { tag: '@HIS-02' }, async ({ page }) => {
    const players = new PlayersPage(page);
    await home.switchPlayerButton.click();
    await players.newPlayerButton.click();
    await new NewPlayerPage(page).create('Pablo', 'Búho');
    await saveRounds(page, (await savedPlayerId(page, 'Lucía')) ?? -1, 1, 'FLAG-B');
    await saveRounds(page, (await savedPlayerId(page, 'Pablo')) ?? -1, 1, 'FLAG-A');

    await home.historyButton.click();

    await expect(history.entries).toHaveCount(1);
    await expect(history.entries.first()).toContainText('Bandera → País');
  });

  test(
    'RND-07 HIS-02 NFR-05 a quit round is not saved: "Historial" says there are no rounds yet',
    { tag: ['@RND-07', '@HIS-02', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      await startRound('Bandera → País');
      await round.answer(questionAt(FIRST_ROUND, 0).entity.name.es);

      await round.quit();
      await home.historyButton.click();

      await expect(history.empty).toBeVisible();
      await expect(history.rounds).toBeHidden();
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
      expect(await savedRoundsOf(page, (await savedPlayerId(page, 'Lucía')) ?? -1)).toBe(0);
    },
  );

  test('HIS-01 the history survives closing the game', { tag: '@HIS-01' }, async ({ page }) => {
    const players = new PlayersPage(page);
    await startRound('Bandera → País');
    await round.playRound(FIRST_ROUND, []);
    const lucia = (await savedPlayerId(page, 'Lucía')) ?? -1;
    await expect.poll(() => savedRoundsOf(page, lucia)).toBe(1);

    await page.reload();
    await players.choose('Lucía');
    await home.historyButton.click();

    await expect(history.entries).toHaveCount(1);
    await expect(history.entries.first()).toContainText('10/10');
  });

  test(
    'HIS-02 NAV-01 "Volver" and the back button go from "Historial" to the home screen',
    { tag: ['@HIS-02', '@NAV-01'] },
    async ({ page }) => {
      await home.historyButton.click();
      await history.backButton.click();
      await expect(home.heading).toHaveText('¿A qué jugamos?');

      await home.historyButton.click();
      await page.goBack();

      await expect(home.heading).toHaveText('¿A qué jugamos?');
    },
  );
});
