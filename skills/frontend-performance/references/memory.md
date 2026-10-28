# Memory

> Load when memory grows, views leak, caches retain data, or teardown/cleanup is in question. Reference instructions; load only this file when the trigger applies.

A healthy long-running app's memory **plateaus**. Climbing across repeated navigation or open/close cycles and never returning after GC = leak → slow degradation → crashes after long sessions. Framework-agnostic; React effect cleanup lives in [react rendering](react-rendering.md).

## Leak taxonomy

Something keeps a reference alive past its usefulness:

```
listeners added but never removed · setInterval/setTimeout never cleared ·
observers (Resize/Mutation/Intersection) never disconnected ·
WebSocket/EventSource/subscriptions never closed · async callback resolving into a
closure retaining dead context · cache with no max size/TTL · module-level
Map/Set/array that only grows · Map keyed by object refs (use WeakMap) · detached
DOM nodes referenced by JS/closure/array · stale closures capturing large data ·
retained UI subtrees holding heavy state · route transitions keeping previous
view's data forever · logs/history/undo stacks growing unbounded ·
URL.createObjectURL never revoked · workers never terminated
```

## Finding a leak

Two snapshots around a cycle that should return to baseline:

1. DevTools → Memory → heap snapshot #1.
2. Do the suspect cycle several times (open/close a view, navigate in/back).
3. Force GC (trash-can icon), take snapshot #2.
4. Comparison view ("Objects allocated between 1 and 2"): anything that should be freed but isn't = the leak.
5. Read the **Retainers** path on a retained object — it names exactly what holds it alive.

Detached DOM: nodes out of the document but reachable from JS — DevTools' detached-elements view or heap-search "Detached"; usual cause is a listener/cache/closure pointing at a removed node. Performance monitor (live JS heap + DOM node count) while exercising the app: sawtooth trending upward = leak; flat sawtooth healthy. Node: inspector heap snapshots or `--heapsnapshot-signal`, compare the same way.

## Cleanup patterns

Whatever you create, destroy:

```ts
// Listener — remove the SAME function reference
window.addEventListener("resize", onResize);
window.removeEventListener("resize", onResize);

// Timer
const id = setInterval(tick, 1000);
clearInterval(id);

// Observer
ro.observe(el);
ro.disconnect();

// AbortController — one signal cancels fetch AND removes listeners
fetch(url, { signal: controller.signal }).catch(() => {});
el.addEventListener("click", onClick, { signal: controller.signal });
controller.abort();

// Object URL
URL.revokeObjectURL(objectUrl);
```

Workers: `worker.terminate()` when done. Subscriptions: call the returned `unsubscribe`. In component frameworks run these in the teardown hook (React: `useEffect` return — patterns in [react rendering](react-rendering.md)).

## Cache discipline

An unbounded cache is a leak with good intentions.

- Every cache needs a bound: max entries (LRU), TTL, or both.
- Key by value where possible; key by object reference ⇒ WeakMap so entries collect with keys.
- Don't retain raw payload AND transformed view forever — pick one.
- Dashboards/time-series: cap retained points, downsample old data, destroy chart instances with the view.
- On route/view change release previous view's heavy data unless explicitly cached with a policy.

## Symptom → fix quick table

| Symptom | Fix |
|---|---|
| Memory climbs across navigation | release previous view data · disconnect observers/sockets on teardown · check detached DOM in retainers |
| Dashboard eats memory | cap/downsample time-series · destroy charts on teardown · store raw XOR transformed · lazy-load inactive views |
| Crashes after long use | find the unbounded grower (cache/log array/global Map) via two-snapshot comparison |
