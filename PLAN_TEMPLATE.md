---
title: "<Plan Title>"
created: "<YYYY-MM-DD> <HH:mm>"
author: "<agent> <llm model>"
---

## Objective
<Requested outcome and link to the brief or source request, if available.>

## Requirements and Constraints
- **R1:** <Observable outcome or behavior to preserve.>
- **R2:** <Verifiable constraint.>

## Current State
- <Relevant behavior and evidence; distinguish facts from assumptions.>
- <Relevant paths and their responsibilities.>
- <For a bug: reproduction, expected and actual behavior, and known or suspected cause.>

## Approach
<Implementation design, key decisions and rationale. Include interfaces, data flow, and edge cases where relevant.>

## Work
| ID | Action | Dependencies | Done when |
| --- | --- | --- | --- |
| M1 | <Specific implementation step and relevant paths> | <IDs or None> | <Observable result> |

## Risks
| ID | Risk | Mitigation | Verification |
| --- | --- | --- | --- |
| K1 | <Possible failure or regression> | <How to prevent or contain it> | <Gate ID or check> |

## Validation Gates
Cover every requirement at least once. Include commands or procedures that another agent can run.

| ID | Covers | Command or procedure | Pass condition |
| --- | --- | --- | --- |
| V1 | <R1, K1> | <Exact check> | <Expected result> |

## Handoff
- **Starting point:** <Branch or revision, workspace state, and prerequisites.>
- **Decisions and assumptions:** <Choices the implementing agent must preserve or verify.>
- **Open questions:** <Unresolved questions and how they affect execution; or None.>
- **Next action:** <First concrete step.>
