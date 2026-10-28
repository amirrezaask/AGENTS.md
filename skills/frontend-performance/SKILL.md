---
name: frontend-performance
description: Diagnose slow browser loading, interactions, rendering, or memory growth. Use for web performance investigations, profiling, optimization, or performance-focused reviews; ordinary React implementation does not trigger it.
metadata:
  category: performance
---

# Browser performance

Reproduce the user path on a production build and representative device/data. Record
load state, route, cache state, and network/CPU conditions. Development-mode overhead
can help debugging but cannot establish shipped performance.

Choose the evidence that answers the symptom: a browser performance trace for
input-to-paint and layout, a component profiler for render fan-out, a bundle/network
trace for loading, or repeated-cycle heap snapshots for retained memory. Separate
field distributions from reproducible lab experiments; segment field results by route
and device rather than trusting one aggregate score.

Identify the stage before changing code. Prefer removing repeated work, narrowing
invalidation, or moving work off the critical path over adding memoization. Measure
transfer, worker startup, and publication cost when moving computation off-thread.
A transition changes update priority; it does not move synchronous computation to a worker.

Read only the relevant reference:

- [Rendering and scheduling](references/rendering.md): state subscriptions, React
  invalidation, rapid events, layout, virtualization, and animation.
- [Loading](references/loading.md): request waterfalls, bundle boundaries,
  hydration, and critical assets.
- [Retained memory](references/memory.md): navigation/open-close growth, caches,
  detached nodes, and cleanup ownership.

Use the project's user-visible budget. Verify current metric definitions and installed
framework APIs before depending on version-specific behavior. After correctness checks,
repeat the same interaction/load cycle and report before/after measurements, relevant
tradeoffs, and unverified field effects. Add a proportionate regression guard when the
measurement is reproducible.
