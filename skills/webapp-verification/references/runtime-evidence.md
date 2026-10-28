# Runtime evidence

Attach console, page-error, failed-request, and relevant HTTP-error capture before navigation so startup failures are visible. Compare with an unchanged baseline when attribution is uncertain. A successful route response can still show a crash overlay or failed client request.

Verify observable invariants through roles, labels, rendered data, URL, storage, and request/response payloads as appropriate. A request firing does not establish that the form sent the right body or persisted its result. Prefer public state contracts; do not scrape React internals or add application debug hooks solely for routine verification.

Exercise the changed primary path and relevant failure/repeat-use cases. For asynchronous views, force loading, empty, and error states when affected. Mock at the existing network boundary with deterministic fixtures. Check keyboard activation and focus when controls change.

Wait for a specific state, response, or readiness contract. Avoid fixed sleeps and `networkidle` for apps with polling or streams. In Playwright, locator assertions retry; raw page evaluations need explicit polling when state changes asynchronously.

Keep data, locale, timezone, viewport, and clocks stable when they affect assertions. Disable animation for static layout comparisons, but preserve it when verifying motion. Reproduce suspected races under delayed network or CPU load; distinguish test synchronization faults from application failures.

For performance-sensitive changes, compare production traces or supported measurements on the same workload. A DOM-count increase alone does not establish a performance regression, and long-task entries require suitable observer capture.
