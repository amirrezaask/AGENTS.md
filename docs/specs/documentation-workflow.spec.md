---
title: "Documentation workflow"
---

## Area

The `communication` and `specification` skills loaded through AGENTS.md, with
templates bundled inside each skill.

## Requirements

- **R1:** Given a change, feature, or bug-fix request, when applying communication rules, then the agent asks once whether ADMIN wants a brief and respects an existing answer. A requested brief follows relevant code inspection and uses the project brief template when present, otherwise the bundled template.
- **R2:** Given a requested brief, when following the workflow, then its sequence is brief, plan, implementation, debrief, and specification update. Artifact/report/media creation requires no plan unless it changes code or a brief was requested.
- **R3:** Given a brief, plan, or debrief, when writing it, then the agent uses its template and documented destination. Briefs are concise human communication; plans give another agent implementation context; debriefs distinguish evidence, assumptions, unrelated findings, and unverified or remaining work.
- **R4:** Given an implemented change and debrief, when completing the task, then the agent updates affected area specifications with implemented, observable requirements and checks them against code and available verification. An unresolved or unverifiable mismatch leaves the work incomplete.
- **R5:** Given the skill directories, when resolving template links, then communication provides the brief, plan, and debrief templates, and specification provides the area specification template. Each template has one canonical file inside its skill.
