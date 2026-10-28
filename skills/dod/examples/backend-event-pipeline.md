# Worked example: Go backend event pipeline

This example redesigns a high-rate consumer that currently creates one goroutine and several database/cache calls for every event.

## Current shape

```go
for msg := range deliveries {
    go func(msg Message) {
        event := decode(msg)
        user := repository.GetUser(event.UserID)
        if shouldProcess(user, event) {
            repository.UpdateState(event)
            cache.Invalidate(event.UserID)
            publisher.Publish(buildOutput(event))
        }
    }(msg)
}
```

Problems to verify:

- unbounded concurrency;
- repeated point queries/N+1 I/O;
- per-item allocation/decoding;
- shared repository/cache writes;
- hidden queueing in goroutines/connections;
- ambiguous commit versus acknowledgement order;
- repeated eligibility checks with sparse matches.

## Example workload facts

Assumed until measured:

- typical 5,000 events/s; bursts to 50,000/s;
- events partition naturally by `AccountID`;
- 10% require the expensive state transform;
- duplicates are possible because delivery is at least once;
- order is required per account, not globally;
- database supports bulk read/write within bounded transaction sizes;
- target p99 queue age below 2 seconds.

## Canonical rows

```go
type AccountID uint64

type EventID [16]byte

type CanonicalEvent struct {
    ID        EventID
    AccountID AccountID
    Sequence  uint64
    Kind      EventKind
    Amount    int64
    Timestamp int64
}

type AccountState struct {
    AccountID    AccountID
    LastSequence uint64
    Balance      int64
    Phase        AccountPhase
}

type StatePatch struct {
    AccountID    AccountID
    LastSequence uint64
    BalanceDelta int64
    NextPhase    AccountPhase
}
```

Large raw payloads are retained separately only for required audit/debug semantics; the transform reads compact canonical fields.

## Proposed schedule

```text
broker deliveries (bounded batch)
  -> decode/validate into []CanonicalEvent
  -> deduplicate by EventID/checkpoint
  -> partition by AccountID owner
  -> gather unique account IDs
  -> bulk read compact AccountState rows
  -> classify processable/retry/invalid rows
  -> build []StatePatch using pure batch transform
  -> bulk transactional commit patches + processed IDs/checkpoint
  -> acknowledge committed deliveries
  -> publish output rows in bounded batches
```

## Active sets

Instead of evaluating every account repeatedly, the batch contains only accounts referenced by incoming events. Within it:

```go
type ClassifiedBatch struct {
    Processable []CanonicalEvent
    Retry       []RetryRow
    Invalid     []RejectedEvent
}
```

If only particular event kinds require expensive enrichment, classify by kind before loading that enrichment.

## Partition ownership

Hash `AccountID` to a fixed number of owner workers. Each worker handles ordered batches for its accounts. Cross-account reductions are emitted to a separate aggregation stage.

```text
receiver -> partition queues [bounded] -> owner batch transforms -> commit coordinator
```

The worker count is configured and observable. Increasing it is a capacity decision, not a consequence of event count.

## Retry as data

```go
type RetryRow struct {
    EventID       EventID
    AccountID     AccountID
    Attempt       uint16
    NextAttemptAt int64
    ErrorClass    ErrorClass
    ExpiresAt     int64
}
```

A deadline-ordered retry relation replaces sleeping goroutines. Poison/error policy is explicit.

## Commit and acknowledgement

Define the invariant:

```text
An event is acknowledged only after its authoritative effect and processed/idempotency identity are durably committed.
```

When outputs are not transactionally coupled, use an outbox relation or another explicit recovery mechanism. Do not hide the consistency gap in callback ordering.

## Physical layout hypotheses

Start with `[]CanonicalEvent` AoS because most compact fields are read together. Consider a compact projection or separate amount/sequence columns only if profiles show large scans and irrelevant bytes. Keep original payload blobs out of the hot rows.

Use maps as temporary batch indexes for unique account IDs and state lookup; discard after the batch unless a longer-lived index has measured reuse.

## Backpressure

- bounded receiver and partition queues;
- broker pause/block when safe capacity is reached;
- reject/dead-letter invalid/expired work;
- retry queue with maximum age and attempts;
- batch-size and transaction-size caps;
- alerts on oldest age, not only depth;
- no unbounded goroutine creation.

## Tests

- table tests for `CanonicalEvent + AccountState -> StatePatch`;
- duplicate and out-of-order events;
- per-account ordering across batches;
- partial DB failure and redelivery;
- outbox/checkpoint replay;
- differential comparison with old handler on captured fixtures;
- race/integration tests for owner partitions.

## Measurements

Before/after:

- events/s and p95/p99 queue age;
- goroutine count;
- allocations/bytes per event;
- DB round trips, rows/bytes, transaction and lock duration;
- CPU/GC;
- batch size and partition skew;
- retries/duplicates/rejections;
- end-to-end correctness/output lag.

## Migration

1. Add canonical decoding and capture fixtures.
2. Run batch classifier while old handler remains authoritative.
3. Replace per-event reads with bulk reads for one event kind.
4. Introduce bounded owner partitions.
5. Dual-write/compare patches without committing them.
6. Commit for a canary partition and compare outputs/checkpoints.
7. Expand partitions.
8. remove per-event goroutines, N+1 calls, old retry sleeps, and duplicate cache flags.
