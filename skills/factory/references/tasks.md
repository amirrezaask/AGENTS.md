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

## Install in a consuming project

1. Run the installer shipped with the skill from the project root. It copies
   `server.ts`, `index.html` and the two Anthropic fonts into `docs/tasks/`
   (the requested board location is an exception to the tools convention), adds
   the `factory:board` script and the dependencies below to package.json without
   touching unrelated entries or existing compatible versions, and runs the
   project's package manager (npm, pnpm, yarn or bun by lockfile) to update its
   lockfile. Re-running updates the copied assets.

   ```sh
   node <skill-dir>/assets/task-board/install-board.ts [project-dir] [--link] [--no-install] [--dry-run]
   ```

   `--link` symlinks the assets instead of copying them, for a project that
   consumes this library directly. An existing unrelated `factory:board` script
   stops the install; rename it first.
2. Require Node.js 24+. All browser/compiler dependencies are local; the server
   never downloads code or fonts when starting.
3. Run relevant project checks and smoke-test the copied app, document tabs,
   and status persistence against disposable task data. Remove test data after.
4. Start with `npm run factory:board` or the project's equivalent. It binds to
   `127.0.0.1:4310`, configurable with PORT. Report the URL and stop instructions.
   Leave a preview running only when ADMIN asks to use it.

Run the installer on the first Factory task in a project unless a board already
exists or ADMIN requests documents only.

The installer applies these ranges (listed for manual installs with npm):

```sh
npm install effect@3.22.4 marked@17 gray-matter@4 sanitize-html@2 react@19 react-dom@19 @radix-ui/react-dialog@1 @radix-ui/react-tabs@1 @radix-ui/react-slot@1 class-variance-authority@0.7 clsx@2 tailwind-merge@3 lucide-react@1 esbuild@0.28 tailwindcss@4.1.18 @tailwindcss/oxide@4.1.18
```

Keep Tailwind and its oxide scanner aligned. Shadcn components are source code
inside index.html, using Radix primitives; there is no shadcn browser script or
runtime package to load. Preserve the included MIT attribution when adapting.

## Application behavior

The complete React application, adapted shadcn Button/Card/Dialog/Tabs/Alert
components, semantic Tailwind theme, and custom reader styles live in index.html.
The server compiles that embedded TSX and Tailwind CSS once at startup, in memory,
using installed dependencies. No separate build command, CDN, generated source
files, framework scaffolding, or database is needed. Restart after source edits.

React loads the board API once, opens an accessible controlled dialog, and fetches
both sanitized documents when a task opens. Switching tabs is local state. The
modal occupies 80vw by 90dvh with internal document scrolling. Dragging cards or
using the pointer/touch grip submits a status operation; success updates card
placement and counts in React without a page reload. Failures keep the local
board unchanged and explain how to reconcile status. Keyboard moves use Space,
Left/Right, Enter, and Escape. Titles still open documents.

Reload the browser to import task-file edits made externally. A status move
renames the task directory between status directories (creating the target
directory when absent) and refuses a name that already exists there. Directories
directly under `docs/tasks/` that are not status directories (legacy flat tasks)
are listed as errors so they can be moved. Invalid task
metadata is visible without hiding valid tasks; missing documents have an
unavailable state. The board never edits brief/plan content, creates/deletes
tasks or subtasks, dispatches agents, or integrates with Codex/Claude sessions.

The server reads documents beside itself independent of cwd. It rejects symlinked
task/document paths, invalid statuses, and writes without the local token and
expected origin. It serves only localhost; remote deployment is outside scope.

## Project name and visual design

Only the project name appears above the columns, read from package.json
`displayName`, then `name`, then the project directory. React renders it as text.
Claude-reference cream/charcoal/clay tokens, locally served Anthropic Serif/Sans,
and restrained transitions carry the visual language. Motion respects reduced
motion. [Font sources](../assets/task-board/FONTS.md) are recorded with the assets.

## Symlink installation in this library

When ADMIN requests links for this repository, use relative symlinks from
`docs/tasks/` to the canonical server, index.html, and two fonts in the skill.
Run `node --preserve-symlinks-main docs/tasks/server.ts` so import.meta.url keeps
the consuming task directory. The board ignores these four linked asset names
when discovering tasks (they sit beside, not inside, the status directories); task directories and documents retain their existing
symlink protections. Other projects use copied assets unless links are requested.
