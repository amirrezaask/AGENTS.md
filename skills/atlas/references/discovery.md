# Discover a large codebase

## Establish the investigation boundary

Start with the user's request, repository instructions, existing specifications,
workspace manifests and execution scripts. Record the revision and uncommitted
changes that affect the analysis. Identify the product or subsystem being
documented, supported variants, relevant environments and external dependencies.
An imported package, a workspace folder and a deployable service are different
boundaries; inspect their wiring before treating them as equivalent.

Use this orientation prompt:

> What can this system do, for which actors, and where can execution begin?
> Find the executable wiring that supports the answer. Locate applications,
> libraries, servers, CLI commands, workers, subscriptions, schedulers, webhooks
> and operational tools. Find state stores and integration adapters. Identify
> configuration or flags that select a different path. Explain which parts of
> the repository are shipped, generated, historical, experimental or outside
> scope. Which existing documents contain accepted requirements? Which contain
> descriptive claims that still need checking?

Use `rg --files` to inventory and scoped `rg -n` searches to locate registrations,
exports, handlers, storage writers and tests. Read surrounding implementation
and callers after locating a symbol. Adapt queries to the stack; a filename or
search hit establishes a lead, not behavior. Follow generator inputs when code
is generated. Exclude vendor and build output from routine reading while retaining
schemas, migrations and fixtures that explain behavior. Inspect configuration
names and defaults without copying secret values.

## Make an inventory before deep reading

Build a working table. For a large repository, group related registrations rather
than listing every endpoint in the first overview; retain a route to the full list.

| Surface | Actor/trigger | Registration or wiring | State/effects | Candidate area | Coverage |
| --- | --- | --- | --- | --- | --- |
| Checkout request | Customer | revision + path/symbol | Reservation and payment | Ordering / inventory / payments | Located; trace pending |

Inventory public exports for a library, commands for a CLI, and processes and
messages for a service. Include admin, batch and support paths that can change
the same state as the main UI. Record excluded workspaces with a reason; do not
let an inaccessible service disappear from the map.

Track coverage as **located**, **traced**, **checked**, **unresolved**, or
**out of scope**, with a reason or next source. “Checked” states the actual check;
it does not imply runtime execution. Keep this working table in context or
gitignored scratch space. The durable scope/coverage summary belongs in
`docs/README.md`, rather than a parallel discovery log.

## Propose areas from responsibility

Use this decomposition prompt:

> Group the system into named responsibilities using its existing vocabulary.
> For each candidate area, state what decisions it owns, which facts it can
> change, which invariants it enforces, and how other areas invoke it. Cite
> implementation and wiring. Does the proposed boundary hold across frontend,
> server, worker and administration paths? Where do two areas write the same
> state or enforce competing versions of a rule? Does this area contain several
> unrelated responsibilities, or merely one operation split across many folders?

Inspect the boundary from several directions:

- **Calls and imports:** shared business helpers, cycles, public interfaces,
  cross-area private calls and dynamic dependency injection.
- **Runtime interactions:** requests, messages, callbacks, polling and retries.
- **Data authority:** authoritative writers, shared tables, derived projections,
  caches and consumers that bypass the expected owner.
- **Ordering:** transactions, deadlines and steps that require earlier work.
- **Deployment:** which processes are released and configured together.
- **Ownership/history:** explicit owners and related changes when available.
  Co-change suggests a boundary to investigate; it does not establish one.

Describe observed coupling, including awkward or leaking boundaries. Discovery
does not authorize redesigning the system. A documentation area can span several
packages; one deployable may contain several areas. Keep shared infrastructure
under architecture/operations unless it owns enough distinct behavior to merit
an area. Avoid an unexplained “common” area that absorbs business rules.

For each candidate, write one sentence of responsibility, its included/excluded
concepts, state owner(s), inbound/outbound interfaces and source locations. Split
when a reader cannot explain the area without several independent lifecycles or
ownership models. Merge when two names describe the same responsibility and
cannot be explained independently. These are documentation boundaries, not a
proposal to extract services.

## Challenge the map with one end-to-end flow

Choose a primary actor goal that crosses meaningful boundaries. Trace from its
real registration through decisions and state/effects to an observable result.
Follow a critical rejection or partial outcome too. Use
[workflow discovery](workflows.md), then revise the candidate area map if the
flow contradicts it. This first trace tests the map; it cannot establish coverage
of the entire repository.

## Expand in bounded passes

Investigate one coherent area at a time with [area discovery](areas.md), using
its inventory surfaces and dependencies as the reading frontier. Keep source
anchors and concise findings rather than carrying entire files between passes.
For each finding, preserve:

| Claim/rule | Evidence label | Revision + path/symbol | Conditions/variants | Uncertainty or contrary evidence |
| --- | --- | --- | --- | --- |

Expand when a call, writer, flag, registration or contradiction changes a claim.
Do not expand merely because another file exists. Discovery depth follows the
behavioral risk: state-changing and permission-sensitive paths warrant more
attention than presentation helpers.

Select further workflows from the inventory: distinct actor goals, alternate
entry points, important state transitions, asynchronous continuations and
recovery. Mark variants that share a traced path and inspect their differences.
Sampling helps orientation; a whole-system baseline still needs an accounting
of the remaining surfaces and the depth reached for each area.

After each pass, ask:

> What did this pass establish? Which boundary or guarantee remains uncertain?
> What source could disprove my current account? Which unread surface could
> change a documented rule? What should I inspect next, and what can remain
> outside the requested scope?

If context is constrained, preserve the current inventory/coverage, claim anchors,
unresolved edges and next targeted read in existing task state or scratch space.
On resume, recheck revision/diff and those anchors before continuing. With
authorized delegation, give an evaluator a bounded area, shared terminology,
source revision and expected evidence. Reconcile cross-area findings yourself;
separate reports are not an integrated specification. Never dispatch by default.

## Stop discovery honestly

Before synthesis, reconcile the original inventory against the area and workflow
map. Each in-scope entry point, major writer, external effect and runtime variant
must have a destination and coverage status. Inspect unassigned surfaces or
explain their deferral. An unresolved external implementation can have a documented
caller contract while its internal behavior remains unknown.

Conclude when further reading is unlikely to change the supported account within
the requested scope. Name incomplete areas and unverified guarantees. Ask ADMIN
when evidence cannot resolve intent, a naming conflict changes business meaning,
or accepted requirements conflict. Do not ask ADMIN to reconstruct facts that
source inspection can establish.
