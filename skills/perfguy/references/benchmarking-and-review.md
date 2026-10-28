# Benchmarking And Review

> Load when reviewing performance changes or designing benchmarks and cost models.

## Performance review checklist

Report each finding in the Finding/Why/Where/Evidence/Fix/Risk/Verify shape from SKILL.md. Check these areas:

- Algorithmic complexity; number of passes over data; bytes touched per useful result.
- Hot/cold field mixing; contiguous vs scattered storage.
- Allocation frequency and lifetime; copies/clones; string processing.
- Hashing/map lookups; dynamic dispatch; branch predictability; SIMD/vectorization blockers.
- Locks/atomics/channels/queues.
- Syscalls and IO; DB queries and query plans; serialization boundaries; GPU resource churn.
- Profiling/benchmark quality itself.

## Benchmark rules

A good benchmark has realistic input sizes and distributions, warmup when needed, enough iterations to reduce noise, dead-code-elimination prevention, setup separated from measured work, stable machine conditions.

Report p50/p95/p99 where latency matters, throughput for batch work, allocation counts for memory, plus a flamegraph/profile when the bottleneck is unknown.

**Coordinated omission**: a load generator that waits for each response before sending the next request silently drops samples that would have arrived during a stall — p99 looks far better than reality. Issue requests on a fixed schedule (or correct for backlog) so stalls count against every request they delayed.

**Control the machine**: pin CPU frequency/governor; watch thermal throttling on laptops; disable turbo when variance matters for comparisons; never compare numbers from different power states or hardware.

**Re-prove correctness before "done"**: run the full test suite; for semantic-sensitive changes (ordering, floating point, concurrency, error paths) diff old vs new outputs on identical inputs. A faster wrong answer is a regression.

Never benchmark only the toy case unless the toy case is the real workload.

Track results in a small table:

```text
version | input | time | throughput | allocs | memory | notes
```

## Cost model cheat sheet

Intuition, not universal truth:

- Sequential array access is usually friendly; random pointer chasing is usually expensive.
- Loading unused fields wastes bandwidth.
- Small hot data that fits in cache can beat fancy algorithms; large cold data needs fewer passes and fewer bytes touched.
- Hash maps are powerful but often overused; strings are expensive keys compared with compact IDs.
- Branches are cheap when predictable, expensive when chaotic.
- Syscalls, network calls, disk IO, and DB round trips dwarf local arithmetic.
- Locks are not just CPU cost; they shape scheduling and tail latency.
- Allocation cost includes allocator work, metadata, fragmentation, cache effects, and eventual cleanup/GC/refcount work.
