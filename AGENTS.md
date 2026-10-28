# AGENTS
Address the user as ADMIN. GLOBAL means `~/.agents/`.

## Directory structure
Never add a top-level directory without asking. Beyond the stack's own source layout, every project has:

- `docs/briefs`: Documents that communicate intent and knowledge from agent to humans, named with `$date-$title.md`.
- `docs/plans/`: plans and proposals, `$date-$title.md` (`YYYY-MM-DD`); git keeps history.
- `docs/reports/`: every benchmark, test and verification result, one dir or `.md` per run, `$date-$title`. Track only Markdown summaries; raw output (json, png, logs, traces) is gitignored. Playwright and playthrough output is written here by the config.
- `docs/specs/`: written specifications of implemented software behavior, one `<area-name>.spec.md` file per area; keep each in sync with the code.
- `tools/`: all scripts, build/install tooling, benchmark drivers, checks, generators and their fixtures. Nothing executable at the repo root or in `scripts/`.
- `.work/`: gitignored scratch space.
- `.worktrees/`: All git worktrees created by different agents.

## Rules
### Version Control
**Keep worktrees of each project in it's own directory in .worktrees**
**Each new session should start from a clean git worktree from a branch (prompt user for branch default to main/master)**
**Each agent round should conclude with a commit.**
**Commit messages should reference the brief and plan document of requested change(in absence of said documents, commit message should just echo user's request)**
**Branch names should not have `codex` or `claude` as prefix, they should be prefixed by `feat-` or `fix-`.**

### Language and Stack
**TypeScript first.** All scripts, tools and app code are TypeScript. Add no other language without ADMIN's explicit approval for that change. Existing non-TypeScript code stays until ported or approved.
  - **Effect.ts** is a mandatory dependency in every TypeScript project, client and server.
  - **Oxlint + Oxfmt** are initialized and run via `npm run lint`. Install the [anti-slop](https://github.com/dmmulroy/anti-slop) rules and enable all of them (the `configure-oxlint` skill bundles them).
  - **One config per test runner:** `playwright.config.ts` (`PW_SUITE=<name>`) and `vitest.config.ts` (`VITEST_SUITE=<name>`). Add a suite rather than a new config file.
  - When there is an obvious performance gain by using a more low-level language like Rust, prompt the user whether they want a rewrite or atleast notify them for they can think about it.


### Agentic
- **Subagents:** Prompt the user with suggestions on whether to use subagents, and the model and reasoning.
- Validation and qualification MUST be done for all session but regression checks come first. First make sure we didn't break anything then check for validity and quality.
- It's really important when pursuing a goal we should move towards implementing all the goal specifies first and then validation and qualification. We should spend hours validating a half baked implementation which proves nothing.

### Cleanliness
- **No leftover files.** Add no Markdown or JSON that nothing will read again (progress notes, handoffs, summaries, audit dumps, receipts). Delete your own scratch files, `.work` contents and stray processes when the request is done.
- **No leftover worktrees** All agents should cleanup worktrees they create after they have committed all changes on the target branch.

## Documentation workflow

At the start of every task, read both skills and follow their instructions:

- [Communication](skills/communication/SKILL.md): briefs, plans, and debriefs.
- [Specification](skills/specification/SKILL.md): implemented behavior and area specifications.

GLOBAL template filenames remain available through installer-managed symlinks;
the canonical templates live inside these skills.
