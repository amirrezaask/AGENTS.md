# Discover actor workflows

A workflow explains how a human or another actor achieves a goal through the
system. Actors include schedulers, event producers, external services and
operators. Use area documents for standing rules and ownership. A workflow
references those rules and describes the sequence and visible outcomes.

## Select flows from real triggers

> List the actors and the goals or events that begin work. Find the registered
> entry point for each. Which flows cross areas or carry state through time?
> Which actor actions look similar but take different paths? Which scheduled,
> administrative or asynchronous flows change the same entities? Which failures
> require an actor or operator to finish recovery?

Group variants when their steps are shared and explain their differences. Split
flows when they have distinct triggers, goals, completion conditions or recovery
ownership. Do not create a workflow file for every helper function or every HTTP
request. A library call or CLI command can be a workflow when it initiates a
meaningful operation; no browser or human actor is required.

Choose initial traces for breadth across responsibilities and risk: a primary
success path, a rejected/failed path and an asynchronous or recovery path where
present. Then return to the surface inventory to account for untraced goals.
Those initial examples are not a fixed limit on documented workflows.

## Follow the actual sequence

> Starting from this trigger, what runs next, and how do I know? Trace parsing,
> identity, authorization, decisions, state changes and external effects through
> the observable result. For each step, identify the responsible area, data read
> or written, called interface and evidence. What is acknowledged to the actor,
> and does acknowledgement mean accepted, persisted, dispatched or complete?

Build a working timeline:

| Step | Actor/area | Input or state | Action / boundary | Durable effect | Observed result | Source |
| --- | --- | --- | --- | --- | --- | --- |

Trace middleware order, dependency injection, plugin registration and runtime
configuration where they choose the path. Do not substitute the most similarly
named implementation for the registered handler. Treat unresolved dynamic edges
as unknown until wiring or runtime evidence identifies the target.

At a queue or callback, continue from the consumer registration. Inspect the
payload, correlation key, acknowledgement policy and continuation state. Follow
projections and notifications when they change what an actor observes. Identify
where local atomic transactions begin and end; a local commit does not make the
whole cross-service workflow atomic.

## Explore branches and failures

At each consequential step, ask:

> What happens if input is invalid, the actor lacks permission, state has changed,
> the same request repeats, or the dependency fails? What persists if execution
> stops immediately before or after the effect? What if a message arrives late,
> twice or out of order? How is completion detected? Can the actor retry safely?

Investigate relevant cases rather than adding generic recovery promises:

- **Rejection before effects:** validation, permissions, policy and state guards.
- **Partial completion:** external success followed by local failure, local
  commit followed by publish failure, and timeout after an unknown remote result.
- **Retries/concurrency:** key scope, deduplication persistence, retry owner,
  backoff, expiry, races and ordering assumptions.
- **Recovery:** compensation, reconciliation, replay, dead-letter handling or
  operator action. Trace its trigger, authority, safe action and completion proof.
- **Actor experience:** pending state, response/error, notification timing and
  visibility across clients or projections.

Use this failure table during investigation and in the document where useful:

| Failure point | Remaining state/effect | Detection | Retry/repair owner and action | Actor-visible outcome | Evidence/gap |
| --- | --- | --- | --- | --- | --- |

If no repair path exists in the inspected scope, say so with that scope limit.
Do not invent a compensating job. If a vendor is outside the repository, describe
the caller's expectations and the provider behavior still needing verification.

## Challenge the trace

> Can I produce the stated result from the real entry point with these
> preconditions? Does the test exercise the registered path or a mocked helper?
> Does another configuration, actor or worker bypass a step? Do the stated
> terminal states match the actual writes and acknowledgements? What evidence
> could disprove the claimed ordering, atomicity or recovery?

Use an existing local test or narrow check when it resolves a material uncertainty
within the authorized scope. Source inspection can establish an intended call
sequence, but label it source-supported until executed. Keep runtime outcomes
qualified by scenario, revision and environment.

## Write the workflow

Use the [workflow template](../templates/WORKFLOW_TEMPLATE.md). Include actor,
goal, trigger, preconditions, participating areas, ordered steps, branches and
completion conditions. Reference area rule anchors instead of redefining them.
Include relevant state transitions and recovery, with evidence and unknowns.

Use a sequence or state diagram when it clarifies the interaction; maintain the
same component names and ordering as the text. Never invent participants to make
the diagram look complete. An interrupted, rejected or pending operation has a
different outcome from a completed one. Explain each material outcome.
