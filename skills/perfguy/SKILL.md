---
name: perfguy
description: Diagnose service, CLI, or runtime performance problems and design workload-driven data layouts. Use for explicit profiling, latency, throughput, memory, or data-oriented redesign tasks. Browser performance uses frontend-performance; Rust GPU frame performance uses rust-gpu-performance.
metadata:
  category: performance
---

# Performance engineering

Start with the user-visible cost and representative workload: input size and distribution,
arrival rate, active fraction, lifetime, ordering, and target environment. Mark measured
facts, specified targets, and assumptions separately.

Trace input → transforms → output, including queues, copies, serialization, database
round trips, and ownership transfers. Measure enough to identify the dominant stage
before choosing a representation. Estimate the maximum integrated gain from its share
of total cost; a microbenchmark alone cannot establish a product improvement.

Change the smallest mechanism that tests the hypothesis. Preserve output, ordering,
precision, retry, and cancellation semantics. Recheck correctness before comparing
performance on identical inputs and environment. Report before/after results, variance,
resource tradeoffs, and anything still unmeasured.

Read only the relevant reference:

- [Data layout](references/data-layout.md): repeated scans, large records, indexes,
  active sets, handles, or an explicit data-oriented design request.
- [Event pipelines](references/event-pipelines.md): batching, owner partitions,
  queues, retries, checkpointing, or terminal/session retention.
- [Benchmarks](references/benchmarking.md): load generators, noisy results,
  throughput/latency comparisons, or performance review evidence.

Cold code and small populations often need no specialized layout. Choose AoS, SoA,
indexes, caching, SIMD, or parallelism from the access pattern and measured cost;
none is a default requirement. Keep ordinary resource adapters encapsulated when that
boundary fits.

For a finding, name the location, workload, evidence or hypothesis, proposed mechanism,
correctness risk, and verification. Do not require a large assessment template for a
local optimization.
