# Workload and transform analysis

Use this reference to turn an architectural story into measurable dataflow.

## Start with a workload inventory

For every significant dataset or stream, capture:

- source and destination;
- typical, peak, and retained count;
- arrival/change rate and burst behavior;
- lifetime and retention policy;
- payload-size distribution;
- active fraction per operation;
- fields read and written together;
- read/write ratio;
- ordering, consistency, and durability requirements;
- owner and readers;
- target hardware/runtime;
- latency, throughput, memory, network, and storage budgets.

Use [the workload template](../templates/workload-fact-sheet.md). Percentiles and distributions matter whenever tails or skew affect behavior. “Usually small” is not a fact.

## Separate facts, assumptions, and measurements

Use three labels:

- **Measured**: captured from production, traces, benchmarks, or representative fixtures.
- **Specified**: a product/SLO/correctness requirement.
- **Assumed**: a temporary working value requiring validation.

Do not merge these categories. An architecture based on an assumption should include instrumentation and a decision point for revisiting it.

## Draw a transform graph

Model the actual path:

```text
source
  -> boundary decode/validation
  -> canonical data
  -> classification/partition
  -> transform(s)
  -> authoritative commit
  -> index/read-model update
  -> transport/render/output
```

For each node, record:

- input and output schemas;
- cardinality: one-to-one, zero-or-one, one-to-many, many-to-one;
- data read and written;
- deterministic or non-deterministic inputs;
- idempotency and retry behavior;
- batch size and cadence;
- owner/thread/process;
- failure isolation;
- metrics.

For each edge, record:

- ownership transfer or sharing;
- copy, allocation, encoding, and serialization;
- ordering guarantee;
- queue capacity and wait behavior;
- persistence boundary;
- retry/duplication semantics.

## Classify transforms

Naming the transform type helps reveal execution and memory behavior:

- **Mutation**: one input updates one output row.
- **Filter**: zero or one output for each input.
- **Emission**: zero to many outputs for each input.
- **Generator**: output created without a row input, such as timers.
- **Join**: combine rows sharing a key or relation.
- **Reduction**: many rows become fewer values.
- **Partition**: separate rows into homogeneous groups.
- **Projection**: derive a read-specific shape.
- **Compaction**: replace detailed history/state with a smaller representation.

A stage may contain multiple transforms, but keep failure and write boundaries clear.

## Design transforms for explicit dataflow

A hot transform should usually:

- accept explicit inputs and output buffers/tables;
- avoid ambient mutable state;
- operate over a batch, range, partition, or active set;
- separate eligibility/classification from expensive work;
- keep read-only inputs distinct from writes;
- allocate outside the inner loop where output sizing permits;
- be deterministic when practical;
- be idempotent when replay or retry is expected;
- expose rows in/out, duration, bytes, failures, and retries.

## Prefer one-way flow

Good default:

```text
input events -> canonical rows -> authoritative facts -> derived views -> UI/output
```

A downstream stage that needs an upstream mutation should emit a command to the owner rather than reaching backward through shared state.

Cycles are not automatically wrong, but they should represent an explicit iteration, retry, feedback control, or state transition. Accidental cycles usually indicate hidden temporal coupling.

## Separate phases and writes

Where practical, process in phases:

1. gather/decode inputs;
2. validate and canonicalize;
3. classify or partition;
4. read stable source data;
5. compute local results;
6. accumulate commands/outputs;
7. commit owned writes;
8. update projections/publish.

This makes dependencies visible, reduces read/write interleaving, improves replay, and creates safe parallelization points.

## Population-first questions

For each operation, ask:

1. How many rows can participate?
2. What fraction actually participates?
3. Can eligibility be known at insertion or state transition time?
4. Which fields are needed for eligibility versus expensive work?
5. Is the same predicate recomputed in multiple places?
6. Can rows be ordered or partitioned once and consumed repeatedly?
7. Does every item require individual existence, or would a count/aggregate suffice?
8. Can processing be coalesced without violating product semantics?
9. Which steps are required synchronously, and which are merely implemented that way today?

## Boundary conversion

Provider SDKs, HTTP handlers, brokers, databases, PTYs, and browser events often produce awkward external objects. Convert them once into canonical rows near the boundary. Downstream code should not repeatedly inspect provider-specific variants or traverse adapter state.

Keep enough raw evidence for debugging and replay when the canonicalization could be wrong or lossy.

## Architecture output

A design is not complete with a class diagram. Include:

- workload table;
- transform graph;
- authoritative relations and invariants;
- active sets/indexes;
- physical layout decisions for hot transforms;
- schedule and ownership;
- backpressure/retry behavior;
- observability and correctness plan;
- migration and measurement plan.
