---
title: "React board implementation"
created: "2026-10-28"
---

## Objective
Implement [the approved brief](BRIEF.md) without changing task storage contracts.

## Current State
Base master 7f8dc6b renders HTML on the server; status moves reload the page. Browser enhancement and CSS reside in server.ts.

## Approach
Move UI into an embedded TSX script and Tailwind theme inside index.html. Inline adapted MIT shadcn components using Radix primitives. Bundle React/application code with esbuild and compile Tailwind locally into memory on startup. Keep server.ts responsible for assets and file APIs. React owns board, move, modal, documents, and tab state; abort stale document requests.

## Work
| ID | Action | Dependencies | Done when |
| --- | --- | --- | --- |
| M1 | Build index.html React components and local visual theme | None | R1, R4 hold |
| M2 | Add board/doc/status JSON APIs and local in-memory preparation | M1 | R2, R3 storage/API behavior works |
| M3 | Migrate regression/interaction tests; check embedded TSX; update specs/resources/demo | M2 | R1–R5 and V1–V3 pass |

## Risks
Keep Tailwind/scanner versions aligned; ensure JSX is bundled before browser delivery. Preserve status-write token/origin checks. Radix content receives sanitized Markdown in a child article. Abort stale fetches so rapid modal changes do not display another task's documents.

## Handoff
Worktree feat-react-board. Sources stay local; dependencies belong in each consuming project's manifest. No separate build command or generated source tree.

## Revisions
- 2026-10-28: Use Tailwind core compiler with explicit local stylesheet resolution to avoid broken declarations in the node integration package. Behavior and requirements unchanged.
