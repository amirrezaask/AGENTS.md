# Data-Oriented Design

> Load when framing a performance problem or deciding whether the data model does unnecessary work.

## First principles

- **Programs transform data**: `input -> transform -> output`. A UI frame turns state into draw commands; a compiler turns text into tokens/IR/machine code; a backend turns requests + rows into responses + side effects; a search index turns documents into queryable structures; a renderer turns scene data into GPU commands. If you can't state the problem as data + transforms, the performance discussion is still too vague.
- **Solve the problem, not the code.** Code is a strategy for a data transformation. Never defend pattern purity, object hierarchy, generic abstraction, framework convention, or cleverness unless it helps under real constraints.
- **Understand the data first.** Per hot path: what data exists; how many items; how often processed; which fields are read / written / rare / cold; which case dominates; access order; what must keep identity; what can be recomputed, precomputed, or deleted. Different data is a different problem: 10 vs 10M items, random vs streaming, one-at-a-time vs batches.
- **Know the machine.** Cache lines move chunks of memory, not just the field you meant. Branch predictors like regularity; SIMD likes uniform independent work; allocators and GCs are runtime cost; syscalls/files/sockets/networks/databases/GPUs are machine boundaries. The compiler cannot fix missing context, wrong layout, excessive generality, or bad API boundaries.
- **Measurement plus cost modeling.** Measurement says what happened; modeling says whether it makes sense and where the ceiling is. Measurements alone may measure the wrong thing; theory alone goes unchecked.

## Operating loop

1. **Define the target** in user-visible terms with a budget: 16.6 ms/frame, p95 < 100 ms, 10M rows/sec, zero allocations per frame, startup < 300 ms, index rebuild < 5 s.
2. **Identify the workload**: input size, frequency, hot vs cold path, typical vs worst case, batch size, read/write ratio, mutation, concurrency, lifetime patterns, probability per case.
3. **Measure before declaring victory**: profiles, traces, counters, benchmarks, flamegraphs, logs, timings, allocation counts, cache misses, DB query plans, frame/GPU captures, perf samples. If none exist, build the smallest instrumentation that answers the question. Not reproducible → fix the benchmark before trusting the optimization. Never claim a win without before/after measurement or a stated theoretical bound.
4. **Estimate the ceiling**: count bytes moved (not just operations), calls, branches, allocations, queries, lock acquisitions, syscalls, GPU uploads, serialized bytes; compare against memory bandwidth, cache capacity, syscall cost, network latency, storage bandwidth, lock contention, GPU upload bandwidth, DB round trips, instruction throughput. Far below ceiling ⇒ look for waste.
5. **Triage by value**: `importance = probability * count * cost`. Optimize the common expensive real case, not the interesting hypothetical generic one. Don't spend design complexity on rare states unless catastrophic.
6. **Remove waste before adding cleverness**: repeated work, unnecessary data movement, avoidable copies, unnecessary allocations, hot-path abstraction, hash maps, string parsing, dynamic dispatch/virtual/interface calls, reflection, boxing, serialization, locks, atomics, syscalls, DB round trips, branchy per-item logic.
7. **Change layout only when the access pattern demands it.** Layout serves the transform; never blindly convert everything to SoA or keep everything as objects.
8. **Implement experimentally when risky**: smallest local version that proves the idea; compare measurement to prediction; no big rewrites before proving the mechanism.
9. **Confirm and report**: re-run benchmark/profile; check correctness, realistic data, p95/p99 and frame spikes when latency matters, regressions in cold paths/maintenance/memory; write down what changed, why, and what it measured.

## Hierarchy of suspicion

When code is slower than expected, investigate in this order:

1. **Wrong algorithm/data structure** — accidental O(n²)/O(n³); repeated scans; N+1 queries; hash maps where sorted arrays or dense indices fit; trees/lists where arrays fit; unbounded work per frame/request.
2. **Data movement** — copying large objects; loading unused fields; pointer chasing; cache misses; false sharing; serialization loops; GPU/CPU upload/download churn.
3. **Allocation/lifetime** — per-item heap allocation; temp strings/vectors/lists; boxing/interface allocation; GC pressure; refcounting in hot paths; fragmentation; high-frequency async/task objects.
4. **Control-flow waste** — branch-heavy per-element logic; dynamic dispatch in tight loops; callback/event-per-item designs; interpreter overhead; exception-based flow; over-generic state machines.
5. **Synchronization** — locks in hot paths; casual atomics; cross-thread ownership churn; too-small jobs on queues; false sharing between workers; channels for tiny high-frequency messages.
6. **IO/external systems** — syscalls in loops; chatty network protocols; excess DB round trips; missing batching; repeated file opens/stats; hot-path logging.
7. **Instruction-level limits** — dependency chains; missed vectorization; poor instruction throughput; scalar math; expensive divides/transcendentals/conversions/bounds checks/modulo.

## Data-shape checklist

For hot data know: type (int/float/string/struct/handle/enum/packed bits/blob), quantity (dozens → millions → unbounded stream), frequency (startup/request/frame/item/keystroke), probability (common/rare/invalid branch likelihood), layout (contiguous/scattered/indexed/sorted/compressed/[de]normalized), lifetime (frame/request/transaction/session/process/permanent), ownership (single-threaded/shared/immutable/copy-on-write/external).

Prefer data easy to iterate, batch, prefetch, serialize, validate, inspect. Separate stable identity from storage location: handles/IDs/indices when pointer stability, serialization, compaction, or table joins matter. Separate hot from cold: a hot loop should not drag rarely used names, debug info, metadata, heap pointers, strings, callbacks, timestamps, optional/editor-only fields, or logging context through cache. Prefer explicit transforms over hidden side effects — side effects break batching, measurement, parallelism, caching, testing.

## Practical DOD transformations (Andrew Kelley)

Seeing many instances of one thing? Ask how to make each instance smaller and easier to stream.

- **Handles/indexes instead of pointers.** Pointers are large, non-serializable, hard to compact, imply scattered allocation. Typed indices cut footprint, improve locality, allow relocation, simplify save/load. Caution: raw ints destroy type safety — use distinct handle types, generation counters, table IDs, or newtypes.
- **Flags out of band when they define groups.** If a loop starts with `if item.is_dead: continue`, store alive/dead items in separate arrays/tables; the flag load and branch vanish from the hot loop. Applies to active/inactive, visible/hidden, dirty/clean, pending/done, valid/invalid, selected/unselected, online/offline. Don't split if the flag flips constantly and regrouping costs more than the saved branch/load.
- **Encoded variants instead of heap polymorphism when hot.** Use `tag[] common[] variant_payload[] string_table[]` or grouped arrays per variant; replaces pointer-heavy object graphs, shrinks memory, makes serialization straightforward. Don't erase invariants: prefer language-level tagged unions/enums/sum types when available, else validate around the encoding.
- **Sparse data in side tables.** Only 1–10% of records have a field? Don't tax 100% in the hot structure: `hot_records[]` plus `rare_field_by_id: map/id_table`, or a compact sparse table keyed by handle.
- **Kill padding deliberately.** Ask: struct size? alignment? padding per element × element count? does field order change size? would a table/SoA layout remove padding? Padding isn't automatically bad, but padding × millions of records is real bandwidth and cache pressure.
- **Arrays as phase outputs.** Compilers/parsers/indexers/renderers/asset pipelines: emit compact arrays (`tags[] source_offsets[] extra_data[] string_table`). Arrays stream, cache, diff, save, load, mmap, compress, parallelize, inspect.

## Hard-nosed review mode (Mike Acton)

Per design, answer: what comes in, what goes out, exact transform, common case, cost, hardware view. If the answer is mostly classes/interfaces/services/modules/design patterns, the review isn't grounded.

- **Where there's one, there are many.** Look on the time axis: one allocation per object → millions per session; one branch per entity → every frame; one DB query per row → N+1 failure; one draw call per glyph → bad renderer; one file stat per completion item → bad editor; one string hash per frame → repeated waste.
- **Solve the common case first, not the most generic.** Generic code pretends to know less than it does; under-defined constraints cause wasted reads, wasted branches, needless dynamic dispatch, over-solving. Ask: what cases are actually valid? what can never happen? what can be prevalidated? what collapses to fewer states? can invalid states become unrepresentable?
- **Split by state.** Many flags/state combos ⇒ `pending_jobs[] running_jobs[] done_jobs[] failed_jobs[]` instead of `jobs[]{state, maybe_started_at, maybe_result, maybe_error}`. Gains: no state branch per loop, fewer optional fields in hot records, easier per-state processing and transition debugging, lower density waste.
- **Do it offline. Do it once.** The best hot-path code doesn't exist. Move work to build/import/startup/indexing time, cache warming, precomputed tables, interned IDs, command buffers, materialized views: precompute string hashes/intern symbols, prebuild glyph atlases, precompute syntax/theme style tables, pre-resolve paths, pre-sort render commands by pipeline/material, precompute LUTs, precompile regex/templates.
- **Don't ask the compiler to fix missing context.** It selects instructions, inlines, vectorizes, elides bounds checks, allocates registers; it cannot know domain constraints, lifetimes, hot/cold splits, real probabilities, or cheaper semantically-equivalent representations. Help it: simple loops, contiguous data, known bounds, non-aliasing, fewer calls in hot paths, no hidden side effects.

## Performance-aware programming (Casey Muratori)

Not "heroic optimization at the end" — understanding cost so normal decisions don't create needless slowness.

- **Two levers**: do fewer instructions/work; make remaining work flow through the CPU better. System level: do less, move fewer bytes, cross fewer expensive boundaries, keep work regular/batched/predictable/local.
- **Five multipliers** when simple ops are slower than expected: waste (unnecessary work); poor instruction throughput (dependency chains, call overhead); missed SIMD/batching on uniform work; cache/memory behavior (unused bytes, pointer chasing); threading overhead/contention (bad parallelism, over-synchronization).
- **Clean-looking code can be mechanically expensive.** Suspect until measured: polymorphism instead of direct dispatch/grouped processing; tiny functions that hide work; "one thing" functions forcing many passes over data; tell-don't-ask APIs hiding layout/allocation/IO/locks; DRY abstractions merging unlike hot paths; interfaces forcing heap/boxing/virtual/async. Keep readability that exposes transform and cost; reject readability hiding facts.
- **Semantic compression beats premature abstraction.** Start with direct code; when repeated semantics appear, compress into a helper/table/abstraction matching the observed pattern. Good compression removes duplication in meaning; bad abstraction removes visible information and makes costs unknowable.
