---
title: "Skill catalog"
---

## Area

Task-specific instructions under `skills/`, discovered through each directory's
`SKILL.md`. Agent hosts decide which descriptions match a request.

## Requirements

- **R1:** Given a skill, when its metadata is read, then its kebab-case name matches its directory and a short description identifies a task trigger.
- **R2:** Given an unrelated task, when an agent considers these skills, then no entrypoint instructs it to load all personal notes or treats the skills as always-on memory.
- **R3:** Given performance work, when selecting guidance, then one `performance` entrypoint covers systems, browser, and GPU performance and routes to the references needed by the symptom. The former performance entrypoints are absent.
- **R4:** Given the global catalog, when listing its skills, then only `performance`, `configure-oxlint`, and `resource-bounded-runs` appear. Webapp verification is retired; Koloop browser testing, promotion, and PS3 compilation skills live in GameBox's local library.
- **R5:** Given conditional reference material, when loading an entrypoint, then it links the relevant local references rather than requiring every reference to load.
- **R6:** Given `npm run check:skills`, when the catalog is valid, then name, description, entrypoint size, unscoped-loading wording, and local Markdown link checks pass. This structural check does not establish the host model's routing behavior.
