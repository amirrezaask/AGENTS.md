---
name: communication
description: Write concise human briefs, detailed agent handoff plans, and evidence-based debriefs. Use when scoping a requested change, preparing a plan, or recording completed work; AGENTS.md requires loading this workflow for every task.
---

# Communication

## Briefs

For a requested change, feature, or bug fix, ask once whether ADMIN wants a
written brief. Respect an answer already given in the conversation. If yes,
inspect the relevant code before writing the brief.

Save it to `docs/briefs/YYYY-MM-DD-title.md`. Use the project's
`docs/briefs/BRIEF_TEMPLATE.md` if present; otherwise use the bundled
[brief template](templates/BRIEF_TEMPLATE.md). Keep the brief short, simple,
and focused on intent and observable requirements for human readers.

When a brief is requested directly or indirectly, follow:
**Brief → Plan → Implementation → Debrief → Specification update**.
Producing an artifact, report, image, or video does not require a plan unless
the task changes code or ADMIN requests a brief.

## Plans

Use the [plan template](templates/PLAN_TEMPLATE.md) and save plans to
`docs/plans/YYYY-MM-DD-title.md`. Plans are agent-to-agent handoffs: include
enough precise context, decisions, dependencies, constraints, and verification
steps for another agent to implement the change without reconstructing the chat.
Git retains revision history.

## Debriefs

Use the [debrief template](templates/DEBRIEF_TEMPLATE.md) and save outcomes to
`docs/reports/YYYY-MM-DD-title.md`. Record the work, decisions, validation,
remaining work, and useful artifacts. Include useful unrelated findings, but
distinguish them from the requested work and separate evidence from assumptions.
State what remains unverified.

After implementation and the debrief, update affected area specifications
using the `specification` skill. Keep these documents useful to their intended
readers; do not create duplicate progress notes or abandoned handoffs.
