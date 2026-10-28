# Global agent instructions and skills

`AGENTS.md` holds global conventions. Factory is the single software development
workflow, from clarification and approved briefs to plans, implementation,
verification, debriefs, and current area specifications. Specialist skills add
focused guidance within that workflow.

## Skills

| Skill | Task trigger |
| --- | --- |
| `factory` | Features, bug fixes, software development, Factory tasks and local task board |
| `configure-oxlint` | Base Oxlint/Oxfmt policy and upstream anti-slop skill installation |
| `performance` | Systems, browser, and GPU performance investigations and optimization |
| `resource-bounded-runs` | Large copies and resource-heavy build or test processes |

Factory replaces the former `communication` and `specification` skills. Its
[entrypoint](skills/factory/SKILL.md) links clarification and planning guidance,
area-specification rules, all document templates, and the optional task board.

## Factory tasks

Discuss a feature or bug with the agent, approve its brief, and let it produce
an implementation plan. The task then lives in:

```text
docs/tasks/<task-name>/
  TASK.md       # title, status, dates, blocker, debrief link
  BRIEF.md      # approved requirements
  PLAN.md       # implementation approach and recorded revisions
```

Agents may revise the plan while preserving the brief and existing area-spec
requirements. Requirement changes need ADMIN's explicit authorization. Final
verification runs regression, acceptance, then quality checks. Debriefs live in
`docs/reports/`; verified current behavior lives in `docs/specs/`.

The optional board groups cards into Ready, In progress, Blocked, and Done.
The single-file React app in `index.html` uses adapted shadcn components and
Tailwind. Cards open a modal with rendered Brief and Plan tabs. Drag-and-drop or keyboard moves update
`TASK.md`; they never launch sessions or prove that work is complete.
The [board installation instructions](skills/factory/references/tasks.md) copy
`server.ts`, `index.html`, and fonts to the consuming project's `docs/tasks/`, add dependencies to that
project's package manifest, and run it on localhost. The server prepares local
React/Tailwind assets at startup; no separate build command or database is needed.
Card moves, modal opening, and tab changes update React state without navigation.
Historical briefs and plans are not automatically moved.

This repository also symlinks its own board assets into `docs/tasks/`. Run
`npm run factory:board` from the repository root. The command preserves the
entrypoint symlink so the board reads this project’s tasks rather than the skill
asset directory. If the demo occupies port 4310, use
`PORT=4311 npm run factory:board`.

## Install

Requires Node.js 24 or newer.

```sh
npm ci
npm run install:agents -- --dry-run
npm run install:agents
```

The installer links `AGENTS.md` and global template aliases into `~/.agents`,
`~/.codex`, and `~/.claude`. Each skill links separately into those hosts' skills
folders and Cursor's `~/.cursor/skills-cursor/`. It never replaces the whole
skills directory. Edits propagate through symlinks; rerun after catalog changes.

```sh
npm run install:agents -- --list
npm run install:agents -- performance
```

Selected installs include Factory and the global files. The four existing
`BRIEF_TEMPLATE.md`, `PLAN_TEMPLATE.md`, `DEBRIEF_TEMPLATE.md`, and
`SPEC_TEMPLATE.md` aliases now point to `skills/factory/templates/`.
`TASK_TEMPLATE.md` is bundled with Factory. Installing through `npx skills`
includes bundled resources; global aliases and AGENTS.md require this installer.

Managed former root and communication/specification template links migrate even
when dangling. Managed communication/specification skill links are removed on
full and selected installs. Other retired skill links are cleaned only on a full
install. Known skill links from `~/dev/Amirreza.md` also migrate. Unrelated files,
directories, and symlinks are preserved; collisions fail preflight before changes.

## Maintain

`configure-oxlint` contains instructions only. Use
`npx skills add dmmulroy/anti-slop --skill install-anti-slop` for setup in other
projects. This repository's lint command uses the pinned upstream archive from
the lockfile, enabling generic and Effect rules.

Keep one skill per directory with matching metadata. Essential instructions stay
in `SKILL.md`; conditional details belong in linked references. Templates have
one canonical location. The board's server is a reusable asset, with its test
runtime dependencies in this repository's devDependencies.

```sh
npm test
npm run lint
npm run check:types
npm run check:skills
```

Tests use isolated temporary data and remove it afterward. Catalog validation
checks metadata, entrypoint size, scope wording, and local links; it does not
prove model routing or semantic adherence to the workflow.
