# Validate the lint policy

Run the repository's regression checks, then verify policy behavior:

- Inspect effective configs for representative files, including nested packages. Confirm source coverage, ignores, plugin lists, and file-class overrides.
- Run fast lint and, when configured, typed lint after required declaration generation. Keep resolution failures distinct from rule findings.
- In hybrid setups, test representative violations to confirm custom checks survived and overlapping diagnostics appear once.
- Check editor/CLI parity when editor integration changed. Run type checks and relevant tests after fixes.
- For latency work, compare timings and memory on the same file set. Investigate accidental inclusion, large TypeScript programs, duplicate engines, and rule cost before dropping useful checks.

Report commands actually run, remaining findings, exceptions, residual ESLint responsibilities, and unverified integration. Keep the report proportional to the change.
