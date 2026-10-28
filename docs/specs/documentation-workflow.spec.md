---
title: "Factory workflow"
---

## Area

`skills/factory/` owns clarification, briefs, plans, task metadata, verification,
debriefs, and implemented area specifications. It replaces communication and
specification as separate skills.

## Requirements

- **R1:** Given a software feature or bug request, when applying Factory, then the agent inspects relevant code and specs, clarifies consequential gaps with ADMIN, drafts a brief with observable requirements and checks, and obtains explicit brief approval before planning or implementation. Existing approval is respected; research alone does not authorize implementation.
- **R2:** Given an approved brief, when planning, then the plan provides implementation context, decisions, interfaces, dependencies, risks, requirement coverage, and reproducible verification. The lifecycle is clarify, plan, build and verify, then learn and adjust. A separate plan approval is needed only when ADMIN requests it.
- **R3:** Given an approved brief and implementation plan, when creating a Factory task, then `docs/tasks/<task-name>/` contains canonical `TASK.md`, `BRIEF.md`, and `PLAN.md`. The brief serves human intent, the plan enables agent handoff, and the debrief records evidence, assumptions, findings, and remaining work. Historical documents remain in place unless migration is requested.
- **R4:** Given implementation and a debrief, when finishing, then affected `docs/specs/<area-name>.spec.md` files describe verified current behavior. Unresolved or unverified mismatches leave the task incomplete.
- **R5:** Given Factory resources, when resolving templates, then the brief, plan, debrief, task, and area specification templates each have one canonical file inside `skills/factory/templates/` and are discoverable through the entrypoint and references.
- **R6:** Given new implementation evidence, when an agent revises a plan, then it records material revisions and preserves all approved brief and existing area-spec requirements. Removing, editing, weakening, or reinterpreting those requirements requires ADMIN's explicit authorization recorded with its reason.
- **R7:** Given an implemented scope, when running final verification, then regression precedes requirement acceptance, which precedes relevant quality qualification. Checks record observed results and limitations; a passing suite alone does not prove requirement coverage.
- **R8:** Given task closeout, when declaring completion, then brief requirements and required checks are satisfied, the debrief exists in `docs/reports/`, affected specs match verified behavior, and TASK.md links the debrief. A manually set done status does not establish these facts.
- **R9:** Given an interrupted task, when resuming, then the agent reconciles task metadata, approved brief, current plan, affected specs, and actual Git changes before continuing. Status/blockers, revisions, and results remain in their designated documents.
