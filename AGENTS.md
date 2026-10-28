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

### Briefing
For any request from user whether it's a change, adding a feature or fixing a bug, ask once whether ADMIN wants a written brief. If yes, inspect the relevant code, then write it to `docs/briefs/$date-$title.md` using `docs/briefs/BRIEF_TEMPLATE.md`, falling back to GLOBAL `BRIEF_TEMPLATE.md`.It's really important to note that when writing the brief we should make it concise, summarized and simple, verbosity in brief kills the whole purpose of fast communication of intent and knowledge with ADMIN.

- Briefs are markdown files that target user and humans as audience not agents.
- Briefs are designed for communicating intent and knowledge to humans, so they MUST be short, concise and right to point. Creating a long elaborate brief that the user will never read is an antipattern so avoid it.
- Verbosity is a bad practice in writing Briefs.
- Following brief template is a MUST.
- When an agent is prompted directly or indirectly to create a brief, follow this sequence: **Brief → Plan → Implementation → Debrief → Specification update**.
- Requests like generating a new artifact or creating a report, image, or video do not need a plan unless they change code or a brief is requested.

## Plans
Plans are handoff documents agents pass between each other to carry out contextual information from one session to another. A basic example would be a consulting session with a high end expensive model and creating plan file, handing it to a simpler cheaper agent model.
**Plans are designed as Agent-to-Agent documents so they should be expressive, percise, contextful document that agents can follow to implement a requested change or fix.**
**Use GLOBAL `PLAN_TEMPLATE.md`**

## Debrief
- Debriefs record the outcome, work, decisions, and validation of a task.
- Include useful findings, even when unrelated to the request; distinguish evidence from assumptions and note what remains unverified.
- Record remaining work and relevant artifacts. Use GLOBAL `DEBRIEF_TEMPLATE.md`.

## Specification
- Describe the software concisely by area in `docs/specs/`; name each area file `<area-name>.spec.md` and use GLOBAL `SPEC_TEMPLATE.md`.
- List observable requirements that can be verified both manually and through automated tests. State the conditions, action, and expected outcome clearly.
- Specifications must match the actual code. Document implemented behavior, not proposed or unfinished behavior.
- After implementation and the debrief, update every affected area specification to reflect the changes. Check the updated requirements against the code and available verification before marking the work complete.
- If a mismatch cannot be resolved or verified, report it and leave the work incomplete; do not present the specification as synchronized.

