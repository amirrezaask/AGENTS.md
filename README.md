# Global agent instructions and skills

`AGENTS.md` holds global conventions. Factory is the single software development
workflow, from clarification and approved briefs to plans, implementation,
verification and debriefs. Atlas owns software specification discovery, structure
and templates; Factory uses its maintenance guidance during delivery.

## Skills

| Skill | Task trigger |
| --- | --- |
| `factory` | Features, bug fixes, software development, Factory tasks and local task board |
| `atlas` | Explicit `/atlas` initialization and documentation of an existing project |
| `configure-oxlint` | Base Oxlint/Oxfmt policy and upstream anti-slop skill installation |
| `performance` | Systems, browser, and GPU performance investigations and optimization |
| `resource-bounded-runs` | Large copies and resource-heavy build or test processes |

Factory replaces the former `communication` workflow. Its
[entrypoint](skills/factory/SKILL.md) links clarification, planning, delivery
templates and the optional task board. [Atlas](skills/atlas/SKILL.md) replaces
the former specification conventions with evidence-based system discovery.

## Atlas specifications

Initialize documentation for an existing project with:

```text
/atlas
/atlas /path/to/project
/atlas the ordering subsystem in this repository
```

`/atlas [project path or scope]` is the only command that starts this baseline
workflow. Ordinary coding, explanation and documentation requests do not start
initialization. Atlas disables implicit skill invocation. Hosts that select
skills through `$atlas` or `/skills` should select the skill and include the
literal `/atlas` command in the request; this repository documents an agent
command convention, not a new host command parser.

Atlas inventories actors, entry points, state writers and integrations; maps
responsibilities; traces actor flows; and checks rules against alternate paths
and contrary evidence before writing. Its guides cover bounded investigation of
large repositories, source/runtime evidence, coverage gaps and accepted intent.
Contracts stay with areas; decision reasoning stays in linked task plans/debriefs.

```text
docs/
  README.md
  architecture.md
  domain.md
  data-model.md
  quality.md
  operations.md
  areas/<area-name>.md
  workflows/<flow-name>.md
  tasks/<task-name>/
  reports/
```

A full baseline creates the six root documents and the applicable areas and
workflows. Scoped maintenance updates affected documents only. Atlas preserves
historical documents unless migration is requested; it does not create empty
Factory tasks or require contracts/decisions directories. Factory reads affected
specifications before planning and reconciles them after verification without
implicitly starting a full baseline.

## Factory tasks

Discuss a feature or bug with the agent, approve its brief, and let it produce
an implementation plan. The task then lives in:

```text
docs/tasks/<status>/<task-name>/      # status: backlog | inprogress | blocked | done
  TASK.md       # title, dates, blocker, debrief link
  BRIEF.md      # approved requirements
  PLAN.md       # implementation approach and recorded revisions
  subtasks/<status>/<subtask-name>/   # same files; no ADMIN approval needed
```

A task's status is the directory it sits in; move it with `git mv` or the board.
Subtasks are full tasks nested in their parent, and they nest recursively: a
subtask can have subtasks, to any depth. Their briefs refine the parent
brief and need no ADMIN approval, and the parent finishes only when all of its
subtasks, at every depth, are done.

Agents may revise the plan while preserving the brief and existing area-spec
requirements. Requirement changes need ADMIN's explicit authorization. Final
verification runs regression, acceptance, then quality checks. Debriefs live in
`docs/reports/`; system specifications live directly under `docs/`, with area
rules/contracts in `docs/areas/` and actor flows in `docs/workflows/`. Existing
`docs/specs/` files remain in place until an authorized migration.

The optional board groups cards into Backlog, In progress, Blocked, and Done (one per status directory) and shows subtask progress on parent cards.
The single-file React app in `index.html` uses adapted shadcn components and
Tailwind. Cards open a modal with rendered Brief and Plan tabs. Drag-and-drop or keyboard moves move the task directory and update
`TASK.md`; they never launch sessions or prove that work is complete.
The [board installation instructions](skills/factory/references/tasks.md) run
`node <skill-dir>/assets/task-board/install-board.ts [project-dir]` (this repo: `npm run install:board -- <project-dir>`), which copies
`server.ts`, `index.html`, and fonts to the consuming project's `docs/tasks/`, adds the `factory:board` script and dependencies to that
project's package.json, installs them, and the board runs on localhost. The server prepares local
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

It also installs the Claude session budget hook: `tools/session-budget-hook.ts` links to
`~/.claude/hooks/` and a `PostToolUse` entry is added to `~/.claude/settings.json`
(other settings and hooks are left untouched; unparseable settings abort the install).
After 150 transcript lines the hook tells the model to commit and start a fresh session
with a short brief, repeating on every tool call past 250. Tune with
`SESSION_BUDGET_WARN` and `SESSION_BUDGET_HARD`. The entry stores the absolute path of the
`node` that ran the installer, so rerun the installer after upgrading Node.

```sh
npm run install:agents -- --list
npm run install:agents -- performance
```

Selected installs include Factory, Atlas and the global files. The four existing
`BRIEF_TEMPLATE.md`, `PLAN_TEMPLATE.md`, `DEBRIEF_TEMPLATE.md`, and
`SPEC_TEMPLATE.md` aliases remain available. Brief/plan/debrief aliases point into
`skills/factory/templates/`; SPEC_TEMPLATE.md points to
`skills/atlas/templates/AREA_TEMPLATE.md`. TASK_TEMPLATE.md is bundled with
Factory; Atlas bundles root/area/workflow specification templates. Installing
through `npx skills` includes bundled resources; install both Factory and Atlas
when using delivery integration. Global aliases and AGENTS.md require this installer.

Managed former root, Factory spec and communication/specification template links
migrate even when dangling. Managed communication/specification skill links are removed on
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
