import { appendFileSync } from 'node:fs';
import type { Page, TestInfo } from '@playwright/test';
import { countries } from '../../src/data/countries.ts';
import { extendedEntities } from '../../src/data/extended.ts';
import { saveResults, savedPlayerId, type Result } from './device.ts';
import { expect, test } from './fixtures.ts';
import { AtlasPage } from './pages/AtlasPage.ts';
import { GameSetupPage } from './pages/GameSetupPage.ts';
import { HistoryPage } from './pages/HistoryPage.ts';
import { HomePage } from './pages/HomePage.ts';
import { NewPlayerPage } from './pages/NewPlayerPage.ts';
import { PlayersPage } from './pages/PlayersPage.ts';
import { RoundPage } from './pages/RoundPage.ts';

// The performance budget of NFR-03 (D38), on the production build under /MiAtlas67/ (project "perf-chrome",
// which runs after every other project, so nothing else loads the machine): a mid-range phone emulated in
// Chromium, CPU 4 times slower, 10 Mbit/s and 40 ms latency. `vite preview` serves the files uncompressed, which
// is slower than GitHub Pages: a margin on our side. Each number is written to the report and, in CI, to the
// job summary, also when it passes.

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
const GAMES = [
  'Bandera → País',
  'País → Bandera',
  'País → Capital',
  'Capital → País',
  'Silueta → País',
  'País → Silueta',
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

/** Records a measure in the report and, in CI, in the job summary. */
function note(testInfo: TestInfo, type: string, description: string): void {
  testInfo.annotations.push({ type, description });
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) appendFileSync(summary, `- NFR-03 · ${type}: ${description}\n`);
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? Number.NaN;
}

const rounded = (values: readonly number[]) =>
  values.map((value) => String(Math.round(value))).join(', ');

/**
 * Starts recording the page's taps with the Event Timing API: each entry's `duration` runs from the tap to the
 * next paint. The browser leaves out events under 16 ms. Fails when the browser has no Event Timing, so a missing
 * entry always means "under 16 ms", never "not measured".
 */
async function recordTaps(page: Page): Promise<void> {
  const supported = await page.evaluate(() => {
    if (!PerformanceObserver.supportedEntryTypes.includes('event')) return false;
    const scope = window as unknown as { taps: { start: number; duration: number }[] };
    scope.taps = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (['pointerdown', 'pointerup', 'click', 'touchstart', 'touchend'].includes(entry.name)) {
          scope.taps.push({ start: entry.startTime, duration: entry.duration });
        }
      }
    }).observe({ type: 'event', durationThreshold: 16 } as PerformanceObserverInit);
    return true;
  });
  expect(supported, 'the browser measures taps (Event Timing)').toBe(true);
}

/**
 * Taps an answer and returns how long its ✓ or ✗ took to be painted: the longest event of the tap. Only the
 * entries that started with this tap count.
 */
async function timeAnswer(page: Page, round: RoundPage): Promise<number> {
  const before = await page.evaluate(() => performance.now());
  await round.options.first().click();
  await expect(round.feedback.getByRole('img')).toBeVisible();
  // The entries of a tap are delivered after its paint: two frames and the task after them.
  await page.evaluate(
    () =>
      new Promise((done) => {
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            setTimeout(done, 0);
          }),
        );
      }),
  );
  return page.evaluate(
    (since) =>
      Math.max(
        0,
        ...(window as unknown as { taps: { start: number; duration: number }[] }).taps
          .filter((tap) => tap.start >= since)
          .map((tap) => tap.duration),
      ),
    before,
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

/** Opens `game` in `region` and `level`, and waits until the first question and its pictures are there. */
async function startRound(
  page: Page,
  game: string,
  region = 'Europa',
  level = 'Fácil',
): Promise<RoundPage> {
  await new HomePage(page).openGame(game);
  await new GameSetupPage(page).chooseRegion(region);
  await new GameSetupPage(page).chooseLevel(level);
  const round = new RoundPage(page);
  await expect(round.progressText).toHaveText('1/10');
  await picturesLoaded(page);
  return round;
}

async function picturesLoaded(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page
        .getByRole('main')
        .locator('img')
        .evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete)),
    )
    .toBe(true);
}

test.describe('Performance budget (NFR-03, D38)', () => {
  test(
    'NFR-03 the first screen shows its buttons, and they respond, within 2 seconds (median of 5 first openings)',
    { tag: ['@NFR-03'] },
    async ({ browser }, testInfo) => {
      const times: number[] = [];
      for (let opening = 0; opening < 5; opening += 1) {
        // A device that never opened the game: a new context each time. Its service worker starts storing the
        // game meanwhile, as on a real first visit.
        const context = await browser.newContext(testInfo.project.use);
        const page = await context.newPage();
        await midRangePhone(page);
        const started = Date.now();
        await page.goto('./', { waitUntil: 'commit' });
        await new PlayersPage(page).newPlayerButton.click();
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nuevo jugador');
        times.push(Date.now() - started);
        await context.close();
      }
      note(testInfo, 'first screen, 5 openings (ms)', rounded(times));
      expect(median(times)).toBeLessThanOrEqual(2000);
    },
  );

  test(
    'NFR-03 NFR-04 no flag or silhouette is requested to reach the home screen, nothing comes from another site, and the first round asks only for the pictures it shows',
    { tag: ['@NFR-03', '@NFR-04'] },
    async ({ page, baseURL }) => {
      const pictures: string[] = [];
      const everything: string[] = [];
      page.on('request', (request) => {
        everything.push(request.url());
        if (request.resourceType() === 'image') pictures.push(new URL(request.url()).pathname);
      });
      await createLucia(page);

      expect(pictures.length).toBeGreaterThan(0);
      expect(
        pictures.filter((path) => !AVATARS.some((avatar) => path.includes(`/assets/${avatar}-`))),
      ).toEqual([]);

      pictures.length = 0;
      await startRound(page, 'País → Bandera');
      const shown = await page
        .getByRole('main')
        .locator('img')
        .evaluateAll((images) =>
          images.map((image) => new URL((image as HTMLImageElement).src).pathname),
        );
      expect(shown).toHaveLength(3);
      expect([...new Set(pictures)].sort()).toEqual([...new Set(shown)].sort());

      const own = new URL(baseURL ?? '').origin;
      expect(everything.filter((url) => new URL(url).origin !== own)).toEqual([]);
    },
  );

  for (const sound of ['on', 'off'] as const) {
    test(
      `NFR-03 a tap on an answer shows its ✓ or ✗ within 100 ms in each of the six games, the very first one included, with the sound ${sound}`,
      { tag: ['@NFR-03'] },
      async ({ page }, testInfo) => {
        test.slow();
        await createLucia(page);
        const soundSwitch = page.getByRole('switch', { name: 'Sonido' });
        if (sound === 'off') await soundSwitch.click();
        await expect(soundSwitch).toBeChecked({ checked: sound === 'on' });
        await midRangePhone(page);
        const home = new HomePage(page);

        const perGame: string[] = [];
        for (const [index, game] of GAMES.entries()) {
          const round = await startRound(page, game);
          if (index === 0) await recordTaps(page);
          // Three answers per game: the first of the page is the one that used to wait for the audio to start.
          const durations: number[] = [];
          for (let question = 1; question <= 3; question += 1) {
            durations.push(await timeAnswer(page, round));
            await round.nextButton.click();
            await expect(round.progressText).toHaveText(`${String(question + 1)}/10`);
            await picturesLoaded(page);
          }
          perGame.push(`${game}: ${rounded(durations)}`);
          if (index === 0)
            expect(durations[0], `${game}, the first answer of the page`).toBeLessThanOrEqual(100);
          // One slow frame (a garbage collection, a picture decoded) must not decide a game: its median does.
          expect(median(durations), game).toBeLessThanOrEqual(100);
          await round.quit();
          await expect(home.heading).toHaveText('¿A qué jugamos?');
        }
        note(testInfo, `tap to ✓/✗, sound ${sound} (ms)`, perGame.join('; '));
      },
    );
  }

  test(
    'NFR-03 a tap among 6 flags, as in "País → Bandera · Difícil", shows its mark within 100 ms (median of 5 questions)',
    { tag: ['@NFR-03'] },
    async ({ page }, testInfo) => {
      await createLucia(page);
      const lucia = await savedPlayerId(page, 'Lucía');
      expect(lucia).not.toBeNull();
      await saveResults(page, lucia ?? Number.NaN, [
        { game: 'FLAG-B', region: 'world', level: 1, score: 8, stars: 2 },
        { game: 'FLAG-B', region: 'world', level: 2, score: 8, stars: 2 },
      ]);
      await midRangePhone(page);
      const round = await startRound(page, 'País → Bandera', 'Mundo', 'Difícil');
      await recordTaps(page);

      const durations: number[] = [];
      for (let question = 1; question <= 5; question += 1) {
        await expect(round.progressText).toHaveText(`${String(question)}/10`);
        await expect(round.options).toHaveCount(6);
        await picturesLoaded(page);
        durations.push(await timeAnswer(page, round));
        await round.nextButton.click();
      }

      note(testInfo, 'tap among 6 flags (ms)', rounded(durations));
      expect(median(durations)).toBeLessThanOrEqual(100);
    },
  );

  test(
    'NFR-03 "Historial" with 500 rounds is usable within 2 seconds (median of 3 openings)',
    { tag: ['@NFR-03'] },
    async ({ page }, testInfo) => {
      await createLucia(page);
      const lucia = await savedPlayerId(page, 'Lucía');
      expect(lucia).not.toBeNull();
      const games = ['FLAG-A', 'FLAG-B', 'CAP-A', 'CAP-B', 'SHAPE-A', 'SHAPE-B'] as const;
      const rounds: Result[] = Array.from({ length: 500 }, (_, index) => ({
        game: games[index % games.length] ?? 'FLAG-A',
        region: 'europe',
        level: 1,
        score: index % 11,
        stars: 0,
        playedAt: Date.UTC(2026, 0, 1) + index * 3_600_000,
      }));
      await saveResults(page, lucia ?? Number.NaN, rounds);
      await midRangePhone(page);

      const history = new HistoryPage(page);
      const times: number[] = [];
      for (let opening = 0; opening < 3; opening += 1) {
        const started = Date.now();
        await new HomePage(page).historyButton.click();
        await expect(history.entries).toHaveCount(500);
        times.push(Date.now() - started);
        await history.backButton.click();
      }

      note(testInfo, 'Historial with 500 rounds, 3 openings (ms)', rounded(times));
      expect(median(times)).toBeLessThanOrEqual(2000);
    },
  );

  test(
    'NFR-03 the Atlas "Mundo", with every country and extended entity, is usable within 2 seconds (median of 3 openings)',
    { tag: ['@NFR-03'] },
    async ({ page }, testInfo) => {
      await createLucia(page);
      await midRangePhone(page);
      const atlas = new AtlasPage(page);
      await atlas.openButton.click();

      const times: number[] = [];
      for (let opening = 0; opening < 3; opening += 1) {
        const started = Date.now();
        await atlas.chooseRegion('Mundo');
        await expect(atlas.entries('Mundo')).toHaveCount(countries.length);
        await expect(atlas.entries('Territorios y otros')).toHaveCount(extendedEntities.length);
        times.push(Date.now() - started);
        await atlas.backButton.click();
        await expect(atlas.regions).toBeVisible();
      }

      note(
        testInfo,
        `Atlas Mundo, ${String(countries.length + extendedEntities.length)} entries, 3 openings (ms)`,
        rounded(times),
      );
      expect(median(times)).toBeLessThanOrEqual(2000);
    },
  );
});
