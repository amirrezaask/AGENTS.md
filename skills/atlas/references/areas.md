# Discover an area's ground rules

Use the area map and surface inventory from [discovery](discovery.md). Start with
the area boundary and its actual registrations, then inspect public operations,
state writers, policy enforcement and relevant tests. Use the following prompts
to drive source investigation. Skip inapplicable dimensions with a reason.

## Responsibility and language

> What capability does this area own? Which actors use it directly or through
> another area? What business nouns, actions and states appear in its public
> interfaces and rules? Find aliases and overloaded names. Does “customer” mean
> the same thing here as in billing? Where does the area translate vendor or
> legacy vocabulary? What is inside this area's responsibility and what is
> explicitly owned elsewhere?

Recover vocabulary from accepted docs and actual usage. Group concepts by
business meaning. Preserve intentional translation boundaries; do not rename
the source or impose one global meaning on distinct domain concepts. Record
uncertain terms as unresolved rather than inventing rationale. Shared terms
belong in `domain.md`; detailed area policy belongs here.

## State authority and lifecycle

> For each important fact, who can create, read, modify and delete it? Find every
> writer, including workers, administration, imports, migrations and repair jobs.
> Which store is authoritative, and which stores are projections or caches? What
> identifiers and relationships survive across boundaries? What states exist,
> which transitions are legal, and where are those transitions checked? How do
> retention, deletion, expiry and restoration work?

Read runtime wiring and current schema plus relevant migrations; migration
history alone does not prove the deployed schema. Check constraints, transaction
boundaries and writer paths. A TypeScript type does not enforce a runtime or
database invariant. A field called `status` does not prove a state machine.
Document multiple authoritative writers if that is what the code supports.

Keep a working entity table with identity, authority, writers, relationships,
invariants and evidence. Publish the cross-area model in `data-model.md`; link
area-specific invariants rather than maintaining two independent formulations.

## Extract behavior into rules

> For each operation, which preconditions, permissions, limits, validations and
> state conditions change its result? Follow the successful path and each
> consequential early return or failure. What remains true before and after the
> operation? Which behavior depends on actor role, tenant, flag, configuration,
> time, locale, currency or data version? Where can another path bypass the rule?

For each candidate rule:

1. Locate the enforcing branch/constraint and trace a reachable caller to it.
2. Identify the protected subject, action, condition and observable outcome.
3. Check alternate entry points and competing implementations of the policy.
4. Read supporting tests and their setup/mocks; distinguish assertions from
   executed results. Record the scope actually exercised if running a check.
5. Look for a counterexample. Qualify the rule if it applies only to one path.
6. Classify the statement's evidence and authority before writing it.

Use a condition/action/outcome or EARS-style sentence where helpful. Give accepted
rules stable IDs with explicit Markdown anchors, such as `INV-003`. Observed
baseline rules can use stable IDs too, but keep their observed status visible.
Preserve existing IDs during updates and qualify references by document.

Examples of responsible translation:

| Code evidence | Supported statement | Still needs investigation |
| --- | --- | --- |
| Role check in one HTTP handler | This handler rejects callers without that role | Other handlers, service calls, tenant/object ownership |
| Cache write with expiry | This path caches this result for the configured interval | Invalidation, stale reads, other paths, accepted freshness target |
| Error notification call | This branch attempts a notification | Delivery, retries, what the user observes, accepted requirement |
| Unique key plus conflict handler | This write rejects a duplicate key | Key scope, retention, other side effects before the write |

Do not promote an incidental implementation mechanism into a required design.
Do not label a defect as intended behavior. A conflict with an accepted rule stays
visible as a contradiction and needs repair or authorized requirement amendment.

## Contracts inside the area

> What can a caller rely on at each public boundary? Identify the input and output
> meaning, permission checks, state effects, error conditions and compatibility
> limits. Which boundary owns each event, file format or operation? What must the
> caller do before or after invoking it? What happens on duplicate or invalid input?

Include interfaces that the area actually exposes: HTTP, events, CLI, filesystem,
library exports or UI interaction where it forms a meaningful behavioral contract.
Link authoritative OpenAPI/protocol/schema/type definitions. Add semantics that
shapes omit: ordering, units, null versus absent, authorization scope, versioning,
retryability and idempotency conditions. A private helper signature seldom needs
to be reproduced in a specification.

For an incoming event, trace registration to handler and acknowledgement. For an
outgoing event, trace the writer and publish ordering. Establish delivery claims
from publisher, transport configuration and consumer handling together; do not
infer exactly-once behavior from a queue or deduplication function name.

## Failures and concurrent behavior

> Which operations can interleave or repeat? What prevents a stale update, double
> debit, oversell or lost write? Where can local state commit before an external
> effect fails? Who retries or repairs that outcome? What does the actor see
> while work is incomplete? Is the claimed protection enforced across processes?

Inspect locks, optimistic versions, uniqueness constraints, transaction scopes,
idempotency keys and expiry. A process-local mutex does not prove distributed
exclusion. Error handling is not proof of rollback. Follow ownership of recovery
into a [workflow trace](workflows.md) when it crosses areas.

## Area exit check

Account for inbound interfaces, known writers, state transitions, authority,
rules, contracts, variants and outstanding contradictions. Tie important rules
to supporting source and counterexample searches. State which paths were traced
and checked and which remain unverified. Link relevant workflows, root concepts
and task decisions. An area description should let a new reader predict both an
allowed action and a rejected or partial outcome without reading implementation.
