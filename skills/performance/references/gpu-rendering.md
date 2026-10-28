# Frame and resource path

Use an explicit path: sample input → update/layout → compact draw list → upload changed
data → encode → submit → present. Trace it alongside GPU passes. GPU timestamp queries
need adapter support and the correct timestamp period; read results asynchronously.
Acquire/present waits may reflect vsync, queue depth, or surface pressure rather than
shader cost. Measure these before rewriting shaders.

Frames in flight trade throughput for latency. Query supported present modes and
measure on target hardware; a mode name alone does not establish input latency.
Idle-heavy editors can redraw on input/dirty state when animations and asynchronous
updates still receive needed frames. Late input sampling helps only if subsequent
CPU work and queued frames stay bounded.

Keep static buffers, textures, samplers, layouts, and pipelines persistent. Track
resource creation and first-use compilation stalls. Prebuild/warm known pipelines off
the interactive path using APIs actually available in the Rust backend; browser WebGPU
async methods are not automatically wgpu methods. Bound permutations and cache by all
pipeline-affecting state. Persistent caches need adapter/driver compatibility and a
fallback on unsupported backends.

Group bindings by update frequency and reuse compatible layouts/groups. For repeated
objects, compare dynamic offsets, indexed storage, and instancing against per-object
binding/encoding cost. Batching must preserve transparent/blend/clip ordering.

Choose uploads by measured write pattern: a few small queue writes, a reusable staging
arena for many writes, or ring/multi-buffered streaming for large updates. Include bytes
AND write count. Reuse slots only after the GPU is done with them; obey mapping/usage
rules. A mapped buffer is unavailable to GPU commands until unmapped. Keep readback
out of a blocking render-thread path.

Reuse CPU scratch buffers where allocations matter, but observe retained capacity.
Prefer compact contiguous fields for hot layout/encoding transforms. Validate Rust/GPU
struct size, alignment, stride, and offsets against the actual shader layout; repr(C)
alone does not prove WGSL compatibility. Avoid shared hot mutations; batch cross-thread
messages and expose ownership rather than replacing every lock with a queue.

Inspect shader cost using GPU evidence: overdraw, fragment work, divergent execution,
uncoalesced access, register/occupancy limits, and pass bandwidth. Move invariant work
only when interpolation/precision semantics remain correct. Lower precision, packing,
and lookup tables exchange ALU, bandwidth, and error; measure on the target adapter.

On tile GPUs, attachment load/store and pass splits can cause external-memory traffic.
Merge passes only when dependencies and attachment semantics permit it. Scissor/cull
invisible content; compare full versus partial updates at representative damage density.
Do not reorder transparent draws or replace discard with blending without checking the
visual/depth semantics.

Keep deployment CPU baseline and unwind/crash requirements when testing compiler flags.
Native-target or PGO builds need representative hardware/workloads and can change
portability. Preserve symbols needed for profiling and crash diagnosis.

## Measurement and acceptance

Record target GPU/backend, driver/OS, resolution, refresh rate, present mode, build,
and workload. Separate CPU update/layout/encode, GPU passes, upload, acquire/present
wait, and queueing. CPU wall time around submission does not measure GPU execution.

Reproduce in release mode with profiling symbols. Compare frame distributions and
input-to-present behavior as appropriate; average FPS can hide stutter and deep frame
queues. Match before/after conditions and retain correctness/visual evidence.

Choose a change tied to one measured counter. Preserve draw/blend order, buffer
ownership, numerical precision, and resource lifetime. Validate the affected backends;
capability and API availability depend on the project's wgpu version and adapter.
Check installed documentation before prescribing version-specific methods or flags.

Report CPU/GPU/wait breakdown, before/after distributions, allocation/upload/draw counts
relevant to the fix, visual/correctness checks, and remaining hardware coverage. Avoid
unsafe code or lower shader precision without a measured benefit and an explicit
invariant or error tolerance.
