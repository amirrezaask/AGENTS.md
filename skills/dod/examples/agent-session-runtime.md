# Worked example: agent/session runtime

This is an example of applying the skill, not a universal architecture. Replace the assumed workload with measurements from the real product.

## 1. Problem boundary

A local/remote agent multiplexer receives provider events for many durable sessions, displays some sessions, keeps others running in the background, supports approvals and commands, and restores history after reconnect.

Current shape to avoid:

```text
Session object
  owns provider client
  owns transport/reconnect callbacks
  owns full event history
  owns terminal parser and renderer
  owns unread/notification flags
  owns approval promises
  owns persistence methods
  update() called for every session
```

This mixes lifetimes and causes every event to traverse a heterogeneous object graph.

## 2. Example workload facts

These values are assumptions for illustration:

| Dataset/stream | Typical | Peak | Rate | Active fraction | Important fields |
|---|---:|---:|---:|---:|---|
| Connected servers | 2 | 20 | low change | 100% transport, few with traffic | connection phase, checkpoint, queue depth |
| Retained sessions | 100 | 10,000 | low creation | 1–5% active | identity, server/provider, archive checkpoint |
| Concurrent active sessions | 8 | 200 | bursty | 100% status, 1 focused | phase, last sequence, progress |
| Provider events | 100/s | 20,000/s burst | skewed by session | sparse across retained sessions | session, sequence, kind, payload size |
| Terminal output | 200 KB/s | 50 MB/s burst | focused-session skew | few sessions rendered | bytes, parser ops, damaged rows |
| Pending approvals | 0–5 | 1,000 | sparse | all pending | request ID, kind, deadline |

Required measurements before implementation include event-size distribution, hot-session skew, background update budget, snapshot restore target, and memory per terminal renderer.

## 3. Authoritative relations

```ts
type SessionCoreRow = {
  sessionId: SessionId;
  serverId: ServerId;
  providerId: ProviderId;
  createdAtMs: number;
};

type SessionRuntimeRow = {
  sessionId: SessionId;
  phase: SessionPhase;
  lastSequence: bigint;
  resumeToken?: string;
};

type LivePtyRow = {
  sessionId: SessionId;
  ptyHandle: PtyHandle;
};

type PendingApprovalRow = {
  requestId: RequestId;
  sessionId: SessionId;
  kind: ApprovalKind;
  createdAtMs: number;
  deadlineMs?: number;
};

type SessionSnapshotRow = {
  sessionId: SessionId;
  throughSequence: bigint;
  schemaVersion: number;
  storageRef: SnapshotRef;
};
```

Processing/derived structures:

```ts
type RuntimeIndexes = {
  visibleSessionIds: ReadonlySet<SessionId>;
  sessionsWithUnread: ReadonlySet<SessionId>;
  sessionsDueForRetry: ReadonlySet<SessionId>;
  terminalsWithDamage: ReadonlySet<SessionId>;
  approvalsBySession: ReadonlyMap<SessionId, readonly RequestId[]>;
};
```

`visibleSessionIds` and `sessionsWithUnread` are rebuildable views. `lastSequence` is authoritative for resume/checkpoint semantics.

## 4. Canonical boundary

Each provider adapter converts its event into:

```ts
type CanonicalEvent = {
  serverId: ServerId;
  sessionId: SessionId;
  sequence: bigint;
  timestampMs: number;
  kind: EventKind;
  payload: unknown;
};
```

Retain raw provider payload separately only when required for audit/debug/replay. Core transforms do not accept provider-owned objects.

## 5. Inbound schedule

```text
read transport frames in bounded batch
  -> decode/validate provider payloads
  -> canonicalize
  -> partition by (serverId, sessionId)
  -> deduplicate and detect sequence gaps
  -> append durable event chunks / advance checkpoint safely
  -> classify by kind
      terminal chunks -> parser input queues
      status events   -> session status patches
      approvals       -> pending approval rows
      tool events     -> tool timeline projection
  -> apply owner commits
  -> derive unread/notification candidates
  -> publish one coalesced client delta
```

The durable append/checkpoint order must make replay behavior explicit. A failed batch cannot advance the resume checkpoint beyond committed events.

## 6. Outbound schedule

```text
user or automation command
  -> validate target and permission
  -> assign command/idempotency ID
  -> persist if delivery must survive restart
  -> route to server connection owner
  -> bounded outbound queue
  -> send
  -> record acknowledgement/result
  -> retry/expire/dead-letter according to command type
```

An approval response is data with identity and lifecycle; it is not only a callback resolution inside a session object.

## 7. Terminal path

Keep specialization local:

```text
PTY byte chunks
  -> decode/parse operations
  -> apply to terminal grid
  -> update changed-row/damage set
  -> shape/render only required rows
  -> publish frame/delta
```

Possible representations:

- byte chunks: append-only/ring segments;
- parser/grid: renderer-specific optimized buffers;
- damage: row bitset or compact ranges when measured useful;
- scrollback: bounded chunks with durable spill/snapshot;
- product session metadata: ordinary readable rows/maps.

Do not force terminal-grid layout onto unrelated product state.

## 8. Level of detail

| Tier | State retained | Update/render policy | Transition |
|---|---|---|---|
| Focused | full renderer, detailed timeline, input state | low-latency batches | focus |
| Visible background | preview, status, unread, limited renderer state | coalesced/lower cadence | visible tab/card |
| Hidden active | status, last sequence, notification facts, bounded event tail | no continuous render | hidden but running |
| Archived | metadata, checkpoint, snapshot/history reference | reconstruct on demand | stopped/old |

Demotion creates or updates a snapshot if reconstruction cost would exceed the reopening budget. Promotion restores snapshot then replays the tail.

## 9. Ownership

- One connection owner per server manages transport, reconnect, resume checkpoint, and bounded outbound queue.
- Session-ordered event transforms are partitioned by `(serverId, sessionId)`.
- Renderer state is owned by the focused/visible renderer subsystem, not arbitrary session logic.
- Persistence/projectors consume canonical batches and publish versioned results.
- UI readers receive immutable snapshots/deltas.

## 10. Backpressure

Example policies:

- Never drop command acknowledgements, approvals, sequence/checkpoint facts, or durable events.
- Coalesce superseded status/progress events by session.
- Reduce terminal rendering cadence for background sessions.
- Bound in-memory scrollback/event tails and spill according to retention rules.
- Reject or block new outbound commands when the server queue reaches a safety limit.
- Expose depth and oldest age per server/session partition.

## 11. Correctness

Key invariants:

- last sequence never regresses;
- snapshot through sequence + replay tail equals full replay;
- duplicate canonical events do not double-apply authoritative effects;
- one unresolved approval row per request identity;
- active-set membership matches source facts;
- reconnect does not lose acknowledged outbound commands;
- LOD demotion/promotion preserves required visible state.

Tests include provider fixture conversion, duplicate/gap/reconnect replay, differential comparison against the existing session path, and renderer snapshot restoration.

## 12. Measurements

- events/bytes and size distribution by provider/kind/session;
- hot-session skew;
- stage duration and batch size;
- sequence gaps/duplicates/replay;
- PTY-output-to-paint latency;
- damage density and rows rendered;
- memory per LOD tier;
- snapshot size/build/restore time;
- client publications and bytes per second;
- queue depth/age, retries, and coalescing.

## 13. Incremental migration

1. Introduce canonical event envelopes beside provider-specific handlers.
2. Record fixtures and dual-feed one projection.
3. Move status/unread processing to batch transforms.
4. Move approvals into explicit rows and commands.
5. Isolate PTY/parser/renderer data path.
6. Add LOD for hidden sessions and compare memory/latency.
7. Move reconnect/checkpoint ownership to connection owners.
8. Remove session-level callback/state duplicates only after differential and replay tests pass.
