# Synthesize and verify the specification

## Reconcile before drafting

Return to the discovery inventory and claim evidence. Use this prompt:

> Can I place each in-scope entry point, authoritative writer, external effect,
> actor goal and runtime variant in this account? Where do two documents claim
> ownership of the same fact or rule? Which untraced surface could invalidate a
> guarantee? Which statements come from accepted requirements, source, executed
> checks, inference or an unsupported assumption? Which conflicts remain?

Inspect missing surfaces before claiming coverage. For a large codebase, a compact
coverage table in `docs/README.md` records area, entry/actor families, traced flows,
evidence depth and remaining gaps. Summarize families and link their registrations
instead of copying a catalog of private functions. Label a partial baseline as
partial and retain the next reading frontier; do not silently shrink the scope.

## Give each fact one home

Follow [document responsibilities](documents.md). Keep shared terminology in
`domain.md`, cross-area data authority in `data-model.md`, area rules/contracts in
the owning area, and sequencing in workflows. Architecture describes observed
components and their interactions even when the code's boundaries are untidy.
Cross-cutting rules have one canonical owner and links from affected areas.

Use stable local requirement IDs and explicit anchors. Preserve existing IDs;
references include document paths. Keep technical details when they form a real
interface, persistence or operational contract. Avoid copying implementation
bodies, private signatures or generated schemas into prose.

Distinguish authority from evidence. For example, an accepted performance target
can remain unverified; a measured response time is an observation in one workload,
not automatically an accepted target. A timeout value is configuration, not proof
of latency. A password hash is a mechanism, not proof that the system is secure.

For unknowns, state the missing fact, why it matters, what was inspected and the
source or decision needed to resolve it. Support important claims with concise
path/symbol references and the inspected revision; link exact schemas where
available. Logs and raw traces belong in gitignored report output when retained,
not permanent specification tables full of transient runtime state.

## Verify in order

For a documentation change, first run applicable existing regression checks;
exercise tooling if installation or scripts changed. Do not claim application
regression coverage from a Markdown link check. If application execution is
unavailable, record that limitation and validate source claims without inventing
runtime results.
Inspect actual check output and exercised scenarios. A successful command that
discovers zero tests provides no regression evidence; a mocked adapter does not
verify the external provider's behavior.

Then check acceptance against the requested scope and accepted requirements.
Finally check writing, navigation, links, diagrams and other relevant quality.

### Evidence challenge prompt

> Pick the most consequential claims about permission, state transitions,
> atomicity, ordering, idempotency and recovery. Follow the source anchors back
> to registrations and enforcement. Search for alternate writers and bypasses.
> State the strongest supported wording and its exceptions. Separate unexecuted
> tests from executed evidence. Which claims still depend on external behavior
> or unresolved intent?

### Reader prediction prompt

> Using only the draft, explain one successful action, one rejection and one
> relevant partial/recovery outcome. Name the actor, applicable rule, state owner
> and visible result. Then compare those predictions with the actual paths.
> Where does the draft leave the reader unable to predict behavior, or predict
> something the implementation does not support?

### Cross-document consistency prompt

> Do architecture participants match the workflows? Does each important fact
> have one authoritative owner, with derived copies distinguished? Are domain
> names consistent, including intentional translations? Do workflow conditions
> and outcomes preserve area rules? Are interfaces linked to their owning area
> and authoritative schema? Do current decisions link to tasks that explain
> their rationale? Are proposed, observed and accepted statements distinguishable?

Correct supported documentation errors. When accepted requirements and code
conflict, keep the discrepancy visible; do not rewrite a requirement to obtain
a clean result. Ask ADMIN for intent or amendment when needed. A missing test is
an evidence limit, not proof the behavior is broken.

## Deliver and maintain

Summarize documents created/updated, coverage reached, important uncertainties
and checks actually performed. Supported observations can form a draft baseline
while intent remains unresolved. Ask for review of consequential intent gaps;
do not declare inferred requirements accepted by virtue of saving the file.
Do not impose an extra approval before writing docs already requested by ADMIN.

Keep the durable navigation/coverage summary in `docs/README.md`, unresolved
questions with their owning document, and task verification in Factory's debrief.
Remove scratch inventories, temporary evaluation files and stray processes.
Read [maintenance](maintenance.md) for the change-driven update cycle.
