---
title: "Project heading and Claude typography"
created: "2026-10-28"
---

## Request

ADMIN approved [the brief](../tasks/project-name-and-claude-typography/BRIEF.md)
to remove the Factory banner, show only the project name, and follow Claude's
font and warm neutral styling. [Plan](../tasks/project-name-and-claude-typography/PLAN.md).

## Outcome and Decisions

The reusable board reads package.json displayName, then name, with a project
directory fallback; it HTML-escapes the value. The top banner, tagline, and Refresh
control are removed. Native browser reload still picks up document edits.

The heading uses Anthropic Serif; the interface uses Anthropic Sans. Fonts were
identified in the public Claude website stylesheet and bundled as local assets
with [source attribution](../../skills/factory/assets/task-board/FONTS.md).
Fixed local font routes and the font-src self policy avoid external font requests.
The palette is cream, charcoal, and a restrained terracotta accent.

Updated consuming-project installation instructions, area specifications, and
the running demo. The demo project is named Factory demo. Task documents and user
status edits were preserved. Its requested preview server remains available on
http://127.0.0.1:4310; no additional preview processes were started.

## Validation

Based on master 101f747; checked in fix-board-heading after all implementation.

| ID | Check | Actual | Result |
| --- | --- | --- | --- |
| V1 | npm test | 15 tests pass, preserving installer, task documents, modal and status behavior | Passed |
| V2 | Header and local font acceptance | Escaped project display name renders alone; no tagline/Refresh; both font routes return woff2 content | Passed |
| V3 | npm run lint, check:types, check:skills | All pass; four skills structurally validated | Passed |
| V4 | Running demo HTTP smoke | Six task cards, project name, Brief/Plan modal responses, and both fonts verified | Passed |
| V5 | git diff --check | No whitespace errors | Passed |

## Findings and Limitations

Browser automation was unavailable in this turn. Acceptance checks verified
served HTML/CSS/font files and HTTP behavior; a newly rendered screenshot and
computed browser typography were not inspected. No independent agents were used,
following ADMIN's existing single-chat preference.

## Follow-up

Reload the running demo to see the new styling. No remaining implementation work.

## Design-language extension — 2026-10-28

ADMIN requested the broader Claude website design language after the first commit.
The public stylesheet confirmed cream #faf9f5, neutral #f0eee6/#e8e6dc, charcoal
#141413, and clay #d97757. The board adopts these surface tokens, dark primary
controls, quiet card hover treatment, serif reader headings, and 140–180ms
transitions with the site’s ease-out-quart curve. Small accent text uses a darker
clay tone for readability. Reduced-motion disables all added motion.
Validation reruns preserve task functionality; no browser render is claimed.
