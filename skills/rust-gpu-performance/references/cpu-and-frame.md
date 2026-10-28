# CPU And Frame

> Load when profiling Rust CPU work, allocations, data layout, concurrency, frame budgets, or presentation latency.

## Profile configuration

Investigate with a profiling-friendly release profile:

```toml
[profile.release]
debug = "line-tables-only"
```

For final benchmarks, test a small matrix instead of assuming one config wins:

```toml
[profile.release]
opt-level = 3          # Also test 2; sometimes 3 is faster.
lto = "thin"           # Also test true/off; weigh binary size and build time.
codegen-units = 1      # Better optimization potential, slower builds.
panic = "abort"        # Only if unwinding is not needed.
incremental = false
strip = "debuginfo"    # Keep symbols if you need crash symbolication.
```

PGO for stable, hot, production-like workloads:

```bash
rm -rf /tmp/myapp-pgo
RUSTFLAGS="-Cprofile-generate=/tmp/myapp-pgo" cargo build --release
./target/release/myapp --run-realistic-workload
llvm-profdata merge -o /tmp/myapp-pgo/merged.profdata /tmp/myapp-pgo
RUSTFLAGS="-Cprofile-use=/tmp/myapp-pgo/merged.profdata -Cllvm-args=-pgo-warn-missing-function" \
  cargo build --release
```

- PGO helps only if the profiling workload matches real use; rebuild profiles when behavior changes.
- `-C target-cpu=native` unlocks wider SIMD but produces illegal-instruction crashes on older CPUs. Local benchmarking only; for distributed builds pick an explicit baseline (`x86-64-v2`/`v3`) or runtime feature detection. Always record the setting in benchmark notes — it changes results.

## Allocation discipline

Per-frame / hot-path code:

- No per-frame `Vec`, `String`, `Box`, `Arc`, `HashMap`, closures, formatted strings, or heap-backed iterators unless measured harmless.
- Preallocate realistic capacity (`Vec::with_capacity`, `String::with_capacity`); reuse buffers via `clear()` (keeps capacity).
- Short-lived data: `SmallVec`, `ArrayVec`, fixed arrays, arenas, bump allocators, slab pools.
- Avoid `clone()` on large structures; prefer handles/indices; `Arc` only for true sharing.
- Keep per-frame logging off or cheap — string formatting can dominate hot UI loops.
- `Cow<'a, str>` is not magic if it still allocates on the common path.

## Data layout

- Hot iteration wants compact, contiguous data.
- SoA (`positions[]`, `colors[]`, `uvs[]`) over AoS when iterating one/few fields or uploading to GPU.
- Split cold fields out of hot structs; avoid pointer-heavy graphs in render/layout loops.
- Stable integer handles / generational indices over `Arc<Mutex<T>>` object webs.
- `#[repr(C)]` only for FFI/GPU layout needs, not as a generic perf trick; align GPU-facing structs deliberately and validate WGSL/std140-style layout with tests.

## Bounds checks and unsafe

- Prefer iterators, `chunks_exact`, `as_chunks` (stable since Rust 1.88), `zip`, slices over manual indexing.
- Add range assertions before loops when the compiler can't prove bounds; index pre-sliced ranges rather than full `Vec`s.
- `get_unchecked` is a last resort: after profiling, with tests, fuzzing, and a comment stating the invariant.

## Concurrency

- Never block the render thread on I/O, shader compilation, asset loading, text indexing, LSP work, filesystem scans, or GPU readback.
- Feed render input from double/triple-buffered producer-consumer data.
- Keep locks out of hot render paths: channels, lock-free snapshots, immutable frame packets, RCU-style swaps.
- Batch cross-thread messages; thousands of tiny messages per frame can be worse than one small lock.

## Frame architecture

Keep an explicit frame pipeline: poll input → update state → build compact scene/list → upload changed data → encode → submit once (or few) → present.

Track a frame stats struct:

```rust
pub struct FrameStats {
    pub cpu_update_us: u64,
    pub cpu_layout_us: u64,
    pub cpu_encode_us: u64,
    pub gpu_main_us: Option<u64>,
    pub gpu_ui_us: Option<u64>,
    pub bytes_uploaded: u64,
    pub draw_calls: u32,
    pub pipeline_binds: u32,
    pub bind_group_binds: u32,
    pub allocations: u32,
}
```

Per-frame churn to forbid (create/destroy pipelines, bind group layouts, large buffers/textures, samplers; re-upload static assets; rebuild atlases; re-shape all text) is itemized in [wgpu and shaders](wgpu-and-shaders.md) and [Text UI](text-ui-and-snippets.md).

## Present mode, frames in flight, input latency

Input latency is a whole-pipeline product: a 5 ms frame queued 3 deep feels worse than a 10 ms frame queued 1 deep. Frame time alone hides queueing.

| Choice | Guidance |
|---|---|
| `PresentMode::Fifo` | vsync; universal support; adds up to a frame of latency |
| `Mailbox` | low latency without tearing where supported |
| `Immediate` / `FifoRelaxed` | lowest latency; may tear; availability varies by backend |
| Editors/UI tools | Fifo or Mailbox — measure both |

- Keep frames in flight small for interactive tools: wgpu `desired_maximum_frame_latency` typically 1–2. Deep queues smooth throughput but add whole frames of lag.
- Sample input as late as possible before building the frame; do not process input at the start of a long CPU frame and present two vsyncs later.
- Idle-heavy apps (editors): redraw on demand (input/dirty state) instead of a free-running loop — cuts battery/thermals and often improves latency by removing queued frames.
- Measure latency end-to-end when it matters: timestamp input event → present, or photodiode/high-speed camera for hardware truth.
- Present/acquire stalls in traces (CPU blocked in `get_current_texture`) mean swapchain/vsync is the constraint — optimizing shader time won't help.
