# Book source map

This file maps the operational guidance in this skill to Richard Fabian's free online reduced edition of *Data-Oriented Design*.

The online edition notes that it omits some inessential chapters and that some generated formatting/listings may be imperfect. Use the book as the conceptual source; use this skill as the adaptation to our software stacks.

## Primary source

- Book index and contents: <https://www.dataorienteddesign.com/dodbook/>

## Chapter map

| Book chapter | Source | Guidance derived for this skill |
|---|---|---|
| Data-Oriented Design | <https://www.dataorienteddesign.com/dodbook/node2.html> | Treat programs as transformations over data; include quantity, frequency, shape, probability, and target machine; avoid forcing the problem-domain object model into the runtime representation; keep solutions concrete and replaceable; allow DOD to coexist with other paradigms. |
| Relational Databases | <https://www.dataorienteddesign.com/dodbook/node3.html> | Use tables/relations and normalization to reason about complex state, authoritative facts, operations, and stream-like processing—even for in-memory data. |
| Existential Processing | <https://www.dataorienteddesign.com/dodbook/node4.html> | Let existence or collection membership encode eligibility/state; avoid repeatedly asking every instance; reduce contradictory boolean/enum state; turn event handling into explicit processable data. |
| Component Based Objects | <https://www.dataorienteddesign.com/dodbook/node5.html> | Move from monolithic objects toward separate data/components and manager/system-driven processing by operation; do not assume a universal entity or per-instance update loop. |
| Hierarchical Level of Detail | <https://www.dataorienteddesign.com/dodbook/node6.html> | Retain full detail only where current importance justifies it; use summaries, mementos, reconstruction, and multiple importance axes. |
| Searching | <https://www.dataorienteddesign.com/dodbook/node7.html> | Design lookup around actual data/query patterns; use compact indexes and avoid repeated broad search when useful subsets can be preserved. |
| Sorting | <https://www.dataorienteddesign.com/dodbook/node8.html> | Ask whether ordering is required; maintain or sort compact representations only when the consuming transform needs it. |
| Optimisations | <https://www.dataorienteddesign.com/dodbook/node9.html> | Follow define/measure/analyze/implement/confirm; organize work as tables and transforms; consider necessity, lazy work, sets, joins, SIMD/SoA only when the workload supports them. |
| Helping the compiler | <https://www.dataorienteddesign.com/dodbook/node10.html> | Reduce unnecessary order and memory dependencies; be aware of aliasing, write behavior, cache-line utilization, false sharing, branch behavior, and vectorization in genuinely hot low-level paths. |
| Maintenance and reuse | <https://www.dataorienteddesign.com/dodbook/node11.html> | Make lifetimes/state visible, avoid fragile references, prefer explicit reusable transforms, test from data, and refactor by changing representations behind verified transformations. |
| What's wrong? | <https://www.dataorienteddesign.com/dodbook/node12.html> | Watch for internalized hidden state, instance-oriented development, rigid hierarchies, and generic abstractions that obscure actual dataflow and change pressure. |

## Local reference map

| Question | Local reference | Book basis |
|---|---|---|
| What does DOD mean here? | [Core principles](00-core-principles.md) | node2, node3, node4, node5 |
| How do I analyze a workload and transform graph? | [Workload and transform analysis](01-workload-and-transform-analysis.md) | node2, node3, node9 |
| How should facts, tables, and memory layouts be shaped? | [Data modeling and physical layout](02-data-modeling-and-physical-layout.md) | node3, node5, node9, node10 |
| How should sparse work, search, sort, joins, and detail tiers work? | [Active sets, queries, and LOD](03-active-sets-search-sorting-and-lod.md) | node4, node6, node7, node8, node9 |
| How should scheduling, ownership, and streams work? | [Ownership, concurrency, and streams](04-ownership-concurrency-and-streams.md) | node2, node3, node5, node10, node11 |
| How do we validate a performance change? | [Performance, testing, and observability](05-performance-testing-and-observability.md) | node9, node10, node11 |
| How do we refactor/review safely? | [Refactoring and review](06-refactoring-and-review.md) | node5, node11, node12 |

## Interpretation rules

- Treat examples tied to game engines and C++ as demonstrations of data/workload reasoning, not mandatory implementation recipes.
- Translate hardware-level guidance to the level where our measured bottleneck exists. For a Go service, the dominant issue may be database rows, allocations, serialization, or locks rather than SIMD. For React, it may be store invalidation, main-thread work, or retained history.
- Preserve the book's insistence on workload-specific design. Do not package its examples into a universal ECS or “DOD framework.”
- Use the target runtime's profiler and constraints. The same logical data may require different physical representations in SQL, Go memory, a WebSocket protocol, and a terminal renderer.
- When this skill adds queue contracts, distributed checkpoints, React invalidation domains, or PTY/rendering examples, those are reasoned adaptations of the book's principles to our software—not claims that the book directly specifies those technologies.
