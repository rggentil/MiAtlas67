import { defineConfig, devices } from '@playwright/test';

const PORT = 5173;
/** The production build, served under /MiAtlas67/ as on GitHub Pages (D10), for the offline tests (NFR-02). */
const PREVIEW_PORT = 4173;
const PREVIEW_URL = `http://localhost:${String(PREVIEW_PORT)}/MiAtlas67/`;
/** The service worker only exists in a production build: its tests run in a project of their own. */
const OFFLINE_SPEC = /offline.spec.ts$/;
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
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    trace: 'on-first-retry',
    // Animations off in E2E: fewer flaky waits (see technical approach §3).
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: [
    { name: 'mobile-chrome', testIgnore: OFFLINE_SPEC, use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', testIgnore: OFFLINE_SPEC, use: { ...devices['iPhone 15'] } },
    { name: 'desktop-chrome', testIgnore: OFFLINE_SPEC, use: { ...devices['Desktop Chrome'] } },
    {
      name: 'offline-chrome',
      testMatch: OFFLINE_SPEC,
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
      reuseExistingServer: !isCI,
      timeout: 180_000,
    },
  ],
});
