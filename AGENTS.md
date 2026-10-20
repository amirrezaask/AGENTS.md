# AGENTs Commandments
- **Always call Me ADMIN**
- **Hereby GLOBAL means ~/.agents/**
- **Keep repos small.**
- **Put every file in the directory below that owns it**
- **Do not add new top-level directories to the project/repo without asking.**
-  **TypeScript only.** All scripts, tools and application code are TypeScript. Do not add Rust, Python, shell or any other language unless the ADMIN explicitly authorizes it for that change. Existing non-TypeScript code stays until it is ported or authorized.
-  **One config per test runner.** `playwright.config.ts` (`PW_SUITE=<name>`) and `vitest.config.ts` (`VITEST_SUITE=<name>`) are the only ones; add a suite to them rather than a new config file.
- **Prefer oxlint for linting typescript projects**
- **Always use motion.dev and shadcn and react for frontend apps**
- **Always use effect.ts for server and client**
- **Always validate fixes/features with tests**
- **Single branch and no worktrees unless specified by ADMIN**.
- **No leftover documents.** Do not add Markdown or JSON files that nothing reads later: no progress notes, handoffs, per-task summaries, audit dumps or generated receipts. A document is allowed only if code, a test or a maintainer will read it again, and it lives in the directory above that fits.
- **Always clean garbage and leftover files on disk and processes.**
- **All change requests or bug fixes should follow this process**:
  - Ask whether the user wants a written plan, unless already specified.
  - Naming convention is `$date-$title.md` (`2026-10-20-ps3-mw3-aot-coverage.md`). `$date` is `YYYY-MM-DD`.
  - If requested, inspect the relevant code and write the plan only using template in docs/plans/.plan.md or in $GLOBAL/.plan.md (project specific template overrules the global template).
- **No patches.** No .patch or .diff are allowed, if any vendored project needs a change we shall do it in the source code.

## Projects Directory structure
**Alongside the directory structure of the source code which is defined by the project's technology stack and technical details all projects shall have**:
### docs/
#### plans/
Plans and proposals. One file each, named `$date-$platform-$title.md` (`2026-10-20-ps3-mw3-aot-coverage.md`). `$date` is `YYYY-MM-DD`; `$platform` is the target (`ps1`, `ps2`, `ps3`, `psp`, `win32`, `minecraft`, `web`, `all`, ...). A finished or abandoned plan is deleted, not archived; git keeps the history.
#### specs/
TBA
#### reports/
Every benchmark, test, verification and evidence result, in one place. One directory (or one `.md`) per run, named `$date-$title`. Only Markdown summaries are tracked; raw output (json, png, logs, traces) stays local and is gitignored. Playwright and playthrough output is written here by the config, never next to the code.
#### tools/
All scripts, build and install tooling, benchmarks drivers, checks, generators and one-off utilities, plus their fixtures. Nothing executable lives at the repo root or in a `scripts/` directory.
### .work
Gitignored scratch space for logs, probes and temporary output. Each agent is hereby commanded to delete it's own trash after completing ADMIN request.





**For Codex-specific instructions, follow @CODEX.md.**
