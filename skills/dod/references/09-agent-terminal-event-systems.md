# Agent, terminal, session, and event systems

Use this reference for YAADE-like multiplexers, Pi-agent fleet management, PTY/Herdr sessions, remote servers, provider adapters, and durable event streams.

## Start from distinct datasets

Do not begin with one `Session` object that owns everything. Inventory separate facts and streams:

- server connection and capability facts;
- session identity and lifecycle;
- provider/runtime binding;
- PTY/process binding;
- ordered canonical events;
- terminal byte stream and parser state;
- renderer surface/damage metadata;
- pending approvals/permissions;
- user focus/visibility/subscription;
- unread/notification checkpoints;
- snapshots and archived history;
- outbound commands and delivery state.

These datasets have different rates, ownership, retention, and consumers.

## Canonical internal event envelope

Normalize provider/runtime events at the boundary:

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

Then classify into kind-specific batches or rows when volume warrants it:

```text
terminal output -> parser/render input chunks
status/progress -> session hot-state patches
approval request -> pending approval rows
agent tool events -> timeline/tool rows
notification candidate -> policy transform -> commands
raw provider event -> retained evidence/debug stream
```

Provider adapters may remain encapsulated objects. Their output should become canonical data before entering the core schedule.

## Suggested authoritative relations

```text
server_core
server_connection_state
session_core
session_presentation
session_runtime_binding
session_last_sequence
live_pty_binding
pending_approval
outbound_command
command_delivery_state
session_snapshot
archive_checkpoint
```

Suggested processing sets/views:

```text
focused_session_id
visible_session_ids
sessions_with_unread
sessions_needing_flush
sessions_due_for_retry
terminals_with_damage
notification_candidates
connected_servers_with_outbound_work
```

The sets are derived processing structures unless product semantics make them durable facts.

## Transform schedule

A practical schedule:

```text
receive server/provider frames
  -> decode/validate
  -> canonicalize
  -> deduplicate and detect sequence gaps
  -> partition by server/session
  -> append durable event batch or advance checkpoint
  -> classify by event kind
  -> update authoritative session/runtime facts
  -> feed terminal parser or other specialized transforms
  -> update read models and notification candidates
  -> publish coalesced client deltas
```

Outbound path:

```text
user/agent command
  -> validate permission and target
  -> persist/assign command identity if required
  -> route to owning server/session connection
  -> bounded send queue
  -> delivery/ack/result rows
  -> retry/expiry/dead-letter policy
```

Make the durable commit and checkpoint order explicit so reconnect/replay cannot silently lose or double-apply work.

## Ordering and identity

Usually require per-session or per-server-session ordering, not a global total order. Record:

- sequence source;
- duplicate identity;
- gap detection and recovery;
- reconnect/resume token;
- snapshot checkpoint;
- command idempotency key;
- whether timestamps are authoritative or presentation-only.

Do not use wall-clock timestamps as the only ordering mechanism when the provider supplies a sequence.

## Terminal-specific data paths

Separate:

- incoming PTY bytes;
- decoder/parser state;
- terminal grid/cell storage;
- row hashes/damage regions;
- scrollback chunks;
- renderer resources;
- viewport/focus state;
- serialized snapshots.

Potential optimizations should target a named transform:

- parse bytes into terminal operations;
- apply operations to grid;
- detect changed rows/cells;
- shape/prepare glyphs;
- transfer damage to renderer/client;
- serialize/restore snapshot.

Do not convert the whole product store to typed arrays because the terminal grid benefits from them. Keep specialization local to parser/renderer paths.

## Damage-driven rendering

Represent changed rows/regions explicitly when sparse damage is common:

```text
terminals_with_damage
changed_rows_by_terminal
full_redraw_required
```

A full scan/redraw can still be cheaper during large bursts. Define a threshold or mode transition based on measured damage density rather than maintaining thousands of tiny updates.

## Session level of detail

### Focused

- full live terminal/agent renderer;
- input and approval interaction;
- low-latency event updates;
- detailed timeline/tool state.

### Visible background

- lightweight preview or last rendered frame;
- status/progress/unread;
- coalesced terminal damage;
- lower refresh cadence.

### Hidden active

- sequence/checkpoint, status, progress summary;
- notification policy;
- no continuous shaping/rendering;
- bounded event tail or durable storage reference.

### Archived

- durable metadata and checkpoint;
- compact snapshot/memento;
- compressed/chunked history reference;
- reconstruct detail on demand.

Promotion and demotion need explicit snapshot/replay rules and latency budgets.

## Multi-server ownership

A connection owner should manage each server's transport, reconnect state, inbound/outbound queues, and resume checkpoint. Session transforms may be partitioned by `(serverId, sessionId)`.

Clients should receive canonical snapshots/deltas rather than references to connection-owned objects. A disconnected server remains represented by facts; it should not require a half-alive object graph to preserve history and UI state.

## Approvals and permissions

Model pending approvals as rows with identity, scope, session, kind, creation/deadline, and resolution state. Membership in a pending relation drives UI and timeout processing.

Do not represent approval solely as a callback waiting inside a provider session object. It must survive reconnect/reload if product semantics require durability.

## Notifications

Separate candidate generation from policy:

```text
event/status change
  -> notification candidate rows
  -> user/session policy transform
  -> deduplicate/coalesce
  -> notification commands
  -> delivery results
```

This makes rate limits, quiet hours, focus suppression, and retries testable as data.

## Persistence and replay

- Append canonical events or provider evidence according to durability requirements.
- Maintain checkpoints per ordering scope.
- Snapshot expensive reconstructed state at measured intervals.
- Bound hot in-memory history.
- Verify snapshot + tail replay equals full replay.
- Version event and snapshot schemas.
- Keep migration/rebuild tooling for projections.

## Metrics

Track:

- events/bytes by server, session, and kind;
- sequence duplicates/gaps and replay counts;
- queue depth/age and reconnect duration;
- batch size and stage duration;
- PTY bytes, parsed operations, damage density, rows rendered;
- memory per focused/background/archived session;
- snapshot size/build/restore time;
- UI/client delta frequency and bytes;
- approval age and command delivery/retry state;
- notification candidate-to-delivery counts.

## Common failure modes

- one universal session object owns transport, history, renderer, UI, approvals, retries, and persistence;
- every provider event invokes polymorphic session handlers individually;
- every session keeps a full renderer active;
- one WebSocket frame causes many store commits;
- reconnect state is implicit in callbacks/promises;
- unbounded scrollback/event arrays absorb pressure;
- sleeping tasks implement retry timers;
- provider-specific payloads leak into all clients;
- timestamps substitute for sequence/checkpoint semantics;
- read models have no rebuild path.

## Design output

For an agent/terminal system, explicitly provide:

1. canonical protocol/event schemas;
2. authoritative relations and processing sets;
3. inbound and outbound transform schedules;
4. ordering/checkpoint/idempotency rules;
5. PTY/parser/grid/renderer data boundaries;
6. session LOD tiers and snapshot/reconstruction rules;
7. connection/session ownership and queue limits;
8. persistence/replay/read-model strategy;
9. metrics and representative benchmarks;
10. incremental migration from current session objects or callback paths.
