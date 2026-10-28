# Layout And Hot Paths

> Load when changing data layout, hot loops, batching, allocation, locality, GPU/UI, backend, or performance APIs.

## AoS vs SoA vs AoSoA

Definitions (`W` ≈ SIMD width / cache line / GPU warp / page / job chunk):

```text
AoS:    [{x,y,z,vx,vy,vz,color}, {x,y,z,vx,vy,vz,color}, ...]
SoA:    x[] y[] z[] vx[] vy[] vz[] color[]
AoSoA:  [{x[W],y[W],z[W],vx[W],vy[W],vz[W]}, {x[W],...}, ...]
```

| Choose | When |
|---|---|
| AoS | Most ops consume most fields of one element: whole-record load/update; small or cold collections; random access to one entity's many fields; insert/delete/move dominates over scanning; passed to APIs as a unit; strong per-record invariants; clarity beats peak throughput; not bandwidth-bound or not in a hot loop |
| SoA | Ops touch one/few fields across many elements: large scans; filter/search/sort by one field; same-field bulk updates; numeric kernels; want SIMD/GPU-upload/columnar friendliness, hot/cold separation, batch transforms, parallel ranges |
| AoSoA | SoA-like vectorization/cache behavior without one giant global column set: fixed-size chunks, cache-sized tiles, easier insertion/removal than giant SoA while keeping vector-friendly inner loops |

Example AoS (cold inspection): `for entity in selected_entities: draw_inspector(entity.name, entity.transform, entity.flags, ...)` — cache-perfect streaming is not the bottleneck here.
Example SoA: `for i in 0..count: x[i] += vx[i]*dt` — streams through few columns.

**Don't blindly split vector components.** If almost every op needs `x`,`y`,`z` together (`length = sqrt(x[i]² + y[i]² + z[i]²)`), compact `Vec3` arrays or AoSoA beat three separate columns. But searching only `times[]` for the first keyframe ≥ t should not pull keyframe values into cache — that split is right.

## Hot/cold splitting

Split by usage frequency, not by domain concept:

```text
EntityHot  { id, position, velocity, health }
EntityCold { id, display_name, debug_label, last_error,
             editor_metadata, script_callbacks, asset_paths }
```

Or separate tables keyed by `entity_id`. Hot loops see only hot fields.

## Batching beats per-item cleverness

Prefer `collect events -> sort/group/filter -> process batch -> emit outputs` over `event -> callback -> method -> virtual dispatch -> lock -> update one item -> notify observers`. Batching improves locality, cuts repeated state loads/stores, lock overhead, and branch noise, and eases profiling. Use event tables, command buffers, dirty lists, compact queues, append-only logs, frame arenas.

## Allocation rules

Allocations aren't automatically bad; unplanned allocation patterns are. Match strategy to lifetime:

- Per-frame/request temporaries → arena/bump/scratch buffer.
- Long-lived stable objects → pool/slab/stable vector/handle table.
- Variable output → pre-size, append contiguously.
- Rare/cold objects → normal heap is fine. Shared immutable → interning/dedup.

Watch: allocation inside loops; hidden allocation in string formatting, closures, iterators, boxing, async state machines, regex, JSON, logging, exceptions, map growth; refcounts in tight loops; GC pressure from short-lived objects.

## Memory locality

Contiguous memory for hot data. Avoid linked lists, trees, graphs, maps, pointer-rich objects on hot paths unless algorithmic benefit dominates locality cost — dense arrays often beat "elegant" structures because hardware loves predictable sequential access.

Sort/group data by how it will be processed: material/shader before rendering; job type before execution; component signature before update; timestamp before time-window scans; key before joins; file/package before indexing; state before state-specific work; visibility before rendering.

## Branches

Branches aren't evil; unpredictable branches in hot loops are suspicious. Improve by: splitting rare cases out of loops; sorting/grouping by condition; masks/bitsets for dense filters; homogeneous batches; tables of commands instead of per-item polymorphism; making invalid cases impossible earlier in the pipeline. No branchless tricks without measurement.

## SIMD

SIMD wants independent, uniform operations over multiple items. Good: same op on many elements, contiguous homogeneous arrays, few unpredictable branches, minimal aliasing, aligned/predictable loads, no loop-carried dependency. Bad: pointer chasing, virtual calls, variable-length per-item data, mixed types/scattered fields, early exits, complex aliasing. First optimization is usually not intrinsics — reshape data/loops so the compiler vectorizes naturally.

## GPU/UI/rendering

Think in streams and retained resources. Prefer persistent buffers, dirty-region updates, batched draws, texture/glyph atlases, stable handles, precomputed geometry, compact per-instance data; avoid CPU/GPU sync points, readback, full-world rebuilds per frame.

Suspicious: uploading huge buffers when a small region changed; recreating pipelines/textures/bind groups/fonts/buffers often; per-glyph/per-widget draws; layout/shaping/highlighting/parsing/IO repeated every frame; animation work for invisible/offscreen items; object-tree traversal emitting one draw call at a time.

## Backend/service

The machine boundary often dominates. Look for N+1 queries; queries in loops; missing indexes; bad plans; over-fetched columns; repeated JSON encode/decode; per-request regex/template/config reload; chatty RPC; excess logging; unbounded tasks/futures; lock contention in shared caches; middleware allocations; tail latency from retries/timeouts/queues/GC/slow downstreams.

Prefer batching; prepared/cached plans; narrow queries; streaming large results; backpressure; pools sized to downstream capacity; explicit timeout budgets; request-scoped arenas; no needless serialization between internal layers.

## Databases as a DOD teacher

Tables = arrays/columns; columns = fields with independent access patterns; indexes = auxiliary traversal orders; joins = intersecting sorted/indexed streams; materialized views = cached transforms; query plans = explicit operation order; column stores = skip irrelevant fields. When data is large, ask: "What would the query plan be?"

## API design

Never force bad performance into callers. Bad shape: `get_one(id) -> object`, `update_one(object)`. Better: `get_many(ids) -> compact batch`, `update_many(batch)`, `transform(input_table, output_table)`.

Prefer APIs exposing: batch ops; caller-provided output buffers; slices/ranges/iterators over contiguous data; stable IDs instead of owning pointers; explicit lifetimes; hot/cold separation; no hidden allocation, IO, or locks.
