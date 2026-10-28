# Patterns And Output

> Load when applying transformation patterns, identifying red flags, or formatting performance advice and plans.

## Transformation patterns

- **Compact then process**: `all_items -> filter indices/handles -> dense worklist -> process`
- **Sort/group then dispatch**: `commands -> sort by type/resource/key -> process homogeneous runs`
- **Index once, query many**: `records -> sorted/indexed auxiliary table -> fast lookups/scans`
- **Append log, consume batch**: `many producers -> append events -> one batch consumer -> compact outputs`
- **Dirty set**: `mutations mark dirty -> process only dirty -> clear dirty`
- **Hot/cold path split**: `fast common case inline -> rare case side table / slow function`
- **State buckets**: `state-flagged items -> pending[] running[] done[] failed[]`
- **Offline/precompute**: `expensive repeated runtime work -> build/startup/index/cache artifact`

## Red flags in code

Prompts to investigate, not automatic sins:

- Per-item map lookup / DB query / allocate / format / log / parse inside loops.
- Per-item virtual method call; lock/unlock per item; draw call per pixel/glyph/entity.
- `clone()`/`copy()` of large data in hot paths; JSON/protobuf/regex/string parsing in inner loops.
- Linked lists on hot paths; per-frame rebuilding of static data.
- Many tiny jobs where scheduling cost dominates.
- Objects containing everything "just in case"; APIs materializing whole objects when the caller needs one field.
- Abstract interfaces hiding allocation, IO, locks, or dispatch.
- Boolean-heavy structs that are really state tags; strings as repeated hot keys when IDs would do.
- Re-reading loop-invariant member fields/getter calls inside loops.
- Retained genericity in a hot path by pretending valid constraints are unknown.

## Response style

Be direct and concrete; actionable changes over vague advice. State assumptions. Separate measured facts from hypotheses. Smallest safe fix first, then deeper data-oriented redesigns. Include verification steps. Don't shame readability — distinguish hot from cold code. Don't force DOD everywhere; justify via quantity/frequency/access pattern. Never say "the compiler will probably fix it" unless you can explain why the compiler has enough information.

## Optimization-advice template

```text
1. What is likely expensive
2. Why the machine cares
3. Minimal fix
4. Data-oriented redesign
5. AoS/SoA/AoSoA recommendation
6. Benchmark/profiling plan
7. Expected risks
```

## Code-review template

```text
Performance review
Hot-path guess: ...
Main issues: ...
Recommended changes: ...
Data layout:
  Current: AoS / SoA / AoSoA / mixed / unclear
  Better: ...
  Reason: ...
Measurement plan: ...
```

## Implementation-plan template

```text
Goal: ...
Constraints: ...

Data model
  Hot data / cold data:
  IDs/handles:
  State buckets:
  Indexes:
  Sparse side tables:

Transforms
  Input -> output:
  Batch boundaries:
  Dirty/changed data:
  Offline/precomputed work:

Performance budgets: ...

Implementation phases
1. Instrument baseline
2. Simplify data path
3. Fix algorithmic waste
4. Fix allocation/lifetime
5. Fix layout/locality
6. Add batching/SIMD/parallelism only if still needed
7. Confirm with benchmarks

Verification
  Correctness tests / benchmarks / profiles / regression guard:
```

## Sources

Distilled from Casey Muratori ([Computer Enhance TOC](https://www.computerenhance.com/p/table-of-contents), [Waste](https://www.computerenhance.com/p/waste), [Caching](https://www.computerenhance.com/p/caching), ["Clean" Code, Horrible Performance](https://www.computerenhance.com/p/clean-code-horrible-performance), [Semantic Compression](https://caseymuratori.com/blog_0015), [Complexity and Granularity](https://caseymuratori.com/blog_0016)); Richard Fabian ([Data-Oriented Design](https://www.dataorienteddesign.com/dodbook/), [Optimisations and Implementations](https://www.dataorienteddesign.com/dodbook/node9.html)); Andrew Kelley ([A Practical Guide to Applying DOD](https://vimeo.com/649009599), [transcript mirror](https://www.josherich.me/podcast/andrew-kelley-practical-data-oriented-design-dod), [andrewkelley.me](https://andrewkelley.me/)); Mike Acton ([DOD and C++ keynote](https://cppcon.org/third-keynote-2014/), [slides PDF](https://neil3d.github.io/assets/img/ecs/DOD-Cpp.pdf)); Homann & Laenen ([SoAx paper](https://arxiv.org/abs/1710.03462)).
