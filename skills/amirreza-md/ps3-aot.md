# PS3 compilation policy

For Koloop/GameBox PS3 work, always use AOT for guest PPU and SPU execution,
including runtime-loaded overlays and FMOD DSP plugins. Fix extraction,
relocation, discovery and compiled dispatch when coverage is missing. Do not
replace that work with a JIT, interpreter or skipped audio/DSP. Game builds must crash on missing
AOT coverage rather than interpret or JIT. Interpretation is allowed only in
explicitly compiled, bounded diagnostic and differential test binaries.

# Shared PS3 fixes and generated-code benchmarks

Work toward fixes in the general PS3 AOT pipeline, code generator and runtime,
rather than title-specific runtime shortcuts. Use games as measured workloads.
Benchmark the emitted AOT PPU/SPU code itself when optimizing output; helper
microbenchmarks alone do not establish an improvement to generated programs.
Keep correctness and real-game performance evidence alongside those benchmarks.

MW3 should reach 30 or 60 FPS. Use verified 30 FPS as the first performance gate
and pursue 60 FPS; reaching gameplay at single-digit FPS is not completion.
