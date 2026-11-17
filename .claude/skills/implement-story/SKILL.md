---
name: implement-story
description: Implement a MiAtlas67 GitHub issue (story or chore) end to end with the project's story loop — read the issue and the spec, plan, write the tests from the Gherkin acceptance criteria first, implement, run every gate, open the pull request, merge when CI is green and update the board. Use it whenever the product owner asks to implement, build, start or continue an issue or an epic ("haz la #21", "sigue con la épica", "la siguiente historia"), and also to only plan a story without touching anything (dry run).
---

# Implement a story

The story loop of `docs/03-way-of-working.md` §1, made repeatable. `CLAUDE.md` holds the commands and
conventions; this skill is the order of work and the checks that are easy to forget.

The product owner (PO) is a QA engineer who reviews on the phone in short slots. Talk to them in Spanish,
briefly. Code, tests, commits and PRs are in English.

## 1. Understand the issue

1. `gh issue view <N>`: user story, `**Traceability:**` line, Gherkin scenarios, notes. The label says the
   type: `story` (user-facing) or `chore` (tooling, CI, docs). Read the epic (#1–#7) for context if needed.
2. Read every requirement ID of the traceability line in `docs/01-product-spec.md`, plus the decisions
   (D-numbers) they mention. For UI work also read `docs/02-technical-approach.md` §3 (tests) and §7 (tokens),
   and look at the existing screens and components so the new one fits in.
3. Check dependencies: if the story needs screens or rules of stories that are not done yet, propose the order
   and do those first (within the same epic that needs no approval).
4. Look at the real content the story will show: the data rows, the flag images, the texts in both languages.
   A question a child cannot answer (two identical flags, a missing translation) is a product question for the
   PO, and it is cheaper to find it in the plan than in the family test session.
5. Check the story against the spec. The spec is the source of truth: if a scenario contradicts a requirement
   or an approved decision (e.g. a timer, while RND-03 and D6 say there is none), do not build it. Stop and
   ask the PO, and propose the spec change (requirement, D-number, change log) that would come first if they
   agree. Building it anyway would silently change the product they approved.

Stop for **product decisions** (what the child sees or does, scope, data that needs the PO's judgement: for
data, use a review page as in the memory notes). Do not stop for **implementation choices** with a sensible
default (component structure, a locator, a CSS detail): decide, and mention it in the PR notes.

## 2. Plan

Write a short plan before touching code. It keeps the tests tied to the acceptance criteria. Write it in
English, like every repo document; only the message to the PO is in Spanish:

```markdown
# Plan: #<N> <title>
Type: story | chore → PR body "Refs #<N>" | "Closes #<N>" → after merge: "In review" | "Done"
Branch: <N>-<short-slug>
Requirements: <IDs>

## Scenarios → tests
| Scenario | Layer | Test title |
|---|---|---|
| Correct answer | component | RND-04 a correct answer shows "¡Correcto!" with a ✓ icon |

## Files
- domain / data / i18n / ui / tests: what changes and why

## Decisions and questions
- decided: … (implementation choices, go in the PR notes)
- for the PO: … (only real product questions; empty is fine)
```

- **Normal run**: share the plan in a few lines and go on. Within an epic the PO lets you chain stories without
  waiting; stop only for the questions above.
- **Dry run** (the PO or an eval asks only for the plan): write the plan where asked and stop. No branch, no
  board move, no file edits in the repo.

## 3. Start

1. `bash scripts/board.sh <N> "In progress"` (and the epic, if it is still in Backlog or Ready).
2. `git checkout main`, `git pull --ff-only`, then `git checkout -b <N>-<short-slug>`.

## 4. Tests first, from the acceptance criteria

Every scenario gets at least one test, and every `Then`/`And` step gets an assertion. The title starts with the
requirement ID, so `npm run trace` can see it: `it('RND-04 marks the chosen wrong option with ✗', …)`.

| What | Layer | How |
|---|---|---|
| Game rule | unit, `src/domain/*.test.ts` | Pure functions, seeded `Rng`; `src/domain` coverage stays ≥ 90 % |
| Screen behaviour | component, `src/**/*.test.tsx` | Testing Library + `userEvent`, `renderWithI18n`, `getByRole` |
| User journey | E2E, `tests/e2e/*.spec.ts` | Page object in `tests/e2e/pages`, `getByRole`, `{ tag: '@<ID>' }`, `?seed=42` |

- E2E content: with `?seed=42` the app is deterministic. Compute the expected question from the domain
  (`generateRound(countries, settings, createRng(42), relations)`) instead of hard-coding country names, so a
  data fix does not break the test.
- Every new screen gets an axe scan (`makeAxeBuilder`) and, if it has new buttons, the 48 × 48 px check (NFR-05).
- Assert the outcome, not just presence: the score went from 0 to 1, the ✗ is on the option that was tapped,
  the disabled game does nothing when tapped. Scenarios that say "cannot", "no" or "not" need a negative check.
- When a scenario is about which items are where ("grouped by topic"), assert their names inside each group, not
  only how many there are.
- Behaviour you add on the side (focus moving to the new screen's title, a new back button) needs a test too.
- Render every new screen at least once in English in a component test (NFR-06).
- No `waitForTimeout`, no CSS/XPath selectors, no `data-testid` unless nothing accessible fits.
- Run the new unit and component tests once before implementing and check that they fail for the right reason.

## 5. Implement

- Domain first (pure TypeScript in `src/domain`), then the UI, which only calls it.
- Follow `CLAUDE.md`: strict TypeScript without `any`, `.ts` imports, no `enum`; every UI text in both
  dictionaries of `src/i18n`; feedback with ✓/✗ icons, not colour alone; touch targets ≥ 48 px.
- Only what the story and the spec ask for. If something seems missing, ask or note it; do not add it.
- If the behaviour of the product changes, update the spec first (requirement, change log, D-number).

## 6. Verify

1. `npx prettier --write src tests`, then `npm run check` (typecheck, lint, format, unit + component with the
   coverage gate, E2E on mobile-chrome, mobile-safari and desktop-chrome). Fix failures; never skip a gate.
2. New or changed screen: look at it with the Playwright MCP at 390 × 844 (screenshots in `.playwright-mcp/`,
   which is git-ignored). Tests pass on ugly screens too.
3. Independent review: spawn the `qa-reviewer` subagent (`.claude/agents/qa-reviewer.md`) with the issue number
   and the branch. Fix the real findings and rerun the gates; list the ones you reject, with the reason, in the
   PR notes.
4. `npm run trace`: the story's requirement IDs must now have tests.

## 7. Ship

Run the state-changing git and gh steps one at a time and check each result before the next.

1. Commit with Conventional Commits: `feat: <what> (#N)` for a story; `chore:`, `ci:`, `docs:` or `test:` for a
   chore. The body says what changed; end it with the attribution lines of the session.
2. `git push -u origin <branch>`, then `gh pr create` with this body:
   - `Refs #<N>` for a story (it stays open until the PO accepts it), `Closes #<N>` for a chore;
   - the acceptance criteria as a checklist, ticked, each with the layers that cover it;
   - notes: decisions taken, QA findings rejected, anything the PO should try.
3. `gh pr checks <pr> --watch` (in the background). When **both** checks are green:
   `gh pr merge <pr> --squash --delete-branch`. Never chain the merge after other commands with `;`.
4. After the merge:
   - story → `bash scripts/board.sh <N> "In review"`;
   - chore → the merge closes the issue; then `bash scripts/board.sh <N> Done`.
5. `git checkout main` and `git pull --ff-only`.

## 8. Tell the PO

In Spanish, a few lines: what is live at <https://rggentil.github.io/MiAtlas67/> once the deploy finishes, what to
tap to try it on the phone, decisions taken, anything pending. Then go on with the next story of the epic.

## When to stop and ask

- A scenario contradicts the spec or an approved decision.
- A product decision has no sensible default, or data needs the PO's judgement.
- CI fails for a reason outside the story after two honest attempts.
