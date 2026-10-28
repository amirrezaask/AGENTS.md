---
title: "Repository-local Factory board links"
created: "2026-10-28"
---

## Request

ADMIN requested Factory scripts in this project's docs and explicitly specified
symlinks. This installs the existing board rather than creating a new feature task.

## Outcome and Decisions

Added four relative symlinks in docs/tasks for server.ts, index.html, and the two
Anthropic fonts. Their canonical sources remain inside the Factory skill.
Added factory:board to package.json using --preserve-symlinks-main so Node keeps
the consuming-project task directory when resolving the entrypoint. Existing
package dependencies already cover the repository's development board.

Task discovery skips the four known board asset filenames, allowing these links
without treating them as task folders. Existing task-directory/document symlink
protections remain. Updated usage instructions and the board area spec.

## Validation

Based on master ea1722f in feat-local-factory-board.

| ID | Check | Actual | Result |
| --- | --- | --- | --- |
| V1 | npm test | All 18 tests pass, including symlink installation reading fixture-project metadata/tasks and persisting status in the consuming directory | Passed |
| V2 | npm run lint | Oxlint, anti-slop and Oxfmt pass, including embedded UI | Passed |
| V3 | npm run check:types | Strict server/tool and embedded TSX checks pass | Passed |
| V4 | npm run check:skills | Four skills structurally valid | Passed |
| V5 | git diff --check | No whitespace errors | Passed |

## Findings and Follow-up

Node resolves a symlinked main script to its real source by default; omitting the
flag would read the asset directory instead of this project's tasks. The command
and regression test cover this behavior. The existing demo remains available;
use PORT=4311 npm run factory:board to run this project's board alongside it.
