---
title: "<Change Title>"
created: "<YYYY-MM-DD> <HH:mm>"
author: "<agent> <llm model>"
---
## User's Request
<Original request or faithful summary.>

## Agent's Understanding
<What agent understood from user's request>

## Requirements

- **R1:** Given <context>, when <action>, then <observable outcome>.
- **R2:** <Verifiable constraint.>

## Validation Gates
Verification gates should reference requirements directly and ALL requirements should be present in this table at least once.
| ID | Covers | Command or procedure | Pass condition |
| --- | --- | --- | --- |
| V1 | <R1, K1> | <Exact check> | <Expected result> |

<!-- After approval, freeze all existing content, including metadata and tables.
Append each update at EOF after a blank line, with its date and reason.
Use the entry format below. Record approval itself as an entry.
Mark Complete only when requirements are satisfied and required validation passes. -->

### <YYYY-MM-DD HH:mm UTC offset> — <Reason for update>

- Status: <Draft / Approved / In Progress / Blocked / Complete>
- Changes and decisions: <Affected IDs, decisions, and what they supersede; or None.>
- Validation: <Gate ID, Passed / Failed / Not Run / Blocked, and actual evidence.>