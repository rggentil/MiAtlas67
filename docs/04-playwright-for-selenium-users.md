# Playwright for Selenium users

What changes when you come from Selenium, as applied in this project. Not a tutorial: each point links a
Selenium habit to what we do here instead. Official docs: <https://playwright.dev/docs/intro>.

## The differences that matter

| # | Selenium habit | Playwright, in this project |
|---|---|---|
| 1 | Explicit waits (`WebDriverWait`, `ExpectedConditions`), sometimes `Thread.sleep` | **Auto-waiting.** Actions (`click`, `fill`) wait until the element is visible, enabled and stable. Assertions such as `await expect(locator).toBeVisible()` are *web-first*: they retry until a timeout. No sleeps, no explicit waits. |
| 2 | `findElement` returns a `WebElement` right away, which can go stale | **Locators are lazy.** `page.getByRole(...)` is a description, resolved again on every action. There is no `StaleElementReferenceException`. |
| 3 | XPath and CSS selectors first | **User-facing locators first:** `getByRole`, `getByLabel`, `getByText`. `getByTestId` only when nothing else fits. A role locator that works is also a small accessibility check. |
| 4 | One WebDriver session per test, cookies cleared by hand | **A fresh browser context per test**, created in milliseconds. Cookies, `localStorage` and IndexedDB start empty, so tests need no cleanup and can run in parallel. |
| 5 | Selenium Grid or several drivers for several browsers | **Projects** in `playwright.config.ts`: every test runs on `mobile-chrome` (Pixel 7), `mobile-safari` (iPhone 15, WebKit, also on Windows) and `desktop-chrome`. Device presets set viewport, touch, user agent and pixel ratio. |
| 6 | `@Before`/`@After` methods and base test classes | **Fixtures** (`test.extend`) inject ready-made objects into the test signature; see `makeAxeBuilder` in `tests/e2e/fixtures.ts`. Page objects stay, in `tests/e2e/pages`. |
| 7 | Screenshot and log on failure | **Trace viewer.** A trace records every step with DOM snapshots, network and console. In CI it is recorded on the first retry and uploaded with the HTML report. Open it with `npx playwright show-trace <trace.zip>`. |
| 8 | Start the app yourself before the suite | **`webServer`** in the config starts Vite and waits until it answers. |
| 9 | Groups or categories (TestNG, JUnit tags) | **Tags:** `{ tag: '@smoke' }`. We also tag requirement IDs (`@NFR-05`), so `--grep @FLAG-A` runs one requirement's tests. |
| 10 | Debugging with breakpoints in the IDE | **UI mode** (`npm run test:e2e:ui`): watch mode with time travel through each step. Also `--debug` (inspector) and `npx playwright codegen` to record locators. |

## Project conventions

- Test titles start with the requirement ID: `test('NFR-05 has no accessibility violations', ...)`.
- Animations are off in E2E (`reducedMotion: 'reduce'`).
- Random content will be fixed with a seed (`?seed=42`), so tests can assert exact questions.
- Each page has an accessibility scan with axe (`makeAxeBuilder`).

## Commands

| Command | What it does |
|---|---|
| `npm run test:e2e` | All E2E tests on the three projects |
| `npx playwright test --project=mobile-safari` | One project only |
| `npx playwright test --grep @smoke` | Tagged tests only |
| `npm run test:e2e:ui` | UI mode |
| `npx playwright show-report` | Open the last HTML report |
