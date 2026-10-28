---
title: "Simplify configure-oxlint"
created: "2026-10-28"
author: "Codex"
---

## Request

ADMIN requested a short configure-oxlint skill containing base rules and upstream
anti-slop skill installation instructions, with the hardcoded bundle removed.

## Outcome

The skill is one 33-line file. Removed its copied rules, custom installer, and
three references. This repository's lint configuration now loads the upstream
plugin from a pinned archive dependency rather than the removed skill assets.

## Work and Decisions

- Used the official `npx skills add dmmulroy/anti-slop --skill install-anti-slop`
  command. Updated AGENTS.md to stop claiming the rules are bundled here.
- Pinned upstream revision `13909c9e07590f5a85d93c62712259fe14a883f7` with lockfile
  integrity. Upstream publishes no official npm package; this is the library's
  own dependency setup, while the skill directs target projects to upstream.
- Added `tsx` loading because Node refuses native type stripping inside
  `node_modules`. All 18 generic and 5 Effect rules are enabled, alongside the
  native accumulating-spread rule. Existing rule coverage is retained.
- Applied the upstream spacing rule's blank-line fixes to existing tools;
  a whitespace-insensitive diff confirms no behavior changes there.

## Validation

Node.js 26.5.1 on macOS; starting revision `e0e14eb`.

| ID | Check | Expected | Actual | Result |
| --- | --- | --- | --- | --- |
| V1 | Baseline `npm test` | Preserve installer behavior | 12 passed | Passed |
| V2 | Final `npm test` | Preserve installer behavior after migration | 12 passed | Passed |
| V3 | `npm run lint` | Upstream plugin loads and rules pass | Passed, including Effect group | Passed |
| V4 | `npm run check:skills` | Valid five-skill catalog | All 5 passed | Passed |
| V5 | Real lint CLI with a temporary chained assertion fixture | Reject an actual violation | `no-chained-type-assertions` reported; fixture removed | Passed |
| V6 | Independent review and whitespace diff | No lost rules or tool behavior changes | Reviewer found missing Effect group, corrected; tools differ only in blank lines | Passed |
| V7 | `git diff --check` | Clean patch | Passed | Passed |
| V8 | `npm ci --ignore-scripts` | Reproducible dependency installation | Passed; subsequent tests, lint, and catalog validation passed | Passed |
| V9 | Compare configured rules with pinned upstream exports | All generic and Effect rules enabled | All 23 exports configured as errors | Passed |

## Findings

- **Related:** Upstream recommends vendoring for target-project customization.
  This library deliberately uses a pinned dependency to satisfy ADMIN's request
  to remove the copied bundle. Updating that dependency requires reviewing
  upstream rules and rerunning lint.
- **Other:** None.

## Follow-up

Refresh installed links and the main checkout's dependencies after integrating master.

## Artifacts

[Simplified skill](../../skills/configure-oxlint/SKILL.md),
[upstream installation guidance](https://github.com/dmmulroy/anti-slop#install-with-an-agent-skill).
