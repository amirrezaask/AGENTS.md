# React Rendering

> Load when diagnosing render fan-out, state ownership, Context, selectors, lists, keys, memoization, the React Compiler, effects, cleanup, concurrency, or animation. Reference instructions; load only when the trigger applies.

React performance is decided by **where state lives** and **what each state change invalidates** — not by memoization. Keep state low and narrow, renders pure and cheap.

## State ownership — keep state low and narrow

A state update re-renders the owning component and everything below.

- Colocate UI-only/transient state (hover, focus, mouse/scroll/drag position, input text) in the component using it; higher placement re-renders the subtree on every keystroke/pixel.
- Split state by update frequency: a 60×/s value never shares an object with per-session config.
- Split state by consumer group: don't bundle data that distant unrelated components each subscribe to.
- Use a ref for mutable values that must NOT trigger a render (last scroll position, timer id, imperative handle).
- Lift state up only for a genuine shared source of truth — then prefer an external store (below) over prop drilling.

```tsx
function SearchBox() {
  const [query, setQuery] = useState("");
  // only the input + its results re-render
}
```

## Context — no selectors, all-or-nothing

Every consumer re-renders when the context **value identity** changes, even if its slice didn't.

- Never put one big mutable app object in a single Context.
- Split by domain and update frequency; keep read-mostly config separate from hot-changing state.
- Memoize the provider value only if it measurably prevents consumer churn.
- High-frequency state with many consumers: don't use Context — use a selector-based external store.

## External stores with selectors

For frequently-changing state read by many components, `useSyncExternalStore` (directly or via Zustand/Jotai/Valtio/Redux Toolkit) subscribes each component to only its slice:

```tsx
const selected = useStore(
  (s) => s.items[id],   // smallest useful slice
  shallowEqual          // unchanged data => no render
);
```

- Subscribe to the smallest useful slice.
- Selectors must return stable values when data didn't semantically change. `s.items.map(...)` allocates every call and defeats the purpose — derive once or use a shallow/structural comparator.
- Normalize by id only when it measurably reduces fan-out; normalization has its own cost.

## Render — pure and cheap

Render runs often; anything expensive in it runs often.

- Never parse, filter, sort, format, or schema-validate in render.
- Never allocate large derived structures or big inline arrays/objects during render.
- Don't mount huge hidden subtrees just to toggle them; unmount, lazy-load, virtualize, or use `<Activity>`.

Bad — mutates props and re-sorts every render:

```tsx
function Table({ rows }: Props) {
  const sorted = rows.sort(compare);          // mutates! re-sorts every render
  return sorted.map((r) => <Row key={r.id} row={r} />);
}
```

Better — derive once, render only the visible window:

```tsx
function Table({ rows }: Props) {
  const sorted = useMemo(() => [...rows].sort(compare), [rows]);
  return <VirtualTable rows={sorted} />;   // virtualization: see javascript-dom-css.md
}
```

Best: sort once at the data boundary, keep rows indexed, pass only the visible window. The cheapest render never happens.

## List keys — identity is correctness AND performance

Keys tell React which elements are the *same* across renders; wrong keys cause wasted reconciliation plus state bugs.

- Key by stable domain id (`r.id`), never index when the list reorders/inserts/filters — index keys remap every row's state and DOM on reorder.
- Never key by `Math.random()` or a value recreated each render — remounts the row every render.
- A deliberately CHANGED key is a tool: `key={resetToken}` resets a subtree's state without effects.
- Keep ids stable through sort/filter so React moves nodes instead of rebuilding.

## Effects

Effects are the other big source of slowness and leaks.

- Do NOT compute derived state in an effect — derive during render (`useMemo` if expensive). The effect path renders twice and risks loops/desync.
- Do NOT copy props/state into local state via an effect unless syncing with an external system.
- ALWAYS clean up: subscriptions, timers/intervals, observers, workers, listeners, object URLs (leak-hunting workflow: [memory](memory.md)).
- Abort obsolete fetches with `AbortController`.
- For an event-like read of latest props that shouldn't re-run the effect, use `useEffectEvent` (19.2) instead of widening deps.

Bad — derived state via effect (extra render, easy to desync):

```tsx
const [filtered, setFiltered] = useState<Item[]>([]);
useEffect(() => setFiltered(items.filter(matches)), [items, query]);
```

Good — derive in render:

```tsx
const filtered = useMemo(() => items.filter(matches), [items, query]);
```

Mandatory cleanup patterns:

```tsx
useEffect(() => {
  const controller = new AbortController();
  fetch(url, { signal: controller.signal }).then(/* ... */).catch(() => {});
  return () => controller.abort();
}, [url]);

useEffect(() => {
  const unsubscribe = store.subscribe(listener);
  return unsubscribe;          // run on unmount / before re-run
}, [store]);

useEffect(() => {
  const objectUrl = URL.createObjectURL(file);
  setPreview(objectUrl);
  return () => URL.revokeObjectURL(objectUrl);
}, [file]);
```

## Concurrent features — keep the UI responsive

Urgent updates (typing, clicking) stay snappy while non-urgent updates render in the background. Main INP lever when a heavy render is unavoidable.

```
useTransition / startTransition  Mark an update non-urgent: input stays responsive,
                                 expensive re-render is interruptible. Use for
                                 filtering, heavy tab switches, navigation.

useDeferredValue                 Render expensive UI from a lagging copy of a
                                 fast-changing value. Use when you don't own the
                                 setter (value arrives via props).

<Activity> (19.2)                Hide a subtree without unmounting: stops rendering,
                                 unmounts its effects, preserves state, pre-renders
                                 at low priority. For tabs/wizards/routes to show
                                 instantly later without losing state — better than
                                 keep-mounted (memory + render cost) or unmounted
                                 (lost state, slow remount).

useEffectEvent (19.2)            Read latest props/state inside an effect without
                                 adding them to the dependency array.

<ViewTransition> (canary)        Declarative transition/route animations via the
                                 browser View Transitions API. Not yet stable.
```

```tsx
const [isPending, startTransition] = useTransition();

function onChange(next: string) {
  setQuery(next);                                   // urgent: input updates now
  startTransition(() => setResults(search(next)));  // non-urgent: interruptible
}
```

These keep INP low: the interaction commits a small urgent update immediately and yields instead of blocking on a giant render.

## Animating without React state

A 60fps animation must not go through `setState` — that's a render + reconcile per frame.

- Drive motion with CSS transitions/animations, Web Animations API, a motion library's animated values, or ref + transform mutation.
- React owns state transitions (drag started/ended), never every frame. Commit final semantic state back.
- Why transform/opacity specifically, and the JS-level patterns: [JavaScript, DOM & CSS](javascript-dom-css.md).

Bad — a render per frame:

```tsx
useEffect(() => {
  const id = requestAnimationFrame(() => setX(x + 1));
  return () => cancelAnimationFrame(id);
}, [x]);
```

Better: mutate `transform` off the render path via a ref; tell React only the outcome.

## Profiling before memoizing

| Tool | Use for |
|---|---|
| React DevTools Profiler | Flamegraph, commit timings, "why did this render"; `Memo ✨` badge = compiler already handles it |
| react-scan | Zero-config overlay highlighting re-rendering components; programmatic `getReport()` for CI |
| why-did-you-render | Prop/state diff for "memoized child still re-renders" mysteries; low maintenance |
| React Performance Tracks (19.2) | React scheduler/suspense lanes in the browser Performance panel (dev builds only) |

## React Compiler 1.0 (stable since Oct 2025)

Build-time transform that auto-memoizes components and hooks by analyzing data flow — including conditional memoization manual `useMemo`/`useCallback` cannot express.

- Shipped through `eslint-plugin-react-hooks` v6+ (old `eslint-plugin-react-compiler` merged in). Enable the linter everywhere even if you don't enable the compiler.
- Opt-in everywhere: Next.js `reactCompiler: true` is a stable flag but **not default** (Babel-based; SWC fast-path limits it to files with JSX/hooks). Expo SDK 54+ behind `experiments.reactCompiler`. Vite via the Babel plugin.
- Works on React 17+, no runtime of its own (output is plain React).
- `"use memo"` opts a function in under `compilationMode: 'annotation'`; `"use no memo"` opts out.

What this changes:

- On a compiler-enabled codebase most manual `useMemo`/`useCallback`/`React.memo` is redundant — re-audit and remove cargo-culted memoization after enabling.
- The compiler assumes the Rules of React; `react-hooks/unsupported-syntax` flags violations. Fix the violation; don't paper over it.
- Treat every `"use no memo"` as a TODO and performance cliff. Comment why.
- Not magic: reduces re-render *cost* only. Cannot fix bad state placement, over-broad Context, heavy render work, or missing virtualization. Architecture still matters more.

## Manual memoization — when it still earns its place

Reach for manual memoization only when one holds:

```
- The calculation is measurably expensive.
- The value goes to a memoized child whose identity must stay stable.
- The value is a hook dependency whose identity churns.
- A profile shows re-renders are the bottleneck.
```

Never do this — memoization costs more than the work it "saves":

```tsx
const sum = useMemo(() => 1 + 2, []);
const onClick = useCallback(() => setOpen(true), []);
```

Do this — protect genuinely expensive derivation:

```tsx
const visibleRows = useMemo(() => filterRows(rows, query), [rows, query]);
```

- Don't cargo-cult `useMemo`/`useCallback` onto cheap primitive work.
- Don't use memoization to hide bad state structure — that treats symptoms.
- `React.memo` only helps if props are referentially stable; inline object/array/function props defeat it.

## Review checklist

| Smell | Usual fix |
|---|---|
| High-frequency state high in the tree | Move state down |
| Context value recreated/updated more often than consumers need | Split Context or switch to selector store |
| Render-time sorting/filtering/parsing/formatting/validation | Derive once outside render or memoize |
| Derived state computed in an effect | Compute during render |
| Missing cleanup (subscriptions, timers, observers, workers, listeners, object URLs, fetches) | Return cleanup from effect; abort fetches |
| Large lists without virtualization or stable keys | Virtualize; key by domain id |
| Selectors allocating new arrays/objects per read | Return stable slices; shallow compare |
| Unstable props defeating memoized child | Stabilize only what needs identity |
| Cargo-culted `useMemo`/`useCallback`/`React.memo` | Delete unless profile shows benefit |
| 60fps animation driven through React state | CSS/WAAPI/ref transforms; commit final state only |
| Inactive heavy tabs kept mounted | `<Activity>` or unmount policy |

Fix in this order: move state down → split state/Context/store by frequency and consumer → narrow subscriptions with stable selectors → stabilize only props that need stability → memoize genuinely expensive work after profiling.

Correctness gates: stable keys preserve identity, effects synchronize external systems rather than derive state, transitions must not drop urgent input.

## Symptom → fix

```
Typing feels slow         local input state · useDeferredValue/startTransition for
                          results · search/indexing in a worker · virtualize results ·
                          kill the per-keystroke global update

Too many renders          move state down · split components · split Context ·
(Profiler shows it)       selector subscriptions · stabilize props · remove parent
                          update from hot path

Context repaints tree     split Context by frequency/domain · memoize provider value ·
                          or switch to selector-based store

Slow expensive list/tree  virtualize · sort/filter at the data boundary, not render
```
