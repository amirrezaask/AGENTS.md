# AGENTS

Address the user as ADMIN. GLOBAL means `~/.agents/`.

## Rules
- **Single branch, no worktrees**, unless ADMIN says otherwise.
- **TypeScript first.** All scripts, tools and app code are TypeScript. Add no other language without ADMIN's explicit approval for that change. Existing non-TypeScript code stays until ported or approved.
  - **Effect.ts** is a mandatory dependency in every TypeScript project, client and server.
  - **Oxlint + Oxfmt** are initialized and run via `npm run lint`. Install the [anti-slop](https://github.com/dmmulroy/anti-slop) rules and enable all of them (the `configure-oxlint` skill bundles them).
  - **One config per test runner:** `playwright.config.ts` (`PW_SUITE=<name>`) and `vitest.config.ts` (`VITEST_SUITE=<name>`). Add a suite rather than a new config file.
- **Change requests and bug fixes:** ask once whether ADMIN wants a written plan. If yes, inspect the relevant code, then write it to `docs/plans/$date-$platform-$title.md` using `docs/plans/PLAN_TEMPLATE.md`, falling back to GLOBAL `PLAN_TEMPLATE.md`.
- **Subagents:** Prompt the user with suggestions on whether to use subagents, and the model and reasoning.
- **No leftover files.** Add no Markdown or JSON that nothing will read again (progress notes, handoffs, summaries, audit dumps, receipts). Delete your own scratch files, `.work` contents and stray processes when the request is done.
- **No patch files for vendored repos.**

## Directory structure
Never add a top-level directory without asking. Beyond the stack's own source layout, every project has:

- `docs/plans/`: plans and proposals, `$date-$title.md` (`YYYY-MM-DD`) Delete finished or abandoned plans; git keeps history.
- `docs/reports/`: every benchmark, test and verification result, one dir or `.md` per run, `$date-$title`. Track only Markdown summaries; raw output (json, png, logs, traces) is gitignored. Playwright and playthrough output is written here by the config.
- `tools/`: all scripts, build/install tooling, benchmark drivers, checks, generators and their fixtures. Nothing executable at the repo root or in `scripts/`.
- `.work/`: gitignored scratch space.
- `specs/`: tests that define the behavior of the software, replacing a written spec.
  - Black-box only: no imports from or calls into the codebase.
  - Playwright for UI and client; plain TS tests for backend.
  - One file per area (a vertical of the app).
  - In a repo without specs after ADMIN explicit request to add specs, propose areas from the codebase and get ADMIN's approval before writing any.
