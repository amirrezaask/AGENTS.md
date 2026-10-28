# Rendering and scheduling

Profile which update causes expensive work and which consumers actually need it.
A parent render can lead to child renders, but memoization, stable child elements,
and framework/compiler behavior affect which work executes; measure the actual tree.

Separate state by update frequency and consumer. Local input should not publish a
whole application snapshot per keystroke. Broad Context value changes notify consumers
regardless of the fields they use; split domains or use selector subscriptions when
that fan-out causes cost. A memoized provider object only helps while its dependencies
stay unchanged.

Selectors/snapshots must preserve identity when semantic data is unchanged. Allocating
an array on every read can defeat equality checks; mutating one snapshot in place can
hide a real update. Batch high-rate events before publishing, with an urgent flush
policy and lossless ordering for events that cannot be coalesced.

Choose expensive derivation placement from reuse and invalidation: boundary/index,
selector, or render-time memoization. Cheap derivation during render is fine; copying
it into effect-driven state adds an extra update and synchronization risk. Stable keys
must follow record identity through insert/reorder. Preserve deliberate reset behavior.

Memoize only a measured calculation or identity boundary. Account for the installed
React Compiler before adding/removing manual caches; neither compiler nor memoization
repairs broad subscriptions or an oversized DOM.

Transitions/deferred values can reduce urgency of expensive rendering. The transition
callback itself runs synchronously: wrapping an expensive search in it still blocks.
Chunk/yield or use a worker for that search, including cancellation/stale-result checks.
Measure serialization and result publication as part of worker cost.

Virtualize large lists when DOM/layout cost warrants it. Verify variable-height
measurement, overscan, focus, accessibility, selection, and scroll restoration. Hiding
heavy subtrees can retain effects/data; choose unmount/retention behavior deliberately
and check the installed framework API.

For layout thrash, find forced layout after style/DOM writes in a trace. Batch reads
before writes or use observers where they fit. Test containment/content-visibility for
scroll, find-in-page, sizing, and focus behavior. These change rendering semantics.

Prefer compositor-friendly animation where it gives the intended effect, but measure
layer count, paint, and raster cost. Transform/opacity do not guarantee free frames.
Avoid publishing framework state on every animation tick unless its measured work is
acceptable; keep semantic completion state synchronized.
