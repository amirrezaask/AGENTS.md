# Validation And Report

> Load when validating configuration, diagnosing performance, choosing severities, or writing the final report.

## Config resolution

```bash
oxlint --print-config path/to/representative.ts   # prints merged config; lints nothing
oxlint --print-config path/to/representative.tsx
oxlint --debug files                              # lists files that would be linted
```

Nested monorepos: print configs from multiple packages. Confirm:

- intended plugins present;
- framework rules apply only where expected;
- test and declaration overrides work;
- generated/vendor outputs excluded;
- source files NOT accidentally ignored;
- explicit plugin lists did not drop defaults (`eslint`, `typescript`, `unicorn`, `oxc`).

## Fast lint

Run the ordinary local command. Record: errors/warnings by rule; elapsed time; unexpected file classes; safe-fix availability.

## Type-aware lint

Build required declarations, then:

```bash
oxlint . --type-aware
oxlint . --type-aware --debug timings   # per-rule cost, native vs type-aware
```

Record: project-resolution errors; unsupported TypeScript options; expensive rules; memory behavior; typed diagnostic counts; differences from residual typed ESLint. Debug hangs/slowness with `OXC_LOG=debug oxlint --type-aware` — shows program assignment, per-program file counts (giant program = misconfigured tsconfig includes), per-file gaps.

Do not disable an expensive high-value rule before testing narrower scope or package-group execution.

## Type check and tests

After config changes and especially fixes, run the repository's actual type check and relevant tests. Lint substitutes for neither.

## Suppression audit

Confirm unused disable directives fail. Search for broad comments:

```text
eslint-disable
oxlint-disable
@ts-ignore
@ts-nocheck
```

Replace broad suppressions with rule-specific justified directives or code fixes.

## Duplicate-diagnostic audit

Hybrid mode: introduce or locate representative violations; verify exactly one engine reports each overlapping rule.

## Editor audit

Open representative files from root + nested packages. Editor diagnostics must match CLI policy; save actions must not produce conflicting rewrites.

## Performance playbook

1. `--debug timings` — most expensive rules.
2. `--debug files` — accidental file inclusion.
3. Cap `import/no-cycle` depth before disabling it.
4. Keep typed lint out of save-time paths.
5. Build only required declarations.
6. Split typed lint by project/package when memory demands.
7. Remove duplicate ESLint coverage.
8. Cache residual ESLint pass.
9. Audit broad tsconfig `include` patterns and generated output (root tsconfig including everything = giant tsgolint program).
10. Update `oxlint` + `oxlint-tsgolint` together, retest.

Residual ESLint type-aware linting: `projectService` over wide project globs; avoid `**` globs scanning every tsconfig; limit out-of-project files; package-level projects/references; larger Node heap = last resort.

Do not trade away floating-promise or hooks correctness for small CI savings — optimize the execution boundary first.

## Rule-severity rubric

**error** when violations usually indicate: incorrect runtime behavior; unsafe async; type unsoundness; broken hook semantics; accessibility failure; invalid/prohibited module dependency; stale or abusive suppression; unreachable/useless/misleading code.

**warn with ratchet** when: high long-term value; nonzero current debt; fixes reviewable but too large for one change; package-by-package plan exists; CI enforces a non-increasing budget. Warnings without ratchet/owner are not a strategy.

**off** when: formatter owns the concern; opinionated low signal; repo runtime/API semantics intentionally conflict; a generated/fixture class cannot comply; experimental and unpiloted; stronger custom rule exists; verified false positive/incompatibility. Document non-obvious offs beside the rule.

## Anti-patterns

- `categories: { all: "error" }` maximalism; pedantic+restriction+style+nursery globally at once.
- Plugin arrays dropping `eslint`/`typescript`/`unicorn`/`oxc`.
- Unmeasured type-aware lint on every save; full typed lint in pre-commit.
- `--fix-dangerously` in CI or repo-wide.
- Weakening production rules because tests are noisy.
- Ignoring all `.d.ts` including handwritten APIs; ignoring a package because generated mixes with source.
- Treating import cycles and architecture boundaries as one problem.
- Keeping ESLint undocumented; both engines reporting the same rules.
- Broad `**/tsconfig.json` project globs.
- Replacing the formatter mid-migration.
- Raising warning budgets to pass CI; blanket disable comments.
- Changing compiler/runtime options merely to satisfy lint.
- Claiming completion without testing CLI + editor + CI + representative file classes.

## Output contract

```markdown
## Lint architecture
- Oxlint-only or hybrid
- Fast path
- Strict typed path
- Remaining type-check path

## Repository findings
- Workspaces/project graph, file classes, existing custom rules/processors, type-aware constraints

## Files changed
- Configs, package.json/lockfile, CI, editor/pre-commit

## Policy decisions
- Plugins, category severities, explicit rules, warning budget + promotion plan, package/file-class exceptions

## Residual ESLint
- Rule/plugin, scope, reason retained, removal condition

## Validation
- Commands run + exit status, error/warning counts, config-resolution checks, typed result, timings, type-check/tests, editor parity

## Remaining risks
- Unsupported rules/options, experimental features excluded, follow-up migrations
```

Do not report a command as passing unless it was run. Distinguish verified facts, repository inferences, and recommended follow-up work.

## Primary references

Revalidate version-sensitive behavior against installed versions:

- oxc.rs linter docs: config, config-file-reference, CLI, nested configs, js-plugins, type-aware, editors, migrate-from-eslint, versioning policy.
- `oxc-project/eslint-plugin-oxlint`; tsgolint implemented-rules table.
- ESLint flat config; typescript-eslint typed linting/`projectService`.
