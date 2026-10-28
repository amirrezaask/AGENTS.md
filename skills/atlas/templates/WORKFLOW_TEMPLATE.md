# <Actor goal or triggered flow>

## Actor, trigger and boundary

<Actor, goal, registered entry point, preconditions, participating areas,
revision/configuration and workflow end condition.>

## Sequence

| Step | Actor / area | Action and applicable rule | State / external effect | Observable result |
| --- | --- | --- | --- | --- |
| <Order> | <Named participant> | <Action; link area rule anchor> | <Read/write/publish and transaction scope> | <Response, pending state, acknowledgement or completion> |

<Add a diagram when useful. Follow asynchronous continuations through consumers;
distinguish request acceptance, persistence and eventual completion.>

## Branches, failures and recovery

| Condition / failure point | Remaining state | System action / recovery owner | Actor-visible outcome | Evidence or gap |
| --- | --- | --- | --- | --- |
| <Relevant case> | <Durable effects> | <Actual retry, repair or rejection> | <Outcome> | <Source/check/unknown> |

## Completion and guarantees

<Successful, rejected, pending and failed terminal outcomes. Link canonical area
rules; explain observed ordering, concurrency and idempotency scope where relevant.
Label accepted requirements versus observed baseline and proposals.>

## Evidence and open questions

<Revision + path/symbol for the trace, checks actually executed and their scenario
limits, unresolved edges and untraced variants. Remove template instructions.>
