# Reconnaissance And Architecture

> Load when inspecting repository topology, choosing Oxlint/ESLint architecture, or deciding config format.

## Phase 1: Reconnaissance

Inspect before editing.

### 1. Repository topology

Record: package manager + lockfile; workspace technology (npm/pnpm/Yarn/Bun workspaces, Nx, Turborepo, Lage, Rush, Bazel, custom); app/package boundaries; source/test/story/fixture/benchmark/generated/vendor/declaration/script/tooling directories; whether packages publish declarations or depend on built siblings; CI entry points and required Node versions.

```bash
pwd
git status --short
git ls-files 'package.json' '*lock*' 'pnpm-workspace.yaml' 'turbo.json' 'nx.json' 'workspace.json'
git ls-files 'tsconfig*.json' '**/tsconfig*.json'
git ls-files '*eslint*' '*oxlint*' '.vscode/**' '.github/workflows/**' '.gitlab-ci.yml'
```

Do not switch package managers or regenerate unrelated lockfiles.

### 2. Map file classes

Inventory when present: production TS/JS; React JSX/TSX; server-only vs browser-only code; tests + utilities; Storybook/examples; configs/build scripts/migrations/CLIs/one-offs; `.d.ts`; generated code; fixtures/snapshots/vendored/copied sources; framework files (Vue, Svelte, Astro, MDX); package entry points and public API.

Verify generated provenance via headers, generation scripts, or repo docs — never directory names alone.

### 3. TypeScript project structure

Read root + representative package tsconfigs. Record: `references`/`composite`/`declaration` + output dirs; `include`/`exclude`/`files`; path aliases + module resolution mode; deprecated/compatibility-sensitive compiler options; separate build/test/app/tooling configs; whether type checking already runs package-by-package.

Type-aware lint must follow the real project graph. Do not invent a separate one unless compatibility requires it.

### 4. Audit existing lint behavior

Inspect every ESLint/Oxlint config including shared config packages and nested configs. Inventory: presets/plugins; type-aware rules; custom/local plugins; `no-restricted-imports`, boundary, or org-specific rules; parsers/processors for MDX/Vue/Svelte/Astro/GraphQL/templates; file overrides + ignores; inline disable conventions; editor/pre-commit/CI commands; warning budgets/caches/baselines.

ESLint flat config inspection:

```bash
eslint --inspect-config
eslint --print-config path/to/representative-file.ts
```

Do not assume a preset's name describes its merged rules.

### 5. Select representative files

Real files per applicable class: production `.ts`; React `.tsx`; async-heavy; unit/integration test; `.d.ts`; config/script; generated/fixture; nested-package file; architectural boundary. These form the validation matrix later.

## Phase 2: Choose the architecture

### Oxlint-only

When native rules (+ intentionally accepted JS plugins) cover all important checks and no critical custom parser/processor/local rule remains. Typical fit: TS/JS/React/Next.js/Node; Jest/Vitest; import analysis + bounded cycle detection; standard a11y and hooks checks; tsgolint-supported type-aware rules.

### Hybrid Oxlint + ESLint

When material remains: custom/local ESLint rules; uncovered architectural plugins; materially different plugin behavior; unsupported parser/processor behavior; template-aware rules (MDX/Vue/Svelte/Astro/custom formats); unsupported/incompatible type-aware rule; migration risk too high for one change.

Hybrid protocol:

1. Oxlint first;
2. ESLint only for residual rules/files;
3. `eslint-plugin-oxlint` LAST in flat config to disable overlap;
4. documented list of why ESLint remains;
5. incremental removal as coverage becomes reliable.

### Config format facts

- Auto-detected filenames: `.oxlintrc.json`, `.oxlintrc.jsonc`, `oxlint.config.ts`, `oxlint.config.mts`. One config per directory — JSON and TS cannot coexist, nor `ts` and `mts`.
- `.oxlintrc.json` accepts comments (jsonc-style). Schema: `$schema: "./node_modules/oxlint/configuration_schema.json"`.
- `-c/--config` disables nested lookup; `--disable-nested-config` disables auto-discovery.
- TS configs execute through a JS runtime and are CLI-marked experimental; `.json`/`.jsonc` work in all runtimes. (TS *plugin* files via `jsPlugins` additionally need Node ≥22.18 / ^20.19, Deno, or Bun.)

Prefer `oxlint.config.ts`/`.mts` when the runtime qualifies, typed authoring/imported shared config objects are valuable, and editor+CI loading is verified. Otherwise prefer `.oxlintrc.json`: static, runtime-independent, most reliable nested resolution in editors.

### Root overrides vs nested configs

Nested resolution: each file is linted with the NEAREST config up its directory tree. Configs are NOT merged — a child never affects the parent. Inheritance requires explicit `extends`.

Prefer one root config with precise overrides when package differences are limited. Use small nested configs for genuinely different environments/frameworks/library constraints/public-API policies; they should extend the root and contain only the delta.

Keep `options.typeAware`/`options.typeCheck` in the root only (spec restriction). Prefer CLI flags for the strict typed path so editor and local fast paths stay responsive.

## Phase 3: Dependency and version policy

Local devDependencies following existing package-manager conventions.

- Core: `oxlint`; `oxlint-tsgolint` when type-aware linting is enabled.
- Hybrid-only: `eslint-plugin-oxlint` + only the residual ESLint plugins needed.
- Migration-only: `@oxlint/migrate`, aligned with the installed Oxlint version.

Rules:

- Update `eslint-plugin-oxlint` and `oxlint-tsgolint` together with Oxlint — overlap coverage and typed compat shift every release.
- Pin exact versions (or repo's controlled policy) for lint infrastructure.
- Versioning policy: patch = safe; minor = new rules/new diagnostics possible but non-breaking by declaration — still run the full validation matrix before merging.
- Group lint-tool upgrades into deliberate dependency updates; never commit `@latest`.
