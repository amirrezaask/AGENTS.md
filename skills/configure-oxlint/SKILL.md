---
name: configure-oxlint
description: Set up Oxlint, Oxfmt, and upstream anti-slop rules. Use when initializing or changing a project's lint configuration.
metadata:
  category: web-quality
---

# Configure Oxlint

Use the project's package manager to install Oxlint and Oxfmt. Run both through
`npm run lint` (or the equivalent package-manager command).

## Base rules

- Enable correctness rules as errors, TypeScript rules, and plugins for the
  frameworks actually present.
- Preserve existing ignores and useful checks when migrating. Scope exceptions
  to the relevant files and rules.
- Keep type checking separate; lint does not replace it. Use Oxfmt for formatting.
- Run existing regression checks, then lint and formatting checks after setup.

## Anti-slop

Install the upstream agent skill:

```sh
npx skills add dmmulroy/anti-slop --skill install-anti-slop
```

Use `install-anti-slop` to install or update the rules in the target project,
preserving local customizations and enabling all rules required by its policy.
Follow [upstream installation guidance](https://github.com/dmmulroy/anti-slop#install-with-an-agent-skill).
This skill carries no plugin copy or installation script.
