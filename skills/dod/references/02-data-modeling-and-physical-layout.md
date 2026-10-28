# Data modeling and physical layout

Use this reference when defining authoritative state, splitting monolithic records, or choosing AoS, SoA, hot/cold, indexes, and snapshots.

## Model facts before objects

List facts and their lifetimes independently of the concept that currently owns them. Two fields belong together when their transforms, ownership, mutation cadence, and lifetime justify it—not merely because product language gives them the same noun.

Questions:

- Is the fact always present or only for some rows?
- Is it scalar, repeating, historical, or time-bound?
- Who writes it?
- Which transforms read it?
- Does it share lifetime with the surrounding record?
- Is it truth or a cached interpretation?
- Can contradictory combinations exist?

## Prefer relations over nullable mega-records

Instead of accumulating unrelated optional capabilities:

```ts
type Session = {
  id: SessionId;
  workspaceId: WorkspaceId;
  providerId: ProviderId;
  title: string;
  terminal?: TerminalState;
  unreadCount?: number;
  pendingApproval?: Approval;
  retryAt?: number;
  archivedAt?: number;
};
```

consider relations shaped by lifecycle and transforms:

```ts
type SessionCoreRow = {
  id: SessionId;
  workspaceId: WorkspaceId;
  providerId: ProviderId;
};

type SessionPresentationRow = {
  sessionId: SessionId;
  title: string;
  createdAt: number;
};

type LiveTerminalRow = {
  sessionId: SessionId;
  rendererHandle: RendererHandle;
  lastSequence: bigint;
};

type PendingApprovalRow = {
  sessionId: SessionId;
  requestId: RequestId;
  kind: ApprovalKind;
};
```

Row existence can express capability or state. The exact split must follow operations; do not turn every field into its own table.

## Normalize authoritative state

Use relational normalization as a reasoning tool in memory as well as in SQL:

- give each durable fact one authoritative home;
- separate repeating values into rows;
- separate optional facts with independent lifetimes;
- avoid duplicating the same meaning across flags, counters, caches, and nested objects;
- use explicit keys for relationships;
- make impossible joins or state combinations hard to express;
- add measured denormalized views for specific reads later.

Normalization is not a command to maximize joins. It establishes truth and update responsibility. Physical read models can be denormalized when their rebuild and freshness semantics are explicit.

## Facts versus interpretations

Avoid storing several booleans that describe one lifecycle:

```text
isConnected
isConnecting
isDisconnected
hasConnectionError
isRetrying
```

Prefer factual axes:

```text
connectionPhase
retryDeadline
lastErrorBySession
```

or processing sets:

```text
connectingSessionIDs
connectedSessionIDs
sessionsDueForRetry
```

Use an enum when it is the clearest durable or wire-level fact. Use state buckets when different states have different processing and sparse populations. Derive UI booleans from facts rather than synchronizing them independently.

## Use specific IDs and handles

Prefer `SessionID`, `WorkspaceID`, `ProviderID`, and `InvoiceID` over raw strings, pointers, or a universal `EntityID`.

A handle should be:

- stable for the required lifetime;
- compact enough for joins and queues;
- validated at boundaries;
- distinguishable from unrelated IDs;
- paired with a generation/version if slot reuse could make stale references dangerous.

A universal identity is justified only when operations genuinely span all represented types uniformly.

## Distinguish truth, indexes, views, and snapshots

For every non-authoritative structure document:

- source of truth;
- query or transform it accelerates;
- build/update policy;
- owner;
- version/checkpoint;
- invalidation or freshness rule;
- rebuild/fallback path;
- memory/storage cost;
- expected use frequency.

Delete an index or projection when its query disappears. Do not let a materialized answer quietly become a second source of truth.

## Select physical layout per transform

### Array of structures (AoS)

Prefer AoS when:

- most fields are consumed together;
- rows are small or collections are modest;
- whole rows are serialized or returned;
- mutations affect the complete row;
- direct code is more valuable than speculative scan optimization.

```go
type SessionHot struct {
    ID          SessionID
    LastSeq     uint64
    UnreadCount uint32
    Phase       SessionPhase
}

var sessions []SessionHot
```

### Structure of arrays (SoA)

Consider SoA when:

- a large hot pass touches only a few fields;
- the same operation runs across many rows;
- irrelevant bytes dominate the working set;
- column-wise compression, vectorization, or bulk operations matter;
- fields have substantially different access/update frequency.

```go
type SessionHotColumns struct {
    IDs          []SessionID
    LastSeq      []uint64
    UnreadCounts []uint32
    Phases       []SessionPhase
}
```

Account for insertion/deletion coordination, stable indexing, whole-row access, and debugging cost.

### Hot/cold split

Often the best compromise:

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

The hot table supports scheduling and frequent updates; cold data supports details, navigation, persistence, and infrequent operations.

### Keys separate from payload

Keep frequently inspected keys compact and touch heavy payload only after selection:

- event timestamp/kind/ID separate from event payload;
- normalized search token/document ID separate from body;
- terminal row hash/damage metadata separate from glyph cells;
- session activity score/ID separate from full metadata.

### Separate read and write buffers

Use distinct input/output buffers or phases when stable snapshots, easier rollback, predictable streaming, or parallel local outputs have concrete value. Do not double-buffer blindly: it may add storage and copying.

### Compact bounded representations

Bitsets, packed fields, and typed arrays can be useful when:

- the domain is bounded and stable;
- intersections/membership are frequent;
- the representation avoids many lookups or reduces transfer materially;
- serialization and debugging remain manageable.

Avoid bit-packing ordinary business state before profiles or storage constraints justify it.

## Layout decision record

For every specialized layout, record:

```markdown
### Layout decision: <transform>

- Dataset and typical/peak count:
- Active fraction:
- Fields read:
- Fields written:
- Access order:
- Mutation/insertion/deletion pattern:
- Reuse window:
- Current bytes/copies/allocations touched:
- Proposed layout:
- Why it matches this transform:
- Costs imposed on other transforms:
- Benchmark or profile that validates it:
- Reversal/migration strategy:
```

## Selection matrix

| Workload | Default candidate |
|---|---|
| Most fields read together; small/medium table | AoS |
| Large scan touches few columns | SoA or compact projection |
| Frequent small state plus rare large metadata | Hot/cold split |
| Point lookup dominates | Map/index plus rows |
| Small compact table | Linear scan, often sorted slice |
| Bounded dense membership/intersection | Bitset |
| Sparse optional capability | Separate relation/set |
| Read-heavy query with expensive recurring join | Materialized view, if freshness/rebuild is defined |
| Stable reader snapshot while writer advances | Snapshot/double buffer/versioned view |

Treat this as a starting hypothesis, not a substitute for workload evidence.
