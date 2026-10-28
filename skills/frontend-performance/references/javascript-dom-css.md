# JavaScript, DOM & CSS

> Load when the bottleneck is JavaScript/TypeScript runtime behavior, allocations, hot loops, DOM size, layout/reflow, CSS, animation, event handlers, Node, or type-check speed. Reference instructions; load only this file when the trigger applies.

Types erase at build time and do nothing at runtime — performance lives in the emitted JavaScript. Engine rules apply to browser and Node alike (V8/JSC/Hermes). Every DOM node costs memory, every layout recalculation costs main-thread time, animating the wrong property forces layout every frame. Most "janky scroll" and "slow interaction" bugs live here; React-specific rendering notes in [react rendering](react-rendering.md).

## Why shape matters

Engines optimize assuming **stable object shapes** and **few shapes per call site**:

- Object literals with the same keys in the same order share a hidden class; adding/deleting properties later or inconsistent key order creates new hidden classes and deoptimizes access.
- A function receiving one object shape is **monomorphic** with fast inline caches; many shapes ⇒ polymorphic/megamorphic ⇒ slow path.
- Generational GC: young allocations are cheap to collect, but high allocation rate in a hot loop means frequent minor GCs = jank. **Allocating less is the most reliable speedup.**

Don't hand-tune for the engine; avoid fighting it.

## Data shape

Hot collections: flat, predictable, monomorphic.

- No dynamic field attachment; don't mix unrelated shapes in one iterated array.
- Numeric timestamps (`number`) over `Date` objects in large collections.
- Ids + indexes over duplicating nested objects everywhere.
- `Map` for keyed lookup; arrays for dense ordered iteration.
- No deep-cloning large state trees; structural sharing intentionally.
- Typed arrays (`Float64Array`) for large numeric data — compact, cache-friendly — after measurement.

```ts
// Good: flat, stable keys, primitive timestamp
type UserRow = { id: string; name: string; status: Status; createdAtMs: number };
// Avoid in hot paths: deep nesting, bag of unknowns, method per row
type BadRow = {
  user: { profile: { display: { name: string } } };
  meta: Record<string, unknown>;
  computed: () => string;
};
```

## Allocation discipline

Every `{}`, `[]`, `() => {}` allocates; in loops over large data that's the hidden cost.

- No arrays/objects/closures created inside loops over large data.
- Chained methods (`filter → map → sort → slice`) allocate an intermediate array per step — fine small, costly hot.
- Reuse buffers for repeated parsing/searching where safe.
- Cap every cache; evict; retain the small projection, not the full payload ([memory](memory.md)).

Clean version — the default:

```ts
const top = rows.filter(pred).map(toVM).sort(cmp).slice(0, 100);
```

Single pass with early exit — only once profiling proves the clean version is the bottleneck:

```ts
const out: VM[] = [];
for (let i = 0; i < rows.length; i++) {
  const r = rows[i];
  if (!pred(r)) continue;
  out.push(toVM(r));
  if (out.length >= LIMIT_BEFORE_SORT) break;
}
out.sort(cmp);
```

Readability wins until measurement says otherwise.

## Rapid events

Keypress/scroll/resize/pointermove must not trigger expensive work every tick. Debounce = run after input settles (search-as-you-type, autosave). Throttle = at most every N ms (scroll/resize).

## Virtualize anything that can grow large

Render a moving window of rows (+ small overscan), not all of them.

```
Virtualize: tables · trees · logs · chat history · search results ·
            file explorers · command-palette results · timelines · diagnostics
```

- Never eagerly render thousands of interactive rows (Lighthouse warns ~800+ DOM nodes, fails ~1,400+; large DOMs slow every layout and inflate memory).
- Small row markup; stable keys/identity.
- Fixed row height preferred; dynamic heights measured and cached.
- No per-row closures or per-row derived arrays — allocation multiplies by row count.
- Overscan a few rows so fast scrolls don't flash blank.

Use your framework's windowing library (`@tanstack/react-virtual`, `react-window` for React) or roll a custom one; the principle (window + overscan) is the same everywhere.

## Don't thrash layout

Reading a layout property (`offsetWidth`, `getBoundingClientRect`, `scrollTop`, `getComputedStyle`, ...) after a DOM write forces a **synchronous reflow**; doing it in a loop is "layout thrashing" — a top cause of slow interactions.

- Batch all reads, THEN all writes. Never read-write-read-write in a loop.
- `ResizeObserver`/`IntersectionObserver` instead of polling layout.
- No layout reads inside scroll handlers.

Bad — reflow every iteration:

```ts
for (const el of els) {
  el.style.height = el.offsetHeight + 10 + "px"; // read then write, N times
}
```

Good — read all, write all:

```ts
const heights = els.map((el) => el.offsetHeight);                   // all reads
els.forEach((el, i) => (el.style.height = heights[i] + 10 + "px")); // all writes
```

## Cheap CSS wins

- `content-visibility: auto` — skips render/layout of off-screen content on long pages; pair with `contain-intrinsic-size` to reserve space (avoids CLS/scrollbar jumps). Test in-page find and scroll restoration after adding it.
- `contain: layout paint` — isolates a subtree so its changes don't re-layout the page.
- `will-change` sparingly, just before an animation; leaving it set wastes memory promoting layers that don't need it.
- Shallow selectors and DOM depth in hot UI.

## Animate without touching layout (or framework state)

- 60fps motion animates ONLY `transform` and `opacity` — compositor-driven, skip layout/paint.
- NEVER animate width/height/top/left/margin/padding on a hot animation — each frame triggers layout.
- Do NOT drive a 60fps animation through framework state (render + reconcile per frame). Use CSS transitions/animations, Web Animations API, or direct style mutation; commit only final semantic state back to the framework (React specifics: [react rendering](react-rendering.md)).

Bad — layout property per frame:

```ts
function step() {
  box.style.left = (parseFloat(box.style.left) || 0) + 2 + "px"; // triggers layout
  requestAnimationFrame(step);
}
requestAnimationFrame(step);
```

Good — transform only:

```ts
let x = 0;
function step() {
  x += 2;
  box.style.transform = `translateX(${x}px)`; // no layout, runs on compositor
  requestAnimationFrame(step);
}
requestAnimationFrame(step);
```

Simple motion: pure CSS transition/animation — zero JS per frame.

## Event handling

- Event delegation: one container listener beats one per row in large lists (less memory, less setup).
- Scroll/touch/wheel listeners `{ passive: true }` when not calling `preventDefault` — browser scrolls without waiting on the handler.
- Replace JS handlers with CSS where possible (hover/focus/active states, many toggles).
- Remove imperatively added listeners ([memory](memory.md)).

Rapid events (keypress/scroll/resize/pointermove): debounce = run after input settles (search-as-you-type, autosave); throttle = at most every N ms (scroll/resize).

## CLS at the DOM level

- Explicit width/height (or aspect-ratio) on images, videos, iframes, ad slots — space reserved before load.
- Late content arrives into reserved space (skeletons with the final size).
- Banners/notices only into reserved space, else they shove the page under the user's cursor.

(Font-driven CLS and image loading strategy: [loading/network](loading-network.md).)

## TypeScript runtime hygiene

- `import type { ... }` for type-only imports — fully erased, never pulls a module into the bundle.
- String unions / `const` objects over runtime `enum`s — enums emit real objects; unions cost nothing at runtime.
- Validate at boundaries (network/storage/input), not repeatedly in hot paths. Zod-style validators on a hot path are a classic latency killer — validate once where data enters, then trust the type.
- Keep generated/wire API types separate from lean internal view models; don't pass bloated server shapes deep into the app.

## Compile-time speed

Slow `tsc` taxes every change:

- `incremental`; multi-package repos use project references + `composite` so unchanged projects aren't re-checked.
- Fast transpiler for emit (swc/oxc/esbuild; Turbopack is the default bundler since Next.js 16, Rolldown since Vite 8) with tsc type-checking only (`noEmit`). Transpile-only builds are dramatically faster than type-checked emit.
- Avoid pathological types: deeply recursive conditional/mapped types, giant unions (hundreds of members), over-clever generics blow up checker time and editor responsiveness.
- Profile slow builds: `tsc --extendedDiagnostics`, `--generateTrace <dir>` (open trace in a profiler). Checker still too slow: try `@typescript/native-preview` (tsgo, the Go-native TS7 compiler, ~10× faster).
- `interface` over equivalent intersection types for extended object types — caches better in the checker.

## Node / server-side TypeScript

Same shape/allocation/GC rules, plus:

- Never block the event loop with sync CPU work — chunk it or offload to a worker thread / child process.
- Stream large I/O (files, HTTP bodies) instead of buffering whole payloads.
- Reuse connections (HTTP keep-alive, DB pools); never one per request.
- Same leaks as browser: unremoved listeners, growing module-level caches/Maps, uncleared timers ([memory](memory.md)).
- Runtimes run `.ts` directly via type stripping (default since Node 22.18/23.6, stable 24.12+; same in Bun/Deno): erasable syntax only (`--erasableSyntaxOnly` enforces it), ignores tsconfig paths/enums/namespaces, no type checking — keep `tsc --noEmit` in CI.
