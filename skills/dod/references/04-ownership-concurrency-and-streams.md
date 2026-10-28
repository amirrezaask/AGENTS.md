# Ownership, concurrency, and streams

Use this reference when mutable state crosses goroutines, workers, processes, tabs, providers, queues, or event stages.

## Ownership before parallelism

For every mutable relation, buffer, projection, and queue, name the writer. Prefer:

- one writer per table, shard, partition, actor, or phase;
- immutable snapshots for readers;
- commands/events across ownership boundaries;
- local output buffers followed by a controlled merge;
- stable IDs rather than references into another owner's mutable storage;
- barriers only at explicit phase boundaries.

“Thread-safe” is not an ownership model. It may hide contention and leave mutation order ambiguous.

## Lifetime and handles

A reference is safe only when its lifetime and mutation rules are clear. Use:

- specific IDs/handles across stages;
- generation/version numbers for reusable slots;
- immutable values for cross-owner messages;
- explicit create, migrate, detach, archive, and retire operations;
- snapshots/checkpoints for long-lived readers.

Garbage collection handles reclamation, not semantic lifetime, stale references, or temporal coupling.

## Partition by the transform's key

Choose partitions that minimize cross-owner writes. Examples:

- session ID for per-session ordered event handling;
- account/invoice ID for financial state transitions;
- workspace ID for project-local state;
- terminal surface/row range for renderer work;
- time bucket for due work.

Document operations that require cross-partition coordination and whether they use a coordinator, reduction, transaction, or eventual projection.

## Bound workers; batch small work

Avoid a goroutine, promise, task, or actor for every short-lived row. Prefer:

- bounded worker pools;
- owner loops over batches;
- partitioned sequential processors;
- bulk I/O;
- local accumulation and one merge/reduction.

Per-item concurrency is reasonable for independently blocking, long-lived operations only when resource limits and cancellation are explicit.

## Separate reads, computation, and commit

A useful pattern:

```text
read stable source snapshot
  -> compute partition-local outputs
  -> validate/resolve conflicts
  -> commit through owner
  -> publish new snapshot/events
```

This avoids fine-grained shared writes and makes retry/replay boundaries clear.

## Avoid hot shared mutation

Do not let every worker update shared maps, rows, counters, or metrics inside the hot loop. Accumulate locally, then merge. Measure lock contention, scheduler overhead, false sharing, and scaling before introducing padding or lock-free structures.

## Backpressure is explicit data

Expose:

- queue capacity and current depth;
- oldest item age;
- input/output rate;
- batch-size distribution;
- rejected, dropped, coalesced, spilled, and retried counts;
- consumer lag/checkpoint;
- time blocked waiting for capacity.

Define overload policy before production:

- block producer;
- reject with a retryable response;
- coalesce newer state over older state;
- shed low-priority work;
- spill durably;
- reduce level of detail/cadence;
- scale/partition consumers;
- trip a safety circuit.

An unbounded queue does not solve overload; it converts it into memory growth and tail latency.

## Queue contract

Every queue or work table needs:

- producer and consumer owner;
- payload schema/version;
- deduplication and idempotency key;
- ordering scope;
- maximum capacity and age;
- batch size/cadence;
- retry schedule and limit;
- poison/dead-letter handling;
- cancellation/expiry semantics;
- durability level;
- checkpoint/replay behavior;
- metrics and alerts.

Do not introduce a queue merely to hide a synchronous dependency. It should create a real ownership, timing, durability, isolation, or batching boundary.

## Stream-processing shape

A robust event path commonly looks like:

```text
receive batch
  -> decode
  -> validate
  -> canonicalize
  -> deduplicate/order
  -> partition by ownership key
  -> transform
  -> durable commit/checkpoint
  -> update projections
  -> publish outputs
```

Make at-least-once duplicates, out-of-order arrival, gaps, retries, and poison payloads explicit data cases rather than incidental exceptions.

## Retry and idempotency

Separate retryable pure/derived work from non-idempotent commits. Record:

- operation identity;
- attempt count;
- first/next attempt time;
- last error category;
- expiry/deadline;
- ownership partition;
- commit/checkpoint status.

A retry queue is a state relation, not a hidden recursive callback or sleep inside an item-owned task.

## Ordering

Specify only the order actually required:

- global order;
- per partition/session/account order;
- causal order;
- no order;
- best-effort timestamp order for presentation.

Global ordering has high coordination cost. Do not accidentally require it when product semantics only need per-key order.

## Snapshots and readers

Readers that need coherence can consume:

- immutable versioned snapshots;
- append-only events plus a checkpoint;
- read models owned by one projector;
- copy-on-write pages/segments;
- bounded deltas over a base snapshot.

State the freshness contract. “Eventually consistent” is incomplete without acceptable lag and failure recovery.

## Concurrency review checklist

- Who writes every mutable structure?
- Which cross-owner writes can become commands?
- Are workers and queues bounded?
- Can small items be batched?
- Are local results merged instead of shared writes?
- What is the actual ordering scope?
- Can a reader consume a snapshot instead of locking the writer?
- Is overload behavior visible and deliberate?
- Are retries idempotent and persisted where required?
- Does partitioning align with the dominant transforms?
