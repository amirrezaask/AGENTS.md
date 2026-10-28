---
name: performance
description: Diagnose and optimize latency, throughput, memory, loading, or frame-time problems. Use for performance investigations, performance-focused reviews, and workload-driven data layout design; ordinary implementation does not trigger it.
metadata:
  category: performance
---

# Performance engineering

Start with the user-visible cost and representative workload: input size/distribution,
arrival rate, active fraction, lifetime, ordering, and target environment. Separate
measured facts, specified targets, and assumptions.

Trace input → transforms → output, including queues, copies, serialization, database
round trips, and ownership transfers. Identify the dominant stage and estimate the
maximum integrated gain from its share of total cost before choosing a representation.
A microbenchmark alone cannot establish a product improvement.

Change the smallest mechanism that tests the hypothesis. Preserve output, ordering,
precision, retry, and cancellation semantics. Check correctness before comparing
performance on identical inputs and environment. Report before/after results, variance,
resource tradeoffs, and unmeasured effects; add a proportionate regression guard.

Load only the references needed for the current symptom:

| Task or symptom | Reference |
| --- | --- |
| Benchmark/load-test design, noisy results, or browser measurement | [Measurement](references/measurement.md) |
| Repeated scans, large records, indexes, handles, or data-oriented design | [Data layout](references/data-layout.md) |
| Batching, queues, retries, checkpoints, or session retention | [Event pipelines](references/event-pipelines.md) |
| Browser interaction lag, React invalidation, layout, or animation | [Web rendering](references/web-rendering.md) |
| Browser bundles, request waterfalls, hydration, or critical assets | [Web loading](references/web-loading.md) |
| Retained memory, cache growth, detached nodes, or cleanup | [Memory](references/memory.md) |
| Rust GPU frame stalls, resources, uploads, shaders, or present latency | [GPU rendering](references/gpu-rendering.md) |
| GPU editor/terminal shaping, glyph atlases, damage, or text layout | [Text surfaces](references/text-surfaces.md) |

Cold code and small populations often need no specialized layout. Choose AoS, SoA,
indexes, caching, SIMD, or parallelism from access patterns and measured cost. Keep
ordinary resource adapters encapsulated when that boundary fits.

For a finding, name location, workload, evidence or hypothesis, proposed mechanism,
correctness risk, and verification. A local optimization does not need a large template.
