# Text and terminal surfaces

Separate document/grid → line layout → shaping → glyph atlas → draw instances.
Scrolling changes viewport/transform; it should not reshape unchanged lines. A shaping
cache key needs font/fallback, size, text, script, direction, features, style, and other
inputs used by the shaper. Invalidate dirty ranges, including neighboring context where
shaping or line breaking depends on it.

Keep glyph rasterization and atlas uploads incremental. Track misses, uploads,
evictions, and pages; bounded atlas policy must preserve references from in-flight
frames. Reuse CPU instance storage and batch by compatible atlas/pipeline/clip while
preserving visual order.

Cull outside the viewport with enough overscan for movement. Keep cursor, selection,
diagnostics, and decorations in layers that can update without rebuilding document
layout. Hit testing and accessibility still need correct document-to-screen mapping
when the renderer skips offscreen detail.

For terminal damage, track changed rows/ranges where sparse updates dominate. Full
redraw may win for large bursts; measure the crossover. Retain scrollback separately
from visible glyph instances and bound or persist history according to product needs.

Immediate-mode APIs can reuse internal IDs, arenas, and layout buffers. Profile actual
per-frame churn before adding pools. A draw per glyph/widget or repeated full-atlas
upload is a candidate for batching; confirm draw/encoding cost is the bottleneck.

Verify edits, selection, resize/reflow, bidi/fallback text, zoom/DPI changes, scrolling,
and atlas eviction. Compare shaped lines, dirty regions, bytes uploaded, draw count,
CPU/GPU frame time, and input/output-to-paint latency. Keep correctness checks tied to
the data/layout mechanism changed rather than an arbitrary FPS target.
