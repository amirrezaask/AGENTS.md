# Worked example: React event ingestion

This example addresses a client that receives agent/session events and calls store setters for every message.

## Current shape

```ts
socket.onmessage = (message) => {
  const event = decode(message.data);
  setSessions((sessions) =>
    sessions.map((session) =>
      session.id === event.sessionId
        ? applyEventToSession(session, event)
        : session,
    ),
  );
};
```

Potential costs:

- decode, map, clone, selector, and render work per message;
- all sessions share one invalidation domain;
- provider payload and product state are coupled;
- terminal output, metadata, approvals, and history share one object;
- hidden sessions retain/render the same detail as focused sessions.

## Example workload facts

Assumed for illustration:

- 100 retained sessions, 8 active, 1 focused;
- status events 50/s, terminal chunks 500/s typical with bursts;
- session list needs status/unread within 100 ms;
- focused terminal target under 50 ms input/output-to-paint;
- hidden sessions can use a 500–1000 ms coalesced status cadence;
- full event history is durable on the server and need not live in the React store.

## Canonical decode batch

```ts
type CanonicalEvent = {
  sessionId: SessionId;
  sequence: bigint;
  timestampMs: number;
  kind: EventKind;
  payload: unknown;
};

type IngestionBatch = {
  receivedAtMs: number;
  events: readonly CanonicalEvent[];
};
```

The socket adapter validates and canonicalizes frames, then appends to a bounded ingestion buffer.

## Classification

```ts
type ClassifiedEvents = {
  statusPatches: SessionStatusPatch[];
  approvalRows: PendingApprovalRow[];
  terminalChunksBySession: Map<SessionId, Uint8Array[]>;
  timelineRows: TimelineRow[];
};
```

The client classifies once, rather than every component switching on provider event variants.

## Store relations

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
  version: number;
};
```

Terminal grids and parser buffers live in a specialized renderer store keyed by session. They are not copied into `AppState` on every chunk.

## Publication schedule

```text
receive frames
  -> canonical event buffer
  -> flush by count/time/urgent-event rule
  -> classify
  -> apply status/approval/timeline rows
  -> feed terminal chunks to renderer owners
  -> derive unread/visible summaries
  -> publish one app-state version
  -> renderer publishes focused/visible damage frames independently
```

Urgent approval/input state can flush immediately. Progress/status can coalesce by session. Sequence/checkpoint changes remain ordered and lossless.

## Coalescing example

```ts
function coalesceStatusPatches(
  patches: readonly SessionStatusPatch[],
): Map<SessionId, SessionStatusPatch> {
  const latest = new Map<SessionId, SessionStatusPatch>();
  for (const patch of patches) {
    const previous = latest.get(patch.sessionId);
    latest.set(patch.sessionId, {
      sessionId: patch.sessionId,
      lastSequence: patch.lastSequence ?? previous?.lastSequence,
      phase: patch.phase ?? previous?.phase,
      unreadDelta:
        (previous?.unreadDelta ?? 0) + (patch.unreadDelta ?? 0),
    });
  }
  return latest;
}
```

Coalescing rules are per event kind. Do not use this shape for events whose individual identity/order is part of product semantics.

## Component subscriptions

- Session list row selects its ID, status row, title row, and unread membership.
- Focused session view selects focused ID and renderer handle/version.
- Approval panel selects pending approvals for one session.
- Timeline virtualizes IDs and resolves visible rows.
- Global navigation does not subscribe to terminal chunks.

## Level of detail

| Session state | Client state | Update cadence |
|---|---|---|
| Focused | full renderer + detailed timeline window | immediate/small batch |
| Visible background | preview/status/unread | coalesced per frame or short interval |
| Hidden active | status/unread/last sequence | slower coalesced interval |
| Archived | metadata + server snapshot/history reference | on demand |

## Search and ordering

Maintain compact ordered activity IDs only when the session list consumes them repeatedly. Do not sort full session payloads every render. Search operates on normalized keys/IDs; fetch heavy history/detail after selection.

## Correctness

- batch application equals sequential application for non-coalesced semantics;
- coalesced status patches preserve final state and additive unread counts;
- sequence never regresses;
- urgent approvals are visible within their latency budget;
- focused-session renderer consumes all terminal chunks in order;
- hidden-to-focused promotion restores snapshot/tail correctly;
- provider conversion fixtures cover unknown versions and invalid payloads.

## Measurements

- messages/events/bytes received;
- decode/classification/apply time;
- batch size and flush reason;
- store publications per second;
- component commits/renders;
- event-to-visible and PTY-to-paint latency;
- main-thread long tasks;
- memory by focused/background/archived tier;
- coalesced/dropped count by kind;
- renderer damage density.

## Migration

1. Add canonical event conversion while retaining current reducer.
2. Buffer and replay captured event fixtures through both paths.
3. Move status patches to one batched store publication.
4. Isolate terminal chunks/render state.
5. Normalize approvals and unread sets.
6. Narrow component subscriptions.
7. Add background LOD/coalescing.
8. Remove nested session event histories and per-message setters after equivalence and latency tests pass.
