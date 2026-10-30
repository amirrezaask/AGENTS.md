---
title: "Single-file React Factory board"
created: "2026-10-28"
---

## Request

ADMIN approved [the brief](../tasks/done/single-file-react-board/BRIEF.md) requesting
index.html beside server.ts, React state without per-click reloads, shadcn and
Tailwind, and preserved Claude fonts/design. [Plan](../tasks/done/single-file-react-board/PLAN.md).

## Outcome

The complete typed React application and Tailwind theme live in index.html.
Adapted MIT shadcn Button, Card, Dialog, Tabs, and Alert source is inline; Radix
supplies dialog accessibility and tab behavior. The component attribution/license
stays in the HTML. Anthropic fonts remain local assets.

server.ts now serves board/document/status JSON APIs and prepares the embedded
TSX and Tailwind once at startup into in-memory app.js/app.css. It uses installed
local dependencies, with no runtime CDN, browser transpiler, separate build
command, generated source tree, or database. Factory's copying/dependency
instructions and area specs reflect the authorized framework migration.

React owns task placement/counts, move state, modal visibility, loaded documents,
and selected tabs. Opening a task requests both sanitized documents once; tabs
switch locally. Successful status responses update React state without a board
reload. Failed moves keep the local board unchanged and expose reconciliation
guidance. Drag/drop, pointer/touch grip, keyboard movement/cancellation, reduced
motion, file protections, and the 80vw by 90dvh modal remain.

The live demo has the new server, index.html, and dependencies. Its six task
folders and user status edits were preserved. The requested preview remains
running at http://127.0.0.1:4310.

## Decisions

- Use shadcn source with Radix primitives; shadcn is not a browser runtime package.
- Use Tailwind core plus an aligned oxide scanner. Local stylesheet resolution
  avoids broken type declarations in the node integration package.
- Add a small repository-only checker extracting embedded TSX into an isolated
  temporary directory for strict TypeScript, Oxlint, and Oxfmt checks. It removes
  its temporary files; no checker is required in consuming projects.
- Keep existing task-file storage, token/origin checks, and the legacy status-form
  endpoint for compatibility; the React app uses the new JSON status API.
- Abort stale document requests and restore focus to task controls after modal
  closure or moves. Task Markdown is sanitized on the server before rendering.

## Validation

Base master 7f8dc6b, worktree feat-react-board. Final implementation was present
for regression, acceptance, and quality checks. Tests use copied assets and
isolated homes/task files, cleaning their processes/data afterward.

| ID | Check | Actual | Result |
| --- | --- | --- | --- |
| V1 | npm test | 17 tests pass: installer regressions, API/storage preservation, path/origin/token protections, React dialog/tabs, move/cancel/failure, native drag and pointer events | Passed |
| V2 | No-navigation interaction acceptance | Mounted root and URL stay unchanged; tabs use one document fetch; moves do not refetch the board | Passed |
| V3 | Live demo DOM/HTTP smoke | Six cards mount, shadcn dialog opens, Plan switches without navigation; local CSS/fonts and modal dimensions served | Passed |
| V4 | npm run lint | Tool/server and extracted UI Oxlint/anti-slop/Oxfmt checks pass | Passed |
| V5 | npm run check:types | Strict TypeScript checks pass for tools/server and embedded TSX | Passed |
| V6 | npm run check:skills | Four skills structurally valid | Passed |
| V7 | git diff --check | No whitespace errors | Passed |

## Findings and Limitations

Browser automation was unavailable. JSDOM runs the actual locally prepared React
bundle and real server APIs, but does not establish physical drag feel, browser
layout, or computed typography. No new rendered screenshot is claimed. External
file edits still require a browser reload; source edits require server restart.
No independent agents were used, following ADMIN's single-chat preference.

## Follow-up

Reload the live demo once to load the new application. Normal board interactions
then stay within React. No implementation work remains for this request.
