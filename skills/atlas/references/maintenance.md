# Maintain specifications with Factory

Atlas owns the specification structure and methods. Factory owns change delivery,
brief approvals, plans, verification and task completion. Do not duplicate those
procedures or create a new development task for a requested documentation update.
Factory can use this guide directly without invoking Atlas's full baseline.
Only ADMIN's `/atlas` command starts existing-project initialization.

## Before planning a change

Read `docs/README.md`, the relevant root documents, areas and workflows. Follow
their code/schema anchors and reconcile the actual revision and current diff.
Existing legacy specs remain binding until an authorized migration or amendment.

Use this impact prompt:

> Which actors, area rules, state owners, interfaces, workflow outcomes and
> runtime variants does this change affect? Which existing requirements must
> remain true? Trace callers, writers and asynchronous consumers beyond the
> edited files. Which root documents summarize those facts? Which task decisions
> explain constraints I must preserve? Which missing spec content requires
> targeted discovery before the brief can be precise?

Reference preserved requirements with document-qualified IDs in the brief/plan.
Keep proposed behavior in the Factory brief; do not present it as implemented
in current-system documentation. A scoped update does not require re-baselining
unrelated areas or generating every root document.

## After implementation and verification

Follow Factory's regression, acceptance and quality order. Then inspect the
actual implementation and verification before updating affected documentation.

> For each approved change, what observable behavior now differs? Which rules,
> contracts, relationships, workflow branches, operational steps and quality
> claims need revision? What evidence supports the new wording? Have any
> unchanged paths lost compliance? Does a newly discovered contradiction need
> repair or ADMIN's authorization to amend an existing requirement?

Update canonical facts and links without duplicating rules across documents.
Preserve existing IDs and meaning except where ADMIN authorized a change; record
that authorization and reason in the task/debrief, retaining prior text in Git.
Add new rule IDs rather than renumbering a document. Do not use an appended note
to silently weaken an existing requirement.

Record significant decisions and alternatives in the task plan/debrief. Add a
short explanation and link from the relevant area or architecture document so
future readers can find the reasoning without searching all tasks.

Before finishing, search the documentation for changed names, previous values
and semantic equivalents: a schedule change may appear as `daily`, `24 hours`,
or a cron expression in an area overview, workflow and operations guide. Inspect
each match rather than replacing blindly; historical task records should retain
their original context. Reconcile current mentions with the canonical fact or
replace repeated detail with a link. Recheck affected readers and summaries as
well as the document you expected to own the change.

## Drift or partial baselines

When a request is to reconcile docs with code, preserve the distinction between
an outdated descriptive observation and an accepted requirement that code violates.
Correct supported descriptive errors; surface requirement conflicts to ADMIN.
Mark evidence and coverage gaps rather than treating missing tests as proof of
failure or rewriting a guarantee to match an incomplete implementation.

For a large remaining gap, discover the affected area using the inventory and
trace prompts in [discovery](discovery.md), [areas](areas.md) and
[workflows](workflows.md). Keep this scoped to the authorized change; do not turn
it into full initialization without `/atlas`. Update the coverage frontier in
`docs/README.md`; do not claim
that a small diff verified the entire system. Recheck links and terminology after
moving or splitting a document. Report unresolved accepted-rule mismatches to
Factory; they leave the affected delivery task incomplete.
