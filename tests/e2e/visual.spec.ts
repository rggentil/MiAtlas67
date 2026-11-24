import type { Page } from '@playwright/test';
import { savedPlayerId, saveResults } from './device.ts';
import { expectedRound, questionAt, wrongOption } from './expected.ts';
import { expect, test } from './fixtures.ts';
import { AboutPage } from './pages/AboutPage.ts';
import { AtlasPage } from './pages/AtlasPage.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { NewPlayerPage } from './pages/NewPlayerPage.ts';
import { PlayersPage } from './pages/PlayersPage.ts';
import { RecordsPage } from './pages/RecordsPage.ts';
import { RoundPage } from './pages/RoundPage.ts';
import { SummaryPage } from './pages/SummaryPage.ts';

// Visual regression of the key screens (story #114, D40): each screen is compared with its approved screenshot
// in tests/e2e/__screenshots__/. A screenshot depends on the operating system, the browser and its fonts, so the
// approved ones are made in the CI container (Linux, mobile-chrome only) and the comparison runs only there.
// To approve a change on purpose, run the workflow "Update screenshots" on the pull request's branch.

test.skip(
  !process.env.CI,
  'The approved screenshots are made in the CI container: compare them there (workflow "Update screenshots")',
);

/** Every date the game reads is this one, so nothing on a screen depends on the day the test runs. */
const NOW = new Date('2026-11-20T10:00:00Z');

/**
 * Waits until the screen is still: the web fonts are loaded and every image on show is decoded. The screenshot
 * itself then waits for two identical frames, with animations stopped and the caret hidden.
 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const onShow = Array.from(document.images).filter((image) => {
          const box = image.getBoundingClientRect();
          return box.bottom > 0 && box.top < window.innerHeight && box.width > 0;
        });
        if (!onShow.every((image) => image.complete && image.naturalWidth > 0)) return false;
        // Loaded is not yet drawn: images with decoding="async" are decoded after they load.
        await Promise.all(onShow.map((image) => image.decode()));
        return true;
      }),
    )
    .toBe(true);
}

/** The id of the saved player `nickname`; the test stops if there is none. */
async function playerId(page: Page, nickname: string): Promise<number> {
  const id = await savedPlayerId(page, nickname);
  if (id === null) throw new Error(`There is no player called ${nickname}`);
  return id;
}

/** Compares the whole screen (or only what is on show, for a long list of images) with its approved screenshot. */
async function expectScreen(page: Page, name: string, fullPage = true): Promise<void> {
  await settle(page);
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage });
}

/**
 * The background of every test: the players Lucía (Zorro) and Pablo (Búho) with rounds saved on fixed dates,
 * then Lucía plays with seed 42 (reduced motion is set for every E2E test).
 */
async function luciaAndPablo(page: Page): Promise<HomePage> {
  await page.clock.setFixedTime(NOW);
  const home = new HomePage(page);
  await home.goto('?seed=42');
  await home.switchPlayerButton.click();
  await new PlayersPage(page).newPlayerButton.click();
  await new NewPlayerPage(page).create('Pablo', 'Búho');
  await expect(home.heading).toHaveText('¿A qué jugamos?');

  const lucia = await playerId(page, 'Lucía');
  const pablo = await playerId(page, 'Pablo');
  await saveResults(page, lucia, [
    {
      game: 'FLAG-A',
      region: 'europe',
      level: 1,
      score: 6,
      stars: 1,
      playedAt: Date.UTC(2026, 10, 1),
    },
  ]);
  await saveResults(page, pablo, [
    {
      game: 'FLAG-B',
      region: 'asia',
      level: 2,
      score: 9,
      stars: 2,
      playedAt: Date.UTC(2026, 10, 2),
    },
    {
      game: 'CAP-A',
      region: 'world',
      level: 3,
      score: 8,
      stars: 2,
      playedAt: Date.UTC(2026, 10, 3),
    },
  ]);

  await home.switchPlayerButton.click();
  await new PlayersPage(page).choose('Lucía');
  await expect(home.heading).toHaveText('¿A qué jugamos?');
  return home;
}

/** Opens `game` in Europa · Fácil and returns the questions of the round (seed 42). */
async function playEuropeEasy(page: Page, home: HomePage, game: string): Promise<RoundPage> {
  await home.openGame(game);
  const setup = new GameSetupPage(page);
  await setup.chooseRegion('Europa');
  await setup.chooseLevel('Fácil');
  return new RoundPage(page);
}

test.describe('Visual regression of the key screens', () => {
  test(
    'NFR-08 NFR-07 «¿Quién juega?» with the two players matches its approved screenshot',
    { tag: ['@NFR-08', '@NFR-07'] },
    async ({ page }) => {
      const home = await luciaAndPablo(page);
      await home.switchPlayerButton.click();
      await expect(new PlayersPage(page).heading).toHaveText('¿Quién juega?');

      await expectScreen(page, 'players');
    },
  );

  test(
    'NFR-08 NFR-07 the home screen matches its approved screenshot',
    { tag: ['@NFR-08', '@NFR-07'] },
    async ({ page }) => {
      await luciaAndPablo(page);

      await expectScreen(page, 'home');
    },
  );

  test(
    'NFR-08 NFR-07 game setup, level step with a locked level, matches its approved screenshot',
    { tag: ['@NFR-08', '@NFR-07'] },
    async ({ page }) => {
      const home = await luciaAndPablo(page);
      await home.openGame('Bandera → País');
      const setup = new GameSetupPage(page);
      await setup.chooseRegion('Europa');
      await expect(setup.level('Medio')).toHaveAccessibleName('Medio, bloqueado');

      await expectScreen(page, 'setup-level-step');
    },
  );

  test(
    'NFR-08 NFR-07 a "Bandera → País" question, before and after a wrong answer, matches its approved screenshots',
    { tag: ['@NFR-08', '@NFR-07'] },
    async ({ page }) => {
      const home = await luciaAndPablo(page);
      const round = await playEuropeEasy(page, home, 'Bandera → País');
      const question = questionAt(expectedRound({ topic: 'flags', region: 'europe', level: 1 }), 0);
      await expect(round.progressText).toHaveText('1/10');

      await expectScreen(page, 'flag-a-question');

      await round.answer(wrongOption(question).name.es);
      await expect(round.feedbackMark('Incorrecta')).toBeVisible();

      await expectScreen(page, 'flag-a-wrong-answer');
    },
  );

  test(
    'NFR-08 NFR-07 a "País → Bandera" question with its grid of flags matches its approved screenshot',
    { tag: ['@NFR-08', '@NFR-07'] },
    async ({ page }) => {
      const home = await luciaAndPablo(page);
      const round = await playEuropeEasy(page, home, 'País → Bandera');
      const question = questionAt(expectedRound({ topic: 'flags', region: 'europe', level: 1 }), 0);
      await expect(round.options).toHaveCount(question.options.length);

      await expectScreen(page, 'flag-b-question');
    },
  );

  test(
    'NFR-08 NFR-07 the summary of a perfect round, with "¡Nuevo récord!", matches its approved screenshot',
    { tag: ['@NFR-08', '@NFR-07'] },
    async ({ page }) => {
      const home = await luciaAndPablo(page);
      const round = await playEuropeEasy(page, home, 'Bandera → País');
      await round.playRound(expectedRound({ topic: 'flags', region: 'europe', level: 1 }), []);
      const summary = new SummaryPage(page);
      await expect(summary.score('10/10')).toBeVisible();
      await expect(summary.newRecord).toBeVisible();

      await expectScreen(page, 'summary-perfect-round');
    },
  );

  test(
    'NFR-08 NFR-07 "Récords de la familia" matches its approved screenshot',
    { tag: ['@NFR-08', '@NFR-07'] },
    async ({ page }) => {
      const home = await luciaAndPablo(page);
      await home.recordsButton.click();
      const records = new RecordsPage(page);
      await expect(records.heading).toHaveText('Récords de la familia');
      await expect(records.cell('País → Bandera', 'Asia', 'Medio')).toContainText('Pablo');

      await expectScreen(page, 'records');
    },
  );

  test(
    'NFR-08 NFR-07 "Atlas", one region, matches its approved screenshot',
    { tag: ['@NFR-08', '@NFR-07'] },
    async ({ page }) => {
      await luciaAndPablo(page);
      const atlas = new AtlasPage(page);
      await atlas.openButton.click();
      await atlas.chooseRegion('Oceanía');
      await expect(atlas.heading).toBeVisible();
      await expect(atlas.entry('Oceanía', 'Australia')).toBeVisible();

      // A long list whose images load as they come into view: what is on show is compared.
      await expectScreen(page, 'atlas-oceania', false);
    },
  );

  test(
    'NFR-08 NFR-07 "Acerca de" matches its approved screenshot',
    { tag: ['@NFR-08', '@NFR-07'] },
    async ({ page }) => {
      await luciaAndPablo(page);
      const about = new AboutPage(page);
      await about.openButton.click();
      await expect(about.heading).toHaveText('Acerca de');

      await expectScreen(page, 'about');
    },
  );

  test(
    'NFR-08 NFR-06 in English: the home screen and a "Flag → Country" question match their approved screenshots',
    { tag: ['@NFR-08', '@NFR-06'] },
    async ({ page }) => {
      const home = await luciaAndPablo(page);
      await home.chooseLanguage('English');
      await expect(home.heading).toHaveText('What shall we play?');

      await expectScreen(page, 'home-en');

      await home.openGame('Flag → Country');
      const setup = new GameSetupPage(page, 'en');
      await setup.chooseRegion('Europe');
      await setup.chooseLevel('Easy');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Which country does this flag belong to?',
      );

      await expectScreen(page, 'flag-a-question-en');
    },
  );
});
