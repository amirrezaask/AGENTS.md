---
title: "Extract communication and specification skills"
created: "2026-10-28"
author: "Codex"
---

## Request

ADMIN requested extracting brief, plan, and debrief rules into `communication`,
specification rules into `specification`, and bundling their templates inside
the skills. ADMIN explicitly requires both skills to remain loaded by AGENTS.md.

## Outcome

AGENTS.md requires reading both skills at the start of each task. Detailed rules
now live in their entrypoints. Four unchanged templates move into their
`templates/` directories; the installer preserves the global template filenames
as symlinks to those canonical sources.

## Work and Decisions

- Preserved brief opt-in, project brief-template precedence, document audiences,
  workflow order, artifact plan exceptions, debrief evidence, and specification
  synchronization rules. The earlier no-brief answer remains applicable.
- Selected installs include both mandatory skills alongside the requested skills
  so the installed AGENTS.md links remain valid.
- Added exact migration of managed root-template links, including dangling ones.
  Required source checks run before mutation; foreign links and real files retain
  collision protection.
- Updated the catalog, installation instructions, and affected specifications.

## Validation

Node.js 24.22.1 on macOS; work started from master `711efce`.

| ID | Check | Expected | Actual | Result |
| --- | --- | --- | --- | --- |
| V1 | Existing regression tests before installer edits | Preserve installation behavior | 8 passed | Passed |
| V2 | `npm test` after implementation | Safe aliases and required dependencies | 12 passed, including old-link migration, readable aliases, selected installs, collision preservation, and missing-source refusal | Passed |
| V3 | `npm run lint` | Clean tooling | Oxlint and Oxfmt passed | Passed |
| V4 | `npm run check:skills` | Valid five-skill catalog | All 5 passed | Passed |
| V5 | Independent extraction and template review | No lost policy or template content | All original obligations retained; all four templates byte-identical; all six skill/template links resolve | Passed |
| V6 | `git diff --check` | Clean patch | Passed | Passed |
| V7 | Real install and filesystem inspection | Readable canonical templates and mandatory skill links | 12 template aliases, 20 skill links, and 6 AGENTS.md pointers verified; second dry-run proposed no changes | Passed |

## Findings

- **Related:** Mandatory loading comes from ADMIN's explicit request and the
  AGENTS.md links. Skill descriptions alone do not enforce host behavior.
- **Related:** `npx skills` carries the bundled templates with each selected skill;
  this repository's installer also installs AGENTS.md and creates global aliases.
- **Other:** None.

## Follow-up

None. Implementation `31fa731` is integrated on master; the actual global
installation has been refreshed and verified.

## Artifacts

[Communication](../../skills/communication/SKILL.md),
[specification](../../skills/specification/SKILL.md),
[installation requirements](../specs/agent-installation.spec.md).
