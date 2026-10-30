---
title: "Implement Atlas"
created: "2026-10-28"
author: "Codex"
---

## Objective

Implement [the approved brief](BRIEF.md) as a separate skill with detailed
discovery references, reusable prompts, templates and Factory integration.

## Current State

Local master at ffdd8db is clean. Factory owns the existing area template and
`docs/specs/` convention. The installer discovers skills but mandates only
Factory and links SPEC_TEMPLATE.md into Factory. Existing installation tests
exercise protected collisions and legacy template migration.

## Approach

Use a short Atlas entrypoint with progressive references for discovery,
area investigation, workflow tracing, synthesis/verification and maintenance.
Include concise templates for the six root documents, areas and workflows.
Keep source inspirations and adaptation decisions in a linked reference that
future maintainers can use. Move the canonical area template to Atlas and migrate
the global alias while preserving old source recognition. Leave historical specs
in place and update affected requirements with the authorization in this brief.

## Work

| ID | Action | Dependencies | Done when |
| --- | --- | --- | --- |
| M1 | Review online methods and write Atlas prompts/templates | None | BRIEF:R1–R4 covered |
| M2 | Update AGENTS, Factory, installer and documentation | M1 | BRIEF:R5 covered; old aliases migrate |
| M3 | Run regression, independent exercise, acceptance and quality | M1, M2 | V1–V4 have evidence; repairs complete |
| M4 | Debrief, specs, commit, fast-forward master and remove worktree | M3 | BRIEF:R6 covered |

## Validation

Use BRIEF:V1–V4. Tests exercise observable installation and migration behavior;
the independent evaluator receives a realistic repository and task without the
expected answer. Record limitations of that exercise in the debrief.

## Risks

- Broad discovery can consume context before reaching behavior: use an inventory,
  bounded area passes, source anchors and an explicit coverage frontier.
- Static code can suggest false guarantees: separate source support from runtime
  evidence and accepted requirements; challenge claims using alternate paths.
- Moving the template can break selected installs: mandate both skills and test
  migration from the prior Factory alias, including a dangling alias.

## Handoff

Worktree: `.worktrees/atlas`, branch `feat-atlas`, base ffdd8db. ADMIN approved
the scope and independent evaluation. No open product decisions.

## Revisions

2026-10-28: ADMIN added explicit-only `/atlas` initialization (BRIEF:R7).
Document the command, add invocation policy metadata and evaluate both the
command path and a request without it. Factory maintenance remains targeted.
