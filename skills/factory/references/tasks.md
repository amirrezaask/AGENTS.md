# Task documents and local board

## Layout and metadata

Use `docs/tasks/<task-name>/{TASK,BRIEF,PLAN}.md`. Task names are lowercase ASCII
letters/numbers separated by single hyphens. Reuse an existing task directory;
never overwrite another task to resolve a naming collision.

`TASK.md` has YAML frontmatter with a nonempty `title`, one `status` value,
and quoted ISO date strings `created` and `updated`. Keep these fields as plain
single-line keys. Other metadata and the Markdown body are allowed and preserved.

| Stored status | Board column | Meaning |
| --- | --- | --- |
| `ready` | Ready | Approved brief and implementation plan exist |
| `in-progress` | In progress | Implementing or verifying |
| `blocked` | Blocked | A recorded decision or dependency prevents progress |
| `done` | Done | Requirements, verification, debrief, and area specs complete |

Update `updated` when changing status. Record blockers and the debrief link in
the Markdown body. A manual board status change is bookkeeping: it does not
approve a brief, validate work, execute a plan, or create an agent session.

## Install in a consuming project

Install on the first Factory task unless the project already has the board or
ADMIN requests documents only. Follow the project's package manager and preserve
existing package scripts and dependency versions that are compatible.

1. Copy [server.ts](../assets/task-board/server.ts) into `docs/tasks/server.ts`,
   and copy its bundled `anthropic-serif.woff2` and `anthropic-sans.woff2` files
   beside it. Fonts are served locally with no external network dependency.
   This requested location is an exception to the general `tools/` convention.
2. Add `effect` (compatible with 3.22), `marked` (17), `gray-matter` (4), and
   `sanitize-html` (2) to the consuming project's `package.json` dependencies;
   use the package manager to resolve patches and update its lockfile. Do not
   add dependencies to a different project or overwrite existing constraints.
3. Require Node.js 24+ and add `factory:board: node docs/tasks/server.ts` to the
   package scripts, choosing another name if an unrelated script already exists.
4. Run the project checks and smoke-test board rendering and a status update
   against temporary task data. Restore/remove the test data afterward.
5. Start with `npm run factory:board` (or the project's package manager). It binds
   to `127.0.0.1:4310`; `PORT` may select another port. Report the URL and how to
   stop it. Do not leave a preview process running after verification unless
   ADMIN asked to use it.

The server uses the task directory beside its own file, independent of cwd.
It needs no database, build pipeline, client framework, or external service.
It displays status columns and cards; clicking a card opens a modal with rendered
Brief and Plan tabs. The status form moves the card by updating `TASK.md` only.
Reload the browser to pick up edits made by agents; automatic live updates are not part
of this version. The board does not edit briefs/plans, create/delete tasks,
dispatch agents, or integrate with Codex/Claude sessions.

Invalid task metadata is reported visibly without hiding valid tasks. Missing
documents show an explicit unavailable state. Markdown is sanitized before
rendering. Paths stay within the task directory; symlinked task directories and
documents are rejected. Writes require the local form token and expected origin.
The board is local-only and has no remote-access deployment mode.

## Project name and typography

The page shows only the project name above the columns, without a Factory banner,
tagline, or Refresh button. It reads `displayName`, then `name` from the consuming
project’s package.json, falling back to its directory name. Names are escaped
before rendering. The warm neutral palette and bundled Anthropic fonts follow
the requested Claude reference; [font sources](../assets/task-board/FONTS.md) are
recorded with the asset.
