# Performance Lifecycle

> Load when the change concerns responsiveness, storage, credentials, lifecycle, resilience, or native UX.

## Performance rules

Measure before and after; no optimization claim without a measurement or stated proxy metric.

- Capture cold/warm startup milestones: process start, app ready, window creation, navigation start, first render, `ready-to-show`, first interaction, background-service readiness.
- Defer non-critical imports, services, migrations, menus, indexing, update checks, telemetry until needed or post-first-interaction.
- Bundle main/preload/renderer/statics for Electron's actual Chromium version; no legacy polyfills.
- Main process: no synchronous I/O, sync subprocess APIs, sync IPC, large JSON operations, CPU loops.
- Renderer: keep tasks short; schedule, virtualize, parse incrementally, offload to workers.
- Terminal/log/event UIs: coalesce chunks, cap retained history, virtualize rows, pause hidden consumers, propagate backpressure upstream.
- No network fetches for critical UI resources during startup.
- Remove the default application menu early if unused.
- Prevent white flashes: `ready-to-show` or window background matching the initial renderer background.
- Profile memory after repeated window open/close, workspace switches, reconnects, long streams. Detached listeners and hidden WebContents are leaks.

## Storage, credentials, privacy

- Use `app.getPath()` locations; no hand-built platform paths.
- Config + modest durable state in `userData`; large caches in a separate cache/`sessionData` location so they don't bloat backups.
- Secrets via `safeStorage` (or OS credential facility). Check Linux backend behavior; plaintext fallback is not secure.
- Plan migrations before enabling cookie encryption — reverting invalidates the existing cookie store.
- Persistent migrations atomic, versioned, recoverable across downgrade/interrupted update where the product requires it.
- Redact tokens, file contents, personal data, command args, URLs before logging/crash reporting.
- Start crash reporting early when used; obtain consent; document retention/upload behavior.
- Validate selected paths, archive entries, download names, symlinks before privileged file operations.

## Lifecycle and resilience

- Decide single-instance explicitly. If yes: acquire lock before creating state; validate second-instance args safely.
- Handle deep links identically for cold start and already-running instance.
- Observe renderer/child-process exits; classify clean exit vs crash vs kill vs OOM vs launch failure vs integrity failure before restarting.
- Detect renderer unresponsiveness; recover without discarding user state.
- Don't tie long-lived jobs, terminals, sessions to a BrowserWindow unless closing it is defined to terminate them.
- Graceful shutdown ordering for windows, streams, utility processes, databases, pending writes, update install — with bounded timeouts.
- Respond to suspend/resume, power-source, thermal changes when running heavy background work.
- Restore window bounds only after validating against currently connected displays.
- Make tray/dock/quit-on-close/reopen native per OS; don't inherit one platform's assumptions.

## Native UX and accessibility

- Use native menus, dialogs, notifications, recent documents, file associations, shortcuts where they aid OS integration.
- Preserve keyboard navigation, visible focus, semantic HTML, reduced motion, high contrast, zoom, screen-reader labels, text selection.
- Don't globally force accessibility mode; build and test accessible UI instead.
- Respect system theme/contrast; never encode state in color alone.
- Test frameless/title-bar layouts on every target OS, display scale, and left/right window-control arrangement.
- Don't hijack OS-reserved shortcuts or browser conventions without strong product reason + discoverable alternative.
