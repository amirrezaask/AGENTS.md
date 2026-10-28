# Loading and hydration

Inspect the critical path: request discovery → network → parse/execute → data →
render/hydrate → usable interaction. Separate server response, asset discovery,
download, and client CPU time before choosing a fix.

Split a heavy route/feature only when it removes work from the initial path. A lazy
chunk that fetches after mount can create chunk → execute → fetch → render waterfalls;
start independent data requests at navigation/intent when the architecture permits.
Measure fallback/reveal behavior and preserve error handling.

Use a bundle graph to identify what ships. Barrel imports do not inherently defeat
tree shaking; check side effects, package exports, and the actual emitted chunk before
rewriting imports. Account for compressed transfer AND parse/execution cost.

Deduplicate independent requests and fetch concurrently where semantics permit.
Prefetch based on plausible navigation intent and resource budget; unconditional
prefetch can compete with critical work. A cache needs key, freshness, invalidation,
authorization scope, and retention behavior.

Keep non-interactive content out of client bundles where the existing framework
supports it. Hydration cost depends on the client subtree and its startup work; verify
first-click behavior as well as initial paint. Consult the installed framework's API
for streaming/server component support rather than importing dated recipes.

Reserve media/font space to avoid layout shifts. Identify the actual LCP resource;
keep it discoverable and avoid deferring it through lazy loading. Use responsive sizes
and preload only resources whose earlier discovery helps the measured path. Font
fallback metrics and preload priority can matter as much as file size.

Audit third-party startup work in the trace. Deferral or a facade may improve the
critical path; verify analytics, consent, and interaction behavior after changing load
order. Worker execution is useful only if the script's APIs and product behavior allow it.

For CPU-heavy parsing/search, include structured-clone cost, buffer transfer ownership,
worker lifetime, and stale-result cancellation. Yielding separates tasks; merely
awaiting an already-resolved promise can continue in microtasks without letting a frame paint.
