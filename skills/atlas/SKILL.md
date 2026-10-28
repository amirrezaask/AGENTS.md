---
name: atlas
description: Explicit /atlas workflow to initialize specifications for an existing project. Discovers areas, actor workflows, ground rules, state ownership and contracts from code evidence. Owns docs structure and specification templates; Factory reuses targeted maintenance guidance for verified changes.
---

# Atlas

Address the user as ADMIN. Build a navigable, evidence-backed description of the
system: its purpose, boundaries, ground rules and actor flows. The discovery
method is the main work; templates organize what the investigation establishes.

## Invocation

ADMIN invokes `/atlas [project path or scope]` to initialize and document an
existing project. This slash command is the only entry to the baseline workflow;
do not start it from an inferred trigger, a generic documentation request, or a
Factory task. If a host selects skills through `$atlas` or `/skills`, select Atlas
and include the literal `/atlas` command in the request. Skill selection alone
does not authorize initialization. If the command is absent, explain its syntax
and stop before scanning or writing a baseline. Once invoked, infer an unambiguous
current repository and ask only for missing scope that affects the investigation.

The skill's invocation policy disables implicit selection where supported.
Factory may read targeted maintenance references without invoking a full baseline.

## Choose the work

- **Baseline an existing system:** read [discovery](references/discovery.md),
  then investigate areas and workflows using the routed guides below.
- **Document one area or flow:** reuse the existing system map, inspect its
  callers and effects, and load [areas](references/areas.md) or
  [workflows](references/workflows.md). Expand the boundary when evidence requires it.
- **Maintain specs after a change or reconcile drift:** read
  [maintenance](references/maintenance.md). A new Factory task is unnecessary
  for standalone documentation work.
- **Discuss a future system:** draft proposed rules with ADMIN; keep them
  distinguishable from implemented behavior. Factory owns delivery briefs.

Inspect existing documentation before selecting names or moving files. Follow
the user's scope and existing authorization. A request to explain or discuss a
system does not authorize saving docs, changing code or installing tooling.

## Discovery sequence

1. Anchor scope, revision, configuration and available evidence. Inventory
   entry points, actors, state stores, integrations and existing requirements.
2. Propose a small area map from responsibilities and data ownership. Trace a
   representative flow to challenge that map before expanding it.
3. Investigate each in-scope area using [area discovery](references/areas.md).
   Extract enforceable rules and interfaces from actual paths, including bypasses.
4. Trace actor flows across areas using [workflow discovery](references/workflows.md).
   Follow asynchronous continuation and partial outcomes as far as evidence permits.
5. Reconcile coverage and contradictions before writing. Use
   [synthesis and verification](references/synthesis.md) to produce the documents
   and check that they explain the inspected system.

Use these guides' prompts as investigation instructions to yourself, not a
questionnaire to send ADMIN. Ask only consequential questions the repository
cannot resolve. Do not require a new approval at each discovery stage.

## Documentation structure

For a full baseline, create the following directly under `docs/`:

```text
docs/
  README.md                 # Purpose, scope, reading map and discovery coverage
  architecture.md           # Components, boundaries, communication and deployment shape
  domain.md                 # Canonical business concepts and shared rules
  data-model.md             # Entities, relationships, state authority and lifecycle
  quality.md                # Accepted quality requirements and observed mechanisms
  operations.md             # Configuration, execution, release and recovery
  areas/<area-name>.md      # Ground rules, ownership and relevant contracts
  workflows/<flow-name>.md  # Actor triggers, steps, outcomes and failures
  tasks/                    # Factory briefs, plans and decision reasoning
  reports/                  # Verification evidence and debriefs
```

Use the [document guide](references/documents.md) and its linked templates.
Create area and workflow files for actual in-scope capabilities. Keep a short
explicit “not applicable” explanation in a root document when that concern does
not apply; do not fill it with invented infrastructure. For scoped work, update
only affected documents rather than scaffolding the whole set. Preserve existing
tasks and reports; Atlas does not create empty task cards or reports directories.

Contracts live with their owning area. Link authoritative schemas instead of
copying them. Record consequential choices and alternatives in Factory plans and
debriefs; link them from the relevant specification. Do not create mandatory
`contracts/` or `decisions/` directories. Historical documents remain in place
unless ADMIN requests migration; link them without creating competing owners.

## Evidence and requirement authority

Label material discoveries as **source-supported**, **runtime-observed**,
**inferred**, **unknown**, or **contradicted**. Cite a revision and path/symbol or
an executed check. Runtime evidence includes its environment and scenario limits.
Separately distinguish **accepted requirements** from **observed baseline** and
**proposals**. Source support alone does not turn behavior into an accepted rule.

Preserve existing requirement IDs and meaning. Use document-qualified references
such as `areas/inventory.md#INV-003`; give new requirements stable local anchors.
Never weaken or reinterpret accepted requirements to match code. Report the
conflict and obtain ADMIN's authorization before amending them. Write supported
baseline observations with their status and unresolved intent visible; do not
describe bugs, dead code or hypothetical capabilities as guarantees.

## Completion

Finish when the requested scope has an explained boundary, area rules and actor
flows have source anchors, cross-document names and links agree, and discovery
coverage accounts for inspected, deferred and unresolved surfaces. Mark unknowns
where evidence is unavailable; disclose partial coverage instead of claiming a
complete system baseline. A passing test suite or polished template is not proof
of specification accuracy.

Factory reads affected specification documents before planning and updates them
after verification through the maintenance guide. Atlas owns methods and templates;
Factory owns the task lifecycle and completion gate. Maintainers can consult
[source methods and adaptations](references/sources.md) when evolving this skill.
