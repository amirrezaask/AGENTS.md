---
title: "Drag-and-drop status changes and larger task reader"
created: "2026-10-28"
---

## Request
ADMIN wants drag-and-drop instead of the status selector/button, plus a task modal sized to 80% of screen width and 90% of screen height.

## Requirements
- **R1:** Drag/drop persists the destination status in TASK.md and removes the selector/Move submit button.
- **R2:** Show destination and failure feedback; preserve card-click document viewing.
- **R3:** Provide keyboard moves and cancellation; support pointer/touch movement through a grip.
- **R4:** Update the reusable board and live demo without changing user task documents.
- **R5:** Modal width is 80vw and height 90dvh; documents scroll internally.

## Validation Gates
| ID | Covers | Procedure | Pass condition |
| --- | --- | --- | --- |
| V1 | R1–R4 | npm test | Existing regressions and client-event persistence pass |
| V2 | R1–R5 | Demo HTML/client smoke and requirement inspection | Assets and modal sizing served with six demo tasks retained |
| V3 | R1–R5 | lint, types, catalog checks | All pass |

## Approval
ADMIN explicitly approved the drag/drop brief in chat on 2026-10-28. ADMIN then explicitly requested the 80% × 90% modal sizing as an additional requirement.
