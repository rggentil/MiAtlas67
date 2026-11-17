# MiAtlas67 — Way of Working

> **Status: v1.0** — how we build this together with Claude Code.
> Last updated: 2026-11-17

---

## 1. Spec-driven flow

```text
Product spec  ──►  Technical approach  ──►  Backlog                      ──►  Build, story by story
   (WHAT)              (HOW)                 (epics → stories + Gherkin       (tests first → code → demo)
                                              acceptance criteria)
```

- **Gate**: you agree each step before the next one starts.
- **Source of truth**: the specs live in the repo (`docs/`). When behaviour changes, the spec changes first,
  then the tests, then the code.

**Loop for each story**
1. Move the story to *In progress* on the board.
2. Claude proposes a short implementation plan, and you approve or adjust it.
3. Acceptance criteria (Given/When/Then) become tests first: E2E, plus component/unit tests where relevant.
4. Implement until every test is green.
5. Demo: you try it on desktop and on your phone. Feedback leads to fixes.
6. Commit; move the story to *Done*.

**Story format (example)**

```gherkin
# FLAG-S1 — Play a flags round
# As a player I want to guess the country of a flag, so that I learn flags.
# Traceability: FLAG-A, RND-04

Scenario: Correct answer
  Given I am playing a Flags round "Europa · Fácil" with seed 42
  When I tap the option "España"
  Then I see "¡Correcto!"
  And the score shows 1/10
```

## 2. Roadmap

| Phase | Goal | Outcome |
|---|---|---|
| **0 Specification** | Agree on spec, technical approach and backlog | Agreed docs |
| **1 Walking skeleton** | Scaffold, lint, Vitest, Playwright, CI, `CLAUDE.md`, one smoke test per layer, open on a phone | "Hola MiAtlas" on your phone, all pipelines green |
| **2 Data and engine** | Country dataset + integrity tests, question generator, scoring | Domain fully unit-tested |
| **3 First playable: Flags** | Flags round end-to-end with summary | First family test session |
| **4 Profiles and history** | Profiles, saved rounds, history screen | Progress over time |
| **5 Capitals and Shapes** | The two remaining modes | MVP content complete |
| **6 Levels and rewards** | Regions × levels, stars, unlocks, family records | MVP complete |
| **7 Polish and ship** | Visual polish, sounds, Atlas, PWA offline/install, HTTPS deploy | Installable on phones |
| **8+ Later** | Map mode, reverse modes, Capacitor app, online multiplayer | — |

The visual style was chosen before phase 1 (theme C «Bloques», spec D11), so the first playable version
already looks good.

## 3. Board — GitHub Projects (decided)

- **Specs** (what and why) live in the repo under `docs/`. They are the source of truth for requirements.
- **Stories** are GitHub Issues in `rggentil/MiAtlas67`:
  - the body holds the user story, the Gherkin acceptance criteria and the traced requirement IDs;
  - labels mark the epic (`epic:data`, `epic:flags`…) and the type (`story`, `bug`, `chore`).
- **Board**: a GitHub Project (Kanban) with the columns *Backlog → Ready → In progress → In review → Done*.
- **Epics** map to the roadmap phases, using milestones or a parent issue with sub-issues.
- **Commits and PRs** reference the issue (`Closes #12`), so the card moves to *Done* when the PR is merged.
- **Claude manages everything with the `gh` CLI**: it creates issues, adds them to the project and moves cards.
  No MCP is needed, only `gh` logged in to github.com with the `project` scope.

FigJam (the Figma connector is available) stays as an option for brainstorming or visual mockups, not for tracking.

## 4. Claude Code setup

| Item | When | Purpose |
|---|---|---|
| `CLAUDE.md` | Phase 1 | Commands, conventions, Definition of Done and where the specs live, so every session starts with the same rules |
| Skill `implement-story` | First story, once the pattern is proven | Read story + spec → plan → tests from acceptance criteria → implement → run all layers → update the board |
| Skill `traceability` | Phase 2–3 | Report which requirement IDs have no test yet |
| Subagent `qa-reviewer` | Phase 3 | Independent review of the tests against the acceptance criteria (missing edge cases, weak assertions) |
| Playwright MCP | Already installed | Claude opens the running app, clicks through it and takes screenshots (exploratory checks). This is separate from the Playwright test suite |
| Figma MCP | Already connected | Optional: mockups, FigJam board |
| Hooks | Later, if useful | For example, automatic typecheck and lint after edits |
| Anthropic skill `frontend-design` | Already installed | UI work: keeps screens intentional and on-theme |
| Anthropic skill `skill-creator` | Already available | Build and test our own skills (`implement-story`, `traceability`) with evals |

No extra MCP or connector is needed right now. From the public
[anthropics/skills](https://github.com/anthropics/skills) catalogue, `webapp-testing` was considered and
not adopted: it drives Playwright from Python, and we already have the Playwright MCP for exploratory
checks plus our own TypeScript Playwright suite.

## 5. Definition of Done

- [ ] Acceptance criteria are covered by tests (requirement IDs in the test names)
- [ ] Typecheck and lint are clean
- [ ] Unit, component and E2E tests are green (mobile and desktop projects)
- [ ] The spec is updated if behaviour changed
- [ ] Demoed and accepted by the product owner (you)
- [ ] Committed, and the board is updated

## 6. Learning Playwright along the way

In phase 1, Claude writes `docs/playwright-notes.md`: **Playwright for Selenium users**. It covers:
- auto-waiting instead of explicit waits;
- role-based locators;
- browser contexts and isolation;
- fixtures;
- projects and devices;
- `npx playwright test --ui`;
- the trace viewer;
- `codegen`.

The tests are written to read as living documentation of the game's behaviour.
