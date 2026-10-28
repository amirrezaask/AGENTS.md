---
name: webapp-verification
description: >-
  Agent workflow for verifying and validating web application changes — both
  visually (screenshots, visual diffs, layout/state coverage) and by inspecting
  live app state (DOM, accessibility tree, console, network, storage, framework
  state). Use after implementing or modifying any web UI, fixing a frontend
  bug, or whenever asked to confirm that a web app "works", "looks right", or
  "didn't break". The rule: never claim a web change works without runtime
  evidence — a passing build is not verification.
metadata:
  category: web-quality
  version: "1.0.0"
---

# Web App Verification & Validation

A change is DONE only with runtime evidence: it renders, state is correct, the
interaction behaves, nothing in the console screams, pixels look right.
"It compiles" and "the diff looks correct" are hypotheses, not verification.

Assumes a driveable browser (Playwright, Puppeteer, CDP, or equivalent).
Fresh install: `npm i -D playwright && npx playwright install chromium`.

## Verification ladder

Run cheap checks first; each rung gates the next. Stop and fix at the first
failure — never screenshot an app that doesn't build.

| # | Rung | Gate |
|---|-------|------|
| 1 | Static | Typecheck + lint + unit tests on touched code |
| 2 | Boot | App starts; route loads HTTP 200; no crash overlay |
| 3 | Console | Zero new errors; warnings triaged |
| 4 | State | DOM / a11y tree / storage / framework state match expectations |
| 5 | Interaction | Changed flow works end to end (click, type, submit, navigate) |
| 6 | Visual | Screenshots reviewed; diffed against baseline when one exists |
| 7 | Regression | Adjacent flows and other viewports still work |

| Change type | Minimum coverage |
|-------------|------------------|
| UI bug fix | Rungs 1–6 |
| Pure logic | Stop at 5 |
| Styling | 6, plus 2–3 — CSS breaks JS via class-name coupling and layout-dependent code |

## Non-negotiable gates

Every run, regardless of which playbooks you load:

- Attach console/error listeners BEFORE `goto`, or startup errors are missed.
- Diff console noise against a base capture; report pre-existing errors separately — never launder them into your change, never own them.
- Inspect state (DOM/a11y/storage), not just pixels — right paint can hide wrong state.
- Assert invariants ("3 rows, sorted by date desc"), not incidentals ("second div has css-1x2y3").
- Verify request payloads, not just that a request fired.
- Render and actually LOOK at every screenshot; file-exists ≠ verified.
- NEVER sleep(N) as synchronization; wait on conditions.
- Force empty/loading/error states; don't test whatever state the dev server happens to be in.
- A visual diff must show ONLY the intended change; unexpected regions are regressions until explained. Baseline updates are reviewed decisions, never auto-accepts.
- Re-run any new check 3× before trusting it; a flake means wrong check or real race — both are findings.
- Don't verify behavior only in dev mode; hydration, minification, and compiler behavior differ in prod builds.

## Playbooks (load only what the change needs)

| File | Covers |
|------|--------|
| [boot-console](references/boot-console.md) | Rungs 2–3: error listeners, console/network capture, new-vs-preexisting noise |
| [state-inspection](references/state-inspection.md) | Rung 4: DOM, a11y tree, URL/storage/network, framework stores, invariant assertions |
| [interactions](references/interactions.md) | Rung 5: flow checklist, forcing empty/error/slow states via route mocking |
| [visual-screenshots](references/visual-screenshots.md) | Rung 6: screenshot recipes, viewport/theme/state matrix, LOOK checklist, before/after diffs, CI baselines |
| [anti-flake](references/anti-flake.md) | Wait strategies, environment pinning, forced-slowdown race reproduction |
| [perf-tripwire](references/perf-tripwire.md) | Node-count / long-task spot checks for perf-sensitive changes |

## Reporting template

End verification with evidence, not vibes:

```md
## Verification

Build/lint/tests: <pass/fail + what ran>
Booted:           <url, route, HTTP status>
Console:          <clean | N pre-existing (listed) | new issues found+fixed>
State checks:     <what was asserted, observed values>
Flows exercised:  <primary, failure, empty/loading/error, keyboard, repeat-use>
Visual:           <viewports × themes covered; before/after attached;
                   diff shows only intended change: yes/no>
Not verified:     <explicitly out of scope + why>
```

The `Not verified` line is mandatory. Silent gaps are how "verified" changes
break in production.

## Final rule

Verification is data-gathering, not a confirmation ritual. Go in trying to
break the change: force the error states, resize the window, mash the
keyboard, run it twice, read the console. What survives that is verified;
everything else is hope.
