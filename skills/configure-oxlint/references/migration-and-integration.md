# Configuration and migration

Capture the existing lint command and diagnostics before editing. Pick representative files from production, tests, declarations, tooling, generated output, and nested packages. Inspect custom rules and processors; migration tools do not prove parity.

Prefer one root config with scoped overrides. If packages need nested configs, verify the installed version's discovery and inheritance behavior with `--print-config` from the root and package directories. Forcing `--config` can change nested discovery. Check editor resolution on the same files.

Keep fast local/editor lint separate from expensive type-aware checks when latency warrants it. Typed lint needs compatible `oxlint-tsgolint`, resolvable projects, and any sibling declaration outputs. Read installed tool help/schema and current official documentation for supported compiler options rather than changing TypeScript semantics to satisfy lint.

Retain the existing type checker until project inclusion, references, framework-generated types, and diagnostics have demonstrated parity. Lint success alone cannot establish that parity.

For a hybrid ESLint setup, use the compatible `eslint-plugin-oxlint` overlap configuration after residual configs. Verify that one engine reports each shared rule. Record which custom rules, formats, or typed checks still require ESLint and their scope.

Use the repository's package manager and lockfile policy. Update compatible lint integrations together. Preserve staged-file arguments; a staged runner should not invoke a whole-monorepo typed pass for each file. Avoid conflicting formatter/fix-on-save ownership.
