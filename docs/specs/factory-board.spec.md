---
title: "Factory task board"
---

## Area

The single shared `skills/factory/assets/task-board/` package (`amirreza-factory`,
run with `npx amirreza-factory`) and Factory's usage instructions.

## Requirements

- **R1:** Given Node.js 24+, when running `amirreza-factory [dir...]`, then one server starts for all projects: listed directories are registered in `$FACTORY_HOME/projects.json` (default `~/.factory`), an empty registry adopts the cwd when it has `docs/tasks/`, and no project receives a copy of the server, UI, fonts or a package script.
- **R2:** Given the running server, when opening its reported URL, then it binds only to 127.0.0.1 on PORT or, by default, any free port the OS assigns (reported at startup), reads each registered project's `docs/tasks`, and reads `backlog/`, `inprogress/`, `blocked/` and `done/` status directories, and displays Backlog, In progress, Blocked, and Done columns with titles and counts. A parent card shows done/total subtask counts for all descendants found in nested `subtasks/<status>/` trees.
- **R3:** Given a task with valid YAML metadata, when opening its card, then a modal displays its title, status chip, updated date and Brief/Plan document navigation with rendered, sanitized Markdown using controlled shadcn/Radix Dialog and Tabs components. Close and Escape return to the board. Missing or unreadable documents show an unavailable state. The modal is 80vw wide and 90dvh tall, with the document scrolling inside the fixed header and tabs.
- **R4:** Given a drag/drop or keyboard move with a valid token, origin, task, and supported status, when submitted, then the server moves the task directory into the target status directory (refusing a name that already exists there), updates only `updated` in TASK.md, preserves other frontmatter/body content, subtasks and both brief/plan files, and returns the updated task as JSON so React updates card placement and column counts without navigating. The legacy /status form endpoint remains available.
- **R5:** Given metadata or file edits made outside the board, when reloading the browser, then the board rereads the current task documents. Invalid tasks and legacy directories placed directly under `docs/tasks/` outside a status directory produce visible errors while valid tasks remain available; empty columns display an empty state.
- **R6:** Given invalid names/statuses, foreign-origin or tokenless writes, or symlinked task paths/documents, when requested, then the server rejects mutations and does not write outside real task document paths. Rendered documents cannot introduce executable HTML or script URLs.
- **R7:** Given a board status update, when it succeeds, then no agent session, workflow execution, approval, verification, brief/plan edit, task creation/deletion, or Codex/Claude integration is performed. Status is bookkeeping only.
- **R8:** Given the skill package, when using it, then the optional local board uses React, adapted inline shadcn source, and Tailwind without a database or separate build command; installed local dependencies prepare assets once at server startup. Other workflow automation and evaluation tooling is outside Factory's current scope.

- **R9:** Given a board page, when rendering, then only the consuming project name appears above the columns; no Factory banner, tagline, or Refresh button appears. The name comes from package.json displayName, then name, then the project directory, and is HTML-escaped.
- **R10:** Given the board assets, when rendering, then project/document headings use bundled Anthropic Serif and controls use bundled Anthropic Sans, served from the local origin with warm neutral styling. Font loading requires no external request.

- **R11:** Given pointer interaction or an opened task modal, when motion is allowed, then controls/cards have brief color transitions and the modal enters with a short fade and 6px translation. When prefers-reduced-motion is reduce, these animations and transitions are disabled. The board uses Claude-reference cream/neutral/clay colors and dark primary controls.

- **R12:** Given a task card, when dragged into another status column or moved through its pointer/touch grip, then the target column is highlighted and a successful status write updates React state in place. The selector and submit button are absent. Clicking the title still opens task documents.
- **R13:** Given focus on a card or grip, when Space/Enter picks up the card, Left/Right chooses a column, and Enter confirms, then the same status operation runs; Escape cancels without a write. Announcements expose move state, and rejected requests display an error and release busy/drag state.

- **R14:** Given index.html beside server.ts, when starting the server, then the embedded typed React/shadcn application and Tailwind theme are prepared locally into in-memory app.js/app.css responses. Application UI source stays in one HTML file; fonts and runtime assets require no CDN.
- **R15:** Given an already loaded board, when opening/closing a task, switching Brief/Plan tabs, or moving status, then no full-page navigation or reload occurs. Opening a task fetches both sanitized documents once, tab selection stays in local state, and card moves preserve the mounted app. Failed operations release busy state and expose recovery guidance.

- **R16:** Given no registered project, when loading the board, then it shows an empty board with guidance to add a project directory.

- **R17:** Given a task with nested `subtasks/<status>/` directories, when its modal is open, then a Subtasks rail beside the document (viewport at least 1024px, otherwise a Subtasks tab) lists each direct subtask with status and descendant counts. Selecting one loads that subtask's Brief, Plan and own Subtasks in the same modal to any depth, with a Back button and a breadcrumb of ancestors to return, and focus moves to the title. Subtask documents are served at `/api/tasks/<parent>/<child>/...`; status moves stay top-level only.

- **R18:** Given the board header, when adding a directory path (token and origin checked), choosing a project in the selector, or pressing Stop watching, then the registry updates, the selection is remembered in the browser, and every task, document and status request is scoped by `project` id. File changes in any registered project stream an SSE change event naming the project; the UI reloads only for the selected one. Unknown project ids return 404.
