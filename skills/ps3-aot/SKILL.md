---
name: ps3-aot
description: Apply Koloop/GameBox's compilation and benchmark requirements when implementing or optimizing its PS3 PPU/SPU runtime.
---

# PS3 AOT

Use AOT for guest PPU and SPU execution, including runtime-loaded overlays and
FMOD DSP plugins. Game builds must crash immediately on missing coverage. Fix extraction,
relocation, discovery, and compiled dispatch rather than falling back to JIT,
interpretation, or skipped audio/DSP. Allow interpretation only in explicitly
compiled, bounded diagnostic or differential-test binaries.

Fix the shared PS3 pipeline, code generator, and runtime; use games as measured
workloads. When optimizing generated output, benchmark emitted AOT PPU/SPU code
and verify correctness and real-game performance. Helper microbenchmarks alone
do not establish an improvement to generated programs.

For MW3 performance work, use verified 30 FPS gameplay as the first gate and
pursue 60 FPS. Reaching gameplay at single-digit FPS does not satisfy that goal.
