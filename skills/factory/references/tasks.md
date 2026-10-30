# Task documents and local board

## Layout and metadata

Use `docs/tasks/<status>/<task-name>/{TASK,BRIEF,PLAN}.md`. Task names are
lowercase ASCII letters/numbers separated by single hyphens and are unique across
all status directories. Reuse existing tasks; never overwrite another task to
resolve a naming collision.

The status is the directory the task lives in:

| Directory | Board column | Meaning |
| --- | --- | --- |
| `backlog/` | Backlog | Approved brief and implementation plan exist; not started |
| `inprogress/` | In progress | Implementing or verifying |
| `blocked/` | Blocked | A recorded decision/dependency prevents progress |
| `done/` | Done | Requirements, verification, debrief, and area specs complete |

TASK.md uses YAML frontmatter with nonempty `title` and quoted ISO
`created`/`updated` dates as plain single-line keys. It has no `status` key: the
directory is the single source of truth. Other metadata and Markdown body content
are allowed and preserved. Move a task with `git mv` (or the board) and update
`updated`. Relative links inside a task's documents must survive the move, so link
to `docs/reports/` from the repo root path or recompute them when moving.

Record blockers and the debrief link in the Markdown body. A status change is
bookkeeping: it does not approve work, execute plans, validate completion, or
create agent sessions.

## Subtasks

A task may contain `subtasks/<status>/<subtask-name>/{TASK,BRIEF,PLAN}.md`, the
same structure and statuses as a top-level task. Subtask names are unique within
their parent. A subtask brief needs no ADMIN approval but must refine, never
contradict, its parent brief; record "Approval: not required, subtask of
`<parent>`". The board shows a `done/total subtasks` count on the parent card and
does not move subtasks; moving a parent moves its subtasks with it.

Subtasks nest recursively without limit: any subtask may hold its own
`subtasks/<status>/…` tree with the same structure and rules. The parent card's
count covers every descendant at all depths.

## One shared board

A single board serves every project; projects do not carry a copy. Run it with
`npx amirreza-factory [project-dir...]` (from this repository, `npm link` inside
`skills/factory/assets/task-board/` after `npm install` there, then run
`amirreza-factory`). Node.js 24+ is required. Listed directories are registered;
with none given and an empty registry the current directory is adopted if it has
`docs/tasks/`. Registered projects persist in `~/.factory/projects.json`
(`FACTORY_HOME` overrides the directory) and can also be added or removed in the
UI header (a native folder dialog opens on the host; light/dark follows the system with a header toggle). The board binds to `127.0.0.1` on any free port (PORT overrides) and
reports the URL. Leave a preview running only when ADMIN asks to use it. Never
add `server.ts`, `index.html`, fonts or a `factory:board` script to a project.

The header shows the selected project name and a project switcher; the name is read from package.json
`displayName`, then `name`, then the project directory. React renders it as text.
Claude-reference cream/charcoal/clay tokens, locally served Anthropic Serif/Sans,
and restrained transitions carry the visual language. Motion respects reduced
motion. [Font sources](../assets/task-board/FONTS.md) are recorded with the assets.
