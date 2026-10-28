# Integrate Atlas specifications

Atlas owns specification discovery, document responsibilities and templates.
Use its [maintenance guide](../../atlas/references/maintenance.md) for the
change-driven cycle. Factory owns delivery and its completion gate. Only ADMIN's
explicit `/atlas` command initiates a full existing-project baseline; these
maintenance instructions do not implicitly invoke initialization.

Before drafting a brief or plan, read relevant system documents, area rules and
actor workflows, then inspect their implementation. Use targeted discovery
prompts linked by the maintenance guide when affected documentation has gaps.
Reference preserved rules with document-qualified IDs instead of redefining them.

After implementation, regression, acceptance, quality checks and the debrief,
update affected specs from verified behavior. Root documents live directly under
`docs/`; area rules/contracts live in `docs/areas/`, actor flows in
`docs/workflows/`. Link consequential choices to task plans/debriefs. Do not
scaffold unrelated documents for a scoped change.

Never remove, weaken or reinterpret an accepted requirement without ADMIN's
explicit authorization. If code and spec disagree, investigate and restore
compliance or request an authorized amendment. Record the reason in the task's
approval record and debrief; Git retains earlier text. Unresolved or unverified
accepted-rule mismatches leave the delivery task incomplete.

Historical `docs/specs/*.spec.md` files remain binding in their existing location
unless ADMIN requests migration. Do not silently move them or create a competing
canonical rule. Link existing documents while using Atlas's structure for newly
documented areas.
