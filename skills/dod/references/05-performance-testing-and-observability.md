# Performance, testing, and observability

Use this reference whenever a representation, index, cache, batching strategy, concurrency change, or rewrite is justified by performance or operational complexity.

## Optimization loop

Use this order without skipping steps:

1. **Define** the objective problem.
2. **Measure** a reproducible baseline.
3. **Analyze and predict** the dominant cost and possible gain.
4. **Experiment** with the smallest change that tests the hypothesis.
5. **Confirm** in the integrated system.
6. **Keep, revise, or remove** based on evidence and complexity.

Use [the optimization experiment template](../templates/optimization-experiment.md).

## Define an objective problem

Good:

```text
Opening a session with 100,000 retained events takes p95 1.8 s on the reference laptop; the target is below 400 ms without increasing steady-state memory above 250 MB.
```

Bad:

```text
Objects are slow, so replace the event model with SoA.
```

A useful problem statement names the user/operational impact, workload, environment, current result, target, and constraints without prescribing the solution.

## Build a representative workload

Record:

- hardware, OS, runtime/compiler, and relevant versions;
- dataset source and distribution;
- typical, peak, and adversarial sizes;
- payload-size and key-skew distribution;
- warm/cold cache or startup conditions;
- concurrency and arrival bursts;
- persistence/network dependencies;
- feature flags and configuration;
- number of repetitions and variance.

Synthetic data must preserve the characteristics that drive cost. A million identical tiny rows may not represent a workload with skewed large payloads and a hot subset.

## Measure the whole cost

Choose the relevant dimensions:

- p50/p95/p99 latency;
- throughput;
- frame or input-to-paint latency;
- time to first usable UI;
- CPU time and utilization;
- allocations and bytes allocated;
- live/retained memory;
- bytes read, written, serialized, or transferred;
- database rows examined/returned and transaction/lock time;
- queue depth, wait time, and oldest age;
- snapshot size and restore time;
- idle CPU/network activity;
- bundle and JavaScript execution size/time;
- operational complexity and failure recovery.

A faster CPU path that doubles memory, network traffic, or invalidation failures may not be an improvement.

## Analyze and predict

Identify the dominant work or data movement from profiles/traces/metrics. State:

- current cost breakdown;
- suspected mechanism;
- how the proposal changes instructions, bytes, calls, copies, branches, locks, waits, or queries;
- theoretical maximum gain;
- expected integrated gain;
- costs moved elsewhere;
- confidence and unknowns.

Use Amdahl-style reasoning: if a component is 5% of end-to-end latency, eliminating it cannot produce a 2x overall improvement.

## Experiment narrowly

Build the smallest isolated test capable of falsifying the hypothesis. Examples:

- compare full scan against maintained active set at representative densities;
- compare AoS against a compact projection for one hot transform;
- batch 1/10/100/1000 events and measure latency/throughput tradeoff;
- compare per-message UI commits against coalesced store versions;
- compare direct join, temporary index, and materialized view across mutation rates.

Preserve a comparable baseline. Avoid combining layout, concurrency, algorithm, and persistence changes in one experiment when they can be separated.

## Confirm in the integrated path

Report:

- before/after with variance or confidence;
- target achieved or not;
- changed CPU, memory, network, storage, and latency costs;
- behavior at typical and peak loads;
- correctness/replay results;
- complexity introduced;
- prediction accuracy;
- decision to keep, revise, or remove.

A microbenchmark can explain a mechanism or reject an idea. It cannot prove the product path improved until integrated measurement confirms it.

## Test transforms as data

The basic test shape is:

```text
input rows + reference state
  -> transform
  -> output rows + new state + emitted commands
  -> invariants
```

Prefer:

- table-driven fixtures;
- invariant/property tests;
- replay from captured production-like traces;
- differential comparison of old and new representations;
- deterministic clocks and seeds;
- explicit duplicate/out-of-order/gap cases;
- benchmark fixtures with documented distributions;
- integration tests for stage order and ownership.

## Preserve evidence

When feasible, retain canonical inputs, append-only batches, raw boundary payloads, checkpoints, or snapshots long enough to reproduce failures. Do not mutate away the only evidence explaining how bad state arose.

For sensitive data, preserve minimal/redacted fixtures or deterministic generators while keeping the statistical and ordering properties needed for the test.

## Invariants

Examples:

- sequence/checkpoint never regresses;
- one authoritative phase per session;
- every pending approval references an existing session/request;
- active-set membership matches the authoritative predicate;
- a projection at checkpoint N equals rebuilding from authoritative data through N;
- no event is committed twice for the same idempotency key;
- queue depth never exceeds configured capacity;
- promotion/demotion between LOD tiers preserves required state.

Prefer structural prevention when possible, then validate at boundaries and after batch commits.

## Observe each pipeline stage

Expose, where relevant:

- rows/events received and emitted;
- active-set and partition sizes;
- queue depth, capacity, and oldest age;
- batch-size distribution;
- processing, wait, and commit duration;
- allocations and bytes processed;
- retries, duplicates, gaps, drops, and coalescing;
- index/query hit and use rates;
- projection lag and rebuilds;
- snapshot age, size, and reconstruction time;
- per-provider/session hot-key skew;
- overload-mode transitions.

The system should reveal where work accumulates, where data expands, and which stage owns the delay.

## Performance budgets for our software

Select only relevant budgets:

### Services

- request p50/p95/p99;
- rows/events per second;
- allocations/bytes per request or event;
- DB queries, rows, bytes, and lock time;
- broker lag and retry age;
- memory per active partition/session.

### React clients

- time to first usable UI;
- event-to-visible-state and input-to-paint latency;
- commits/renders per event batch;
- main-thread blocking time;
- retained event/store memory;
- network bytes and update cadence for background sessions.

### Terminal/session systems

- PTY-output-to-paint latency;
- rows/cells parsed and rendered per second;
- bytes retained per focused/background/archived session;
- damage-region size and frame cadence;
- snapshot size/restore time;
- idle CPU/network use per connected server.

## Evidence hierarchy

Use, from strongest to weakest for a product decision:

1. integrated representative before/after measurement;
2. production canary or trace comparison;
3. subsystem benchmark with realistic dependencies;
4. isolated microbenchmark;
5. profile-based hypothesis;
6. intuition or general rule.

Lower levels are useful for forming hypotheses, not for declaring success.
