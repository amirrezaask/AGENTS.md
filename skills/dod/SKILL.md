---
name: data-oriented-design
description: "Apply Richard Fabian's Data-Oriented Design principles to architecture, implementation, refactoring, performance work, and code review in Go, TypeScript/React, event-driven services, and agent or terminal runtimes. Use when data volume, access patterns, state complexity, repeated scans, event throughput, memory movement, scheduling, or ownership materially affects the design. Start from workload facts and measured transformations; do not use this skill to justify speculative rewrites, ECS everywhere, or cargo-cult SoA."
---

# Data-Oriented Design

Use this skill to design software around the data that exists, the transformations performed on it, and the machine/runtime that executes those transformations.

The source book is Richard Fabian's *Data-Oriented Design*: <https://www.dataorienteddesign.com/dodbook/>. This package adapts its ideas to our Go services, TypeScript/React applications, event pipelines, agent runtimes, terminal/session systems, databases, and queues.

## Operating contract

1. Begin with workload facts, not domain nouns or preferred patterns.
2. Describe the system as transformations over explicit data.
3. Keep each fact authoritative in one place; treat indexes and read models as derived data.
4. Represent sparse work explicitly when doing so is cheaper than rediscovering it.
5. Choose AoS, SoA, hot/cold splits, indexes, batching, and concurrency from actual access patterns.
6. Preserve simple object-oriented or encapsulated boundaries where they fit, especially around external resources.
7. Label assumptions. Do not present guessed scale, frequency, or bottlenecks as measured facts.
8. Require correctness evidence and end-to-end measurement before accepting a performance-driven specialization.

## When to invoke

Apply this skill when at least one condition is true:

- a request, frame, worker, renderer, or consumer processes many similar items;
- a system repeatedly scans, filters, joins, sorts, dispatches, or copies the same population;
- records contain many optional fields, overlapping flags, nested collections, or unrelated lifetimes;
- callbacks, methods, promises, goroutines, or actors are created or invoked per item;
- event throughput, memory use, allocation rate, startup time, tail latency, UI responsiveness, or battery use matters;
- ownership, mutation order, replay, retry, backpressure, or debugging is difficult;
- an architecture or refactor is being justified as a performance improvement;
- a session/event/terminal product keeps full detail or full processing active for every session.

Apply it lightly to cold, small, adapter-heavy code. Do not introduce specialized layouts where simple structs and direct code already meet the requirements.

## Reference-loading protocol

Do not load every file by default. Read only the references required by the current task.

### Always read for non-trivial use

- [Core principles](references/00-core-principles.md)
- [Workload and transform analysis](references/01-workload-and-transform-analysis.md)

### Load by task

| Task or symptom | Read |
|---|---|
| Define authoritative state, split mega-records, choose AoS/SoA/hot-cold | [Data modeling and physical layout](references/02-data-modeling-and-physical-layout.md) |
| Repeated condition checks, scans, searches, sorts, joins, or unnecessary full-detail state | [Active sets, queries, and level of detail](references/03-active-sets-search-sorting-and-lod.md) |
| Concurrency, event streams, queues, retries, partitioning, or backpressure | [Ownership, concurrency, and streams](references/04-ownership-concurrency-and-streams.md) |
| Performance claim, benchmark, profiling, tests, replay, or observability | [Performance, testing, and observability](references/05-performance-testing-and-observability.md) |
| Existing-system refactor or code review | [Refactoring and review](references/06-refactoring-and-review.md) |
| Go implementation | [Go services](references/07-go-services.md) |
| TypeScript or React implementation | [TypeScript and React](references/08-typescript-react.md) |
| Agent, session, event, PTY, terminal, or multiplexer implementation | [Agent and terminal systems](references/09-agent-terminal-event-systems.md) |
| Trace a rule back to the book or resolve interpretation disputes | [Book source map](references/10-book-map.md) |

### Reusable artifacts

- [Workload fact sheet](templates/workload-fact-sheet.md)
- [Data-oriented assessment](templates/data-oriented-assessment.md)
- [Optimization experiment](templates/optimization-experiment.md)
- [Incremental migration plan](templates/migration-plan.md)

### Worked examples

- [Agent/session runtime](examples/agent-session-runtime.md)
- [Backend event pipeline](examples/backend-event-pipeline.md)
- [React event ingestion](examples/react-event-ingestion.md)

## Required workflow

### 1. Choose the task mode and boundary

State whether this is:

- new architecture;
- focused feature design;
- performance investigation;
- representation refactor;
- concurrency/scheduling redesign;
- code review.

Name the smallest system boundary that contains the problem. Avoid redesigning the entire product when one transform or dataset is responsible.

### 2. Establish workload facts

Use [the workload template](templates/workload-fact-sheet.md). Capture, where relevant:

- typical and peak counts;
- arrival and mutation rates;
- active fraction;
- lifetime and retention;
- field access frequency;
- read/write ratio;
- ordering and consistency requirements;
- payload-size distribution;
- target runtime and hardware;
- latency, throughput, memory, network, and storage budgets.

When a fact is unknown, mark it `unknown`, state the working assumption separately, and propose instrumentation. Never convert an assumption into a requirement silently.

### 3. Draw the transform graph

Describe actual flow rather than packages or classes:

```text
external input
  -> validate/decode
  -> canonical rows
  -> classify/partition
  -> transforms
  -> authoritative state
  -> indexes/read models
  -> transport/render/output
```

For every edge, record shape, ownership, copy/serialization, ordering, batching, failure, retry, and backpressure behavior.

### 4. Identify authoritative facts and derived data

For each field or relation, decide whether it is:

- authoritative fact;
- transient work item;
- index;
- cache/materialized view;
- snapshot/memento;
- presentation-only state.

A duplicated fact requires an explicit owner, update policy, rebuild path, and freshness contract.

### 5. Identify the active set

For each transform, ask which rows can participate. Choose explicitly between:

- a full scan;
- a queue or set;
- a state bucket;
- a sorted range;
- an index;
- an event-triggered batch;
- a coarse timing/frequency bucket.

Include the maintenance cost of the active set. A small dense scan may be better than an index.

### 6. Select representation from access patterns

For each hot transform, list fields read together, fields written, access order, active fraction, bytes touched, and mutation pattern. Then choose the simplest fitting representation:

- array of structures;
- structure of arrays;
- hot/cold split;
- normalized relations;
- compact key/index plus payload;
- snapshot/delta;
- another task-specific layout.

Do not say “SoA is faster” or “objects are slow.” Name the concrete transform and cost being changed.

### 7. Define schedule, ownership, and overload behavior

Specify:

- one writer or owner for each mutable table/partition;
- phase order;
- batch boundaries;
- immutable snapshots or commands crossing owners;
- bounded worker/queue limits;
- retry and idempotency rules;
- behavior when producers outrun consumers.

Concurrency is a scheduling decision after data dependencies are understood, not a default per-item abstraction.

### 8. Define correctness, observability, and migration

Use fixtures, invariants, replay, or differential tests. Expose counts, queue age/depth, batch sizes, transform duration, retries, drops/coalescing, allocations/bytes when relevant, and read-model lag.

For an existing system, use [the migration template](templates/migration-plan.md). Prefer one transform at a time, dual-running or differential comparison where useful, and removal of obsolete state after cutover.

### 9. Validate performance claims

Use [the experiment template](templates/optimization-experiment.md). Require:

- objective problem statement;
- reproducible baseline;
- hypothesis tied to work or data movement;
- predicted maximum and expected gain;
- representative workload;
- integrated before/after result;
- complexity and resource tradeoffs.

A microbenchmark may explain a mechanism; it does not prove product-level improvement by itself.

## Required answer format

For substantive architecture, review, or refactor work, fill [the data-oriented assessment template](templates/data-oriented-assessment.md). The answer must connect every recommendation to a dataset, transform, workload fact, or clearly labeled hypothesis.

For a narrow code review, at minimum report:

1. workload assumptions or missing measurements;
2. current data and transform path;
3. authoritative versus derived state;
4. the main unnecessary scan, movement, allocation, dispatch, or synchronization;
5. the smallest proposed change;
6. correctness and measurement gates.

## Hard guardrails

Reject or revise a proposal when it relies on any of these arguments without evidence:

- “DOD means ECS.”
- “SoA is always faster.”
- “Every boolean should become a table.”
- “Every object must be removed.”
- “A map is better than a scan because it is O(1).”
- “One goroutine/actor/promise per item is scalable.”
- “A cache will make it faster.”
- “The microbenchmark improved, therefore the architecture is better.”
- “We should build a generic data framework before concrete workloads exist.”
- “Rewrite the whole subsystem to make it data-oriented.”

Correctness, security, durability, accessibility, and maintainability remain requirements. Performance specializations must earn their complexity.

## Completion gates

A data-oriented change is complete only when:

- the workload and target are documented;
- the authoritative data model and ownership are explicit;
- transform order and active sets are visible;
- correctness is covered by invariants, fixtures, replay, or differential tests;
- queues and overload behavior are bounded and observable where applicable;
- the integrated target is measured;
- obsolete representations, flags, callbacks, and synchronization paths are removed or deliberately documented;
- tradeoffs and rejected alternatives are recorded.
