# Incremental data-oriented migration plan

## Scope

- Current transform/subsystem:
- New representation/schedule:
- Migration owner:
- Compatibility constraints:
- Rollback requirement:

## Baseline and evidence

- Representative fixtures/traces:
- Current invariants:
- Current performance/operational baseline:
- Existing metrics and gaps:

## Old and new models

### Old authoritative/derived state

| Structure | Role | Owner | Consumers | Problems |
|---|---|---|---|---|
| | | | | |

### New authoritative/derived state

| Structure | Role | Owner | Consumers | Rebuild/migration source |
|---|---|---|---|---|
| | | | | |

## Controlled conversion boundary

- Where external/old data becomes the new canonical shape:
- Where new outputs are converted for old consumers:
- How duplicate sources of truth are prevented:
- Version/checkpoint strategy:

## Migration stages

| Stage | Change | Validation | Rollout gate | Rollback | Cleanup after success |
|---:|---|---|---|---|---|
| 1 | Capture fixtures/baseline | | | | |
| 2 | Introduce canonical schemas | | | | |
| 3 | Build new transform beside old | | | | |
| 4 | Dual-run/differential compare | | | | |
| 5 | Switch one consumer/partition | | | | |
| 6 | Expand rollout | | | | |
| 7 | Remove old writes/state | | | | |
| 8 | Remove compatibility layer | | | | |

## Differential checks

- Inputs shared:
- Outputs compared:
- Allowed differences:
- Invariants:
- Sequence/checkpoint comparison:
- Performance comparison:
- Alert thresholds:

## Data backfill/rebuild

- Source:
- Batch/partition strategy:
- Ordering/idempotency:
- Resource limits/backpressure:
- Checkpoint/resume:
- Verification:

## Rollout and rollback

- Feature flag/traffic partition:
- Canary size:
- Observation window/gates:
- Rollback trigger:
- State compatibility during rollback:
- Recovery from partial migration:

## Completion gates

- Correctness/replay passes:
- Target integrated metric passes:
- Queue/ownership metrics healthy:
- New representation is authoritative:
- Old writes disabled:
- Old fields/tables/callbacks/indexes removed:
- Documentation/diagrams updated:
- Rebuild/runbook tested:
