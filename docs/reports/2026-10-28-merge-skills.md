---
title: "Merge and simplify global skills"
created: "2026-10-28 12:11"
author: "Codex"
---

## Request

Merge `~/dev/Amirreza.md` skills into this repository, copy before evaluation,
simplify and consolidate them, and install separate skills with precise triggers.
ADMIN selected master, carrying current AGENTS.md edits, no brief, and parallel reviewers.

## Outcome

Ten scoped skills are committed on master and installed through 40 individual
symlinks across Agents, Codex, Claude, and Cursor. Skill Markdown decreased from
290,194 bytes / 6,429 lines to 45,121 bytes / 665 lines (84% fewer bytes).

## Work and Decisions

- Preserved the complete working-tree import in commit `bca28c1` before review;
  implementation is `ece1bf0`. Source repository contents remain untouched.
- Consolidated `dod` into `perfguy`; retained browser and Rust GPU performance
  specializations. Rewrote supporting references as well as entrypoints.
- Replaced `amirreza-md` with `koloop-game-testing`, `koloop-promotion`, `ps3-aot`,
  and `resource-bounded-runs`. Retained user-specific audio, cover, AOT, and
  resource constraints without loading every note for unrelated tasks.
- Removed duplicate tutorials, stale version snapshots, arbitrary numeric budgets,
  mandatory assessment/report templates, and redundant verification checklists.
- Replaced the root shell installer with TypeScript tooling. Installation preserves
  real directories and unrelated links, and preflights conflicts before mutation.
- Carried ADMIN's AGENTS.md changes, including the new branch naming convention.

## Validation

Node.js 24.22.1 on macOS; final checks ran from master at `ece1bf0`.

| ID | Check | Expected | Actual | Result |
| --- | --- | --- | --- | --- |
| V1 | `npm test` | Safe installs and migration | 8 tests passed, including isolated homes with spaces, idempotence, collision preservation, selected installs, and symlinked-parent refusal | Passed |
| V2 | `npm run lint` | Clean tooling | Oxlint with all 15 bundled anti-slop rules and Oxfmt passed | Passed |
| V3 | `npm run check:skills` | Valid catalog and local links | All 10 skills passed | Passed |
| V4 | Independent description review | Specific task scope | Systems/web/GPU positives and ordinary endpoint/React/Rust negatives reviewed; project skill scope and preserved intent reviewed separately | Passed |
| V5 | Real installation and link inspection | Individual links into this repository | All 40 skill links verified; subsequent dry-run proposed no changes | Passed |
| V6 | Source status and whitespace | Preserve source work and clean patch | Original source changes retained; `git diff --check` passed | Passed |

## Findings

- **Related:** Removed 10 retired managed skill links, including four dangling
  Cursor links from older source versions, and three obsolete root installer links.
- **Related:** Description review is qualitative; automatic routing in fresh chats
  across each agent host remains unverified. The validator checks structure, not
  model judgment. The bundled anti-slop implementation was retained unchanged.
- **Other:** None.

## Follow-up

Use the catalog in new chats and refine a trigger if an observed request misroutes.

## Artifacts

[Catalog and installation](../../README.md),
[installation specification](../specs/agent-installation.spec.md),
[skill specification](../specs/skill-catalog.spec.md).
