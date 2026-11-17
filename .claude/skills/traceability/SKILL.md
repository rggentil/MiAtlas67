---
name: traceability
description: Report which MiAtlas67 spec requirements (RND-02, FLAG-A, NFR-07…) have tests and which do not, highlighting the gaps of the current roadmap phase. Use when asked about traceability, requirement coverage, "which requirements have no test", or before closing a story or an epic.
---

# Traceability report

1. Run `npm run trace` (about 15 s). For another phase: `npm run trace -- --phase N`.
   - Requirements: the bold IDs defined in `docs/01-product-spec.md`.
   - Tests: Vitest and Playwright test titles (and Playwright tags) that mention an ID.
   - Current phase: the lowest open epic; its requirements are the IDs on the `**Traceability:**` line of the
     epic's sub-issues (read with `gh`). Without `gh`, the phase section says it is unavailable.
2. Summarize for the product owner, in Spanish and briefly:
   - totals (requirements with and without tests);
   - every gap of the current phase, with the story that traces it, classified as:
     - **missing test**: the behaviour exists but no test title mentions the ID;
     - **naming gap**: a test covers it but its title lacks the ID;
     - **deferred**: the requirement belongs to a later story or phase (say which);
   - the requirements of later phases are expected to have no tests yet: do not list them one by one.
3. Propose the next action for each gap (add a test, rename a title, move the ID to the right story).
   Do not change tests, the spec or issues from this skill without asking.
