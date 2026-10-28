---
title: "Skill catalog"
---

## Area

Task-specific instructions under `skills/`, discovered through each directory's
`SKILL.md`. Agent hosts decide which descriptions match a request.

## Requirements

- **R1:** Given a skill, when its metadata is read, then its kebab-case name matches its directory and a short description identifies a task trigger.
- **R2:** Given an unrelated task, when an agent considers these skills, then no entrypoint instructs it to load all personal notes or treats the skills as always-on memory.
- **R3:** Given performance work, when selecting guidance, then `perfguy` covers general systems and data-layout work, `frontend-performance` covers web behavior, and `rust-gpu-performance` covers Rust GPU rendering. The former `dod` skill is consolidated into `perfguy`.
- **R4:** Given Koloop/GameBox work, when selecting personal project constraints, then game browser testing, promotional video conventions, and PS3 compilation have separate skill directories. Resource-heavy runs have a separate disk/process skill.
- **R5:** Given conditional reference material, when loading an entrypoint, then it links the relevant local references rather than requiring every reference to load.
- **R6:** Given `npm run check:skills`, when the catalog is valid, then name, description, entrypoint size, unscoped-loading wording, and local Markdown link checks pass. This structural check does not establish the host model's routing behavior.
