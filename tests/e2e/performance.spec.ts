import type { Page, TestInfo } from '@playwright/test';
import { saveResults, savedPlayerId, type Result } from './device.ts';
import { expect, test } from './fixtures.ts';
import { AtlasPage } from './pages/AtlasPage.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HistoryPage } from './pages/HistoryPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { NewPlayerPage } from './pages/NewPlayerPage.ts';
import { PlayersPage } from './pages/PlayersPage.ts';
import { RoundPage } from './pages/RoundPage.ts';

// The performance budget of NFR-03 (D38), on the production build under /MiAtlas67/ (project "perf-chrome"):
// a mid-range phone emulated in Chromium, CPU 4 times slower, 10 Mbit/s and 40 ms latency. Each test records
// its numbers as annotations, so the report shows them even when they pass.

const AVATARS = [
  'fox',
  'panda',
  'frog',
  'lion',
  'penguin',
  'octopus',
  'unicorn',
  'trex',
  'cat',
  'dog',
  'owl',
];

/** CPU 4 times slower, as D38 says; PERF_CPU_RATE=1 measures this machine as it is, to compare. */
const CPU_RATE = Number(process.env.PERF_CPU_RATE ?? 4);

/** The mid-range phone of D38. */
async function midRangePhone(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_RATE });
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 40,
    downloadThroughput: (10 * 1024 * 1024) / 8,
    uploadThroughput: (10 * 1024 * 1024) / 8,
  });
}

function note(testInfo: TestInfo, type: string, description: string): void {
  testInfo.annotations.push({ type, description });
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? Number.NaN;
}

/**
 * Times the next tap: from the tap to the next paint, as the Event Timing API measures it (`duration`). Events
 * shorter than 16 ms are not reported by the browser, so no entry means under 16 ms.
 */
async function timeTap(page: Page, tap: () => Promise<void>): Promise<number> {
  await page.evaluate(() => {
    const scope = window as unknown as { tapDurations: number[] };
    scope.tapDurations = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (['pointerdown', 'pointerup', 'click', 'touchstart', 'touchend'].includes(entry.name)) {
          scope.tapDurations.push(entry.duration);
        }
      }
    }).observe({ type: 'event', durationThreshold: 16 } as PerformanceObserverInit);
  });
  await tap();
  // Event Timing entries arrive after the paint: give them a moment.
  await page.waitForFunction(
    () =>
      new Promise((done) =>
        setTimeout(() => {
          done(true);
        }, 300),
      ),
  );
  return page.evaluate(() =>
    Math.max(0, ...(window as unknown as { tapDurations: number[] }).tapDurations),
  );
}

async function createLucia(page: Page): Promise<void> {
  const players = new PlayersPage(page);
  await page.goto('./');
  await expect(players.heading).toHaveText('¿Quién juega?');
  await players.newPlayerButton.click();
  await new NewPlayerPage(page).create('Lucía', 'Zorro');
  await expect(new HomePage(page).heading).toHaveText('¿A qué jugamos?');
}

test.describe('Performance budget (NFR-03, D38)', () => {
  test(
    'NFR-03 the first screen shows its buttons, and they respond, within 2 seconds (median of 5 first openings)',
    { tag: ['@NFR-03'] },
    async ({ browser }, testInfo) => {
      const times: number[] = [];
      for (let opening = 0; opening < 5; opening += 1) {
        // A device that never opened the game: a new context each time.
        const context = await browser.newContext({
          ...testInfo.project.use,
          serviceWorkers: 'block',
        });
        const page = await context.newPage();
        await midRangePhone(page);
        const started = Date.now();
        await page.goto('./', { waitUntil: 'commit' });
        const players = new PlayersPage(page);
        await players.newPlayerButton.click();
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nuevo jugador');
        times.push(Date.now() - started);
        await context.close();
      }
      note(testInfo, 'first screen (ms)', times.join(', '));
      expect(median(times)).toBeLessThanOrEqual(2000);
    },
  );

  test(
    'NFR-03 NFR-02 no flag or silhouette is requested to reach the home screen, and the first round asks only for the pictures it shows',
    { tag: ['@NFR-03', '@NFR-02'] },
    async ({ page }) => {
      const pictures: string[] = [];
      page.on('request', (request) => {
        if (request.resourceType() === 'image') pictures.push(new URL(request.url()).pathname);
      });
      await createLucia(page);

      const notAvatars = pictures.filter(
        (path) => !AVATARS.some((avatar) => path.includes(`/assets/${avatar}-`)),
      );
      expect(pictures.length).toBeGreaterThan(0);
      expect(notAvatars).toEqual([]);

      pictures.length = 0;
      await new HomePage(page).openGame('País → Bandera');
      await new GameSetupPage(page).chooseRegion('Europa');
      await new GameSetupPage(page).chooseLevel('Fácil');
      const round = new RoundPage(page);
      await expect(round.progressText).toHaveText('1/10');
      const shown = page.getByRole('main').locator('img');
      await expect
        .poll(() =>
          shown.evaluateAll((images) =>
            images.every((image) => (image as HTMLImageElement).complete),
          ),
        )
        .toBe(true);
      const shownPaths = await shown.evaluateAll((images) =>
        images.map((image) => new URL((image as HTMLImageElement).src).pathname),
      );
      expect(shownPaths).toHaveLength(3);
      expect([...new Set(pictures)].sort()).toEqual([...new Set(shownPaths)].sort());
    },
  );

  for (const sound of ['on', 'off'] as const) {
    test(
      `NFR-03 a tap on an answer shows its mark within 100 ms (median of the six games, one tap each), with the sound ${sound}`,
      { tag: ['@NFR-03'] },
      async ({ page }, testInfo) => {
        test.slow();
        await createLucia(page);
        if (sound === 'off') await page.getByRole('switch', { name: 'Sonido' }).click();
        await midRangePhone(page);
        const home = new HomePage(page);
        const durations: number[] = [];
        const games: string[] = [];
        for (const game of [
          'Bandera → País',
          'País → Bandera',
          'País → Capital',
          'Capital → País',
          'Silueta → País',
          'País → Silueta',
        ]) {
          await home.openGame(game);
          await new GameSetupPage(page).chooseRegion('Europa');
          await new GameSetupPage(page).chooseLevel('Fácil');
          const round = new RoundPage(page);
          await expect(round.progressText).toHaveText('1/10');
          const duration = await timeTap(page, () => round.options.first().click());
          await expect(round.feedback).not.toBeEmpty();
          durations.push(duration);
          games.push(`${game}: ${String(Math.round(duration))}`);
          await round.quit();
          await expect(home.heading).toHaveText('¿A qué jugamos?');
        }
        note(testInfo, `tap to mark, sound ${sound} (ms)`, games.join('; '));
        // One slow frame (a garbage collection, a picture decoded) must not decide: the median does.
        expect(median(durations)).toBeLessThanOrEqual(100);
      },
    );
  }

  test(
    'NFR-03 a tap among 6 flags, as in "País → Bandera · Difícil", shows its mark within 100 ms (median of 5 questions)',
    { tag: ['@NFR-03'] },
    async ({ page }, testInfo) => {
      await createLucia(page);
      const lucia = (await savedPlayerId(page, 'Lucía')) ?? -1;
      await saveResults(page, lucia, [
        { game: 'FLAG-B', region: 'world', level: 1, score: 8, stars: 2 },
        { game: 'FLAG-B', region: 'world', level: 2, score: 8, stars: 2 },
      ]);
      await midRangePhone(page);
      await new HomePage(page).openGame('País → Bandera');
      await new GameSetupPage(page).chooseRegion('Mundo');
      await new GameSetupPage(page).chooseLevel('Difícil');
      const round = new RoundPage(page);
      await expect(round.options).toHaveCount(6);

      const durations: number[] = [];
      for (let question = 1; question <= 5; question += 1) {
        await expect(round.progressText).toHaveText(`${String(question)}/10`);
        await expect(round.options).toHaveCount(6);
        durations.push(await timeTap(page, () => round.options.first().click()));
        await expect(round.feedback).not.toBeEmpty();
        await round.nextButton.click();
      }

      note(
        testInfo,
        'tap among 6 flags (ms)',
        durations.map((d) => String(Math.round(d))).join(', '),
      );
      expect(median(durations)).toBeLessThanOrEqual(100);
    },
  );

  test(
    'NFR-03 "Historial" with 500 rounds is usable within 2 seconds',
    { tag: ['@NFR-03'] },
    async ({ page }, testInfo) => {
      await createLucia(page);
      const lucia = (await savedPlayerId(page, 'Lucía')) ?? -1;
      const games = ['FLAG-A', 'FLAG-B', 'CAP-A', 'CAP-B', 'SHAPE-A', 'SHAPE-B'] as const;
      const rounds: Result[] = Array.from({ length: 500 }, (_, index) => ({
        game: games[index % games.length] ?? 'FLAG-A',
        region: 'europe',
        level: 1,
        score: index % 11,
        stars: 0,
        playedAt: Date.UTC(2026, 0, 1) + index * 3_600_000,
      }));
      await saveResults(page, lucia, rounds);
      await midRangePhone(page);

      const history = new HistoryPage(page);
      const started = Date.now();
      await new HomePage(page).historyButton.click();
      await expect(history.entries).toHaveCount(500);
      await history.backButton.click();
      const elapsed = Date.now() - started;

      note(testInfo, 'Historial with 500 rounds (ms)', String(elapsed));
      expect(elapsed).toBeLessThanOrEqual(2000);
    },
  );

  test(
    'NFR-03 the Atlas "Mundo", with its 247 entries, is usable within 2 seconds',
    { tag: ['@NFR-03'] },
    async ({ page }, testInfo) => {
      await createLucia(page);
      await midRangePhone(page);
      const atlas = new AtlasPage(page);
      await atlas.openButton.click();

      const started = Date.now();
      await atlas.chooseRegion('Mundo');
      await expect(atlas.entries('Mundo')).toHaveCount(195);
      await expect(atlas.entries('Territorios y otros')).toHaveCount(52);
      await atlas.backButton.click();
      await expect(atlas.regions).toBeVisible();
      const elapsed = Date.now() - started;

      note(testInfo, 'Atlas Mundo (ms)', String(elapsed));
      expect(elapsed).toBeLessThanOrEqual(2000);
    },
  );
});
