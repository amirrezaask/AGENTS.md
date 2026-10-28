---
title: "Lint tooling"
---

## Area

This repository's Oxlint and Oxfmt command and its external anti-slop dependency.

## Requirements

- **R1:** Given installed dependencies, when running `npm run lint`, then Oxlint checks `tools/` and `skills/factory/assets/`, and Oxfmt checks those paths and configured package/config files.
- **R2:** Given the lint configuration, when loading anti-slop, then the plugin comes from the commit-pinned upstream archive in `node_modules`, using `tsx` for its TypeScript source. No anti-slop implementation or anti-slop installer is tracked in this repository.
- **R3:** Given the pinned upstream version, when inspecting configured rule coverage, then all 18 generic and 5 Effect rules are enabled as errors, together with native `oxc/no-accumulating-spread`.
- **R4:** Given code containing a chained type assertion, when linting it with the repository configuration, then anti-slop reports `no-chained-type-assertions`.
