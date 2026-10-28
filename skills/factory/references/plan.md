# Make an executable plan

Inspect the implementation before planning. Link the approved brief and affected
area specs and workflows; use qualified references such as `BRIEF:R1` and
`areas/identity.md#AUTH-003` (or an existing legacy spec's ID) so IDs
in different documents are not confused. Do not redefine the brief's requirements
in the plan. Identify preserved requirements alongside new behavior.

Write for an implementing agent without this conversation:

- Explain current behavior, relevant paths, interfaces, dependencies, and evidence.
- Record the chosen approach and consequential alternatives or tradeoffs.
- Decompose by independently checkable deliverables. State paths, dependencies,
  interface contracts, and an observable completion condition for each step.
- Include migration, failure, rollback, and compatibility details where relevant.
- Map every requirement and significant risk to an exact command or manual
  procedure with a pass condition. Order final gates as regression, acceptance,
  then quality. Identify prerequisites and checks that cannot run locally.
- Provide the starting revision, workspace state, open questions, and next action.

Specify decisions another agent cannot safely infer. Avoid both generic steps
such as “handle edge cases” and full implementation bodies copied into a plan.
Tests should exercise behavior and meaningful failure modes, not repeat code.
Choose TDD where useful; Factory does not impose it on every change.

Before execution, check coverage against the brief and existing specs, dependency
order, interface compatibility, unresolved decisions, and feasibility of the
verification commands. Close material gaps before handing off.

A material discovery can justify a plan revision. Record date, reason, affected
work IDs, and impact. Recheck coverage and preserved behavior after revising.
Scope or requirement conflicts need ADMIN's authorization; implementation
freedom does not allow changing the contract.

When ADMIN authorizes subagents, give each a bounded deliverable, relevant
requirements, interfaces, constraints, and expected evidence. Review actual
changes and results before accepting their report. Follow existing session
preferences; do not automatically dispatch agents or select different models.

These practices draw on
[Superpowers planning](https://github.com/obra/superpowers/blob/main/skills/writing-plans/SKILL.md)
and [Spec Kit](https://github.github.com/spec-kit/). The distinction between
proposed changes and current behavior follows
[OpenSpec](https://github.com/Fission-AI/OpenSpec/blob/main/docs/getting-started.md).
