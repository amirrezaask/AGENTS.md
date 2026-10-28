# Policy And Rules

> Load when designing the root policy, selecting rules, or configuring a monorepo.

## Phase 4: Build the root policy

### Explicit plugin selection

Oxlint enables `eslint`, `typescript`, `unicorn`, `oxc` by default. Setting `plugins` REPLACES that set — list every plugin needed:

```ts
plugins: ["eslint", "typescript", "unicorn", "oxc", "import", "promise"]
```

Add only when detected:

- `react` — React/hooks/refresh rules;
- `jsx-a11y` — JSX accessibility;
- `nextjs` — Next.js (monorepos: also `settings.next.rootDir`);
- `node` — Node-specific rules;
- `jest` or `vitest` — not both unless genuinely used (`settings.jest.version` / `settings.vitest.typecheck` available);
- `jsdoc` — intentional JSDoc policy only;
- `vue` — supported script-block behavior only;
- `react-perf` — after evaluating signal and false-positive rate.

Native plugins cover most of the ESLint ecosystem; check native first. `jsPlugins` (alpha, no semver guarantees) runs real ESLint plugins or custom JS/TS rules as a compatibility escape hatch. Native names are reserved — alias JS versions: `{ "name": "import-js", "specifier": "eslint-plugin-import" }`. TS plugin files need native type stripping: Node ≥22.18 / ^20.19, Deno, or Bun (older Node: use `.js` plugins).

### Category policy

Clean codebase baseline:

```ts
categories: {
  correctness: "error",
  suspicious: "error",
  perf: "warn",
  pedantic: "off",
  style: "off",
  restriction: "off",
  nursery: "off",
}
```

Migration baseline: same but `suspicious: "warn"`, `perf: "off"`.

Interpretation: correctness fails by default; suspicious errors greenfield / measured debt elsewhere (promote); perf warn after relevance check — no speculative micro-optimizations as correctness; pedantic opt-in per rule; style belongs to the formatter unless it protects semantics/generated APIs; restriction per-rule for repo architecture; nursery off (unstable, under development). No `all` shortcut.

### Suppression policy

```ts
options: { reportUnusedDisableDirectives: "error" } // root config only
```

Every suppression must: name a specific rule; use the narrowest scope; include a reason when non-obvious; never batch unrelated rules; be removed when unused.

Prefer described `@ts-expect-error` over `@ts-ignore`; disallow `@ts-ignore`/`@ts-nocheck` unless a verified file class requires them.

Other root-only `options`: `denyWarnings`, `maxWarnings`, `respectEslintDisableDirectives` (default `true`), `typeAware`, `typeCheck`. CLI flags take precedence over config values.

## Phase 5: Select high-signal rules

Categories give broad coverage; explicit rules pin stable policy across category churn.

### Fast semantic baseline

- `eqeqeq`: error;
- `no-debugger`: error;
- `no-unused-vars`: error with explicit underscore convention for intentionally unused args/catch params (see template);
- `typescript/ban-ts-comment`: require descriptions for `@ts-expect-error`, disallow `@ts-ignore`/`@ts-nocheck`;
- `typescript/consistent-type-imports`: error;
- `typescript/no-import-type-side-effects`: error;
- `typescript/no-explicit-any`: warn established repos, error greenfield/clean-strict packages;
- `unicorn/no-abusive-eslint-disable`: error.

Measure `any`'s role in tests, generated types, interop layers, serialization boundaries, and public declarations before forbidding globally. Permanent `warn` is not an end state: remediate and promote, or document the narrower exception.

### Type-aware correctness tier

Run with `--type-aware`. Powered by tsgolint (typescript-go); needs `oxlint-tsgolint`; projects must be TypeScript 7.0+ (legacy tsconfig options like `baseUrl` unsupported). ~59/61 typescript-eslint type-aware rules implemented.

Error tier:

- `typescript/await-thenable`;
- `typescript/no-floating-promises`;
- `typescript/no-misused-promises`;
- `typescript/no-for-in-array`;
- `typescript/no-unsafe-enum-comparison`;
- `typescript/only-throw-error`;
- `typescript/switch-exhaustiveness-check`.

Unsafe family — `typescript/no-unsafe-{argument,assignment,call,member-access,return}` — high value, heavy legacy debt: error greenfield/clean strict; else warn with a non-increasing CI budget and promote package-by-package. Never disable wholesale because tests or one integration layer are dynamic; scope those exceptions.

`typescript/no-unnecessary-condition` (added v1.48): verify its category in the installed version; while nursery-classified, pilot only in pinned clean packages.

### React and accessibility tier

With React detected:

- `react/rules-of-hooks`: error;
- `react/exhaustive-deps`: error clean codebases, warn only during measured migration;
- react correctness + suspicious via category policy;
- jsx-a11y correctness on browser-facing JSX;
- `settings.react.version` for version-specific behavior.

No repository-wide dangerous dependency-array autofixes — each change can alter rendering/effect behavior; review individually.

React Compiler lint rules stay off unless deliberately adopting the compiler, versions are pinned, and compiler validation succeeds. Not a generic React quality preset.

### Imports and architecture tier

Native import analysis first. Cycle starter:

```ts
"import/no-cycle": ["warn", { maxDepth: 3, ignoreTypes: true }]
```

Promote to error after measuring cost and resolving current cycles; raise depth only when coverage justifies it.

`no-restricted-imports` for repository policy: banned/deprecated dependencies; server-only modules in browser bundles and vice versa; bypassing public package entry points; cross-layer dependencies; old APIs with approved replacement. Always include an actionable replacement message.

Retain an ESLint boundaries/custom rule until Oxlint reproduces the exact constraint — shallow cycle checks do not replace domain architecture rules.

## Phase 6: Preferred configuration template

Adapt to the repository; remove non-applicable plugins/rules/envs/ignores. Verified paths only — never guessed globs.

```ts
import { defineConfig } from "oxlint";

export default defineConfig({
  // Setting plugins replaces defaults — list every required plugin.
  plugins: [
    "eslint", "typescript", "unicorn", "oxc", "import", "promise",
    // Detected integrations only:
    // "react", "jsx-a11y", "nextjs", "node", "vitest", "jest",
  ],

  categories: {
    correctness: "error",
    suspicious: "error",
    perf: "warn",
    pedantic: "off",
    style: "off",
    restriction: "off",
    nursery: "off",
  },

  options: {
    reportUnusedDisableDirectives: "error",
    // Keep typeAware/typeCheck off here for fast editor/local runs;
    // enable --type-aware in the strict script.
  },

  // Verified outputs, caches, generated artifacts, vendored code, fixtures only.
  ignorePatterns: [
    "**/node_modules/**", "**/dist/**", "**/build/**", "**/coverage/**",
    "**/.next/**", "**/.turbo/**", "**/.cache/**", "**/storybook-static/**",
  ],
  // ignorePatterns is gitignore-style, rooted at the config file's directory;
  // patterns containing ".." are rejected.

  rules: {
    eqeqeq: ["error", "always"],
    "no-debugger": "error",
    "no-unused-vars": ["error", {
      args: "all",
      argsIgnorePattern: "^_",
      caughtErrors: "all",
      caughtErrorsIgnorePattern: "^_",
      destructuredArrayIgnorePattern: "^_",
      ignoreRestSiblings: true,
      reportUsedIgnorePattern: true,
    }],

    "typescript/ban-ts-comment": ["error", {
      "ts-expect-error": "allow-with-description",
      "ts-ignore": true,
      "ts-nocheck": true,
      "ts-check": false,
      minimumDescriptionLength: 8,
    }],
    "typescript/consistent-type-imports": ["error", {
      prefer: "type-imports",
      fixStyle: "separate-type-imports",
      disallowTypeAnnotations: true,
    }],
    "typescript/no-import-type-side-effects": "error",
    "typescript/no-explicit-any": "warn",

    // Active in the strict --type-aware path:
    "typescript/await-thenable": "error",
    "typescript/no-floating-promises": "error",
    "typescript/no-misused-promises": "error",
    "typescript/no-for-in-array": "error",
    "typescript/no-unsafe-enum-comparison": "error",
    "typescript/only-throw-error": "error",
    "typescript/switch-exhaustiveness-check": "error",
    "typescript/no-unsafe-argument": "warn",
    "typescript/no-unsafe-assignment": "warn",
    "typescript/no-unsafe-call": "warn",
    "typescript/no-unsafe-member-access": "warn",
    "typescript/no-unsafe-return": "warn",

    "import/no-cycle": ["warn", { maxDepth: 3, ignoreTypes: true }],
    "unicorn/no-abusive-eslint-disable": "error",

    // React repos: add "react"/"jsx-a11y" plugins too.
    // "react/rules-of-hooks": "error",
    // "react/exhaustive-deps": "error",
  },

  overrides: [
    {
      files: ["**/*.{test,spec}.{js,jsx,ts,tsx,mjs,cjs,mts,cts}", "**/__tests__/**"],
      rules: { "no-console": "off" }, // add exceptions only after inspecting diagnostics
    },
    {
      files: ["**/*.d.ts"],
      rules: { "no-unused-vars": "off" }, // declaration params document API shape
    },
    {
      files: ["**/*.config.{js,ts,mjs,mts,cjs,cts}", "**/scripts/**", "**/tools/**"],
      env: { node: true },
      rules: { "no-console": "off" },
    },
  ],
});
```

Template adaptation:

- Backend-only: `node` env on actual Node source globs or package-level config.
- Browser app: `browser` env on app source globs only, not server packages.
- React: uncomment React rules; add `react` + `jsx-a11y`.
- Next.js: add `nextjs`; verify framework-generated files, server/client boundaries, `settings.next.rootDir` in monorepos.
- Vitest/Jest: detected plugin; verify test-file globals/environment.
- Library: public declarations + entry points stricter than tests/examples.
- Legacy: start suspicious/unsafe-typed/cycles at warn, record count, ratchet down.
- Greenfield: promote any-policy, unsafe typed rules, cycles to error.
- No generated-code ignores before generation ownership is proven.

## Phase 7: Monorepo configuration

Resolution facts: each file uses the NEAREST config up its directory tree; configs are NOT auto-merged (child never affects parent); `extends` provides inheritance — JSON takes paths relative to the containing config, TS takes imported objects; merged first→last, last wins.

`extends` reliably merges `rules`, `plugins`, `overrides`. Do NOT assume it propagates categories, root options, environments, globals, settings, or ignore patterns — define those in the consuming root and verify with `--print-config`.

Root owns: common plugins, category severities, suppression policy, shared rule policy, common output ignores, root-only `options.*`, common file-class overrides.

Nested package delta (small only):

```ts
import { defineConfig } from "oxlint";
import rootConfig from "../../oxlint.config.ts";

export default defineConfig({
  extends: [rootConfig],
  env: { browser: true },
  rules: {
    // Only package-specific deltas belong here.
    "no-console": "error",
  },
});
```

Do not duplicate the root rule list per package.

With nested configs:

- rely on ordinary discovery, not forced root `--config`;
- verify `oxlint --print-config` on files in ≥2 packages;
- verify editor/LSP on the same files;
- if nested TS-config resolution differs between CLI and editor, use root overrides or nested JSONC until parity;
- never set `typeAware`/`typeCheck` in nested configs — root-only by spec.

Shared config package for multi-repo/independently-versioned workspaces: export a typed object, extend from `oxlint.config.ts`. Keep org-specific architecture restrictions separate from the generic base so app/library policies evolve independently.
