---
name: perfguy
description: Language-agnostic performance engineering skill for agents. Use when reviewing, designing, profiling, or optimizing code/systems where runtime speed, memory use, latency, throughput, frame time, startup time, tail latency, cache behavior, SIMD/GPU friendliness, allocations, IO, concurrency, database access, or data layout matter. Not for web-page rendering/loading speed (use frontend-performance) or Rust wgpu/GPU-rendered UIs (use rust-gpu-performance).
metadata:
  category: performance
  version: "1.0.0"
---

# perfguy

Performance engineering doctrine for Rust, C/C++, Zig, Go, Java, C#, JavaScript/TypeScript, Python, Swift, databases, renderers, game engines, compilers, CLIs, services, and build systems.

## Core stance

Describe every problem as `input data -> transform -> output data`, then pin down quantity, frequency, access order, common case, lifetime, owner, fields read/written, and boundary costs. Fast code matches its workload's actual work, data movement, memory layout, branch behavior, allocation pattern, synchronization, IO, and instruction stream. Never assume abstraction is slow or low-level code is fast — measure. A solution for ten items may be wrong for ten million; a random-access solution may be wrong for a stream.

## Operating loop

1. Define a user-visible target and budget: latency, throughput, memory, startup, frame time, CPU/GPU, battery, storage, or build time.
2. Reproduce the real workload: typical, worst, batch, mutation, and concurrency patterns.
3. Measure before editing: profile, trace, benchmark, query plan, frame capture, allocation count, heap snapshot. No evidence → build instrumentation first.
4. Estimate the ceiling: count useful work, bytes moved, allocations, calls, branches, locks, syscalls, queries, uploads, serialized bytes.
5. Remove waste in order: wrong algorithm → excess data movement → allocation/lifetime churn → control-flow waste → synchronization → IO → instruction-level limits.
6. Change the smallest data path that should move a measured counter.
7. Re-run correctness plus realistic p50/p95/p99 or throughput. Keep the change only if result and tradeoffs are clear.

## First questions

- What exactly is slow or expensive, and what is the budget?
- How many items/bytes are processed, how often?
- Which data is hot vs cold? Which fields are actually read?
- Is work repeated, copied, allocated, serialized, locked, or sent across a process/GPU/database boundary unnecessarily?
- Can work be deleted, moved offline, batched, indexed, or made incremental?
- Which correctness, ordering, precision, error, or concurrency semantics must be preserved?

## References

Load only the module matching the task; skip references for small local optimizations. For a broad review, read in this order:

1. [Data-oriented design](references/data-oriented-design.md) — framing the transform, handles, state buckets, precomputation, directness.
2. [Layout and hot paths](references/layout-and-hot-paths.md) — AoS/SoA/AoSoA, hot/cold data, batching, allocation, locality, branches, SIMD, GPU/UI, backend, API shape.
3. [Benchmarking and review](references/benchmarking-and-review.md) — review checklist, benchmark design, cost models.
4. [Patterns and output](references/patterns-and-output.md) — reusable transform patterns, red flags, response and implementation-plan templates.
5. [Interaction latency budgets](references/interaction-latency-budgets.md) — input-latency budgets and async rules for keyboard-driven apps/editors; paste into a project's AGENTS.md.

## Finding format

Report findings in this shape. Separate measured facts from hypotheses. Smallest safe fix first; propose a data-oriented redesign only when the workload justifies it. Never claim a win without a before/after measurement or an explicit theoretical bound.

```text
Finding: <specific issue>
Why it matters: <cost model>
Where: <function/module/loop/query>
Evidence: <measurement or static reason>
Fix: <minimal change>
Bigger redesign: <optional>
Risk: <correctness/complexity tradeoff>
Verify: <benchmark/profile/test>
```
