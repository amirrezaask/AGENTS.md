---
title: "Agent installation"
---

## Area

`tools/install.ts` installs this repository's global instructions, document
templates, and individually discoverable skills using symlinks.

## Requirements

- **R1:** Given Node.js 24 or newer, when `npm run install:agents` runs, then root `AGENTS.md` links into `~/.agents`, `~/.codex`, and `~/.claude`. Their `BRIEF_TEMPLATE.md`, `PLAN_TEMPLATE.md`, and `DEBRIEF_TEMPLATE.md` aliases link directly to `skills/communication/templates/`; `SPEC_TEMPLATE.md` links to `skills/specification/templates/SPEC_TEMPLATE.md`. Each skill links separately into the agents' skill directories and `~/.cursor/skills-cursor`.
- **R2:** Given `--list` or `--dry-run`, when the installer runs, then it reports discovered skills or intended changes without writing to the home directory.
- **R3:** Given explicit skill names, when installation runs, then it installs those skills, the global files, and the mandatory `communication` and `specification` skills referenced by AGENTS.md. Unknown names or options fail before mutation.
- **R4:** Given an existing regular file, directory, unrelated symlink, or symlinked destination parent, when it conflicts with installation, then preflight rejects the install before changing links. Unrelated installed skills remain intact.
- **R5:** Given individual skill links into `~/dev/Amirreza.md/skills`, when installation runs, then matching skills migrate here. A full install removes links owned by the old source or this repo for skills absent from the current catalog, and removes this repo's obsolete root `install.sh` links. Selected installs preserve retired skill links.
- **R6:** Given an installed repository, when installation repeats, then correct links remain unchanged. The installer never replaces the entire skill directory or links tooling and Git metadata into agent configuration.
- **R7:** Given template symlinks pointing to this repository's former root-template paths, when installation runs, then it migrates them to the corresponding nested source even if the old links dangle. Foreign links and real files remain protected by preflight.
- **R8:** Given a missing required template or mandatory skill entrypoint, when installation runs, then it fails before changing destination files or links.
