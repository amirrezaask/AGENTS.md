# Refactoring and review

Use this reference to apply data-oriented design without a big-bang rewrite.

## Refactor one transform at a time

Recommended sequence:

1. Capture representative inputs, outputs, invariants, and a baseline.
2. Select one costly or hard-to-reason-about transform.
3. Define canonical input/output schemas and ownership.
4. Introduce the new data representation beside the old one.
5. Feed both from one controlled source or boundary converter.
6. Compare behavior with fixtures, replay, and differential tests.
7. Measure isolated and integrated paths.
8. Switch one consumer/producer at a time.
9. Observe rollout and rollback gates.
10. Remove obsolete fields, flags, callbacks, indexes, and synchronization.
11. Document the final transform graph and ownership.

Use [the migration template](../templates/migration-plan.md).

## Good first targets

- repeated full scans with sparse matches;
- hot records carrying large cold fields;
- per-item callback/interface dispatch;
- high-rate events causing one UI commit per item;
- repeated joins/searches/sorts;
- unclear dirty/cached state;
- retry or due work hidden inside object state;
- unbounded queues or per-item tasks;
- object graphs that make replay, lifetime, or ownership difficult;
- full renderer/detail state retained for inactive sessions.

## Bad first targets

- cold admin/configuration code;
- stable external adapters;
- small collections with no measured issue;
- a subsystem without representative fixtures or instrumentation;
- broad rewrites motivated by fashion, engine architecture, or synthetic benchmarks;
- security/correctness-sensitive behavior where the migration cannot be compared safely.

## Anti-patterns and corrections

### Universal domain object

**Symptom:** Every feature adds fields and methods to `Session`, `User`, `Order`, or `Entity`.

**Correction:** Split facts by lifecycle and transform. Keep compact identity/core facts and separate optional relations.

### Polymorphic `update()` loop

**Symptom:** Iterate heterogeneous instances and invoke `update`, `tick`, or `handle` on each.

**Correction:** Classify by operation and process homogeneous rows/queues. Keep polymorphism at coarse boundaries where variation is real.

### Boolean soup

**Symptom:** Several flags represent one lifecycle and allow contradictory combinations.

**Correction:** Store factual axes, one durable phase, or explicit state buckets; derive presentation booleans.

### Null-filled record

**Symptom:** Most rows carry empty capability fields.

**Correction:** Move optional facts into relations whose existence is meaningful.

### Repeated filter/sort/join in reads

**Symptom:** Every request or render recomputes the same population and order.

**Correction:** Preserve an active set, compact ordered keys, top-N, partition, or projection when its write cost is justified.

### Callback cascade

**Symptom:** One callback mutates objects that synchronously trigger more callbacks.

**Correction:** Append canonical events/commands and process explicit stages with owned writes.

### Cache by instinct

**Symptom:** Add cached fields and dirty flags without recompute cost, hit rate, or invalidation evidence.

**Correction:** Compare recomputation with lookup, branch, memory, and invalidation costs. Use explicit dirty-work rows for sparse expensive work.

### SoA everywhere

**Symptom:** Convert all fields into parallel arrays regardless of access.

**Correction:** Select AoS, SoA, projection, or hybrid per hot transform and account for other operations.

### Cosmic entity ID

**Symptom:** Unrelated concepts use one universal registry and ID.

**Correction:** Use specific typed IDs and relations; add universal identity only for genuinely universal operations.

### One async unit per row

**Symptom:** Thousands of tiny goroutines, promises, tasks, or actors.

**Correction:** Batch through bounded workers/owners. Reserve per-item concurrency for independent long-lived waits.

### Hidden overload

**Symptom:** Unbounded arrays, channels, promises, or broker lag absorb pressure.

**Correction:** Expose capacity/age and define block, reject, shed, coalesce, spill, scale, or reduce-detail behavior.

### Microbenchmark architecture

**Symptom:** Adopt a complex layout because one isolated benchmark improved.

**Correction:** Verify end-to-end latency, memory, network, correctness, operational complexity, and maintenance.

### Generic framework before pressure

**Symptom:** Build a reusable ECS/data engine/repository/provider framework before concrete repeated cases exist.

**Correction:** Implement concrete schemas/transforms first; extract only stable mechanics demonstrated by multiple workloads.

## Code-review gates

### Workload

- Are typical, peak, active counts, rates, lifetimes, and distributions known?
- Is the target environment and budget named?
- Are measurements separated from assumptions?
- Is the problem objective rather than pattern-driven?

### Data model

- Does each fact have one authoritative home?
- Are optional/repeating facts separated when lifetimes differ?
- Are IDs and relationships explicit and type-safe?
- Are indexes/read models marked as derived with rebuild/freshness rules?
- Are impossible or contradictory states prevented or validated?

### Transform design

- Is eligibility determined before expensive work?
- Is work grouped by operation rather than instance?
- Are inputs, outputs, writes, and stage order explicit?
- Can the transform be tested/replayed from data?
- Are provider-specific objects normalized at the boundary?

### Layout and movement

- Which exact fields are touched together?
- How many bytes, allocations, copies, queries, messages, or renders occur?
- Does AoS/SoA/hot-cold/index choice fit the access pattern?
- Are search/sort/join/index maintenance costs included?
- Are cold paths left simple?

### Ownership and concurrency

- Who writes each mutable structure?
- Are cross-owner changes commands/data rather than arbitrary shared access?
- Are queues/workers bounded?
- Is ordering scoped no more broadly than required?
- Can writes be partition-local or accumulated before merge?
- Is overload behavior explicit?

### Correctness and measurement

- Is there a reproducible baseline and representative fixture?
- Was the expected gain predicted?
- Are invariants, replay, and differential tests present where needed?
- Is integrated performance measured?
- Does added complexity pay for itself?
- Is old state actually removed after migration?

## Review output

For a focused review, report:

```markdown
## Data-oriented review

### Workload facts and unknowns
### Current transform and ownership path
### Authoritative and derived state
### Main cost or complexity
### Smallest proposed change
### Correctness and migration gates
### Measurement required
### Tradeoffs / reasons not to specialize further
```

Reject a performance-oriented structural change when the workload, bottleneck, expected gain, or integrated validation cannot be stated and the change adds material complexity.
