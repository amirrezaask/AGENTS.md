# Go services

Use this reference with the core workflow for Go APIs, consumers, workers, storage paths, and event processors.

## Representation defaults

- Start with `[]T` for ordered homogeneous batch processing.
- Use `map[K]V` when point lookup or authoritative key/value mutation dominates, not automatically for every collection.
- Keep hot structs compact; move large strings, blobs, metadata, and rarely read fields into cold rows or separate stores.
- Prefer concrete typed batch transforms in hot paths over repeated `any`/interface dispatch.
- Use typed IDs to prevent invalid joins.
- Preallocate slices when a reliable estimate exists; avoid huge defensive capacity.
- Reuse buffers only when ownership/reset semantics are clear and profiles show allocation cost.
- Use `sync.Pool` as an optimization for ephemeral reusable objects, not as a general object-lifetime model.

## Batch-transform shape

```go
type InputEvent struct {
    SessionID SessionID
    Sequence  uint64
    Kind      EventKind
    Payload   []byte
}

type SessionDelta struct {
    SessionID SessionID
    LastSeq   uint64
    UnreadInc uint32
}

func BuildSessionDeltas(
    events []InputEvent,
    visible map[SessionID]struct{},
    out []SessionDelta,
) []SessionDelta {
    for i := range events {
        event := &events[i]
        delta := SessionDelta{
            SessionID: event.SessionID,
            LastSeq:   event.Sequence,
        }
        if _, isVisible := visible[event.SessionID]; !isVisible {
            delta.UnreadInc = 1
        }
        out = append(out, delta)
    }
    return out
}
```

The exact representation may change, but keep inputs, outputs, ownership, and batch scope visible.

## Scheduling

Prefer:

- bounded worker pools or partition owners;
- batches read from channels/brokers rather than one goroutine per event;
- per-key ordered partitions when semantics require ordering;
- local result slices/maps followed by one owner commit;
- explicit cancellation and deadline data;
- separate ingestion, validation, transformation, commit, and publication phases.

A channel is a queue and needs capacity, producer/consumer ownership, overload behavior, and metrics. An unbuffered or buffered channel does not eliminate the need for a queue contract.

## Concurrency

- Do not share mutable maps/slices across workers because a mutex can be added later; choose ownership first.
- Avoid shared counters/maps in inner loops; aggregate per worker and merge.
- Avoid a goroutine for tiny work; scheduling and allocation can dominate.
- Keep retry scheduling in a due-work relation/queue rather than goroutines sleeping per item.
- Use immutable values or owned buffers across goroutine boundaries.
- Run race tests after ownership or buffering changes, but do not treat race-freedom as proof of deterministic semantics.

## Database and storage paths

- Gather keys and use set-oriented queries to avoid N+1 patterns.
- Separate normalized authoritative tables from read-specific projections.
- Batch inserts/updates where transaction semantics permit.
- Measure rows examined, bytes returned, lock/transaction duration, and network round trips—not only query count.
- Make projector checkpoints and rebuild procedures explicit.
- Keep non-idempotent commits separated from retryable computation.
- For large result sets, stream or page according to processing order instead of materializing unrelated columns.

## Maps versus scans

For small compact tables, a slice scan can be simpler and faster than a map. Benchmark representative sizes and mutation patterns. Consider:

- build cost;
- memory overhead;
- iteration order;
- cache locality;
- number of repeated lookups;
- concurrency/ownership complexity.

## Hot/cold split example

```go
type SessionHot struct {
    ID          SessionID
    LastSeq     uint64
    UnreadCount uint32
    Phase       SessionPhase
}

type SessionCold struct {
    ID            SessionID
    Title         string
    WorkspacePath string
    ProviderName  string
    CreatedAt     time.Time
}
```

Do not split merely to shrink structs. Confirm the hot transform avoids touching cold rows and that joins/lookup do not erase the gain.

## Event consumer shape

```text
broker delivery batch
  -> decode into canonical rows
  -> validate/deduplicate
  -> partition by ownership key
  -> transform using stable reference state
  -> bulk durable commit
  -> advance checkpoint
  -> publish projection/notifications
```

Record duplicate, gap, retry, poison, and partial-commit behavior.

## Measurement and verification

Use representative benchmarks and integrated load tests. Capture the relevant combination of:

- CPU and allocation profiles;
- blocking/mutex profiles;
- execution traces;
- GC and live-memory behavior;
- database/broker metrics;
- queue depth and oldest age;
- race and correctness tests;
- replay/differential comparison during migration.

## Go review questions

- Can per-item calls become one loop over `[]T`?
- Does a map serve an actual lookup, or merely mirror a slice?
- Are large cold fields carried through hot request/event paths?
- Are interfaces used for real variation at a coarse boundary or per-row dispatch?
- Are goroutines/workers bounded and partitioned by ownership?
- Are channels observable and backpressured?
- Are DB operations set-oriented and measured by rows/bytes/locks?
- Can the transform be benchmarked independently and confirmed end to end?
