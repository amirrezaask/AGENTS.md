# Rung 4 — State inspection

Pixels can look right while state is wrong (stale store, wrong URL, unsaved
form). Inspect the truth, not the paint.

## DOM and accessibility tree

Prefer role/name queries over CSS selectors — they assert semantics, survive
refactors, and verify accessibility for free:

```ts
await expect(page.getByRole("button", { name: "Save" })).toBeEnabled();
await expect(page.getByRole("alert")).toHaveText(/saved/i);
await expect(page.getByRole("row")).toHaveCount(20);
```

For structure/content checks, evaluate in the page:

```ts
const state = await page.evaluate(() => ({
  rowCount: document.querySelectorAll("[data-testid=row]").length,
  activeTab: document.querySelector("[aria-selected=true]")?.textContent,
  overflowing: [...document.querySelectorAll("*")].filter(
    (el) => el.scrollWidth > el.clientWidth + 1 &&
            getComputedStyle(el).overflowX === "visible"
  ).length,
}));
```

Dump the accessibility tree when a screen's semantics matter — it catches
missing labels, wrong roles, and unreachable controls that screenshots hide:

```ts
const yaml = await page.locator("body").ariaSnapshot();   // inspect (Playwright ≥1.49)
await expect(page).toMatchAriaSnapshot(`- banner: ...`);  // assert structure
// Legacy page.accessibility.snapshot() is deprecated — do not use in new checks.
```

## URL, storage, and network as state

```ts
expect(page.url()).toContain("/orders/42");                 // routing state
const draft = await page.evaluate(() => localStorage.getItem("draft"));
const [resp] = await Promise.all([                           // server state
  page.waitForResponse((r) => r.url().includes("/api/orders") && r.ok()),
  page.getByRole("button", { name: "Save" }).click(),
]);
expect((await resp.json()).status).toBe("saved");
```

Verify the request payload too, not just that a request fired — a form that
submits the wrong body "works" visually.

## Framework / store state

When DOM assertions are too indirect, read the app's own state:

- Best: the app exposes a test hook in dev builds —
  `if (import.meta.env.DEV) window.__appState = () => store.getState();`
  then `await page.evaluate(() => window.__appState())`. Add this hook when it
  doesn't exist; it pays for itself immediately. Keep it dev-only.
- Zustand/Redux: read the store via the exposed hook or Redux DevTools
  extension messages.
- Otherwise, treat data-* attributes as the state contract: render the
  interesting state into `data-state`, `data-count`, `aria-*` and assert those.
- Do NOT scrape React internals (`__reactFiber$…`) — brittle across versions;
  use it only as a last-resort debugging aid, never in kept checks.

## Assert the invariant, not the incidental

Check what must be true ("3 rows, sorted by date desc, total shows $120"), not
what happens to be true ("the second div has class css-1x2y3"). Incidental
assertions rot and make future verification noisy.
