# Text Ui And Snippets

> Load when optimizing text-heavy GPU UIs, reviewing anti-patterns, or using the profiling snippets.

## Text pipeline

Split into stages: document model → line layout → shaping → glyph cache → draw instances.

- Cache shaping by font, size, text run, script, style, OpenType features; re-shape only dirty lines/ranges. Scrolling must not reshape.
- Glyph atlas pages; upload only new/dirty glyphs; keep eviction rare and observable via counters.
- Draw text as instanced quads / batched vertices grouped by atlas page and pipeline.
- Store glyph instances in a reusable CPU buffer; upload one contiguous chunk per layer/pass.

## Editor surface

- Cull lines outside viewport + small overscan.
- Cursor, selection, diagnostics, minimap, line/search highlights = separate batched layers.
- Animate transforms/colors on compact instance data — never rebuild layout for visual-only animation. For cursor/selection animation store previous/current positions and interpolate at render time.
- Per-pane scissor rectangles; scroll animation independent of document layout (scrolling changes transform/viewport).
- No per-glyph/per-cell draw calls: thousands of glyphs should be a handful of draws per atlas/layer.

## Immediate-mode UI patterns

- Generate draw lists into reusable arenas; batch widgets by texture/atlas/pipeline/clip.
- No per-frame allocation of widget IDs, labels, paths, layout nodes, style structs. The API is immediate; internal storage stays cached, pooled, stable.
- Separate hit-testing data from render data; the GPU renderer must not depend on complex widget objects.

## Anti-patterns

Flag immediately in review:

- optimizing on intuition with no profile; benchmarking debug builds;
- creating pipelines/shader modules/bind groups during interaction or per object per frame;
- map/unmap in the render loop when `write_buffer`/staging/ring buffers work;
- CPU waiting on GPU readback in a frame;
- one draw call per glyph/sprite/widget/rectangle;
- rebuilding all text layout/glyph instances for scrolling; uploading full buffers/textures when a range changed;
- excessive tiny compute dispatches; pass splits that add bandwidth; unbounded shader permutations;
- logging/formatting/cloning/hashing/heap allocation in hot loops; `Arc<Mutex<...>>` in render/layout paths;
- unsafe optimizations without tests and a measured win.

## Review checklist

Before approving a Rust GPU performance change, verify:

- [ ] Release-mode benchmark exists; CPU and GPU timings separated.
- [ ] Per-frame allocations known and acceptable.
- [ ] Pipelines/layouts/bind groups/resources not created in hot paths unless justified.
- [ ] Static GPU data not re-uploaded every frame; dynamic data uses ring/staging strategy.
- [ ] Draws batched by pipeline/bind group/texture/clip where practical.
- [ ] Text shaping and atlas updates incremental.
- [ ] Shader changes validated on target backends/hardware; WASM vs native considered separately when relevant.
- [ ] Unsafe code has safety comment, tests, measured benefit.

## Snippets

### Conditional Tracy integration

`tracing-tracy` 0.11.x pairs with Tracy client 0.11.x — check the version table before bumping either side. Enable only behind a feature flag: Tracy broadcasts discovery packets to the local network and exposes collected traces there.

```toml
[features]
tracy = ["tracing-tracy/enable"]

[dependencies]
tracing = "0.1"
tracing-subscriber = "0.3"
tracing-tracy = { version = "0.11", optional = true, default-features = false }
```

```rust
#[cfg(feature = "tracy")]
pub fn init_profiler() {
    use tracing_subscriber::layer::SubscriberExt;
    tracing::subscriber::set_global_default(
        tracing_subscriber::registry().with(tracing_tracy::TracyLayer::default()),
    ).expect("setup tracy layer");
}
```

### Frame timing zones

```rust
let _frame = tracing::info_span!("frame").entered();
{
    let _s = tracing::info_span!("update_state").entered();      // input/app/editor state
}
{
    let _s = tracing::info_span!("build_render_list").entered(); // compact render packets
}
{
    let _s = tracing::info_span!("encode_gpu").entered();        // wgpu command encoding
}
```

### Renderer counters worth exposing

```text
frame_ms cpu_ms gpu_ms present_wait_ms
alloc_count alloc_bytes
bytes_uploaded buffer_write_count texture_upload_count
render_pass_count compute_pass_count draw_call_count dispatch_count
pipeline_bind_count bind_group_bind_count
glyphs_drawn glyph_atlas_uploads shaped_lines dirty_lines
```

## Sources

- Rust Performance Book: https://nnethercote.github.io/perf-book/ (profiling, heap allocations, bounds checks)
- Cargo profiles: https://doc.rust-lang.org/cargo/reference/profiles.html · rustc PGO: https://doc.rust-lang.org/beta/rustc/profile-guided-optimization.html
- wgpu API (Buffer mapping, QueryType/timestamps, PipelineCache, Features): https://docs.rs/wgpu/latest/wgpu/
- WebGPU best practices (async pipelines, explicit layouts, bind-group reuse): https://www.khronos.org/developers/linkto/webgpu-best-practices · https://toji.dev/webgpu-best-practices/bind-groups.html
- NVIDIA Vulkan Dos and Don'ts (pipeline cache, binds, push constants, dynamic buffers, memory suballocation): https://developer.nvidia.com/blog/vulkan-dos-donts/
- Vulkan tile-based rendering best practices: https://docs.vulkan.org/guide/latest/tile_based_rendering_best_practices.html
- Apple Metal Best Practices Guide (archived; storage modes, texture usage, command buffers): https://developer.apple.com/library/archive/documentation/3DDrawing/Conceptual/MTLBestPracticesGuide/ResourceOptions.html
- Tracy + Rust clients: https://github.com/wolfpld/tracy · https://github.com/nagisa/rust_tracy_client (version-compatibility table in README)
