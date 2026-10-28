# Loading Network

> Load when changing bundles, code-splitting, lazy/Suspense boundaries, streaming SSR, Server Components, hydration, network requests, assets, third-party scripts, workers, or event-loop scheduling. Reference instructions; load only this file when the trigger applies.

LCP and time-to-interactive are dominated by **how much JavaScript ships**, **how data is fetched**, and **how assets load**. The cheapest byte is the one never sent.

## Ship less JavaScript

- Route-split: each route loads its own chunk, not the whole app.
- Feature-split: lazy-load modals, editors, charts, admin panels, rarely used settings.
- Audit heavy hitters: icon sets, date libs, chart libs, syntax highlighters, rich-text editors, markdown renderers. Import only what you use.
- Barrel files (`index.ts` re-exporting everything) pull whole modules into the bundle and defeat tree-shaking — import directly from the source path for large libraries.
- Measure: source-map-explorer, rollup-plugin-visualizer, vite-bundle-visualizer. CI size budget so chunks can't silently grow.

Dynamic import is the framework-agnostic lazy boundary:

```ts
button.addEventListener("click", async () => {
  const { openEditor } = await import("./heavy-editor"); // loaded on demand
  openEditor();
});
```

Prefetch likely-next chunks on hover/intent — instant navigation without front-loading first paint.

## Code-splitting with lazy + Suspense

Split heavy or rarely used UI (modals, editors, charts, admin panels, heavy visualizations) to load on demand:

```tsx
const HeavyChart = lazy(() => import("./HeavyChart"));

function Panel() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart />
    </Suspense>
  );
}
```

- Split at route level first (biggest win), then per heavy feature.
- Keep the Suspense fallback cheap — a skeleton, not another heavy tree.
- Prefetch chunks on intent (hover/focus) so navigation feels instant without front-loading first paint.
- Don't stack waterfalls: a lazy chunk that fetches only after mount serializes network→parse→mount→fetch→render. Start data requests when navigation starts (route loader / hoisted fetch / query prefetch).
- Same inside Suspense trees: per-level fetch-on-render creates request-per-level waterfalls. Hoist or preload data; let boundaries reveal it, not sequence it.

## Streaming SSR

- Stream with Suspense so the shell and above-the-fold paint before slow data resolves.
- Boundaries around genuinely slow parts so everything else streams early. React 19.2 batches boundary reveals during SSR — don't fragment content into many tiny boundaries expecting progressive pop-in.

## Partial prerendering

Next.js 16 PPR (stable): the static shell is prerendered at build time; dynamic holes stream in at request time via `resume` APIs. Structure routes as static shell + Suspense-wrapped dynamic islands to get static-speed first paint without caching the whole page.

## Server Components & hydration cost

Hydration cost scales with interactive JS shipped and run on the client. A page that *looks* interactive but isn't hydrated queues clicks and produces INP spikes of 500ms+.

- Prefer Server Components for non-interactive content — zero client JS for those parts.
- Keep above-the-fold client components small; defer below-the-fold interactivity.
- Don't client-render the whole shell when one island needs interactivity; don't hydrate static islands at all.

**Shrink the interactive surface.** Every client component is JS to download, parse, and hydrate; the fastest one stays on the server.

## Data fetching

Network shape matters as much as payload size.

- Kill waterfalls: never await request A just to start independent request B. Parallel (`Promise.all`) or hoist fetches above the code that renders results.
- Deduplicate + cache: TanStack Query / SWR / RTK Query, or your own keyed cache — coalesces duplicates, caches, revalidates in background.
- Don't over-fetch: request the fields/pages needed; paginate or load incrementally.
- Prefetch likely-next data on intent (hover, route enter).
- Parse big JSON off the main thread (worker); project to a lean view model, discard raw payload.

## Images, fonts, assets

Images (largest thing on the page):
- Explicit width/height or aspect-ratio always — reserve space (CLS).
- Preload the LCP image; never lazy-load it. Below-fold images: `loading="lazy"`.
- AVIF/WebP + `srcset`/`sizes` so phones don't download desktop bytes.

Fonts (most common late layout shift):
- `font-display: swap` (or optional) so text paints immediately.
- Preload the critical font; subset to used characters.
- Match fallback metrics (`size-adjust`/`ascent-override`) to kill swap-in reflow.

Transport/static:
- CDN + content hashing + long immutable cache lifetimes.
- HTTP/3 at the CDN: supported by all browsers for years, expect ~60–80% adoption (keep h2 fallback; corporate firewalls block UDP/443). Modest gain, mostly high-latency mobile.
- Origin think-time ≳100 ms: enable 103 Early Hints — edge-generated hint set if possible; only render-blocking CSS, critical font, LCP image preconnects; mirror `Link` headers on the final 200; requires h2/h3 end-to-end. Server push is dead — this replaces it. Judge by LCP, not TTFB (the 103 skews `responseStart`).

## Third-party scripts

Analytics, chat widgets, ads run on your main thread — a frequent INP/LCP regression you didn't write.

- Remove what isn't earning its cost.
- Load async/defer, after interaction, or behind a facade (lightweight placeholder until engagement).
- Partytown moves tag managers into a worker where feasible.

## Async work & main thread / event loop

Work that would block interaction (browser) or other requests (Node): break up or move off-thread. Candidates: large filtering/search-indexing · syntax highlighting · big JSON/CSV parsing · diffing · tree building · analytics processing · large validation.

- Chunk long sync work and YIELD between slices: `scheduler.yield()` where available, `setTimeout(0)` fallback; `requestIdleCallback` for truly non-critical work; `scheduler.postTask` for priorities.
- Urgent visual feedback first; heavy part after the yield.
- Regularly >~16–50 ms CPU-heavy non-DOM work ⇒ Web Worker (browser) or worker thread (Node), especially if the user must keep interacting through it.

```ts
async function processInChunks<T>(items: T[], step: (x: T) => void) {
  for (let i = 0; i < items.length; i++) {
    step(items[i]);
    if (i % 100 === 0) {
      // @ts-expect-error scheduler may be unavailable; fall back
      await (globalThis.scheduler?.yield?.() ??
        new Promise((r) => setTimeout(r, 0)));
    }
  }
}
```

Worker boundary rules:

- Send compact data; don't clone huge object graphs across the boundary.
- Transfer ArrayBuffers (`Transferable`) instead of copying.
- Keep the message protocol typed and versioned.
- Terminate workers you no longer need ([memory](memory.md)).

## Symptom → fix quick table

| Symptom | Fix |
|---|---|
| Slow first load | ship less JS · route/feature split · big libs off initial route · audit bundle |
| Slow/janky LCP | preload + optimize LCP image · cut TTFB (CDN/SSR/Early Hints) · inline critical CSS · don't lazy-load hero |
| Layout jumps (CLS) | dimensions on media/iframes/ads · font-display swap + metric-matched fallback · reserve space for late content |
| Slow data/spinners | parallelize independent requests · caching data layer · stop over-fetching · prefetch on intent |
| Interaction blocks | chunk + yield (`scheduler.yield`) · worker · defer third-party scripts |
| Hydrated page ignores clicks | shrink interactive surface · Server Components · don't hydrate static islands |
