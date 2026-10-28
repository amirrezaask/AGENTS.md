# Measurement And Budgets

> Load when reproducing a slowdown, collecting field/lab data, profiling, setting budgets, or adding regression guards. Reference instructions; load only this file when the trigger applies.

You cannot fix what you cannot see. What to measure, with which tool, and how to lock in the win.

## Core Web Vitals

Judged at the **75th percentile of real users**; a page passes only when all three are good at p75.

| Metric | Meaning | Good | Poor |
|---|---|---|---|
| LCP | Largest Contentful Paint (loading) | ≤2.5 s | >4.0 s |
| INP | Interaction to Next Paint (responsiveness) | ≤200 ms | >500 ms |
| CLS | Cumulative Layout Shift (stability) | ≤0.1 | >0.25 |

Thresholds stable through 2026. Alert at **80% of budget** (INP 160 ms, LCP 2.0 s, CLS 0.08): a deploy bumping INP 150→190 ms still reports "good," but three of those a month and you're failing.

- **INP**: full input → next painted frame (delay + handler + render + layout + paint); reports the *worst* interaction of the session. Almost all bad INP traces to a **long task (>50 ms)** on the main thread.
- **LCP** is gated by TTFB — an 800 ms response floors LCP at 800 ms. Keep TTFB <200 ms.
- **CLS** comes from content inserted/resized without reserved space (images/iframes/ads without dimensions, late fonts, injected banners). Cheap to fix ([loading/network](loading-network.md)).

## Default budgets

Project-specific budgets win; otherwise hold these lines:

- TTFB ≲200 ms; sync task >16 ms suspicious, >50 ms = blocking task.
- Large/growing tables, trees, logs, chats, result lists are virtualized ([JavaScript, DOM & CSS](javascript-dom-css.md)).
- 60fps animation stays off framework state/render paths.
- Long-running app memory plateaus across repeated open/close/navigation ([memory](memory.md)).
- Type checking and dev tooling remain responsive.

## Field vs lab — use both, trust field

```
Field (real users, what Google ranks on):
- CrUX (Chrome UX Report) — 28-day rolling window, via PageSpeed Insights / BigQuery
- web-vitals JS library (current major v6) sent to your own analytics = faster feedback
- RUM tools (SpeedCurve, mPulse, custom)

Lab (reproducible debugging — does NOT predict field):
- Lighthouse (v13) / PageSpeed Insights lab run
- Chrome DevTools Performance panel
- WebPageTest with scripted interactions
```

Lab can't measure INP directly (no real interactions); it reports **Total Blocking Time (TBT)** as proxy — strongly predicts poor INP, correlation not 1:1. CrUX is a 28-day window, so your own RUM pipeline is the only way to validate a fix this week.

### Wiring up RUM

```ts
import { onLCP, onINP, onCLS } from "web-vitals/attribution";

function send(metric: { name: string; value: number; attribution?: unknown }) {
  const body = JSON.stringify(metric);
  // sendBeacon returns a boolean (false = queue rejected), so `??` cannot be
  // used as a fallback — check the return value explicitly.
  const queued = navigator.sendBeacon?.("/api/vitals", body) ?? false;
  if (!queued) {
    fetch("/api/vitals", { body, method: "POST", keepalive: true }).catch(() => {});
  }
}

onLCP(send);
onINP(send);   // the attribution build names the exact element + event handler
onCLS(send);
```

The attribution build says *which* element/event/handler caused a bad score. Slice by route, device class, country — aggregates hide fires ("great on desktop in Germany, awful on mobile in Brazil").

## Profiling tools by question

| Question | Tool |
|---|---|
| Main-thread time? | DevTools → Performance panel (record interaction, read flame chart; red-cornered blocks = long tasks) |
| Retained memory? | DevTools → Memory → heap snapshot ×2 compare ([memory](memory.md)) |
| What's in my bundle? | source-map-explorer / rollup-plugin-visualizer / vite-bundle-visualizer |
| Custom timing? | `performance.mark` / `measure` + PerformanceObserver |
| Node CPU/heap? | `node --prof` / `--cpu-prof`, clinic.js, inspector heap snapshots |

Component framework ⇒ also its profiler (React: React DevTools Profiler — [react rendering](react-rendering.md)).

### Marking your own spans

```ts
performance.mark("filter:start");
const result = filterRows(rows, query);
performance.mark("filter:end");
performance.measure("filter", "filter:start", "filter:end");
// reads in the Performance panel and via PerformanceObserver("measure")
```

## Always measure a production build

Dev builds lie: unminified, extra checks, double-invoked under StrictMode. Reproduce on a production build (`vite build && vite preview` or equivalent) with CPU throttling (4–6× slowdown) + network throttling — mid-range mobile is where real users live.

React specifics: profile with React DevTools Profiler ("why did this render", flamegraph), react-scan (render overlay), or React 19.2 performance tracks in the browser Performance panel ([profiling table](react-rendering.md)).

## Regression guards

A fix without a guard rots. Add at least one:

- RUM alert at 80% of budget (INP 160 ms, LCP 2.0 s, CLS 0.08).
- Bundle-size budget in CI failing on growth past N kB (`size-limit`).
- Lighthouse CI assertion on TBT/LCP for key routes.
- Unit/integration test pinning the expensive behavior ("filtering 10k rows allocates no new array per keystroke", "teardown calls every cleanup").

## Checklist

```
[ ] Reproduced in a production build, throttled CPU + network
[ ] Flame chart, profiler trace, or two heap snapshots in hand
[ ] Single biggest contributor identified (not a guess)
[ ] Baseline measured against the budget
[ ] Change made; re-measured; before/after recorded
[ ] Guard added so it cannot silently regress
```
