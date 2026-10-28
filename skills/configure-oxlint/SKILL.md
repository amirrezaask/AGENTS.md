---
name: configure-oxlint
description: Configure or migrate Oxlint and its bundled anti-slop rules. Use for lint setup, ESLint migration, or lint configuration and performance problems.
metadata:
  category: web-quality
---

# Configure Oxlint

Inspect the existing package manager, configs, custom rules/processors, TypeScript project graph, and lint entry points before changing policy. Preserve checks that Oxlint cannot reproduce; a hybrid ESLint layer may be necessary.

- [Configuration and migration](references/migration-and-integration.md): use when changing tools, scripts, nested configs, or typed linting.
- [Rule policy](references/policy-and-rules.md): use when choosing plugins, severities, overrides, or installing anti-slop.
- [Validation](references/validation-and-report.md): use to verify the resulting policy.

Keep fixes separate from tool/formatter migration where possible. Review behavior-sensitive fixes; do not run repository-wide dangerous fixes. Scope exceptions to the actual file class and rule. Preserve existing ignores and custom checks until equivalent coverage is verified.
