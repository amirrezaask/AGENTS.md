---
title: "Project name and Claude typography"
created: "2026-10-28"
---

## User's Request
Remove the top Factory header, show only the project name, and use Claude's website font and design reference.

## Requirements
- **R1:** Only the project name appears above the task columns.
- **R2:** Use Claude's Anthropic Serif/Sans fonts with warm neutral styling.
- **R3:** Preserve task display, Brief/Plan modals, and status writes; update the reusable asset and running demo.

## Validation Gates
| ID | Covers | Procedure | Pass condition |
| --- | --- | --- | --- |
| V1 | R3 | npm test | Existing behavior passes |
| V2 | R1, R2 | Board response and local font checks | Escaped project name only, local fonts served |
| V3 | R1, R2, R3 | lint, types, catalog checks and demo HTTP smoke | All checks pass |

## Approval
ADMIN explicitly approved this brief in chat on 2026-10-28.

## Authorized clarification — 2026-10-28
ADMIN explicitly requested extending R2 to Claude website coloring, styling, and animations. The design uses the public site’s neutral/clay color tokens, restrained hover feedback, and short modal transitions respecting reduced motion.
