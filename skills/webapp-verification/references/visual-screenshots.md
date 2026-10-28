# Rung 6 — Visual verification

## Taking screenshots that mean something

```ts
await page.emulateMedia({ reducedMotion: "reduce" });   // kill animations
await page.addStyleTag({ content:
  `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}` });
await page.screenshot({ path: "after-desktop.png", fullPage: true });
```

One happy-path desktop screenshot is not visual QA. Cover the matrix that
matters for the change:

```
Viewports:  1440×900 (desktop) · 768 (tablet) · 390×844 (mobile) — at minimum
            desktop + mobile for any layout change
Themes:     light AND dark if the app has both (emulateMedia colorScheme)
States:     default · hover/focus of the changed control · filled · error ·
            loading · empty · long-content (overflow!) · zoomed (text-only
            zoom 200% for a11y-sensitive work)
Locales:    long-string locale (e.g. German) when labels changed
```

## Actually LOOK at the screenshot

Render it into your own context and inspect it — do not just confirm the file
exists. Check deliberately:

```
- Clipped/truncated text, overlapping elements, broken wrapping
- Misalignment against sibling components; inconsistent spacing
- Contrast: text readable on its background in BOTH themes
- Overflow: horizontal scrollbars that shouldn't exist (also assert
  document.documentElement.scrollWidth <= innerWidth programmatically)
- Missing images/icons (alt text or empty boxes rendering instead)
- Layout shift between loading and loaded screenshots
- The thing you changed is actually visible and looks intended
```

## Before/after and baseline diffing

For any visual change, capture BEFORE (base state) and AFTER at identical
viewport/DPR/theme, then diff:

```bash
npx odiff before.png after.png diff.png --threshold 0.1   # or pixelmatch
```

- The diff must show ONLY the intended change. Unexpected diff regions are
  regressions until explained.
- If the repo has visual snapshot tests (`toHaveScreenshot`, Chromatic, Percy),
  run them as part of verification; in CI they are the regression gate. Update
  baselines only for intended changes — an updated baseline is a reviewed
  decision, never an auto-accept. Commit updated baselines alongside the change
  and call them out in the report.
- Mask genuinely dynamic regions (timestamps, avatars) rather than raising the
  threshold; a high global threshold hides real regressions.
