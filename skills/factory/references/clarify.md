# Clarify a request

Inspect relevant code, existing specs, tests, and supplied evidence. Summarize
what exists today and distinguish observations from assumptions. For an existing
Factory task, start from its brief rather than restarting discovery.
Use [Atlas's maintenance guide](../../atlas/references/maintenance.md) for missing
knowledge about affected areas/workflows. Inspect actors, writers and interfaces
beyond the edited files. Keep future requirements in the brief until implemented;
do not initialize a full project baseline without ADMIN's `/atlas` command.

Ask the highest-impact unresolved question first. Keep related questions small
enough to answer together; follow ADMIN's vocabulary and build on their answers.
Do not ask a fixed questionnaire or revisit settled decisions. Offer a concrete
proposal to correct when that is more useful than asking an abstract question.

Cover the gaps that change the outcome:

- Who experiences the problem, what triggers it, and why it matters.
- Observable success, error paths, boundary conditions, and compatibility.
- Scope, non-goals, constraints, and behaviors that must remain intact.
- External dependencies and choices ADMIN wants to retain or delegate.
- For a bug: reproduction, expected/actual results, affected versions or inputs,
  evidence, and whether the cause is known or still a hypothesis.

Compare credible approaches when they change scope, cost, or user experience.
Recommend one with reasons; do not invent alternatives for a predetermined fix.
Keep detailed implementation decisions for planning.

Draft the brief with stable R IDs and verification gates covering every
requirement. Requirements describe outcomes, not incidental implementation.
Flag unresolved assumptions that affect acceptance. Present the complete brief
for explicit approval and record who approved it and when. New material scope
changes require an authorized amendment, not a quiet rewrite of the brief.

This guidance adapts repository-first discovery from
[Superpowers brainstorming](https://github.com/obra/superpowers/blob/main/skills/brainstorming/SKILL.md),
ambiguity and consistency checks from
[Spec Kit](https://github.github.com/spec-kit/), and proportional discovery from
[BMAD](https://bmadcode.com/method). Use the local Factory contract when their
artifact locations, approval rules, or execution defaults differ.
