# Rule policy and anti-slop

Check the installed configuration schema before choosing plugins or rules. An explicit plugin list may replace defaults; verify the effective config. Enable framework plugins only for frameworks present in the repository. Separate browser, server, test, tooling, handwritten declaration, and generated file policies.

Prefer correctness and async/type safety checks with demonstrated signal. Add style, restriction, performance, or experimental rules deliberately rather than enabling every category. Review hooks dependency fixes for closure and runtime changes. Import cycle detection does not replace architectural boundary rules.

If existing debt requires warnings, use a non-increasing budget and a promotion condition. Prefer narrow justified exceptions to blanket disables. Check unused suppressions. Verify generated provenance before excluding files.

## Bundled anti-slop plugin

The bundle contains opinionated rules for casts, type widening, dynamic access, naming, and test mocking. Install it when requested or required by repository instructions; inspect existing local modifications first.

```sh
node <skill-directory>/anti-slop/scripts/install.mjs
```

The script copies assets into `tools/oxlint/anti-slop/` relative to the current directory. A positional argument selects another destination. It refuses an existing destination unless `--force` is supplied; compare and preserve local changes before using that flag.

Install compatible `oxlint` and `@oxlint/plugins` with the repository package manager. Register the plugin in the existing config:

```ts
jsPlugins: [
  { name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" },
],
```

Read the copied `index.ts` to enumerate exported rules and enable each as `anti-slop/<rule-name>` at the requested severity. Exclude the copied plugin implementation itself from consuming its rules; preserve unrelated source coverage. For Vite+, merge plugin fields into its lint configuration and check formatter ownership too.

Run the rules on owned source. Fix findings within the authorized migration scope; report unrelated debt rather than silencing rules or inserting casts to pass lint. Compare diagnostics before replacing an older bundle.
