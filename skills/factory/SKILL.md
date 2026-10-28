---
name: factory
description: Guide software features and bug fixes from clarification and approved briefs through implementation, verification, debriefs, and area specifications. Use for software development work, Factory tasks, or the local task board; research discussions alone do not start implementation.
---

# Factory

Address the user as ADMIN. Factory owns the software development workflow:
**Clarify → Plan → Build and verify → Learn and adjust**.
Use existing project conventions and relevant specialist skills within this flow.
Do not turn a research discussion, status question, or document viewing request
into authorization to implement software.

## Clarify

Read [clarification guidance](references/clarify.md) when shaping a feature or bug
fix. Inspect relevant code and area specifications before asking questions that
the repository can answer. Work through consequential gaps with ADMIN and draft
a concise brief using the [brief template](templates/BRIEF_TEMPLATE.md).
Keep the draft in the conversation until approval, unless ADMIN requests a file.

The brief records intent, observable requirements with stable IDs, non-goals,
constraints, and acceptance checks. Distinguish ADMIN's decisions from agent
assumptions. Explicit approval of the brief is required before planning and
implementation; respect approval already given in the conversation.
Do not ask whether to create a brief: it is part of Factory feature/bug work.

## Plan and create the task

After brief approval, read [planning guidance](references/plan.md) and use the
[plan template](templates/PLAN_TEMPLATE.md). A separate plan approval is not
required unless ADMIN requests it. Approval to plan alone does not authorize
implementation; follow the scope ADMIN actually requested.

Once the approved brief and plan exist, create `docs/tasks/<task-name>/` with:

- `TASK.md`: metadata using the [task template](templates/TASK_TEMPLATE.md).
- `BRIEF.md`: the approved brief, including its approval record.
- `PLAN.md`: the implementation plan, linked to `BRIEF.md`.

Use a descriptive lowercase hyphenated task name and never overwrite another
task. These are the canonical task documents; do not duplicate them under
`docs/briefs/` or `docs/plans/`. Existing historical documents remain where they
are unless ADMIN requests migration. Reuse a task when resuming its work.
Read [task metadata and board](references/tasks.md) when creating or managing
tasks or installing the board. Set new tasks to `ready`.

## Build and verify

Set the task to `in-progress` when implementation starts. Execute the full agreed
scope in coherent increments, with focused checks where they help development.
For bugs, reproduce the failure and investigate its cause before choosing a fix.

Agents may change implementation steps, interfaces, sequencing, or technical
approach in `PLAN.md` without seeking approval when all brief and existing area
specification requirements remain satisfied. Record the date, reason, and impact
of each material revision in the plan. Never remove, edit, weaken, or silently
reinterpret requirements in the approved brief or existing area specs. A conflict
requires ADMIN's explicit authorization to amend the affected requirements;
record that authorization and preserve the earlier requirement in Git/history.
An append-only note is not a loophole for changing a requirement.

After implementing the scope, verify in this order:

1. **Regression:** existing checks and preserved behavior, identifying pre-existing
   failures separately from failures introduced by this change.
2. **Acceptance:** every brief requirement mapped to concrete observed evidence.
3. **Quality:** relevant lint, type, security, accessibility, performance, or manual
   checks proportional to the change. A passing test suite alone proves neither
   requirement coverage nor product quality.

Repair failures and repeat affected checks. Do not spend extended qualification
on a partial implementation while leaving agreed requirements unimplemented.
Record command, result, revision, and limitations; never claim an unrun check
passed. Use `blocked` when a required decision or external dependency prevents
progress and record the reason in `TASK.md`. Resume when the blocker is resolved.

## Learn and adjust

Write the debrief using the [debrief template](templates/DEBRIEF_TEMPLATE.md) at
`docs/reports/YYYY-MM-DD-<task-name>.md` and link it from `TASK.md`. It records
outcomes, plan changes, verification, remaining work, and useful unrelated
findings, separating evidence from assumptions. Keep raw output gitignored.

Then follow [area specifications](references/specifications.md) and update
`docs/specs/<area-name>.spec.md` with verified, implemented behavior, using the
[spec template](templates/SPEC_TEMPLATE.md). Add requirements for new behavior;
existing requirements retain their meaning unless ADMIN authorized a change.

Mark the task `done` only after all brief requirements and required checks are
satisfied, the debrief exists, and affected specs match verified behavior.
A card's status is user-editable bookkeeping, not proof of completion. If a card
says `done` but evidence is incomplete, report the discrepancy and reconcile it
before claiming success. Follow project commit and worktree cleanup rules.

## Resume and scope

On resume, read `TASK.md`, the approved brief, the current plan, relevant area
specs, and the actual Git diff. Reconcile implementation and verification with
those sources before choosing the next step; chat history alone is insufficient.
Keep status and blockers in `TASK.md`, revisions in `PLAN.md`, and results in the
debrief rather than creating parallel progress logs.

For standalone specification or debrief work, load the relevant template and
reference directly; a new development task is unnecessary. Factory adds no
workflow engine, evaluation harness, session dispatcher, or unrelated tooling.
The optional local board changes task metadata only; it never starts agents.
