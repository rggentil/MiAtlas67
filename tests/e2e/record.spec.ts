import type { Page } from '@playwright/test';
import { savedPlayerId, savedRoundsOf, saveResults, type Result } from './device.ts';
import { expectedRound } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { isOnTop } from './layout.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { NewPlayerPage } from './pages/NewPlayerPage.ts';
import { PlayersPage } from './pages/PlayersPage.ts';
import { RoundPage } from './pages/RoundPage.ts';
import { SummaryPage } from './pages/SummaryPage.ts';

const LEVEL_NAMES = { 1: 'Fácil', 2: 'Medio', 3: 'Difícil' } as const;

/** A result of "Bandera → País" in "Europa" at `level`, already saved as a best. */
function europe(level: 1 | 2, score: number): Result {
  const stars = score === 10 ? 3 : score >= 8 ? 2 : score >= 5 ? 1 : 0;
  return { game: 'FLAG-A', region: 'europe', level, score, stars };
}

/** The question indexes missed to finish a round of 10 with `score` correct answers: the first ones. */
function missing(score: number): number[] {
  return Array.from({ length: 10 - score }, (_, index) => index);
}

test.describe('«¡Nuevo récord!» in the round summary', () => {
  let home: HomePage;
  let summary: SummaryPage;
  /** Lucía's id in the database. */
  let lucia: number;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    summary = new SummaryPage(page);
    await home.goto('?seed=42');
    const saved = await savedPlayerId(page, 'Lucía');
    expect(saved).not.toBeNull();
    lucia = saved ?? -1;
  });

  /** Plays "Bandera → País" in "Europa" at `level` with `score` correct answers; waits until it is saved. */
  async function finish(page: Page, level: 1 | 2, score: number, roundsBefore: number) {
    const setup = new GameSetupPage(page);
    await home.openGame('Bandera → País');
    await setup.chooseRegion('Europa');
    await setup.chooseLevel(LEVEL_NAMES[level]);
    await new RoundPage(page).playRound(
      expectedRound({ topic: 'flags', region: 'europe', level }),
      missing(score),
    );
    await expect(summary.score(`${String(score)}/10`)).toBeVisible();
    // The summary knows whether it is a record before the round is saved.
    await expect.poll(() => savedRoundsOf(page, lucia)).toBe(roundsBefore + 1);
  }

  test(
    'RND-08 SCR-03 NFR-05 with a best of 6/10, finishing with 8/10 shows "¡Nuevo récord!"',
    { tag: ['@RND-08', '@SCR-03', '@NFR-05'] },
    async ({ page, makeAxeBuilder }) => {
      await saveResults(page, lucia, [europe(1, 6)]);

      await finish(page, 1, 8, 1);

      await expect(summary.newRecord).toBeVisible();
      expect((await makeAxeBuilder().analyze()).violations).toEqual([]);
    },
  );

  for (const score of [8, 7]) {
    test(
      `RND-08 with a best of 8/10, finishing with ${String(score)}/10 is not a record`,
      { tag: '@RND-08' },
      async ({ page }) => {
        await saveResults(page, lucia, [europe(1, 8)]);

        await finish(page, 1, score, 1);

        await expect(summary.newRecord).toHaveCount(0);
      },
    );
  }

  test(
    'RND-08 the first round of a game, region and level is not a record',
    { tag: '@RND-08' },
    async ({ page }) => {
      await finish(page, 1, 5, 0);

      await expect(summary.newRecord).toHaveCount(0);
    },
  );

  test(
    "SCR-03 records are per player: Pablo's 10/10 does not stop Lucía's 8/10 from beating her 6/10",
    { tag: '@SCR-03' },
    async ({ page }) => {
      const players = new PlayersPage(page);
      await home.switchPlayerButton.click();
      await players.newPlayerButton.click();
      await new NewPlayerPage(page).create('Pablo', 'Búho');
      const pablo = await savedPlayerId(page, 'Pablo');
      expect(pablo).not.toBeNull();
      await saveResults(page, pablo ?? -1, [europe(1, 10)]);
      await saveResults(page, lucia, [europe(1, 6)]);
      await home.switchPlayerButton.click();
      await players.choose('Lucía');

      await finish(page, 1, 8, 1);

      await expect(summary.newRecord).toBeVisible();
    },
  );

  test(
    'RND-08 a perfect round that is also a record shows both, and the confetti does not cover "¡Nuevo récord!"',
    { tag: '@RND-08' },
    async ({ page }) => {
      await saveResults(page, lucia, [europe(1, 8)]);

      await finish(page, 1, 10, 1);

      await expect(summary.celebration).toBeVisible();
      await expect(summary.newRecord).toBeVisible();
      expect(await isOnTop(summary.newRecord)).toBe(true);
    },
  );

  test(
    'SCR-03 GAME-02 records are per game, region and level: 6/10 in "Europa · Medio" beats its 4/10',
    { tag: ['@SCR-03', '@GAME-02'] },
    async ({ page }) => {
      await saveResults(page, lucia, [europe(1, 10), europe(2, 4)]);

      await finish(page, 2, 6, 2);

      await expect(summary.newRecord).toBeVisible();
    },
  );
});
