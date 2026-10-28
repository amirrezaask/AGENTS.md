# AGENTS
Address the user as ADMIN. GLOBAL means `~/.agents/`.

## Directory structure
Never add a top-level directory without asking. Beyond the stack's own source layout, every project has:

- `docs/tasks/<task-name>/`: Factory tasks with `TASK.md` metadata, approved `BRIEF.md`, and mutable `PLAN.md`. Historical briefs and plans stay in place unless migration is requested.
- `docs/tasks/server.ts`: the optional Factory board server; this is the specific exception to the tooling location rule.
- `docs/reports/`: every benchmark, test and verification result, one dir or `.md` per run, `$date-$title`. Track only Markdown summaries; raw output (json, png, logs, traces) is gitignored. Playwright and playthrough output is written here by the config.
- `docs/README.md`, `docs/architecture.md`, `docs/domain.md`, `docs/data-model.md`, `docs/quality.md`, and `docs/operations.md`: Atlas's system purpose/navigation, structure, shared concepts, data ownership, quality requirements, and operational behavior. These documents live directly under `docs/`.
- `docs/areas/<area-name>.md`: ground rules, state ownership, and relevant contracts for each software area.
- `docs/workflows/<flow-name>.md`: actor goals, triggers, steps, outcomes, and failure/recovery behavior across areas. Actors include users, external systems, jobs, and operators.
- Keep specification facts in one owning document and link related documents. Contracts belong in areas; consequential decisions and their reasoning belong in task plans/debriefs, linked from the relevant specification. No mandatory `contracts/` or `decisions/` directories. Keep historical specs in place unless migration is requested.
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
  - **Oxlint + Oxfmt** are initialized and run via `npm run lint`. Install the [anti-slop](https://github.com/dmmulroy/anti-slop) rules and enable all of them; `configure-oxlint` points to the upstream installation skill.
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

For software development work, read [Factory](skills/factory/SKILL.md) and follow
its clarification, approved brief, plan, task, verification, and debrief workflow.
[Atlas](skills/atlas/SKILL.md) owns specification discovery methods, the structure
above, and specification templates. Only ADMIN's explicit `/atlas` command starts
initialization/documentation of an existing project; do not infer it from ordinary
coding or explanation requests. Factory reads affected specs before planning and
uses Atlas's targeted maintenance guidance to reconcile them with verified
behavior before completion. Research discussions do not authorize implementation.

GLOBAL template filenames remain available through installer-managed symlinks;
brief, plan, task and debrief templates live inside Factory; specification
templates live inside Atlas.
