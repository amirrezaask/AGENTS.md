# Workload fact sheet

Copy this template before selecting a representation or architecture. Delete irrelevant columns only after considering them.

## Scope

- System/feature:
- Transform or user path under review:
- Task mode: architecture / feature / refactor / performance / review
- Target runtime/hardware:
- Current correctness/SLO requirements:
- Evidence window/source:

## Dataset and stream inventory

| Dataset / stream | Source → destination | Typical count | Peak/retained count | Arrival/change rate | Burst/skew distribution | Payload-size distribution | Lifetime/retention | Hot operations | Fields touched together | Read/write ratio | Active fraction | Ordering/consistency | Owner | Budget | Evidence status |
|---|---|---:|---:|---:|---|---|---|---|---|---|---:|---|---|---|---|
| | | | | | | | | | | | | | | | Measured / Specified / Assumed / Unknown |

## Transform inventory

| Transform | Input | Output | Cardinality | Cadence/batch | Fields read | Fields written | Owner | Retry/idempotency | Current cost/evidence |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |

## Data movement inventory

| Edge | Shape/encoding | Copy/allocation | Serialization/network/storage | Ordering | Queue/capacity | Failure/retry | Evidence |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

## Query/index inventory

| Query/predicate | Frequency | Source size | Rows examined | Rows returned | Mutation rate | Current structure | Latency | Freshness requirement |
|---|---:|---:|---:|---:|---:|---|---|---|
| | | | | | | | | |

## Level-of-detail inventory

| Importance tier | Population | Retained state | Update cadence | Network/render cadence | Promotion/demotion trigger | Reconstruction source/cost | Budget |
|---|---:|---|---|---|---|---|---|
| Focused/active | | | | | | | |
| Visible/background | | | | | | | |
| Hidden/idle | | | | | | | |
| Archived | | | | | | | |

## Known bottlenecks

- Measured:
- Suspected:
- User/operational impact:
- Current baseline:
- Target:

## Unknowns requiring instrumentation

| Unknown | Why it matters | Instrumentation/query | Decision affected | Owner |
|---|---|---|---|---|
| | | | | |

## Assumptions

| Assumption | Reason | Risk if wrong | Validation plan | Revisit date/gate |
|---|---|---|---|---|
| | | | | |
