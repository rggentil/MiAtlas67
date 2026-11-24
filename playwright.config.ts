import { defineConfig, devices } from '@playwright/test';

const PORT = 5173;
/** The production build, served under /MiAtlas67/ as on GitHub Pages (D10), for the offline tests (NFR-02). */
const PREVIEW_PORT = 4173;
const PREVIEW_URL = `http://localhost:${String(PREVIEW_PORT)}/MiAtlas67/`;
/** The service worker only exists in a production build: its tests run in a project of their own. */
const OFFLINE_SPEC = /offline\.spec\.ts$/;
/** The performance budget is measured on the production build too, on an emulated mid-range phone (D38). */
const PERFORMANCE_SPEC = /performance\.spec\.ts$/;
const PRODUCTION_SPECS = [OFFLINE_SPEC, PERFORMANCE_SPEC];
/** Visual regression runs on mobile-chrome only, so there is one approved screenshot per screen (D40). */
const VISUAL_SPEC = /visual\.spec\.ts$/;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  ...(isCI ? { workers: 2 } : {}),
  reporter: isCI
    ? [['html', { open: 'never' }], ['github']]
    : [['html', { open: 'never' }], ['list']],
  // The approved screenshots (D40): one per screen, made in the CI container, so the name has no project or OS.
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  // A missing screenshot fails instead of being written (a retry would then pass against it). Only the workflow
  // "Update screenshots" writes them, with --update-snapshots.
  updateSnapshots: 'none',
  expect: {
    // Up to 100 pixels may differ, each by a little (anti-aliasing). A changed colour token, even a shade
    // (sun #FFC93C → #FFB92C), a padding or a changed word is far above it.
    toHaveScreenshot: { maxDiffPixels: 100, threshold: 0.05 },
  },
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    trace: 'on-first-retry',
    // Animations off in E2E: fewer flaky waits (see technical approach §3).
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: [
    { name: 'mobile-chrome', testIgnore: PRODUCTION_SPECS, use: { ...devices['Pixel 7'] } },
    {
      name: 'mobile-safari',
      testIgnore: [...PRODUCTION_SPECS, VISUAL_SPEC],
      use: { ...devices['iPhone 15'] },
    },
    {
      name: 'desktop-chrome',
      testIgnore: [...PRODUCTION_SPECS, VISUAL_SPEC],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'offline-chrome',
      testMatch: OFFLINE_SPEC,
      use: { ...devices['Pixel 7'], baseURL: PREVIEW_URL, serviceWorkers: 'allow' },
    },
    {
      name: 'perf-chrome',
      testMatch: PERFORMANCE_SPEC,
      // Times are measured last, when every other project has finished, one test at a time, so nothing else
      // loads the machine; a retry would only pick the best of three. Alone: --project=perf-chrome --no-deps.
      dependencies: ['mobile-chrome', 'mobile-safari', 'desktop-chrome', 'offline-chrome'],
      fullyParallel: false,
      retries: 0,
      use: { ...devices['Pixel 7'], baseURL: PREVIEW_URL, serviceWorkers: 'allow' },
    },
  ],
  webServer: [
    {
      command: `npm run dev -- --port ${String(PORT)} --strictPort`,
      url: `http://localhost:${String(PORT)}`,
      reuseExistingServer: !isCI,
    },
    {
      command: `npx vite build --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port ${String(PREVIEW_PORT)} --strictPort`,
      env: { VITE_BASE: '/MiAtlas67/' },
      url: PREVIEW_URL,
      // Always a fresh build: an old preview on this port would test an old game.
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
