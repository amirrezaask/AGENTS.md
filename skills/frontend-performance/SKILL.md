---
name: frontend-performance
description: >-
  Make web apps fast end to end: React apps that render less, stay responsive,
  and hold memory steady, plus the framework-agnostic layers underneath —
  TypeScript, JavaScript, Node, workers, Vue/Svelte, CLIs, bundles, loading,
  network, DOM/CSS, animation, and memory. Covers hooks, Context, memoization,
  the React Compiler, Suspense, Server Components, hydration, Next.js, Core Web
  Vitals, Lighthouse, profiling, and budgets. Use when typing, scrolling,
  routes, interactions, large lists, jank, slow loads, hydration, memory
  growth, type-checking, or build speed are involved, when reviewing React or
  TypeScript for performance, or when a Web Vitals regression needs diagnosis.
  Not for native desktop/GPU rendering (use rust-gpu-performance) or
  language-agnostic perf doctrine outside the browser (use perfguy).
metadata:
  category: performance
  version: "1.0.0"
---

# Frontend Performance

Performance is decided by how much work runs, where state lives, and what each change invalidates — not by memoization. Covers React (hooks, Context, Suspense, Server Components, hydration, Compiler) plus the framework-agnostic layers: TypeScript/JavaScript, Node, DOM/CSS, network, memory.

## Loop

```text
measure → compare to budget → fix the smallest high-leverage thing → re-measure → guard
```

No repro/profile/flame chart/heap snapshot/field metric = make it measurable first; never optimize by vibes. Leverage order:

```text
delete work → move out of interaction/startup → compute once at the data boundary →
chunk/yield → off-thread → narrow invalidation → virtualize → lazy-load →
surgical cache/memoize → loops/layout last
```

## Budgets

Project budgets win. Otherwise alarm at 80% of: INP ≤200 ms · LCP ≤2.5 s · CLS ≤0.1 · TTFB ≲200 ms · sync task >50 ms = blocking. Full tables and tooling: [measurement](references/measurement-and-budgets.md).

## Symptom → fix

| Symptom | Fix first | Reference |
|---|---|---|
| Laggy typing/interaction; too many renders; Context repaints tree | move state down · split Context/store · defer non-urgent updates · virtualize | [react rendering](references/react-rendering.md) |
| Memoized child still re-renders; cargo-culted `useMemo`/`memo` | profile, then delete or stabilize only what needs identity | [react rendering](references/react-rendering.md) |
| Derived state via effects; leaks from missing cleanup | derive during render · return cleanup · abort fetches | [react rendering](references/react-rendering.md) |
| Slow first load, fat bundle, janky navigation | route+feature split · ship less JS · preload LCP · prefetch on intent | [loading & network](references/loading-network.md) |
| Spinner waterfalls; hydrated page ignores clicks | parallelize fetches · cache/dedupe · shrink interactive surface | [loading & network](references/loading-network.md) |
| Janky scroll/animation; huge DOM; layout thrash | virtualize · transform/opacity only · batch reads then writes | [JavaScript, DOM & CSS](references/javascript-dom-css.md) |
| Hot-loop CPU, GC churn, slow checker/build | allocate less · flat stable shapes · single pass · project references/tsgo | [JavaScript, DOM & CSS](references/javascript-dom-css.md) |
| Memory climbs across navigation/open-close | two-snapshot hunt · release previous view data · bound every cache | [memory](references/memory.md) |
| "Did it get faster?" / regression fear | production build + throttling · baseline vs budget · add a guard | [measurement](references/measurement-and-budgets.md) |

Read only the matching reference. Broad change: measurement first, then the domain reference, then loading/memory if crossed.

## Method

1. Reproduce on a production build.
2. Collect evidence; name the bottleneck class before editing.
3. Smallest high-leverage architectural change first — state placement and invalidation before memoization; the Compiler cannot repair global state, broad Context, heavy renders, or missing virtualization.
4. Report before/after numbers against a budget.
5. Add a regression guard: test, bundle budget (`size-limit`), Lighthouse/RUM alert, memory plateau check.

Review flags: broad/high-frequency state, Context churn, render-time work, cargo-culted memoization, hot-loop allocations, uncapped caches, interleaved layout reads/writes, long sync tasks, unvirtualized large lists, heavy initial dependencies, missing cleanup, pathological types. Separate measured facts from hypotheses.

## Anti-patterns

Optimizing a dev-only slowdown · blocking the event loop · deep-cloning large state · parsing huge payloads synchronously · unbounded caches · animating layout properties · driving 60fps motion through React state · memoizing before finding the invalidation/cost problem · claiming a fix worked without re-measuring.

## Output

Report: bottleneck with evidence, highest-leverage architectural fix, smallest safe patch, before/after measurement + regression guard, risks/tradeoffs. No reflexive memoization; no improvement claims without evidence.
