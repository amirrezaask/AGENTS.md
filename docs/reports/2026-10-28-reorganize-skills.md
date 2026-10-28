---
title: "Consolidate performance and relocate project skills"
created: "2026-10-28"
author: "Codex"
---

## Request

ADMIN requested merging performance skills, removing webapp verification, and
moving Koloop-related skills into GameBox. The earlier no-brief choice remains.

## Outcome

The global catalog contains `performance`, `configure-oxlint`, and
`resource-bounded-runs`. Performance has one entrypoint and eight conditional
references. Three Koloop/PS3 skills move to GameBox's existing local library.

## Work and Decisions

- Consolidated `perfguy`, `frontend-performance`, and `rust-gpu-performance`.
  Preserved specialized reference content and moved browser/GPU entrypoint
  details into relevant references. No compatibility skill aliases remain.
- Deleted `webapp-verification` and its references without redistributing them.
- Moved `koloop-game-testing`, `koloop-promotion`, and `ps3-aot` byte-for-byte
  into GameBox, with task links in its AGENTS.md.
- Updated the README and catalog specification. The existing installer already
  removes retired managed links; its implementation required no changes.

## Validation

Node.js 24.22.1 on macOS; global work started from master `00a15f5`.

| ID | Check | Expected | Actual | Result |
| --- | --- | --- | --- | --- |
| V1 | `npm test` | Preserve installer behavior | 8 tests passed | Passed |
| V2 | `npm run lint` | Clean tooling | Oxlint and Oxfmt passed | Passed |
| V3 | `npm run check:skills` | Valid consolidated catalog | All 3 skills passed | Passed |
| V4 | Independent merge review | Preserve specialized knowledge and scoped routing | All 8 reference links resolve; no actionable findings | Passed |
| V5 | GameBox transfer comparison | No lost project instructions | All 3 moved skills byte-identical; AGENTS.md task links resolve | Passed |
| V6 | `git diff --check` | Clean patch | Passed | Passed |
| V7 | Real install, link inspection, second dry-run | Current global links and retired-link cleanup | 12 current links verified; 28 retired links absent; second dry-run proposed no changes | Passed |

## Findings

- **Related:** Automatic skill selection in fresh agent sessions remains
  unverified; structural checks and independent description review do not prove
  host-model routing. GameBox retains its existing local skill layout.
- **Other:** The README still listed Electron after ADMIN removed that skill;
  the current catalog table now matches the actual directories.

## Follow-up

None. Global changes are integrated on master; GameBox's move is committed as
`a8c7f972`. Its master advanced during this task, so the documentation-only commit
was cherry-picked while preserving concurrent application edits.

## Artifacts

[Catalog](../../README.md), [catalog specification](../specs/skill-catalog.spec.md).
