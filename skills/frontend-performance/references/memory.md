# Retained memory

Reproduce a cycle expected to return to the same state, such as opening and closing
one view. Warm it once, capture a heap snapshot, repeat several cycles, collect under
comparable GC conditions, and compare retained objects and dominator/retainer paths.
Growth alone can be a cache or delayed collection; identify the retaining owner before
calling it a leak. Repeat longer to distinguish a bounded plateau from continued growth.

Check detached DOM, listeners, observers, timers, subscriptions, sockets, workers,
object URLs, closures, undo/history, and retained route subtrees. Pair each resource
with its actual lifecycle owner and teardown. Cancellation must also prevent obsolete
async results from retaining or updating a disposed view.

A TTL checked only on lookup may leave expired entries resident forever. Bound cache
memory/entries and define eviction; test hot-key churn and abandoned keys. A WeakMap
helps only when object-key lifetime matches the desired lifetime and no other owner
keeps those keys alive.

Track raw payloads, transformed projections, and backing buffers separately. A small
view/slice can retain a large backing store. Canvas, image, worker, and GPU allocations
may not appear in JavaScript heap totals; compare process/device memory and resource
counts when the symptom exceeds the JS heap.

Verify cleanup by repeating the original cycle after the fix. Report retained size,
object/resource counts, number of cycles, and the final plateau or remaining growth.
