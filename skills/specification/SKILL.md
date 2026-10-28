---
name: specification
description: Write and synchronize area specifications with implemented software behavior. Use when documenting requirements or completing behavior changes; AGENTS.md requires loading these rules for every task.
---

# Specification

Use the [specification template](templates/SPEC_TEMPLATE.md). Keep one concise
`docs/specs/<area-name>.spec.md` file per area.

Describe implemented behavior, not proposals or unfinished work. Write observable
requirements with clear conditions, actions, and expected outcomes that can be
verified manually and through automated tests.

After implementation and the debrief, update every affected area specification.
Check each changed requirement against the actual code and available verification
before marking the task complete. If a mismatch cannot be resolved or verified,
report it and leave the work incomplete; do not claim the specification is
synchronized.
