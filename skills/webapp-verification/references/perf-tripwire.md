# Performance spot-check (when the change could regress it)

Not a full perf audit (see frontend-performance), but a
tripwire for changes touching lists, hot interactions, or startup:

```ts
const metrics = await page.evaluate(() => ({
  nodes: document.getElementsByTagName("*").length,
  longTasks: performance.getEntriesByType("longtask").length, // needs observer buffered
  heapMB: (performance as any).memory?.usedJSHeapSize / 1048576,
}));
```

- DOM node count jumped by thousands → missing virtualization.
- Do the interaction with a Performance trace or long-task observer running;
  a new >50 ms task on a keystroke path is a regression.
- Verify against a production build (`vite build && vite preview`) before
  reporting perf numbers — dev builds lie.
