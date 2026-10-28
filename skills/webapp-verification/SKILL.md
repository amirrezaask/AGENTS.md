---
name: webapp-verification
description: Verify changed web UI behavior and appearance in a running browser. Use after a frontend change or when asked to confirm a web app works or looks right.
metadata:
  category: web-quality
---

# Web app verification

Use the project's existing browser tools and tests. Choose coverage from the changed behavior and its likely regressions; do not install another runner merely to follow this skill.

1. Run appropriate existing regression checks before assessing the new behavior.
2. Exercise the changed flow in a running app and inspect its resulting state. Capture browser errors before navigation and distinguish new failures from the baseline.
3. Inspect screenshots when appearance changed. Check relevant nearby flows and viewport/theme variants.
4. Report the observed result and material gaps. A build proves compilation; browser evidence supports runtime claims.

Read [runtime evidence](references/runtime-evidence.md) for interactions, state, and diagnostics. Read [visual checks](references/visual-screenshots.md) for screenshots and visual diffs. Load each only when relevant.

Reuse existing production-preview coverage when hydration, bundling, or production behavior matters. State when only development mode was exercised. Repeat checks when flakiness or a race warrants it, rather than imposing a fixed rerun count.
