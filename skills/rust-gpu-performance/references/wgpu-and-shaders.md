# Wgpu And Shaders

> Load when changing wgpu resources, pipelines, bind groups, uploads, command encoding, shaders, or render passes.

Version note: wgpu breaks API every major; current major is 30 (July 2026). Verify changelog before version-specific advice. Recent perf-relevant additions: `StagingBelt::finish_and_recall_on_submit` + `CommandEncoder::map_buffer_on_submit` (30), `Features::SHADER_I16` / `enable wgpu_int16;` on Vulkan/Metal/DX12 (30).

## Device and resource lifetime

- Create `Instance`, `Adapter`, `Device`, `Queue`, common samplers, pipeline layouts, bind group layouts, long-lived buffers once.
- Label buffers/textures/pipelines/bind groups — makes RenderDoc captures and validation errors usable.
- Keep validation enabled in development; disable expensive debug features only for final benchmarking.

Never do these per frame unless the object truly changes and measurement says it's fine:

- create/destroy pipelines, shader modules, bind group layouts, samplers;
- create/destroy large buffers/textures;
- re-upload static meshes/assets.

## Pipelines

- Prefer `create_render_pipeline_async` / `create_compute_pipeline_async` or background warm-up for pipelines not needed immediately. Synchronous creation can return before backend shader compilation finishes → first-use jank. Build known pipelines up front.
- Use explicit pipeline layouts in non-trivial apps so bind groups can be shared across pipelines.
- Cache pipelines by stable key: shader module, entry point, vertex layout, target formats, blend, depth, primitive state, multisample count, permutation flags.
- Keep shader permutation counts bounded; use specialization/pipeline constants where supported, never thousands of variants.
- Persistent pipeline caches: request `Features::PIPELINE_CACHE`, pass the cache via `RenderPipelineDescriptor::cache` / `ComputePipelineDescriptor::cache`, persist `PipelineCache::get_data()` keyed by `wgpu::util::pipeline_cache_key(adapter)`. Currently **Vulkan-only** (DX12/Metal unimplemented; safe no-op stub elsewhere — check `adapter.features()`, use `fallback: true`). Warm during startup/splash so first-launch jank happens once per install. Driver-side caches still help Metal/DX12 even without this API.

## Bind groups and layouts

Group resources by update frequency:

| Group | Contents |
|---|---|
| 0 | frame/global: camera, viewport, time, global texture arrays |
| 1 | pass/material: atlas, material textures, samplers |
| 2 | object/instance: dynamic offsets, storage-buffer indices, per-object values |

Rules:

- Reuse bind group layouts across compatible pipelines; reuse bind groups when resources don't change.
- No monolithic bind group that changes per object; no per-object bind group creation in the frame loop.
- Many objects: dynamic uniform/storage buffers or storage-buffer indexing.

## Buffer uploads

Choose the path intentionally:

```text
Is data static at creation?        -> mapped_at_creation / create_buffer_init
One/few small writes per frame?    -> queue.write_buffer
Many small writes per frame?       -> StagingBelt or custom staging/ring arena
Large streaming writes?            -> staging buffer + copy, ring-buffered
Need GPU -> CPU readback?          -> async map, never block render frame
```

- Ring-buffer or N-buffer per-frame mutable data, N = frames in flight; never write a buffer the GPU may still read.
- Dynamic offsets / indexed storage buffers for many small per-object values; keep static resources immutable and GPU-local.
- Mapping rule: a mapped buffer is CPU-accessible or GPU-usable, never both. Mapping a buffer used by recent GPU work forces waiting; design so the render thread never waits.
- Readback asynchronously and rarely; never block a frame on map/readback.

## Command encoding

- Submit the fewest command buffers/passes that don't starve the GPU; combine adjacent passes when attachments/dependencies allow.
- Avoid tiny compute dispatches/draws — dispatch overhead can dominate at small sizes.
- Sort/batch by pipeline, bind group, texture/atlas, blend/depth mode.
- Many similar objects → instancing and indirect-style batching.

## Shader cost

- Move invariant work out of the fragment shader: CPU, vertex shader, precomputed buffers/textures.
- Minimize fragment work; overdraw multiplies it.
- Avoid divergent branches within a wave/warp/subgroup and dynamic loops with unpredictable bounds in hot shaders.
- Coherent memory access: adjacent invocations read adjacent data.
- Lookup tables/textures only when they save more ALU/branch cost than the bandwidth they cost.
- Use lower precision (`f16` via `enable f16;`, mediump) where supported and visually correct — especially mobile/tile GPUs.
- `discard`/alpha-kill can disable early-Z; prefer blending, alpha-to-coverage, prepass, or geometry trimming.
- Minimal varyings — interpolate only what the fragment shader uses. Pack instance data, but only if unpacking doesn't cost more than it saves.

## Overdraw control

- Scissor rectangles for UI/editor panes; cull invisible objects and off-screen text lines before encoding draws.
- Depth/stencil where it genuinely reduces overdraw; batch and sort blend-enabled draws.
- Skip full-screen passes unless the visual benefit justifies bandwidth + shader cost; downscale intermediates for blur/bloom/shadow/post effects.

## Tile-based / mobile GPUs

Apple/Arm/mobile tile renderers:

- Deliberate load/store actions: clear/discard attachments whose previous contents aren't needed; keep intermediate data on-chip via transient/memoryless attachments.
- Avoid render-pass splits that force tile memory round-trips; reduce attachment count, MSAA cost, bandwidth.
- Consistent depth compare/write behavior preserves early-Z/hidden-surface removal.
- Move texture-coordinate math to the vertex shader when it helps prefetch/reuse; verify reduced precision visually and numerically on target devices.
