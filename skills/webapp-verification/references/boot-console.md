# Rungs 2–3 — Boot and console

Load the page and capture everything the browser complains about BEFORE
asserting anything:

```ts
const errors: string[] = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("requestfailed", (r) =>
  errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
page.on("response", (r) => {
  if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`);
});

await page.goto(url, { waitUntil: "domcontentloaded" });
```

## Rules

- Attach listeners before `goto`, or you miss startup errors.
- A hydration mismatch warning, a failed chunk load, a 404 on an API route, or
  a React "key" warning is a FINDING even if the page looks fine.
- Distinguish new noise from pre-existing noise: capture the console on the
  base branch/state once, and diff against it. Don't launder old errors into
  your change, and don't get blamed for them either — report them separately.
