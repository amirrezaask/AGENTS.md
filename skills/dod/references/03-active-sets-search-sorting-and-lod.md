# Active sets, searching, sorting, and level of detail

Use this reference when the system repeatedly asks every item whether it needs work, repeatedly searches or sorts, or retains full detail for inactive items.

## Existential processing

When possible, make valid work exist as a row or membership in a collection:

```text
readyJobs
sessionsNeedingFlush
terminalsWithDamage
invoicesAwaitingReconciliation
messagesNeedingClassification
```

The transform can then process all rows as valid inputs rather than scan unrelated items and branch repeatedly.

Good candidates:

- due timers ordered by deadline;
- dirty projections awaiting rebuild;
- providers with pending outbound data;
- visible session IDs;
- retry-due requests;
- pending approvals;
- damaged terminal surfaces;
- unread or notification-candidate sessions.

## When not to maintain an active set

Prefer a full scan when:

- the population is small;
- most rows participate;
- membership changes more frequently than processing;
- scan order is already useful and cache-friendly;
- maintaining another structure creates more writes or invalidation risk than it saves;
- the transform is cold and simple.

Always include insertion/removal, memory, synchronization, and correctness costs in the comparison.

## State buckets

A lifecycle can be represented by moving IDs or rows between processing collections:

```text
connectingSessions
  -> connectedSessions
  -> reconnectBackoffSessions
  -> connectingSessions
```

This works well when each state has distinct processing. It lets each transform consume only relevant rows.

Keep a phase enum when:

- it is a durable business or protocol fact;
- transitions are very frequent;
- most operations need all rows anyway;
- multiple containers would be harder to keep consistent;
- one centralized switch is clearer and fast enough.

The objective is not to eliminate booleans/enums. It is to avoid contradictory state and repeated rediscovery of the same subset.

## Timing and frequency buckets

Do not run every item at the fastest cadence. Consider:

- deadline-ordered heaps/queues;
- timing wheels or coarse time buckets at scale;
- high-, medium-, and low-frequency passes;
- visible/active/background partitions;
- event-driven work for sparse changes;
- coalescing state updates by key;
- promotion and demotion based on focus, recency, or interaction.

A hidden session may need status and notification evaluation, not continuous terminal rendering.

## Search: first ask why the answer was lost

Before optimizing a repeated search, consider preserving the useful subset earlier:

- maintain matching IDs during writes;
- keep a top-N projection;
- partition by a recurring predicate;
- store due work in deadline order;
- carry a classification result forward;
- narrow with a cheap key/index before expensive predicates;
- aggregate when individual rows are unnecessary.

Repeated search may indicate that the pipeline discards information it already computed.

## Index actual queries

For a recurring query, collect:

- predicate/key shape;
- frequency and concurrency;
- source mutation rate;
- rows examined and returned;
- latency distribution;
- memory used by the index;
- build/update/invalidation cost;
- correctness/freshness requirement.

Candidate structures:

- map for dominant point lookup;
- sorted slice for compact read-heavy data;
- tree for ordered incremental mutation;
- bitset for dense bounded membership/intersection;
- buckets for coarse ranges/classification;
- scan for small tables;
- materialized projection for expensive read-heavy joins.

Big-O is not the whole cost. A compact linear scan can beat a pointer-heavy structure at small sizes.

## Sort only what must be sorted

Prefer, from least to most work:

1. no order;
2. partition/bucket;
3. partial selection or maintained top-N;
4. sort compact keys/indices;
5. sort full payload.

Ask whether stable ordering is a product requirement or an accidental implementation property. When removal order is irrelevant, swap-remove may avoid shifts. When order must be stable, document and test it.

## Treat joins as transforms

Choose deliberately among:

- synchronized traversal of sorted relations;
- lookup through an index;
- temporary hash/index for one batch;
- cached/materialized join;
- denormalized read model;
- direct scan for small sides.

Base the choice on relation sizes, ordering, mutation frequency, reuse, and freshness. A cached join creates another update obligation.

## Hierarchical level of detail

Retain only the detail required for current importance:

```text
aggregate/summary
  -> snapshot or memento
  -> full active state
  -> compact snapshot/summary
```

Useful importance axes include:

- focused, visible, hidden;
- active, idle, archived;
- recent, stale;
- interacting, monitored;
- local, remote;
- high-priority, best-effort.

For each level define:

- retained fields/state;
- update frequency;
- snapshot/memento format;
- reconstruction source and cost;
- promotion/demotion triggers;
- acceptable approximation, delay, or loss;
- memory/network budget.

Prefer deriving level from factual axes over maintaining a large mode machine.

## Agent/session/terminal example

- **Focused session**: full renderer state, live event stream, input capability, high-frequency updates.
- **Visible background session**: preview, unread count, status, coalesced updates.
- **Hidden active session**: last sequence, progress/status summary, notification policy; no continuous rendering.
- **Archived session**: metadata, durable snapshot, compressed or bounded event-log tail; reconstruct detail on demand.

Do not retain a fully rendered terminal for every session merely because the session exists.

## React/UI example

- subscribe components to IDs and minimal rows;
- virtualize long collections;
- format detailed content only for visible rows;
- coalesce high-rate events before committing store versions;
- retain compact offscreen summaries;
- promote data and update cadence when focus/visibility changes;
- avoid rerendering all sessions for one session's state change.

## Review checklist

- Which full scans could be active sets?
- Which active sets are more expensive to maintain than scanning?
- Is the same filter/classification repeated in multiple stages?
- Is ordering truly required, and at what scope?
- Does an index accelerate a measured recurring query?
- Can heavy payload remain cold until after key selection?
- Can inactive items use summaries/snapshots or lower cadence?
- Are promotion, reconstruction, and freshness observable?
