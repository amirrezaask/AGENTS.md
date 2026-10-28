# Data layout decisions

For the costly transform, list fields read/written together, access order, active
fraction, mutation rate, bytes touched, and reuse window. Include the work imposed on
other transforms by a new representation.

| Candidate | Useful condition | Cost to include |
| --- | --- | --- |
| AoS | Most fields of each compact row are used together | Unused fields during partial scans |
| SoA or compact projection | Large repeated pass consumes few columns | Whole-row access, insertion, coordinated column updates |
| Hot/cold split | Frequent small state, rare large payload/metadata | Join or lookup when cold data is needed |
| AoSoA/chunked storage | Uniform kernels benefit from tiled batches | Chunk sizing, tails, mutation complexity |
| Map/index | Recurring point or range queries | Build, mutation, memory, invalidation |
| Bitset | Bounded dense membership/intersection | Sparse domain expansion, scans, clearing |
| State bucket/dirty set | Sparse eligibility known at mutation time | Membership maintenance, transitions, synchronization |

A compact scan can beat an index at small sizes or high mutation rates. State buckets
help when each state has distinct processing; keep an enum when transitions are
frequent or the whole population is consumed anyway. Do not split vector components
that most operations consume together.

Keep identity separate from physical position when compaction or slot reuse matters.
Use typed handles; add generations if stale handles could refer to a reused slot.
Keep large payloads cold until key selection finishes. Sort compact keys/indices;
use partitioning or top-N selection when consumers do not require a full order.
Preserve stable order only where semantics require it.

Give each authoritative fact one owner. For an index, cached join, or read model,
identify its source, update/freshness rule, rebuild path, and memory cost. A second
copy of a fact creates an update obligation, even in an in-memory store.

Compare repeated lookup with one temporary batch index, sorted merge, or maintained
projection using query frequency, relation size, and mutation rate. Preserve useful
classification from earlier stages instead of rediscovering it in every consumer.

Match allocation to lifetime: reuse bounded scratch buffers for repeated transforms;
keep stable storage for long-lived handles. Include retained capacity and reset cost.
Measure branch, dispatch, and synchronization cost before replacing readable code
with branchless kernels, intrinsics, or lock-free structures.

For a structural migration, capture representative input/output fixtures, convert at
one boundary, compare old and new transforms on shared inputs, switch a consumer or
partition, and remove old writes/derived state after equivalence and integrated
measurement pass. Do not create a general data framework ahead of concrete workloads.
