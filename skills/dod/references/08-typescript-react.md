# TypeScript and React

Use this reference for browser/desktop clients, React stores, event ingestion, rendering, and view models.

## Normalize external state

Prefer relations and ID sets over one deeply nested mutable/immutable object graph:

```ts
type AppState = {
  sessionCoreById: ReadonlyMap<SessionId, SessionCoreRow>;
  sessionStatusById: ReadonlyMap<SessionId, SessionStatusRow>;
  visibleSessionIds: readonly SessionId[];
  sessionsWithUnread: ReadonlySet<SessionId>;
  pendingApprovalsBySession: ReadonlyMap<
    SessionId,
    readonly PendingApprovalRow[]
  >;
};
```

The store shape should match update and selection patterns. Do not force high-rate terminal/event data through the same tree as low-rate navigation metadata when that invalidates unrelated components.

## Canonicalize provider events once

```ts
type CanonicalEvent = {
  sessionId: SessionId;
  sequence: bigint;
  timestampMs: number;
  kind: EventKind;
  payload: unknown;
};
```

At the boundary:

```text
WebSocket/provider payloads
  -> decode and validate batch
  -> canonical event rows
  -> classify by kind/session
  -> apply owned transforms
  -> publish one coherent store version
```

Do not let provider-specific event variants leak through selectors and components.

## Batch store commits

Avoid `setState` or store publication for each incoming message. Accumulate a bounded batch by time, count, or frame budget, then publish coherent changes.

Possible policies:

- flush immediately for user input/approval events;
- coalesce status/progress by session key;
- batch terminal output within a small latency budget;
- reduce background-session cadence;
- cap retained history and spill durable detail outside the hot store.

Product semantics determine which events may be coalesced. Never coalesce commands, sequence checkpoints, or financial state merely for convenience.

## Select minimal rows

Components should subscribe to:

- stable IDs;
- the smallest row/view model they render;
- narrow derived booleans from authoritative facts;
- versioned terminal/event buffers through specialized boundaries.

Avoid:

- broad contexts that update the entire app for one session;
- selectors that allocate/filter/sort on every render;
- passing full session objects through many component layers;
- storing the same derived mode in several components/stores.

## Derive view models deliberately

A view model/materialized selector is derived data. Document:

- source relations;
- invalidation keys;
- expected reuse;
- stable identity behavior;
- rebuild cost;
- whether stale values are acceptable.

Memoization is useful when recomputation and invalidation behavior justify it. It is not free: dependency checks, retained memory, cache misses, and stale-closure bugs are costs.

## Rendering and level of detail

- Virtualize long lists.
- Compute expensive formatting only for visible rows.
- Keep focused-session renderer state separate from background summaries.
- Coalesce background progress/status updates.
- Retain unread count, last sequence, state, and preview for hidden sessions rather than full event/render trees.
- Promote detail when a session becomes visible/focused; demote with a snapshot when it becomes hidden.
- Use visibility and user interaction as scheduling inputs, not only presentation flags.

## Immutable updates without broad copying

Immutability supports coherent readers but does not require cloning the entire application tree. Use:

- normalized maps/tables with copy-on-write at the affected relation;
- persistent data structures where measured and justified;
- external mutable hot buffers with versioned immutable publication boundaries;
- append-only chunks/segments for large event streams;
- per-session partitions so one session update does not copy unrelated sessions.

Be explicit about who may mutate a hot buffer and when readers observe a new version.

## Example batch reducer

```ts
type SessionStatusRow = {
  sessionId: SessionId;
  lastSequence: bigint;
  phase: SessionPhase;
  unreadCount: number;
};

type SessionStatusPatch = {
  sessionId: SessionId;
  lastSequence?: bigint;
  phase?: SessionPhase;
  unreadDelta?: number;
};

function applyStatusPatches(
  previous: ReadonlyMap<SessionId, SessionStatusRow>,
  patches: readonly SessionStatusPatch[],
): ReadonlyMap<SessionId, SessionStatusRow> {
  if (patches.length === 0) return previous;

  const next = new Map(previous);
  for (const patch of patches) {
    const current = next.get(patch.sessionId);
    if (!current) continue;

    next.set(patch.sessionId, {
      ...current,
      lastSequence: patch.lastSequence ?? current.lastSequence,
      phase: patch.phase ?? current.phase,
      unreadCount:
        current.unreadCount + (patch.unreadDelta ?? 0),
    });
  }
  return next;
}
```

For very high rates, avoid repeatedly cloning the same relation inside one batch; accumulate patches and publish once. Measure before replacing readable maps/objects with custom column stores.

## Typed arrays and specialized buffers

Use typed arrays, ring buffers, slab/chunk storage, or columnar layouts only in measured hot paths such as terminal parsing/rendering, binary protocols, or huge numeric event projections. Keep ordinary product state readable unless its cost is material.

## Search, sort, and grouping in UI

- Preserve server-side or ingestion-time classification when possible.
- Maintain compact sorted IDs for frequently reused views.
- Use stable top-N or buckets instead of sorting full payload every render.
- Separate normalized searchable keys from full message/session payload.
- Account for index update cost on high-rate event streams.

## Client observability

Track, where relevant:

- incoming events/bytes by kind/session;
- decode/classification/apply time;
- batch size and flush reason;
- store publications per second;
- components committed/rendered;
- event-to-visible latency;
- long tasks/main-thread blocking;
- focused/background retained memory;
- dropped/coalesced updates;
- snapshot promotion/demotion time.

## TypeScript/React review questions

- Does one event cause multiple store publications?
- Are provider-specific objects traversed throughout the UI?
- Are high-rate and low-rate state mixed in one invalidation domain?
- Does each component subscribe to minimal data?
- Are filter/sort/group operations repeated per render?
- Can hidden sessions use lower detail/cadence?
- Is memoized/derived state rebuildable and correctly invalidated?
- Are specialized buffers restricted to measured paths?
