---
title: "Atlas specifications"
---

## Responsibility and boundary

Atlas provides explicit existing-project baseline discovery and specification
methods. Factory owns delivery and reuses Atlas's targeted maintenance guide.
The approved intent is recorded in [the Atlas brief](../tasks/atlas/BRIEF.md).

## Ground rules

<a id="ATL-001"></a>
### ATL-001: Explicit initialization

ADMIN invokes `/atlas [project path or scope]` for an existing-project baseline.
Absent that command, the skill explains the syntax and stops initialization.
`agents/openai.yaml` disables implicit skill invocation where supported. Host
selection syntax may differ; the slash command is a documented agent convention,
not an installed host parser. Factory's scoped maintenance does not initialize a
full baseline. Source: `skills/atlas/SKILL.md` and `agents/openai.yaml`.

<a id="ATL-002"></a>
### ATL-002: Document ownership

A full baseline creates six root Markdown documents directly under `docs/`:
README, architecture, domain, data-model, quality and operations. Area files own
ground rules, state ownership and relevant contracts; workflow files own actor
triggers, steps, outcomes and recovery. Tasks/reports keep Factory's conventions;
decision history links to tasks. No contracts/decisions directory is mandatory.
Scoped updates preserve unrelated docs and historical specs. Sources:
`skills/atlas/SKILL.md`, `references/documents.md` and linked templates.

<a id="ATL-003"></a>
### ATL-003: Evidence-based discovery

Discovery inventories actors, entry points, authoritative writers, integrations
and variants; proposes responsibility boundaries; traces flows; searches bypasses
and contrary evidence; and reconciles inventory coverage before synthesis.
Statements distinguish source/runtime support, inference, unknowns and
contradictions separately from accepted requirements, observations and proposals.
Existing requirements retain IDs and meaning absent ADMIN's authorized amendment.
Sources: Atlas discovery, area, workflow and synthesis references.

<a id="ATL-004"></a>
### ATL-004: Delivery integration and installation

Factory reads affected specs before planning and reconciles them after verified
delivery. Selected global installs include both Factory and Atlas. The global
SPEC_TEMPLATE.md alias resolves to Atlas's AREA_TEMPLATE.md; managed former
Factory links migrate without replacing unrelated content. Sources:
`skills/factory/references/specifications.md`, `tools/install.ts` and installer tests.

## Contracts and decisions

The `/atlas` request supplies an optional project path or scope. An unambiguous
current repository is the default; consequential missing scope needs clarification.
Templates and references ship within the skill. Full initialization needs no
external skills, generated code index or new dependencies.

The [plan](../tasks/atlas/PLAN.md) explains the separate ownership and migration
choices. [Factory workflow](../specs/documentation-workflow.spec.md) retains its
existing requirement IDs and delivery obligations.

## Coverage and open questions

Static instructions and installer behavior can be checked locally. Independent
fixture evaluation provides bounded evidence of model behavior; it cannot prove
completeness on production monorepos or actual command registration in every host.
Verification results belong in the task's linked debrief.
