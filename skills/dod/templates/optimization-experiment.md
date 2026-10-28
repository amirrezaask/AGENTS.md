# Optimization experiment

## Decision

- Proposal under test:
- Owner:
- Date/commit/branch:
- System path:

## 1. Objective problem

- User/operational symptom:
- Workload:
- Current measured result:
- Target:
- Constraints that must not regress:

Do not state the proposed solution as the problem.

## 2. Baseline environment

- Hardware/OS:
- Runtime/compiler/build:
- Dependencies/services:
- Configuration/feature flags:
- Warm/cold conditions:
- Concurrency:
- Dataset source and distribution:
- Repetitions/duration:

## 3. Baseline results

| Metric | Typical | Peak/tail | Variance/confidence | Evidence |
|---|---:|---:|---|---|
| Latency | | | | |
| Throughput | | | | |
| CPU | | | | |
| Allocated/live memory | | | | |
| Bytes/queries/copies | | | | |
| Queue depth/age | | | | |
| Other | | | | |

## 4. Cost analysis

- Dominant stage:
- Profile/trace evidence:
- Current instructions/calls/queries/copies/bytes/locks/waits:
- Fraction of end-to-end cost:
- Unknowns:

## 5. Hypothesis and prediction

- Hypothesis:
- Mechanism changed:
- Theoretical maximum gain:
- Expected integrated gain:
- Costs moved elsewhere:
- Failure conditions/falsification:

## 6. Smallest experiment

- One variable changed:
- Control/baseline:
- Representative cases:
- Typical/peak/adversarial dimensions:
- Correctness checks:
- Metrics collected:

## 7. Isolated results

| Case | Before | After | Delta | Interpretation |
|---|---:|---:|---:|---|
| | | | | |

## 8. Integrated results

| Metric | Before | After | Target | Pass/fail |
|---|---:|---:|---:|---|
| | | | | |

## 9. Correctness and operational impact

- Fixture/replay/differential result:
- Memory/network/storage changes:
- Failure/recovery changes:
- New metrics/alerts:
- Complexity/maintenance cost:
- Rollback path:

## 10. Decision

- Keep / revise / remove:
- Was the prediction accurate?
- Why:
- Follow-up or cleanup:
