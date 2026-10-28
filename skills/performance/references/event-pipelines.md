# Batching, ownership, and retained state

Make the actual sequence explicit:

receive → decode/validate → canonicalize → classify/partition → transform → commit
→ checkpoint/acknowledge → update projections → publish

The application determines durability order. Do not advance a replay checkpoint or
acknowledge work beyond its committed effects. If a durable write and publication
cannot share a transaction, define recovery through an outbox or equivalent protocol.

Choose the smallest required ordering scope, often account/session rather than global.
Partition by the key that owns mutations. Use one writer per partition and local
results followed by controlled commits; a thread-safe map does not define update order.
Keep retryable computation distinct from non-idempotent commits. Carry operation IDs,
attempt/deadline, sequence/checkpoint, and deduplication state where semantics need them.

Batch short work through bounded owners instead of creating one task per row. Compare
batch size against tail latency and skew: one hot key can dominate a partition. Track
queue depth AND oldest age, arrival/service rate, batch size, retries, and coalescing.
Define capacity, cancellation, expiry, and overload behavior; an unbounded queue turns
overload into retained memory and latency.

Coalesce superseded state only when its algebra permits it. Latest progress may replace
older progress; additive counters must accumulate, terminal bytes stay ordered, and
commands/approvals must retain their identity. Test batch application against sequential
application, including duplicates, gaps, partial failure, and replay.

For multi-session or terminal systems, separate transport, event history, PTY bytes,
parser/grid, renderer damage, and product metadata. They have different lifetimes and
consumers. Keep specialized buffers local to the parser/renderer. Publish compact
versioned deltas or snapshots across owners rather than mutable adapter objects.

Use focus/visibility as scheduling inputs when measured cost justifies it:

- Focused: detailed renderer and low-latency input/output.
- Visible background: preview/status with coalesced updates.
- Hidden active: sequence, notification facts, and bounded history; avoid continuous
  shaping/rendering when it has no consumer.
- Archived: metadata and a snapshot/history reference; reconstruct on demand.

Define promotion/demotion, freshness, and restoration cost. Prove snapshot plus tail
replay equals full replay. Pending approvals that must survive reconnect need durable
identity and state rather than a callback retained inside a session object.

Sparse terminal damage can use changed-row sets/ranges. Dense bursts may favor a full
pass; measure the crossover rather than forcing thousands of tiny updates. Report
output-to-paint latency, damage density, retained bytes by tier, and restore time.
