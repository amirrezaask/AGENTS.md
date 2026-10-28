---
name: configure-oxlint
description: Configure, migrate, and validate Oxlint for large TypeScript and React repositories or monorepos with high-signal code-quality rules, fast editor feedback, strict type-aware CI, scoped exceptions, and minimal ESLint fallback. Also installs the bundled anti-slop Oxlint plugin (opinionated no-*, require-* rules) into a repository.
metadata:
  category: web-quality
  version: "1.1.0"
---

# Configure Oxlint for Large TypeScript Codebases

Use when adding Oxlint, replacing or migrating from ESLint, tuning a large TypeScript/React/Node repository, or reducing lint latency without weakening semantic checks.

Target: a small trusted lint policy catching correctness, async, type-safety, React, accessibility, and architecture defects — fast and predictable in editors, scripts, CI, and workspaces. Formatting stays separate from linting; runtime behavior is preserved.

## Non-negotiable guardrails

- Inspect before editing: package manager, workspaces, configs, file classes, CI, editor hooks, existing custom rules.
- Never run `--fix-dangerously` across a repository.
- No `all`, no `nursery`, no experimental React Compiler rules, no global plugin enablement without pinned, validated versions.
- Never turn findings into blanket disable comments or ignore a source tree just to make lint pass.
- Do not delete ESLint custom rules, processors, parsers, or architecture checks until equivalent behavior is verified.
- Do not replace `tsc --noEmit` with `oxlint --type-check` without proving project, diagnostic, framework-generated-type, editor, and CI parity.
- Scope rules by file class (browser, Node, test, generated, declaration, fixture, package) — never give every file every global.
- Do not force a root `--config` when nested discovery is part of the design; test CLI and editor resolution separately.
- Never claim success from config syntax alone; record findings and timings.

## Required outcome

1. Repository lint assessment + representative-file matrix.
2. Root Oxlint config + small package-specific deltas.
3. Dependency/script changes using the existing package manager.
4. CI, staged-file, and editor integration where those systems exist.
5. Documented ESLint residual layer where Oxlint cannot replace a rule.
6. Validation results: commands, diagnostics, timings, exceptions, gaps.

## Operating sequence

1. [Reconnaissance and architecture](references/reconnaissance-and-architecture.md)
   — topology, project graphs, file classes, current lint behavior; choose Oxlint-only vs hybrid and config format.
2. [Policy and rules](references/policy-and-rules.md)
   — plugins, categories, high-signal rules, overrides, monorepo inheritance.
3. [Migration and integration](references/migration-and-integration.md)
   — dependencies, two-speed scripts, typed linting, ESLint residuals, editor/pre-commit hooks, CI.
4. [Validation and reporting](references/validation-and-report.md)
   — config resolution, diagnostics, performance, suppressions, severity, final report.

Load only the reference matching the current phase.

## Default policy

Setting `plugins` replaces Oxlint's default set (`eslint`, `typescript`, `unicorn`, `oxc`) — always list every required plugin. Add only detected integrations: `import`, `promise`, `react`, `jsx-a11y`, `nextjs`, `node`, `vitest` or `jest`.

Use categories conservatively:

```ts
categories: {
  correctness: "error",
  suspicious: "error", // warn during an explicit debt migration
  perf: "warn",
  pedantic: "off",
  style: "off",
  restriction: "off",
  nursery: "off",
}
```

Explicit rules for stable repository policy. Enforce suppression hygiene with root-only `options.reportUnusedDisableDirectives: "error"`. Keep type-aware lint (`--type-aware`, requires `oxlint-tsgolint`) out of the fast editor/local path until measured parity. Warning-class migrations need an owner, a non-increasing budget, and a promotion condition — warnings without a ratchet are not a plan.

## Architecture defaults

- Oxlint-only when native rules cover all important checks.
- Hybrid when custom rules, unsupported processors/formats, exact architecture constraints, or material typed gaps remain. Run Oxlint first, disable overlap in ESLint (`eslint-plugin-oxlint` last in flat config), document each residual responsibility.
- Prefer one root config with precise overrides. Nested configs resolve per-file to the nearest config and are NOT merged — use `extends` for inheritance; keep them small and delta-only.
- Editor/staged lint stays non-type-aware; full typed lint runs deliberately in CI or an explicit command.
- Treat tests, declarations, scripts, generated files, fixtures, vendor code, and production code as different file classes, not blanket exceptions.
- Formatter ownership stays separate. Review every behavior-sensitive fix.

## Final report

End applied changes with the structure defined in [Validation and reporting](references/validation-and-report.md): lint architecture, repository findings, files changed, policy decisions, residual ESLint, validation, remaining risks.

Do not report a command as passing unless it was run. Distinguish verified facts, repository inferences, and recommended follow-up work.

## Installing the anti-slop plugin

A bundled Oxlint plugin lives at `anti-slop/` in this skill's base directory (scripts + rule assets). Install it when the user asks to add anti-slop lint rules or opinionated slop-detection rules to a TypeScript/JavaScript repo:

1. Inspect before changing: agent instructions, `git status`, package manager, existing Oxlint config (`oxlint.config.*`, `.oxlintrc*`), whether anti-slop files already exist. Never overwrite without reviewing.
2. Copy the bundled plugin into the repo from the skill base directory:

   ```bash
   node <skill-base-dir>/anti-slop/scripts/install.mjs
   ```

   This creates `tools/oxlint/anti-slop/`. Pass another relative destination as the first argument when the repository has an established tooling layout. The script refuses to replace an existing destination; only use `--force` after backing up and reviewing existing files.

3. Install current compatible dependencies rather than trusting remembered versions — query `npm view oxlint version` and `npm view @oxlint/plugins version`, then install both with the repository's package manager (`oxlint` as a devDependency; copied source imports `@oxlint/plugins`).
4. Register the plugin and enable all rules at `"error"`:

   ```ts
   // oxlint.config.ts / .oxlintrc.json — merge with existing config, keep every existing ignore
   ignorePatterns: [
     ".agent/**", ".agents/**", ".claude/**", ".codex/**", ".continue/**",
     ".cursor/**", ".gemini/**", ".opencode/**", ".pi/**", ".roo/**",
     ".windsurf/**", "tools/oxlint/anti-slop/**",
   ],
   jsPlugins: [
     { name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" },
   ],
   ```

   Rules to enable: `anti-slop/no-chained-type-assertions`, `no-conditional-empty-object-spread`, `no-known-value-widening`, `no-module-mocking`, `no-object-parameters`, `no-reflect-apply`, `no-reflect-get`, `no-runtime-typeof`, `no-shape-in-symbol-names`, `no-unknown-parameters`, `no-unknown-returns`, `no-unknown-type-aliases`, `no-unsafe-dictionary-type`, `no-widen-then-assert`, `require-safety-comment-for-type-assertion`.

   For Vite+, add these fields to `lint.ignorePatterns` and `lint.jsPlugins`, merge the same patterns into `fmt.ignorePatterns`, then run the full `vp check`.
5. Run lint + typecheck. If findings appear in owned project source, report them; fix only when the user asked for migration/cleanup. Do not suppress rules, weaken severity, add unsafe casts, or launder types to make lint pass.
6. Report: copied path, dependency versions installed, configuration changed, checks run, remaining findings.

**Migration guidance:** when replacing an older local copy, compare its rules and diagnostics before overwriting. Keep project-specific rules in their own plugin; anti-slop is intentionally generic. Prefer inference, `as const`, `satisfies`, named owner contracts, and boundary parsing when resolving findings.
