---
title: "Factory task board"
---

## Area

The reusable `skills/factory/assets/task-board/server.ts` copied into consuming
projects at `docs/tasks/server.ts`, and Factory's installation instructions.

## Requirements

- **R1:** Given a consuming Node.js 24+ project, when installing the board through Factory, then the agent copies the server asset into `docs/tasks/`, adds compatible Effect 3.22, marked 17, gray-matter 4, and sanitize-html 2 dependencies and a run script to that project's package manifest, and updates its lockfile without overwriting unrelated settings.
- **R2:** Given the running server, when opening its reported URL, then it binds only to 127.0.0.1 on PORT or default 4310, reads task directories beside its own file independent of cwd, and displays Ready, In progress, Blocked, and Done columns with titles and counts.
- **R3:** Given a task with valid YAML metadata, when opening its card, then a modal displays its title and Brief/Plan document navigation with rendered, sanitized Markdown. Close and Escape return to the board. Missing or unreadable documents show an unavailable state.
- **R4:** Given a local status form with a valid token, origin, task, and supported status, when submitted, then the server updates only status and updated in TASK.md, preserves other frontmatter/body content and both brief/plan files, and redirects to the refreshed board.
- **R5:** Given metadata or file edits made outside the board, when refreshing, then the board rereads the current task documents. Invalid tasks produce visible errors while valid tasks remain available; empty columns display an empty state.
- **R6:** Given invalid names/statuses, foreign-origin or tokenless writes, or symlinked task paths/documents, when requested, then the server rejects mutations and does not write outside real task document paths. Rendered documents cannot introduce executable HTML or script URLs.
- **R7:** Given a board status update, when it succeeds, then no agent session, workflow execution, approval, verification, brief/plan edit, task creation/deletion, or Codex/Claude integration is performed. Status is bookkeeping only.
- **R8:** Given the skill package, when using it, then the optional local board needs no database, client framework, or build step. Other workflow automation and evaluation tooling is outside Factory's current scope.
