---
name: rust-gpu-performance
description: Use when implementing, profiling, or optimizing Rust applications with GPU-rendered UIs, wgpu/WebGPU/Vulkan/Metal backends, WGSL/shaders, render loops, frame-time issues, input latency, allocation pressure, or shader-heavy desktop apps. For web frontend performance use frontend-performance; for language-agnostic perf doctrine use perfguy.
metadata:
  category: performance
  version: "1.1.0"
  last_researched: "2026-08-22"
---

# Rust + GPU Performance

Scope: Rust apps whose performance crosses the CPU/GPU boundary — wgpu/WebGPU/Vulkan/Metal, WGSL, render loops, editors/immediate-mode UIs, compute shaders, visual tools, input latency, frame time, GPU memory.

Posture: measure the real bottleneck; make the smallest change that moves one counter; validate correctness and p50/p95/p99 after it. Never cargo-cult unsafe code, SIMD, shader rewrites, pipeline tricks, or flags. `last_researched` is historical — re-check current Rust/wgpu/driver behavior before version-specific work; wgpu breaks API every major (current major as of 2026-07: wgpu 30).

## First-response checklist

Establish or infer:

- target OS/backend/GPU and resolution;
- refresh rate → frame budget: 60 Hz = 16.67 ms, 120 Hz = 8.33 ms, 144 Hz = 6.94 ms;
- workload type: editor, UI, game-like renderer, compute, visualizer;
- symptom: CPU/GPU time, stutter, shader jank, upload stall, input latency, memory growth, battery/thermal pressure, WASM overhead;
- available profile/capture — if absent, add instrumentation first.

## Measurement contract

Separately measure CPU update/layout/encode time, GPU pass time, upload time, present/wait time, allocations, draw calls, pipeline/bind changes, buffer writes, texture uploads. Benchmark release builds on representative workloads; record p50/p95/p99 plus hardware, backend, resolution, vsync, driver/OS, flags, commit. Tool specifics live in the references below.

## Frame contract

```text
poll input → update state → build compact render list → upload changed data
→ encode GPU commands → submit → present
```

- Never block the render thread on I/O, parsing, indexing, LSP, shader work, or GPU readback.
- Static resources persistent; dynamic data ring-buffered; idle editors redraw on demand.
- Frames in flight and present mode are input-latency decisions, not just throughput settings.

## Focused references

- [CPU and frame architecture](references/cpu-and-frame.md) — profiling config, allocations, data layout, concurrency, frame stats, present latency.
- [wgpu and shaders](references/wgpu-and-shaders.md) — resource lifetime, pipelines/bind groups, uploads, encoding, shader cost, overdraw, tile GPUs.
- [Text UI and snippets](references/text-ui-and-snippets.md) — text/editor rendering, immediate-mode UI, anti-patterns, review checklist, tracing snippets, counters.

## Optimization sequence

1. Reproduce with a fixed realistic workload.
2. Instrument CPU sections, GPU passes, allocations, draw/bind/upload counts, present stalls.
3. Classify bottleneck: CPU loop, allocation, fragment cost, upload bandwidth, pipeline jank, synchronization, pass/draw count, text layout, vsync/present.
4. Patch the smallest mechanism that should move one measured counter.
5. Re-run release benchmarks + correctness tests; keep or revert on evidence.
6. Record the before/after result and remaining assumptions.

## Review gate

Approve only against the [review checklist](references/text-ui-and-snippets.md#review-checklist).
