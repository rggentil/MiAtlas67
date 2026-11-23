import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { BrowserContext, Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';
import { AboutPage } from './pages/AboutPage.ts';
import { AtlasPage } from './pages/AtlasPage.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HistoryPage } from './pages/HistoryPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { NewPlayerPage } from './pages/NewPlayerPage.ts';
import { PlayersPage } from './pages/PlayersPage.ts';
import { ProgressPage } from './pages/ProgressPage.ts';
import { RecordsPage } from './pages/RecordsPage.ts';
import { RoundPage } from './pages/RoundPage.ts';
import { SummaryPage } from './pages/SummaryPage.ts';

// These tests run on the production build served under /MiAtlas67/ (project "offline-chrome",
// playwright.config.ts): the service worker exists only there. `?seed=` does not work in a production build, so
// they check structure (10 questions, pictures loaded), not which countries are asked.

const BUILD = join(import.meta.dirname, '..', '..', 'dist-e2e');
const BASE_PATH = '/MiAtlas67/';
const GAMES = [
  'Bandera → País',
  'País → Bandera',
  'País → Capital',
  'Capital → País',
  'Silueta → País',
  'País → Silueta',
];

/** Every file of the build, as a path under the game's address ("assets/es-….svg"). */
function buildFiles(): string[] {
  const files: string[] = [];
  const walk = (folder: string) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name);
      if (entry.isDirectory()) walk(path);
      else files.push(relative(BUILD, path).replaceAll('\\', '/'));
    }
  };
  walk(BUILD);
  return files;
}

/** Opens the game at its address and waits until its service worker stores the game and serves the page. */
async function openOnline(page: Page): Promise<void> {
  await page.goto('./');
  await expect(new PlayersPage(page).heading).toHaveText('¿Quién juega?');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
}

/**
 * Takes the device offline, and proves it: a file the worker has not stored can no longer be fetched, not even
 * by the worker. Without this canary, a file missing from the store could still come from the test server.
 */
async function goOffline(page: Page, context: BrowserContext): Promise<void> {
  await context.setOffline(true);
  const canary = await page.evaluate(() =>
    fetch(`not-stored-${String(Date.now())}.txt`).then(
      () => 'reached the server',
      () => 'offline',
    ),
  );
  expect(canary).toBe('offline');
}

/** The addresses the service worker stored, without the revision it adds to some of them. */
async function storedAddresses(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const addresses: string[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        const url = new URL(request.url);
        url.searchParams.delete('__WB_REVISION__');
        addresses.push(url.href);
      }
    }
    return addresses;
  });
}

/** Every picture on screen has loaded (the flag, the silhouette, the option cards). */
async function expectPicturesLoaded(page: Page): Promise<void> {
  const pictures = page.getByRole('main').locator('img');
  await expect.poll(() => pictures.count()).toBeGreaterThan(0);
  await expect
    .poll(() =>
      pictures.evaluateAll((images) =>
        images.every(
          (image) =>
            (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
        ),
      ),
    )
    .toBe(true);
}

async function createPlayer(page: Page, nickname: string, avatar: string): Promise<void> {
  await new PlayersPage(page).newPlayerButton.click();
  await new NewPlayerPage(page).create(nickname, avatar);
  await expect(new HomePage(page).heading).toHaveText('¿A qué jugamos?');
}

/**
 * Plays a whole round of `game` in "Europa · Fácil", tapping the first option each time, to its summary. With
 * `offlineAt`, the device goes offline just before that question.
 */
async function playRound(
  page: Page,
  game: string,
  offlineAt?: { question: number; context: BrowserContext },
): Promise<void> {
  const home = new HomePage(page);
  const setup = new GameSetupPage(page);
  const round = new RoundPage(page);
  await home.openGame(game);
  await setup.chooseRegion('Europa');
  await setup.chooseLevel('Fácil');
  for (let question = 1; question <= 10; question += 1) {
    await expect(round.progressText).toHaveText(`${String(question)}/10`);
    if (offlineAt?.question === question) await goOffline(page, offlineAt.context);
    await expectPicturesLoaded(page);
    await round.options.first().click();
    await round.nextButton.click();
  }
  await expect(new SummaryPage(page).playAgainButton).toBeVisible();
}

/** Online first visit with Lucía, then offline and reloaded, back to the home screen as Lucía. */
async function luciaOffline(page: Page, context: BrowserContext): Promise<void> {
  await openOnline(page);
  await createPlayer(page, 'Lucía', 'Zorro');
  await goOffline(page, context);
  await page.reload();
  await new PlayersPage(page).player('Lucía').click();
  await expect(new HomePage(page).heading).toHaveText('¿A qué jugamos?');
}

test.describe('Play offline (NFR-02, D36)', () => {
  test(
    "NFR-02 D10 the first visit registers a service worker for the game's own address and stores every file of the build",
    { tag: ['@NFR-02'] },
    async ({ page, baseURL }) => {
      await openOnline(page);

      const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
      expect(scope).toBe(baseURL);
      expect(new URL(scope).pathname).toBe(BASE_PATH);

      const stored = await storedAddresses(page);
      // The worker itself and its library are not stored: the browser keeps them. Nor are the .woff fonts: a
      // browser with service workers reads the .woff2 ones.
      const expected = buildFiles().filter(
        (file) => file !== 'sw.js' && !/^workbox-.*\.js$/.test(file) && !file.endsWith('.woff'),
      );
      expect(expected.some((file) => file.endsWith('.woff2'))).toBe(true);
      expect(expected.filter((file) => file.endsWith('.svg')).length).toBeGreaterThan(490);
      for (const file of expected) {
        expect(stored, file).toContain(new URL(file, baseURL).href);
      }
    },
  );

  test(
    'NFR-02 offline, the game opens on «¿Quién juega?» with Lucía and Pablo',
    { tag: ['@NFR-02'] },
    async ({ page, context }) => {
      await openOnline(page);
      await createPlayer(page, 'Lucía', 'Zorro');
      await new HomePage(page).switchPlayerButton.click();
      await createPlayer(page, 'Pablo', 'Búho');

      await goOffline(page, context);
      await page.reload();

      const players = new PlayersPage(page);
      await expect(players.heading).toHaveText('¿Quién juega?');
      await expect(players.playerButtons).toHaveText(['Lucía', 'Pablo']);
    },
  );

  for (const game of GAMES) {
    test(
      `NFR-02 offline, a round of "${game}" shows every picture and ends in its summary, saved`,
      { tag: ['@NFR-02'] },
      async ({ page, context }) => {
        await luciaOffline(page, context);

        await playRound(page, game);

        const home = new HomePage(page);
        await new SummaryPage(page).menuButton.click();
        await home.historyButton.click();
        const history = new HistoryPage(page);
        await expect(history.entries).toHaveCount(1);
        await expect(history.entries.first()).toContainText(game);
      },
    );
  }

  test(
    'NFR-02 offline, every screen opens and shows the rounds saved offline, also after a reload',
    { tag: ['@NFR-02'] },
    async ({ page, context }) => {
      await luciaOffline(page, context);
      await playRound(page, 'Bandera → País');
      const home = new HomePage(page);
      await new SummaryPage(page).menuButton.click();

      const history = new HistoryPage(page);
      await home.historyButton.click();
      await expect(history.entries).toHaveCount(1);
      await expect(history.entries.first()).toContainText('Bandera → País');
      await history.backButton.click();

      const progress = new ProgressPage(page);
      await home.progressButton.click();
      await expect(progress.cell('Bandera → País', 'Europa', 'Fácil')).not.toHaveText('Sin jugar');
      await expect(progress.cell('País → Bandera', 'Europa', 'Fácil')).toHaveText('Sin jugar');
      await page.goBack();

      const records = new RecordsPage(page);
      await home.recordsButton.click();
      await expect(records.cell('Bandera → País', 'Europa', 'Fácil')).toContainText('Lucía');
      await records.backButton.click();

      const atlas = new AtlasPage(page);
      await atlas.openButton.click();
      await atlas.chooseRegion('Oceanía');
      await expect(atlas.entry('Oceanía', 'Nueva Zelanda')).toContainText('Wellington');
      await expectPicturesLoaded(page);
      await atlas.backButton.click();
      await atlas.backButton.click();

      const about = new AboutPage(page);
      await about.openButton.click();
      await expect(about.heading).toHaveText('Acerca de');
      await expect(about.section('Territorios y nombres')).toBeVisible();
      await about.backButton.click();

      await page.reload();
      await new PlayersPage(page).player('Lucía').click();
      await home.historyButton.click();
      await expect(history.entries).toHaveCount(1);
      await history.backButton.click();
      await home.progressButton.click();
      await expect(progress.cell('Bandera → País', 'Europa', 'Fácil')).not.toHaveText('Sin jugar');
    },
  );

  for (const game of ['País → Bandera', 'Silueta → País']) {
    test(
      `NFR-02 the connection drops in the middle of the first round of "${game}": it goes on, with its pictures, to the summary`,
      { tag: ['@NFR-02'] },
      async ({ page, context }) => {
        await openOnline(page);
        await createPlayer(page, 'Lucía', 'Zorro');

        await playRound(page, game, { question: 4, context });
      },
    );
  }

  test(
    "NFR-04 D10 every request goes to the game's own address, and the worker stores only the game's own files, under /MiAtlas67/",
    { tag: ['@NFR-04', '@NFR-02'] },
    async ({ page, baseURL }) => {
      const requested: string[] = [];
      page.on('request', (request) => requested.push(request.url()));
      await openOnline(page);
      await createPlayer(page, 'Lucía', 'Zorro');
      await playRound(page, 'Bandera → País');

      const own = new URL(baseURL ?? '').origin;
      expect(requested.length).toBeGreaterThan(0);
      expect(requested.filter((url) => new URL(url).origin !== own)).toEqual([]);
      const stored = await storedAddresses(page);
      expect(stored.length).toBeGreaterThan(500);
      expect(stored.filter((url) => !url.startsWith(`${own}${BASE_PATH}`))).toEqual([]);
    },
  );

  test(
    'NFR-02 D24 still installable under /MiAtlas67/: the manifest "MiAtlas67" starts there and its icons are stored',
    { tag: ['@NFR-02'] },
    async ({ page, baseURL }) => {
      await openOnline(page);

      const href = await page.locator('link[rel="manifest"]').getAttribute('href');
      const manifestUrl = new URL(href ?? '', baseURL);
      expect(manifestUrl.pathname).toBe(`${BASE_PATH}manifest.webmanifest`);
      const manifest = (await (await page.request.get(manifestUrl.href)).json()) as {
        name: string;
        start_url: string;
        icons: { src: string }[];
      };
      expect(manifest.name).toBe('MiAtlas67');
      expect(new URL(manifest.start_url, manifestUrl).pathname).toBe(BASE_PATH);
      const stored = await storedAddresses(page);
      for (const icon of manifest.icons) {
        expect(stored).toContain(new URL(icon.src, manifestUrl).href);
      }
    },
  );

  test(
    'NFR-02 D36 players and rounds do not live in the stored files: dropping every stored version keeps them',
    { tag: ['@NFR-02'] },
    async ({ page }) => {
      await openOnline(page);
      await createPlayer(page, 'Lucía', 'Zorro');
      await playRound(page, 'Bandera → País');

      // What a new version does to the old one: its caches go, and a new worker takes over.
      await page.evaluate(async () => {
        for (const name of await caches.keys()) await caches.delete(name);
        for (const registration of await navigator.serviceWorker.getRegistrations()) {
          await registration.unregister();
        }
      });
      await page.reload();

      await new PlayersPage(page).player('Lucía').click();
      const home = new HomePage(page);
      await home.historyButton.click();
      await expect(new HistoryPage(page).entries).toHaveCount(1);
    },
  );

  test(
    'NFR-02 D36 a new version never interrupts a round: the worker waits instead of taking over, and the game never asks it to',
    { tag: ['@NFR-02'] },
    () => {
      // A canary on the built worker: if a plugin update changes how sw.js is written, check the behaviour again
      // (a waiting worker, no skipWaiting on install) and update the pattern.
      const worker = readFileSync(join(BUILD, 'sw.js'), 'utf8');
      // skipWaiting() only answers a "SKIP_WAITING" message…
      const skips = worker.match(/skipWaiting\(\)/g) ?? [];
      expect(skips).toHaveLength(1);
      expect(worker).toMatch(/"SKIP_WAITING"===\w+\.data\.type&&self\.skipWaiting\(\)/);
      // …and nothing in the game sends it.
      const game = buildFiles().filter(
        (file) => file.endsWith('.js') && file !== 'sw.js' && !file.startsWith('workbox-'),
      );
      expect(game.length).toBeGreaterThan(0);
      for (const file of game) {
        expect(readFileSync(join(BUILD, file), 'utf8'), file).not.toContain('SKIP_WAITING');
      }
    },
  );
});
