# MiAtlas67

[![CI](https://github.com/rggentil/MiAtlas67/actions/workflows/ci.yml/badge.svg)](https://github.com/rggentil/MiAtlas67/actions/workflows/ci.yml)

A mobile-first geography quiz game for the family: learn the world's **flags**, **capitals** and
**country shapes** in short rounds, from easy to expert, and watch your progress grow.

Spanish UI by default, English available. No accounts, no ads, no tracking: everything stays on the device.

> **Status:** specification approved, development starting (phase 1, walking skeleton).

**Play it:** <https://rggentil.github.io/MiAtlas67/>. Every commit on `main` that passes CI is deployed there.

## Development

Requires Node 22 LTS (see `.nvmrc`).

```bash
npm ci                          # install exact dependency versions
npx playwright install chromium webkit   # browsers for the E2E tests (first time only)
npm run dev                     # http://localhost:5173
npm run check                   # every quality gate: typecheck, lint, format, tests, coverage, E2E
```

### Try it on your phone

1. **Deployed version (HTTPS):** open <https://rggentil.github.io/MiAtlas67/> on the phone.
   HTTPS is required for the future offline/install features.
2. **Your local changes, same Wi-Fi:** run `npm run dev -- --host`. Vite prints a *Network* URL such as
   `http://192.168.1.23:5173`; open it on the phone.
   - Windows asks to allow Node.js through the firewall the first time: allow it on **private** networks only.
   - It does not work on guest or corporate Wi-Fi networks that isolate devices from each other.
3. **Quick check without a phone:** browser DevTools (F12) → device toolbar.

## Documentation

The project is built spec-first with Claude Code. The specs are the source of truth:

| Document | Contents |
|---|---|
| [Product specification](docs/01-product-spec.md) | What the game does: games, levels, rounds, profiles, data rules |
| [Technical approach](docs/02-technical-approach.md) | Stack, architecture, testing strategy, design tokens |
| [Way of working](docs/03-way-of-working.md) | Spec-driven flow, roadmap, board, Definition of Done |
| [Playwright for Selenium users](docs/04-playwright-for-selenium-users.md) | The differences that matter, as applied here |

Work is tracked on the GitHub Project board linked to this repository.

## License

[MIT](LICENSE): free to use, copy and adapt. Flag and map data keep their own open licences (see the
"Acerca de" screen in the app).
