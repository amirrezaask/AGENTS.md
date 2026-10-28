---
title: "Factory workflow consolidation"
created: "2026-10-28"
author: "Codex"
---

## Request

ADMIN requested Factory implementing the agreed software development flow and
consolidating brief, plan, debrief, and specification material into one skill.
The design includes file-based tasks and a local board that changes status only.
ADMIN selected local master and authorized using installed Effect source without
adding a vendored checkout.

## Outcome

Added skills/factory with workflow instructions, clarification/planning/spec/task
references, five templates, and a reusable TypeScript board server. Removed the
communication and specification skills. Updated AGENTS, README, installer,
tests, and affected area specs. Historical project documents remain in place;
reusable workflow instructions and templates now have one owner inside Factory.

## Work and Decisions

- Clarification ends in explicit brief approval, followed by planning. Canonical
  task files are TASK.md, BRIEF.md, and PLAN.md under docs/tasks/task-name.
- Agents may revise plans while preserving brief and existing spec requirements.
  Requirement changes need explicit authorization; material plan revisions are
  recorded. Final gates run regression, acceptance, then quality checks.
- The board asset is copied to docs/tasks/server.ts in consuming projects. Its
  instructions add four runtime dependencies to that project's manifest. This
  repository carries test dependencies, not a live board installation.
- HTTP forms and a native-dialog enhancement provide the board without a client
  framework or build step. Refresh reads current documents. There is no agent
  dispatch or external integration, and manual status is not completion proof.
- Installer migration handles exact managed former template links, including
  dangling links. Selected installs include Factory and retire managed old
  workflow skills; unrelated installations and preflight safeguards remain.
- Existing workflow, installation, and catalog requirements were amended under
  ADMIN's explicit consolidation request. Lint coverage includes the new asset;
  the board has a separate area spec.

## Validation

Validated in feat-factory based on local master 8aa91f5, using Node.js 24+.
All implementation changes were present before the final verification run.
Tests use temporary homes/task directories and clean up data and processes.

| ID | Check | Expected | Actual | Result |
| --- | --- | --- | --- | --- |
| V1 | npm test: installer regression and migration | Safe full/selected installs, aliases and collision protection | All 13 installer tests passed, including Factory migration | Passed |
| V2 | npm test: copied board asset | Render docs; update statuses; preserve other content | Both integration tests passed, including CRLF/Unicode, malformed metadata, unsafe Markdown, origin/token/path/symlink rejection | Passed |
| V3 | Requirement inspection | Approved flow and single resource owner | Entry point, references, templates, installer and specs checked against ADMIN's design | Passed |
| V4 | npm run lint | No lint/format errors | Oxlint with configured anti-slop rules and Oxfmt passed | Passed |
| V5 | npm run check:types | Strict check succeeds | All tools and the board asset checked without errors | Passed |
| V6 | npm run check:skills | Valid metadata, scope, size and links | Four skills validated | Passed |
| V7 | Browser inspection | Usable board, reader and status form | Desktop and 390px layout inspected; Brief/Plan navigation, Escape and Ready-to-Blocked move verified | Passed |
| V8 | git diff --check | No whitespace errors | No errors | Passed |

## Findings

- **Related:** Impeccable's detector flagged the conventional Markdown blockquote
  border as a card-accent warning. It belongs to quoted document content, not a
  card. The rendered reader was inspected.
- **Limitations:** Browser verification used the in-app browser, not a cross-browser
  suite. File changes require refresh. Structural checks cannot prove future
  model adherence or installation in every consuming project. No separate
  evaluation harness or independent subagents were added, per ADMIN's scope.
- **Other:** None.

## Follow-up

Codex/Claude session dispatch remains deferred.

## Artifacts

[Board preview with synthetic tasks](2026-10-28-factory/board.png).
The screenshot is local and gitignored. Preview files and process are cleaned
up after verification.
