# MiAtlas67 — guide for Claude Code

Mobile-first geography quiz game for the family (flags, capitals, country shapes), built spec-first.
The product owner is a QA engineer and plays it with their kids; the UI is Spanish by default, English switchable.

## Source of truth

| Document | Use it for |
|---|---|
| `docs/01-product-spec.md` | **What** to build. Requirement IDs (`RND-02`, `FLAG-A`, `NFR-04`…) |
| `docs/02-technical-approach.md` | **How**: stack, architecture, test strategy, design tokens (§7) |
| `docs/03-way-of-working.md` | Story loop, board, Definition of Done |
| GitHub issues | Stories with Gherkin acceptance criteria. Issue #N (N = 1…7) is the epic of roadmap phase N |

**Spec-driven rule:** when behaviour changes, update the spec first, then the tests, then the code.
Never add behaviour that is not in the spec or the story; ask the product owner instead.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:5173 (`-- --host` to open it from a phone on the same Wi-Fi) |
| `npm run build` | Typecheck + production build into `dist/` |
| `npm run typecheck` / `npm run lint` / `npm run format` | Quality tools (`format:check` in CI) |
| `npm run test:unit` | Vitest, `src/**/*.test.ts`, node environment |
| `npm run test:component` | Vitest + Testing Library, `src/**/*.test.tsx`, jsdom |
| `npm run test:coverage` | Unit + component with the gate: `src/domain` ≥ 90 % |
| `npm run test:e2e` | Playwright on mobile-chrome, mobile-safari, desktop-chrome (starts Vite itself) |
| `npm run check` | Every gate in sequence: run it before opening a pull request |

## Layout

```text
src/domain/      Pure TypeScript game rules: no React, no DOM, no Math.random (use the seeded RNG)
src/data/        Bundled datasets (countries, shapes)
src/storage/     Repository interfaces + IndexedDB implementation
src/i18n/        Typed UI dictionaries (es, en)
src/ui/          React: screens/ and components/
src/test/        Component-test setup
tests/e2e/       Playwright specs, fixtures.ts (axe), pages/ (page objects)
scripts/         Data build scripts and repo tooling (board.sh)
```

## Conventions

- **Language:** code, comments, docs, commits and PRs in English. UI texts in Spanish and English through `src/i18n`,
  never hard-coded in components (from story #13 on). Talk to the product owner in Spanish.
- **TypeScript:** strict, no `any`, no non-null assertions. Imports use the `.ts`/`.tsx` extension.
  `erasableSyntaxOnly` is on: no `enum`, no `namespace`, no constructor parameter properties.
- **Domain first:** game rules live in `src/domain` as pure functions with unit tests; the UI only calls them.
- **Tests:**
  - the title starts with the requirement ID: `it('RND-02 never repeats an option', ...)`;
  - E2E uses role-based locators (`getByRole`), page objects in `tests/e2e/pages`, an axe scan on every new screen,
    and requirement tags (`{ tag: '@FLAG-A' }`);
  - tests come from the story's acceptance criteria, written before the code.
- **Privacy (NFR-04):** no runtime network calls, no analytics, no cookies. Store only nickname, avatar and results.
  Never commit secrets or `.env` files.
- **Accessibility (NFR-05):** touch targets ≥ 48 px; feedback never relies on colour alone (✓ / ✗ icons).

## Story loop and git

1. Move the story to *In progress*: `bash scripts/board.sh <issue> "In progress"`.
2. Branch `<issue>-<short-slug>` from `main`.
3. Tests from the acceptance criteria → implementation → `npm run check`.
4. Commit with Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`).
5. Open a pull request whose body lists the acceptance criteria as a checklist:
   - **chore** (tooling, CI, docs): body says `Closes #<issue>`;
   - **story** (user-facing): body says `Refs #<issue>`, so the issue stays open until the product owner accepts it.
6. Wait until **both CI checks are green** (`gh pr checks <pr> --watch`), then `gh pr merge <pr> --squash --delete-branch`.
   `main` is protected: it requires the checks "Typecheck, lint, format, unit + component tests" and
   "E2E (mobile-chrome, mobile-safari, desktop-chrome)". If you rename a CI job, update the branch protection too.
7. After merging, CI deploys to <https://rggentil.github.io/MiAtlas67/>:
   - chore: the merge closes the issue; then `bash scripts/board.sh <issue> Done` (the board does not move
     closed issues by itself);
   - story: `bash scripts/board.sh <issue> "In review"`; the product owner tries it on the phone, then you close it.

**Git safety:** run state-changing git/gh steps one at a time and check each result before the next. Never chain a
merge after other steps with `;`.

Definition of Done: `docs/03-way-of-working.md` §5.
