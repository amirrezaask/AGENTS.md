# Migration And Integration

> Load when adding scripts, typed linting, ESLint residuals, editor hooks, migration steps, or CI.

## Phase 8: Two-speed scripts

```json
{
  "scripts": {
    "lint": "oxlint .",
    "lint:fix": "oxlint . --fix",
    "lint:typed": "oxlint . --type-aware",
    "lint:ci": "oxlint . --type-aware --deny-warnings",
    "lint:files": "oxlint . --debug files",
    "lint:timings": "oxlint . --type-aware --debug timings"
  }
}
```

Adopting warnings incrementally: replace `--deny-warnings` with a non-increasing `--max-warnings N` budget. Record why each warning-class rule is not yet an error; never raise silently.

CI annotations: `-f github` (also `gitlab`, `sarif`, `junit`, `checkstyle`).

### Monorepo typed-lint preparation

Typed lint needs resolvable types: install deps, then build sibling `.d.ts` outputs before linting.

```bash
package-manager install --frozen-lockfile
package-manager run build:types   # derive from the repo; don't build whole apps if only declarations are needed
package-manager run lint:ci
package-manager run typecheck
```

### Type-aware compatibility gate (tsgolint)

Before making typed lint mandatory:

1. install the compatible `oxlint-tsgolint`;
2. run `oxlint --type-aware` over the full intended surface;
3. confirm path aliases and project references resolve;
4. build required sibling declarations;
5. measure memory + rule timings (`--debug timings`);
6. compare key typed rules against previous ESLint results;
7. retain typed ESLint while a material rule or project option is unsupported.

Requirements/gotchas: TypeScript 7.0+ programs via typescript-go; legacy tsconfig options unsupported (`baseUrl` etc.) — options deprecated in TS 6 / removed in TS 7 require migration first (`ts5to6` helps); debug with `OXC_LOG=debug oxlint --type-aware`. Do not change compiler semantics solely to enable linting.

### Type checking

`oxlint --type-check` reports TS compiler diagnostics alongside lint and can replace a separate `tsc --noEmit` CI step once proven. Keep the existing type check until ALL are verified:

- same projects/files included;
- project references behave correctly;
- framework-generated types available;
- important compiler diagnostics match;
- CI and editor behavior stable;
- unsupported legacy compiler options resolved;
- team accepts diagnostic differences.

## Phase 9: ESLint residual configuration

Current flat config; named objects scoped by `files`/`ignores`. The Oxlint-derived config always goes LAST.

From a JSON/JSONC Oxlint config:

```js
import oxlint from "eslint-plugin-oxlint";

export default [
  ...remainingConfigs,
  ...oxlint.buildFromOxlintConfigFile("./.oxlintrc.json"), // last: disables overlap
];
```

From a TypeScript Oxlint config:

```js
import oxlint from "eslint-plugin-oxlint";
import oxlintConfig from "./oxlint.config.ts";

export default [
  ...remainingConfigs,
  ...oxlint.buildFromOxlintConfig(oxlintConfig),
];
```

`configs['flat/recommended']` disables ALL rules Oxlint supports — use only when intentional. `buildFromOxlintConfigFile` requires ESLint ≥9 flat config.

Residual typed ESLint rules:

- prefer `parserOptions.projectService: true`;
- set `tsconfigRootDir` explicitly;
- `allowDefaultProject` only for a tiny set of root configs outside TS projects;
- no broad `**/tsconfig.json` project globs; no broad `include` pulling build artifacts;
- scope typed rules to files that need them;
- package-level projects/project references when one program is too large;
- cache output.

```json
{
  "scripts": {
    "lint": "oxlint . && eslint . --cache --cache-location .cache/eslint/.eslintcache",
    "lint:ci": "oxlint . --type-aware --deny-warnings && eslint . --cache --cache-location .cache/eslint/.eslintcache --max-warnings 0"
  }
}
```

Never let both engines report `no-unused-vars`, React hooks, import, or TS-safety rules.

Document residuals in a table: plugin/rule, affected globs, why Oxlint cannot replace it, owner, removal condition. Hybrid without this inventory becomes permanent duplication.

## Phase 10: Migration from ESLint

### Baseline first

Record before changing config: current command + exit status; errors/warnings per rule; representative `--print-config`; runtime/memory if expensive; inline suppression count; ignored vs processed files. No formatting or fixing during capture.

### Migrate with the tool as input, not authority

`npx @oxlint/migrate [eslint.config.mjs]`, aligned with installed Oxlint; inspect unmigrated rules (`--details`). The tool can misname plugins, migrate JS plugins with runtime limitations, miss preset/processor behavior, lint files inherited presets excluded, broaden categories, omit local plugins/settings in overrides. Compare migrated behavior against baseline + representative matrix.

### Migrate in quality tiers

Order: correctness/suspicious → suppression hygiene + unused vars → TS import hygiene + any-policy → typed promise/safety → React hooks + a11y → import cycles + architecture restrictions → perf rules with demonstrated value → style only if intentionally outside formatter.

### Control existing debt

Large codebases: high-value debt-producing rules enter as warnings; exact count recorded in CI; increases prohibited; fix by package/subsystem/rule; promote at zero; prefer code fixes over inline disables; narrow overrides for structurally different file classes. No permanent sea of ignored warnings.

### Separate lint migration from formatting churn

Never combine in one change: tool migration, formatter replacement, import sorting, quote/semicolon rewrites, mass type-only import rewrites, behavioral promise/effect changes. Small reviewable changes make regression attribution possible.

### Apply fixes safely

Review the rule set before ordinary `--fix`. Bound to a package/file set first. Review diffs for runtime behavior, side-effect imports, public API shape, generated files. Run type checks + tests after nontrivial fixes. No suggestion/dangerous fixes automated in CI. A clean lint result never proves a mass fix preserved behavior.

## Phase 11: React-specific policy

Classify first: client/server/shared components; hooks; tests/stories; SSR/worker code; legacy class components; generated route/framework files.

Policy:

- hooks correctness always high priority;
- exhaustive-deps fixed by understanding closures, never blind array edits;
- a11y on user-facing JSX; narrow exceptions only for abstractions intentionally wrapping semantics;
- browser globals never leak into SSR/server/worker/Node;
- nextjs restrictions only in actual Next globs (+ `settings.next.rootDir` in monorepos);
- react-perf advisory until signal verified against the rendering model;
- React Compiler rules = separate opt-in with pinned versions + validation plan.

## Phase 12: Runtime and file-class overrides

**Tests** — no wholesale safety disabling. Justified deltas: console output; scoped `any` in test doubles/protocol fixtures; relaxed non-null assertions in setup; framework globals/rules. Keep promise rules where possible — tests carry production-impacting async bugs.

**Declaration files** — handwritten `.d.ts` = API code. Common exception: `no-unused-vars` off for parameter names. Decide `no-explicit-any` per compatibility/API intent, not automatically.

**Scripts/tooling** — Node globals + console allowances scoped to actual scripts/configs/tools; async/error correctness stays.

**Generated/vendored** — ignore verified outputs instead of dozens of rule exceptions; never hand-edit generated output to satisfy lint; validate the generator when repo-owned.

**Fixtures/snapshots** — ignore only when purpose requires invalid/old/unusual syntax; executable test helpers stay linted.

**Benchmarks** — relax only measurement-distorting patterns; correctness checks stay unless they change purpose.

## Phase 13: Editor and pre-commit integration

Official extension `oxc.oxc-vscode` (also IntelliJ/WebStorm/Zed; other editors via `oxlint --lsp`). Use the repo-local binary.

```json
{
  "editor.codeActionsOnSave": { "source.fixAll.oxc": "always" },
  "oxc.typeAware": false
}
```

`oxc.typeAware` unset → editor follows root config's `options.typeAware`; set explicitly it OVERRIDES config. Prefer `options.typeAware` in config over the editor setting.

Keep editor type-aware linting off by default in very large repos unless measured responsiveness is acceptable; developers use the strict script on demand, CI stays authoritative. If enabling: install `oxlint-tsgolint`; verify memory/latency on large files; verify references/generated declarations; ensure settings don't surprise-override root policy. With residual ESLint, prevent both extensions fixing the same rules on save.

Oxfmt handles formatting (`source.format.oxc`) — keep linter/formatter separation.

Staged files:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}": "oxlint"
  }
}
```

The runner appends paths — never wrap it in a script that ignores those paths and re-lints the whole monorepo per commit. No type-aware full-project linting or dangerous fixes pre-commit; fast and deterministic only.

## Phase 14: CI design

Quality path order: deterministic install → generation/declaration build required by lint → strict typed Oxlint → residual ESLint if any → independent type check → relevant tests. Use native annotation formats; cache dependencies; cache residual ESLint results — never correctness assumptions.

Monorepo choice: one repo-wide typed lint when memory/resolution healthy; package-group jobs when too large; affected-package PR speed PLUS scheduled/full main-branch run. PR optimization must not eliminate the regular full-repo gate.
