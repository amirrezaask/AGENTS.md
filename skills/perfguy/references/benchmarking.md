# Evidence for a performance change

Use the same hardware, power state, runtime/build, feature flags, dataset, concurrency,
and warm/cold conditions for the comparison. Record representative sizes, payload/key
skew, bursts, and retained state. Separate setup from timed work and consume outputs
so the optimizer cannot discard the work.

Repeat enough to expose variance. Alternate baseline/candidate order when thermal or
background drift matters. Avoid comparing numbers from different power/thermal states.
Use the runtime's CPU, allocation, blocking, query-plan, or GPU evidence to explain
where time moved; throughput alone can hide worse tail latency.

For latency load tests, a client that waits for each response before sending again
omits arrivals during stalls. Use a schedule representing offered load and account for
backlog and dropped/rejected arrivals. Report queue wait and end-to-end latency, not
only service time for accepted requests.

Measure the integrated path after the isolated experiment. A faster helper may be a
small fraction of total cost or move work into serialization, allocation, queues, or
startup. Include p50/p95/p99 when enough samples support them, throughput for batch
work, and allocated versus retained memory when either changes.

Check correctness before timing: compare output and required ordering/precision on
shared fixtures; use replay, differential, race, or property checks where the changed
semantics warrant them. Race-freedom alone does not prove ordering or idempotency.

Record revision, environment, workload, baseline, candidate, variance, changed resource
costs, and limitations. Choose a regression guard that captures the mechanism or user
budget without making noisy microsecond timings a brittle unit-test requirement.
