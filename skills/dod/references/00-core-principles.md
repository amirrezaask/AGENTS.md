# Core principles

Read this reference before making a substantial data-oriented recommendation.

## Working definition

Data-oriented design treats software as transformations over well-formed data. “Well-formed” depends on the quantity, frequency, distribution, lifetime, access pattern, and target machine/runtime—not only on the semantic type or domain model.

This does not ban objects, classes, interfaces, functional code, or domain terminology. It changes the starting question from “what object represents this concept?” to “what facts exist, which transformations consume them, and what representation makes those transformations correct, clear, and sufficiently efficient?”

## Vocabulary

- **Data**: facts represented in memory, storage, messages, files, or instructions.
- **Transform**: an operation that consumes data and emits or mutates data.
- **Table**: a homogeneous collection of rows, columns, keys, IDs, or work items; it need not be SQL.
- **Set**: a collection whose membership carries meaning, such as `sessionsNeedingFlush`.
- **Active set**: the subset eligible for a transform now.
- **Authoritative state**: the minimal facts from which dependent state can be rebuilt.
- **Index**: auxiliary data maintained to answer a recurring query more cheaply.
- **Materialized view**: derived data maintained for a read path.
- **Hot data/path**: touched frequently enough that movement or execution cost matters.
- **Cold data/path**: infrequent work where simplicity usually dominates specialization.
- **Working set**: data needed by a transform during the relevant time window.
- **Memento/snapshot**: compact retained data from which fuller state can be restored.
- **Level of detail**: retained state or processing frequency based on current importance.

## Principles

### 1. Start with live workload facts

Data is more than a schema. Record its type, count, rate, shape, probability distribution, lifetime, and change pattern. Design for the representative and tail workloads rather than an imagined average instance.

### 2. Design for populations and operations

Prefer asking “how do we process all due jobs?” or “how do we render all changed terminal rows?” over asking every object whether it needs work. This exposes actual loops, dispatch, memory movement, and scheduling.

### 3. Make transformations explicit

A system should reveal what consumes what, where data changes shape, who owns writes, and when work runs. Hidden callbacks and object graph traversal obscure these facts.

### 4. Keep truth minimal

Store facts once. Derive cheap interpretations. Treat caches, indexes, projections, counts, and UI modes as dependent data with explicit rebuild and invalidation rules.

### 5. Use relations to separate lifetimes and capabilities

Optional or repeating facts often belong in separate relations instead of nullable fields on a universal record. Add capabilities by adding rows/relations, not by inflating every instance.

Do not split mechanically. Fields used and mutated together can remain together.

### 6. Let membership express sparse work

When only a subset needs processing, a queue, set, state bucket, deadline structure, or range can encode eligibility. Then the transform processes valid work rather than rechecking the full population.

Maintaining membership has a cost. Use a scan when it is smaller, denser, simpler, or cheaper.

### 7. Group work by transform

Batch homogeneous work and centralize scheduling. A coarse external adapter may stay polymorphic; the inner hot path should usually process canonical rows by operation.

### 8. Choose layout from access

AoS, SoA, hot/cold, packed values, indexes, and buffers are tools. Select them by fields touched, iteration order, active fraction, mutation behavior, and measured cost. No layout is globally superior.

### 9. Make ownership and lifetime visible

Mutable data needs a clear writer. Prefer explicit commands, partitions, immutable snapshots, and stable IDs over arbitrary shared references. Garbage collection does not solve aliasing, temporal coupling, or contention.

### 10. Vary detail and frequency

Not every item needs full state or the highest update cadence. Promote detail for visible/active/focused items; retain summaries, snapshots, or lower-frequency processing for background or archived items.

### 11. Optimize through feedback

Define the problem, measure, analyze and predict, implement the smallest experiment, then confirm in the integrated system. Keep the specialization only when the result pays for its complexity.

### 12. Prefer concrete, replaceable solutions

Data and workflows are product-specific. Do not create a universal DOD framework in advance. Implement concrete transforms and extract common machinery only after stable repetition appears.

## Objects and abstractions at the edges

Encapsulated objects are often appropriate around:

- sockets, files, PTYs, renderers, OS resources;
- database, broker, and provider clients;
- SDK adapters;
- lifecycle-bound UI widgets;
- coarse subsystems with stable variation.

Normalize their output into explicit application data quickly. Do not spread adapter-owned object graphs through the core.

## Non-goals

Data-oriented design is not:

- ECS everywhere;
- primitive arrays everywhere;
- branch removal at any cost;
- zero allocation as a universal rule;
- bitsets, SIMD, pooling, or custom allocators by default;
- denormalizing every store;
- replacing understandable cold code with specialized machinery;
- a license to ignore product correctness or operational safety.

## Decision rule

Describe the data, workload, transformations, target environment, and required outputs. Choose the simplest representation and schedule that satisfy them. Add specialization only where evidence identifies a material cost.
