# Interaction latency budgets (keyboard-driven apps)

Preserved from the retired `poweruser-usability` skill (full text in git history);
now maintained as a perfguy reference. Paste into a project's AGENTS.md when
building editor/UI tools.

```txt
Typing/edit echo:            <16 ms ideal, <32 ms acceptable
Cursor movement:             <16 ms ideal
Palette open:                <50 ms
Palette filtering/keystroke: <30 ms
File/buffer switch (warm):   <100 ms
Command feedback:            immediate, even if work continues async
Frame drops during input:    treated as UX bugs
```

Rules:

- Never block typing on indexing, parsing, LSP, debug-info loading, or network work.
- Long operations need progress, cancellation, partial results; searches/listers stream results.
- Expensive visualizations are incremental and scoped to visible regions.
- Measure latency as part of feature definition, not after.
