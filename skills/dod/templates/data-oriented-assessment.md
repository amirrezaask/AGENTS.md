# Data-oriented assessment

Use this as the required output for substantive architecture, refactor, or review work.

## 1. Scope and task mode

- Boundary:
- Mode:
- User/operational goal:
- Constraints:
- References loaded from the skill:

## 2. Workload facts

Summarize typical/peak counts, rates, distributions, active fractions, lifetimes, access patterns, target environment, and budgets. Separate measured, specified, assumed, and unknown values.

Link or embed the completed [workload fact sheet](workload-fact-sheet.md).

## 3. Current dataflow

```text
source -> decode -> canonicalize -> classify -> transform -> commit -> projection -> output
```

Describe:

- input/output schemas;
- copies/serialization;
- ownership and synchronization;
- queues/batches;
- ordering/retry;
- indexes/read models;
- callback/object graph paths.

## 4. Main costs and complexity

### Measured findings

- Finding:
- Evidence:
- User/operational impact:

### Hypotheses

- Hypothesis:
- Why plausible:
- Evidence needed:

Do not mix hypotheses into measured findings.

## 5. Proposed authoritative data model

| Relation/table | Key | Authoritative fields | Owner | Lifetime | Invariants |
|---|---|---|---|---|---|
| | | | | | |

### Derived structures

| Index/view/set/snapshot | Source of truth | Purpose | Update/freshness | Rebuild/fallback | Cost |
|---|---|---|---|---|---|
| | | | | | |

## 6. Transform schedule

| Order | Transform | Active set/input | Output | Owner | Batch/cadence | Failure/retry | Metrics |
|---:|---|---|---|---|---|---|---|
| | | | | | | | |

State why the schedule groups work by operation and where phase barriers exist.

## 7. Physical layout decisions

For every hot transform:

- fields read/written together;
- active fraction and access order;
- current bytes/copies/allocations;
- selected AoS/SoA/hot-cold/index/snapshot layout;
- effect on other transforms;
- validation benchmark.

## 8. Searching, ordering, and level of detail

- Full scans retained and why:
- Active sets/indexes introduced and maintenance cost:
- Ordering scope and strategy:
- Join strategy:
- LOD tiers, retained state, cadence, promotion/demotion, reconstruction:

## 9. Ownership, concurrency, and backpressure

- Writer/owner per mutable relation:
- Partition key:
- Cross-owner commands/snapshots:
- Worker and queue bounds:
- Required ordering scope:
- Retry/idempotency:
- Overload behavior:

## 10. Correctness and observability

### Invariants

- 

### Tests

- fixtures/table tests;
- replay/differential tests;
- duplicate/gap/retry cases;
- integration schedule tests.

### Metrics

- rows/events in/out;
- queue depth/age;
- batch size;
- stage duration;
- bytes/allocations;
- retries/drops/coalescing;
- projection/snapshot lag.

## 11. Migration plan

Summarize incremental steps, compatibility boundary, dual-run/differential comparison, rollout/rollback, cleanup, and completion gates. Use [the migration template](migration-plan.md).

## 12. Measurement plan

- Objective baseline:
- Representative workload:
- Hypothesis:
- Predicted maximum/expected gain:
- Acceptance threshold:
- Integrated confirmation:
- Resource/complexity tradeoffs:

Use [the optimization experiment template](optimization-experiment.md) for performance-driven changes.

## 13. Tradeoffs and rejected alternatives

Explain why the proposal fits the actual workload and what it intentionally does not optimize. Include the reasons to keep simple code, scans, objects, or existing layouts where they remain appropriate.
