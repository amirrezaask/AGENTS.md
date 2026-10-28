# Task documents and local board

## Layout and metadata

Use `docs/tasks/<task-name>/{TASK,BRIEF,PLAN}.md`. Task names are lowercase ASCII
letters/numbers separated by single hyphens. Reuse existing tasks; never overwrite
another task to resolve a naming collision.

TASK.md uses YAML frontmatter with nonempty `title`, `status`, and quoted ISO
`created`/`updated` dates as plain single-line keys. Other metadata and Markdown
body content are allowed and preserved.

| Stored status | Board column | Meaning |
| --- | --- | --- |
| `ready` | Ready | Approved brief and implementation plan exist |
| `in-progress` | In progress | Implementing or verifying |
| `blocked` | Blocked | A recorded decision/dependency prevents progress |
| `done` | Done | Requirements, verification, debrief, and area specs complete |

Record blockers and the debrief link in the Markdown body. A board status change
is bookkeeping: it does not approve work, execute plans, validate completion, or
create agent sessions.

## Install in a consuming project

Install on the first Factory task unless a board already exists or ADMIN requests
documents only. Use the project's package manager; preserve compatible existing
dependencies and unrelated scripts. Ask before replacing incompatible constraints.

1. Copy [server.ts](../assets/task-board/server.ts) and
   [index.html](../assets/task-board/index.html) beside each other in `docs/tasks/`.
   Copy `anthropic-serif.woff2` and `anthropic-sans.woff2` beside them too. The
   requested board location is an exception to the general tools convention.
2. Add the dependencies below to the consuming project's package.json and update
   its lockfile with its package manager. All browser/compiler dependencies are
   local; the server never downloads code or fonts when starting.
3. Require Node.js 24+ and add `factory:board: node docs/tasks/server.ts`. Choose
   another script name if that name already belongs to unrelated functionality.
4. Run relevant project checks and smoke-test the copied app, document tabs,
   and status persistence against disposable task data. Remove test data after.
5. Start with `npm run factory:board` or the project's equivalent. It binds to
   `127.0.0.1:4310`, configurable with PORT. Report the URL and stop instructions.
   Leave a preview running only when ADMIN asks to use it.

For npm, these package ranges/versions cover the tested application:

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

Reload the browser to import task-file edits made externally. Invalid task
metadata is visible without hiding valid tasks; missing documents have an
unavailable state. The board never edits brief/plan content, creates/deletes
tasks, dispatches agents, or integrates with Codex/Claude sessions.

The server reads documents beside itself independent of cwd. It rejects symlinked
task/document paths, invalid statuses, and writes without the local token and
expected origin. It serves only localhost; remote deployment is outside scope.

## Project name and visual design

Only the project name appears above the columns, read from package.json
`displayName`, then `name`, then the project directory. React renders it as text.
Claude-reference cream/charcoal/clay tokens, locally served Anthropic Serif/Sans,
and restrained transitions carry the visual language. Motion respects reduced
motion. [Font sources](../assets/task-board/FONTS.md) are recorded with the assets.
