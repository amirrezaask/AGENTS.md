---
title: "Drag/drop and modal implementation"
created: "2026-10-28"
---

## Objective
Implement [the approved brief](BRIEF.md), preserving task storage, local-request checks, fonts, and document rendering.

## Work
| ID | Action | Dependencies | Done when |
| --- | --- | --- | --- |
| M1 | Add native drag/drop, pointer grip, keyboard move/cancel, target/busy/error feedback to browser enhancement | None | R1–R3 persist through existing status endpoint |
| M2 | Replace selector/button with grip, hidden token, accessible instructions; set modal dimensions and document scrolling | M1 | R1, R2, R5 hold |
| M3 | Exercise client events against copied server, update references/specs, refresh demo | M2 | V1–V3 pass and demo task content is preserved |

## Risks
Native drag and touch differ; the grip uses Pointer Events. Failed writes must not imply success. Keyboard state must cancel without posting. DOM tests cannot establish physical browser drag feel.

## Handoff
Base: master b4806b3; worktree feat-board-drag-drop. Run regression tests before acceptance and quality qualification.

## Revisions
- 2026-10-28: ADMIN added explicit 80vw × 90dvh modal sizing; include in M2 and acceptance.
