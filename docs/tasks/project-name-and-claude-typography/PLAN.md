---
title: "Project heading and typography plan"
created: "2026-10-28"
---

## Objective
Implement [the approved brief](BRIEF.md) in the board asset and running demo.

## Current State
Board renders a fixed Factory heading, tagline, and Refresh control with a green palette and system font.

## Work
| ID | Action | Dependencies | Done when |
| --- | --- | --- | --- |
| M1 | Read package.json displayName/name and escape the project title | None | R1 holds, including directory fallback |
| M2 | Bundle official Claude fonts, serve fixed font routes, adjust typography and neutral colors | M1 | R2 holds without external font requests |
| M3 | Update instructions, tests/specs, and demo; run regression then acceptance and quality checks | M2 | R3 holds and all gates pass |

## Validation Gates
Follow BRIEF.md V1–V3. Preserve non-heading behavior from factory-board.spec.md.

## Handoff
Starting revision: master 101f747. Worktree: fix-board-heading. Approval already recorded in brief.

## Revisions
None.
