# MiAtlas67 — Technical Approach

> **Status: v1.0** — accepted with the product spec v1.0 (the product owner delegated the technology choice).
> Last updated: 2026-11-17

---

## 1. Stack

| Concern | Choice | Why |
|---|---|---|
| Language | **TypeScript** (strict) | Types catch bugs early; very well supported by AI tooling |
| UI framework | **React + Vite** | The most widespread web stack, so Claude's output is strongest here. Huge ecosystem, and the skills carry over to future apps |
| Styling | **Tailwind CSS** | Fast, consistent, mobile-first utilities |
| Animation | **Motion** (framer-motion) | Smooth, kid-friendly transitions |
| Country shapes | **d3-geo + topojson-client**, **Natural Earth** data | Renders silhouettes as SVG; the same base serves the future map mode |
| Flags | **Wikimedia Commons** SVGs, the file Wikipedia shows, optimised with **svgo** (`npm run data:flags`) | Every flag in its real ratio (D39), crisp at any size, works offline. Source, licence and ratio recorded per file |
| Fonts | **Lilita One** + **Nunito**, self-hosted via **@fontsource** (SIL OFL) | No runtime call to Google Fonts (NFR-04); works offline |
| Local persistence | **IndexedDB via Dexie**, behind a repository interface. Per-device preferences (language) in `localStorage`, with every access guarded | Robust on-device storage; the interface lets us plug in a cloud backend later. If storage is blocked, the app still works with defaults |
| Offline / installable | **vite-plugin-pwa** | Service worker + web app manifest |
| Native app (later) | **Capacitor** | Wraps the same web app as an Android/iOS app, with no rewrite |
| Unit + component tests | **Vitest + React Testing Library** (+ fake-indexeddb) | Fast and Vite-native |
| E2E tests | **Playwright** (+ @axe-core/playwright) | Mobile emulation, auto-waiting, trace viewer, accessibility scans |
| i18n | Typed translation dictionaries (`es`, `en`); `react-i18next` only if needs grow | Type-safe keys: a missing translation fails the typecheck |
| Lint / format | ESLint + Prettier | |
| Repo / CI | Git + GitHub (`rggentil/MiAtlas67`) + GitHub Actions | Free; CI runs every test layer on each push |
| Hosting (HTTPS preview) | **GitHub Pages**, deployed by GitHub Actions | Free HTTPS for a public repo (D10) |

Versions: latest stable at scaffold time (2026-11), pinned exactly in `package.json`, on Node 22 LTS (`.nvmrc`).
Exception: TypeScript stays on **6.0** because typescript-eslint does not support TypeScript 7 yet; upgrade
when it does.

**Alternatives considered**
- *Flutter*: excellent for native, weaker for "web first".
- *React Native / Expo*: web is a secondary target and there are more moving parts.
- *Svelte*: simpler, but a smaller ecosystem.

React + Vite + Capacitor is the shortest path from "web now" to "app later" with a single codebase.

## 2. Architecture

```text
src/
  domain/        # Pure TypeScript, no React: countries, question generator, scoring, stars, mastery, seeded RNG
  data/          # countries.json (curated), shapes (TopoJSON)
  storage/       # Repository interfaces + IndexedDB implementation
  i18n/          # UI texts (es, en)
  ui/
    screens/     # ProfilePicker, Home, ModeSelect, Round, RoundSummary, History, Progress, Atlas...
    components/  # AnswerButton, FlagImage, CountryShape, StarRating...
scripts/         # One-off data build scripts (Natural Earth -> simplified shapes)
tests/
  e2e/           # Playwright specs + page objects
```

**Principles**
- Game rules live in `domain/` as pure functions: easy to unit test and independent of the UI.
- The UI depends on the domain, and storage is hidden behind interfaces (IndexedDB now, maybe cloud later).
- All assets (flags, shapes, data) are bundled, so nothing is fetched at runtime.
- Navigation between screens is React state: the URL never changes, so `?seed=` stays for the whole visit.
  The game keeps history entries of its own, three away from the first screen ("¿Quién juega?") and one on it,
  so the phone's back button goes back inside the game, and asks before leaving it (NAV-01, NAV-02, D22,
  `src/ui/navigation/`).
  They are added only after a tap or a key press: Chrome's back button skips the entries a page adds without one.
- The data build script generates `countries.json` and simplified shapes once. The output is committed to the
  repo, and integrity tests guard it.

## 3. Testing strategy — three layers

| Layer | Tools | What it covers | Volume / speed |
|---|---|---|---|
| **1. Unit** | Vitest | Domain rules: question generation (no duplicates, correct answer exactly once, distractor rules per level), scoring and stars, unlocking, mastery; data integrity | Many tests, milliseconds |
| **2. Component / integration** | Vitest + React Testing Library + jsdom + fake-indexeddb | Screens with the real domain logic (round flow, feedback, summary); the storage repositories against a fake IndexedDB (`src/storage/*.test.ts`, which Vitest runs in Node: no React there) | Moderate, seconds |
| **3. End-to-end** | Playwright | User journeys in real browser engines: create profile → play round → see history; persistence after reload; mobile and desktop viewports; accessibility scan | Few tests, critical paths only |

**Playwright projects** (each E2E test runs on all of them):
- `mobile-chrome`: Pixel 7 emulation (Chromium)
- `mobile-safari`: iPhone emulation (WebKit, which runs fine on Windows)
- `desktop-chrome`

**Testability design**
- **Seeded randomness**: `?seed=42` (enabled only in dev/test builds) produces the same questions on every
  run, so E2E tests can assert exact content.
- **Locators**: prefer `getByRole` / `getByText`, which also checks accessibility. Use `data-testid` only
  when there is no accessible alternative.
- **Isolation**: every Playwright test gets a fresh browser context, so IndexedDB starts empty and no cleanup is needed.
- **Animations**: E2E runs with `reducedMotion: 'reduce'` to avoid flakiness.
- **Traceability**: test titles carry requirement IDs (`test('RND-02 options never contain duplicates', ...)`),
  plus Playwright tags (`@smoke`, `@FLAG-01`) to run subsets. `npm run trace` reports which requirements
  have no test and highlights the gaps of the current phase (also in the CI job summary).
- **Page Object Model** for E2E, the same pattern as in Selenium.

**Quality gates**: typecheck, lint, all three layers green, ≥ 90% coverage of `domain/`, CI green.

*Could:* visual regression with Playwright `toHaveScreenshot` on key screens once the design is stable.

## 4. Running and testing on a phone

1. **DevTools device mode** (F12 → device toolbar): the quickest check while developing.
2. **Real phone on the same Wi-Fi**: run `npm run dev -- --host`. Vite prints a *Network* URL
   (e.g. `http://192.168.1.23:5173`); open it on the phone.
   Windows Firewall must allow Node on private networks. Corporate laptops or guest Wi-Fi networks may block this.
3. **HTTPS preview**: service workers (offline/install) only work over HTTPS or on `localhost`, so an IP URL
   is not enough. CI deploys to the HTTPS host (see the stack table); open that URL on the phone → "Add to home screen".
4. **Playwright mobile emulation** runs on every test run (viewport, touch, user agent). It is a regression
   safety net, not a replacement for a real device.
5. **Native (later)**: Capacitor → Android Studio emulator, or install the APK on an Android phone over USB.
   iOS needs a Mac with Xcode (and a paid Apple developer account to distribute beyond your own devices).

## 5. Path to a mobile app

1. **PWA**: install from the browser, works offline. Probably enough for family use.
2. **Capacitor**: when native features or store presence are wanted. Same code, no rewrite.

## 6. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Errors in Spanish country/capital names | Curated dataset reviewed by a human, integrity tests, documented sources |
| Silhouettes of tiny or fragmented countries are unrecognizable | `shapeEligible` flag, higher-resolution data for small states, overseas territories cropped |
| Disputed territories / political sensitivity | Explicit entity list (Appendix A, DATA-07), neutral names and factual status labels (DATA-08) |
| Flaky E2E tests from randomness or animations | Seeded RNG, Playwright auto-waiting, reduced motion in tests |
| Scope creep | MoSCoW priorities, first playable version early |

## 7. Visual theme tokens — Theme C «Bloques»

Taken from the chosen mockups (spec D11). They become the Tailwind theme in phase 1.

| Token | Value | Use |
|---|---|---|
| `ink` | `#1A1A2E` | Text, outlines, shadows |
| `ink-muted` | `#4A4A66` | Secondary text |
| `sky` | `#CFE6FF` | App background |
| `paper` | `#FFFFFF` | Cards, option buttons |
| `sun` | `#FFC93C` | Primary action ("Siguiente"), progress bar, stars |
| `accent` | `#FF5D8F` | Logo, highlights |
| `topic-flags` | `#FF9DBB` | Banderas |
| `topic-capitals` | `#8DB4FF` | Capitales |
| `topic-shapes` | `#6EDDB0` | Siluetas |
| `success` | `#6EDDB0` | Correct-answer feedback, always with a ✓ icon |
| `error` | `#FF8A80` | Wrong-answer feedback, always with a ✗ icon |

- **Shape**: 3 px `ink` border; radius 16 px for cards, 999 px for chips; offset shadow `4px 4px 0 ink`
  (pressed state: no shadow, moved 4 px right and down).
- **Type**: *Lilita One* for titles, buttons and big numbers; *Nunito* 700–900 for body text.
- **Accessibility**: every text/background pair above with `ink` text passes WCAG AA contrast; axe checks it in E2E.
