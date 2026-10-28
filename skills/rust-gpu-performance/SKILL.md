---
name: rust-gpu-performance
description: Profile and optimize Rust GPU rendering when frame time, stutter, input latency, uploads, or shader cost is the problem. Use for performance work on wgpu or native GPU UIs, rather than ordinary Rust or Electron implementation.
metadata:
  category: performance
---

# Rust GPU performance

Record target GPU/backend, driver/OS, resolution, refresh rate, present mode, build,
and workload. Separate CPU update/layout/encode, GPU passes, upload, acquire/present
wait, and queueing. CPU wall time around submission does not measure GPU execution.

Reproduce in release mode with profiling symbols. Compare frame distributions and
input-to-present behavior as appropriate; average FPS can hide stutter and deep frame
queues. Match before/after conditions and retain correctness/visual evidence.

Read only the relevant reference:

- [Frame and resource path](references/frame-and-resources.md): stalls, allocations,
  uploads, pipelines/bind groups, frames in flight, shader/pass cost.
- [Text surfaces](references/text-surfaces.md): editor/terminal shaping, glyph atlases,
  damage, viewport culling, and incremental layout.

Choose a change tied to one measured counter. Preserve draw/blend order, buffer
ownership, numerical precision, and resource lifetime. Validate the affected backends;
capability and API availability depend on the project's wgpu version and adapter.
Check installed documentation before prescribing version-specific methods or flags.

Report workload, CPU/GPU/wait breakdown, before/after distributions, allocation/upload/
draw counts relevant to the fix, visual/correctness checks, and remaining hardware
coverage. Avoid unsafe code or lower shader precision without a measured benefit and
an explicit invariant or error tolerance.
