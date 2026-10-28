# Anti-flake discipline

Flaky verification is worse than none — it trains everyone to ignore red.

```
- NEVER sleep(N) as synchronization. Wait for a condition: a locator state,
  a specific response, a data-state attribute, or a custom "ready" hook.
- Playwright's web-first assertions (expect(locator).toBeVisible()) auto-retry;
  raw page.evaluate assertions don't — poll or use expect.poll for those.
- Prefer waiting for a specific request/response over networkidle; apps with
  polling/websockets never go idle.
- Pin the environment: fixed viewport, deviceScaleFactor, timezone, locale,
  and Date (page.clock in Playwright / clock mocking) when output depends on
  them. Seed random data.
- Disable animations for both interaction (mid-transition clicks miss) and
  screenshots (mid-frame captures diff).
- Re-run a new check 3× before trusting it. If it flakes, the check is wrong
  or the app has a race — both are findings.
```

A flake reproduced under forced slowness is often a real bug: rerun the flow
with CPU throttling (CDP `Emulation.setCPUThrottlingRate`, 4–6×) and a delayed
network — races that "never happen" locally happen for real users.
