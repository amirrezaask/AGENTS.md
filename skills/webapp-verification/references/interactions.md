# Rung 5 — Interaction verification

Walk the changed flow as a user, keyboard included:

```
- The primary path: fill → submit → success feedback → resulting state.
- The failure path: submit invalid input → actionable error, no data loss,
  no console explosion.
- The empty/loading/error trio: verify all three render states for any view
  that fetches (mock the API to force each: page.route()).
- Keyboard: Tab reaches the new control, Enter/Space activates it, Escape
  closes what it opened, focus lands somewhere sensible afterwards.
- Repeat-use: do the flow twice; the second run catches unreset state,
  duplicate listeners, and stale caches.
```

Force the hard-to-reach states instead of hoping:

```ts
await page.route("**/api/items", (r) =>
  r.fulfill({ status: 500, body: "{}" }));            // error state
await page.route("**/api/items", (r) =>
  r.fulfill({ json: [] }));                            // empty state
await page.route("**/api/items", async (r) => {       // slow state
  await new Promise((res) => setTimeout(res, 3000)); r.continue();
});
```
