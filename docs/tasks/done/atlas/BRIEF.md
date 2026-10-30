---
title: "Atlas software specifications"
created: "2026-10-28"
author: "Codex"
---

## User's Request

Create Atlas as a separate software specification skill. Use the agreed docs
structure and devote the main effort to discovery instructions for large codebases.
Review the relevant online skills and integrate Atlas with Factory and AGENTS.md.

## Requirements

- **R1:** Atlas produces `docs/README.md`, `architecture.md`, `domain.md`, `data-model.md`, `quality.md`, `operations.md`, `areas/`, and `workflows/`, alongside existing Factory tasks and reports. Contracts belong in areas; decisions link to tasks. Neither gets a mandatory directory.
- **R2:** Discovery guides teach evidence-based orientation, responsibility and data ownership mapping, area decomposition, actor workflow tracing, rule extraction, failure analysis, and coverage reconciliation at large-codebase scale.
- **R3:** Observations, runtime checks, accepted requirements, inferences, contradictions, and unknowns remain distinguishable. Discovery must not bless bugs or invent intent, guarantees, measurements, or recovery mechanisms.
- **R4:** Atlas includes reusable prompts and document templates, supports initial baselines and scoped maintenance, and preserves existing requirements and historical documents unless ADMIN authorizes their amendment or migration.
- **R5:** Factory delegates specification conventions to Atlas during discovery and closeout. AGENTS.md, installation, template aliases, catalog documentation and affected specs agree with that ownership.
- **R6:** Review the discovered online references, validate regression before acceptance and quality, independently evaluate discovery behavior, and commit the completed change with worktree cleanup.

## Scope and Constraints

No application refactors, new dependencies, automatic subagent dispatch, or
wholesale migration of this repository's historical specs. Keep Factory's task
and approval lifecycle. ADMIN selected local master as the worktree base and
authorized an independent evaluator using the current model and reasoning.

## Validation Gates

| ID | Covers | Procedure | Pass condition |
| --- | --- | --- | --- |
| V1 | R5, R6 | `npm test` | Installer and board regressions pass |
| V2 | R1–R4, R6 | Independent discovery exercise plus document review | Traceable boundaries, rules, actor flows and honest gaps; agreed structure |
| V3 | R4, R5 | Installer migration tests and isolated installs | Atlas and Factory available; old SPEC alias migrates safely |
| V4 | R1–R6 | `npm run check:skills`, `npm run lint`, `npm run check:types`, `git diff --check` | Structural, lint, type and whitespace checks pass |

### 2026-10-28 — Approved

ADMIN approved the separate skill, simplified structure and discovery emphasis
through the design discussion, then instructed: “let's go with atlas make the
skill it should make the same structure we agreed on just put all effort needed
on discovery instructions.” This records the existing approval; no requirements
have been added through a separate approval gate.

### 2026-10-28 — ADMIN's invocation amendment

- **R7:** Document `/atlas [project path or scope]` as the only invocation for
  initializing specifications on an existing project. Disable implicit skill
  invocation and keep Factory's targeted maintenance distinct from initialization.
- **Validation:** V2 and V4 also cover R7; inspect the entrypoint/policy and
  independently exercise a request lacking the slash command.
- **Authorization:** ADMIN instructed, “also atlas should have a slash command
  documented as the only way to invoke it to initialize and document an already
  existing project.”
