---
title: "Single-file React Factory board"
created: "2026-10-28"
---

## Request
ADMIN requested index.html beside server.ts, loading React, shadcn, and Tailwind, preserving Claude typography/design/fonts, and using React state to remove click-by-click page refreshes.

## Requirements
- **R1:** Complete typed React UI source lives in index.html beside server.ts, with genuine adapted shadcn component source and Tailwind styling.
- **R2:** Modal opening/closing, tabs, and status moves update state without navigation/reload.
- **R3:** Preserve drag/drop, pointer/touch grip, keyboard moves/cancel, error feedback, task/document safety, and 80vw × 90dvh modal.
- **R4:** Preserve Claude fonts and design language with local assets and dependencies.
- **R5:** Update Factory installation resources and the running demo; preserve task documents.

## Validation Gates
| ID | Covers | Procedure | Pass condition |
| --- | --- | --- | --- |
| V1 | R2, R3 | npm test | API/storage/installer regressions and React state interactions pass |
| V2 | R1, R4, R5 | Asset preparation, demo HTTP/DOM smoke | Local React/shadcn/Tailwind app loads with existing tasks |
| V3 | R1–R5 | lint, strict type checks including embedded TSX, skill validation | All checks pass |

## Approval
ADMIN explicitly approved this brief in chat on 2026-10-28.
