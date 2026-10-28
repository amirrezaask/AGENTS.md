---
name: electron-app-engineering
description: Design, implement, review, migrate, secure, optimize, test, package, sign, update, and troubleshoot production Electron applications. Use for Electron main/preload/renderer architecture, BrowserWindow or WebContentsView, IPC, utility processes, remote content, native modules, Forge packaging, code signing, auto-updates, performance, security audits, or Electron upgrades—even when the request is framed as a React desktop application problem. Shell/main-process performance belongs here; web-content rendering perf inside pages uses frontend-performance.
compatibility: Agent Skills-compatible clients. Requires repository access for implementation or audits; network access is useful for verifying current Electron releases and breaking changes.
metadata:
  category: desktop
  version: "1.2.0"
  researched: "2026-08-22"
---

# Electron App Engineering

Inspect before changing: package/lock files, Electron/Forge config, entry points, preload scripts, installers, updaters, native modules, CI.

## Establish the actual shape

Determine: Electron major (only latest 3 stable majors supported; 8-week cadence), target OS/arch/min versions, package manager, bundler/packager, main/preload/renderer/worker/utility entry points, local vs remote content, privileged capabilities, long-running workloads, window lifetime, offline behavior, crash recovery. Treat CLI args, deep links, protocol payloads, dropped files, clipboard, downloads, renderer input as untrusted.

Draw the boundary before changing it:

```text
OS/external input → main lifecycle + capability broker
                  → narrow validated preload API
                  → sandboxed renderer
                  ↕ bounded MessagePort streams
                  utility process/worker for isolated heavy work
```

Per boundary identify caller, accepted input, validation, authorization, cancellation, timeout, result/error shape, logging, cleanup.

## Architectural defaults

- Main owns lifecycle, windows, native UI, global policy, privileged orchestration. Never block its event loop: no sync I/O, sync subprocess APIs, sync IPC, CPU loops, large JSON parsing.
- Renderer is an untrusted web boundary: no Electron/Node imports, credentials, unrestricted filesystem paths, or raw native capabilities.
- Preload is a capability adapter, not business logic. Expose one typed purpose-built method per capability via `contextBridge`.
- `utilityProcess` for long-lived crash-isolated Node/native work; Web Workers for renderer-scoped CPU work; MessagePorts for sustained streams with bounded buffering and backpressure.
- Own window/listener/port/timer/worker/process lifetimes explicitly. Define restart, shutdown, suspend/resume, and second-instance behavior before implementing.

## Security baseline

Start every production window from this hardened config (`contextIsolation` default since E12, `sandbox` since E20 — keep both explicit):

```ts
new BrowserWindow({
  show: false,
  webPreferences: {
    preload: preloadPath,
    contextIsolation: true,
    sandbox: true,
    nodeIntegration: false,
    webSecurity: true,
    allowRunningInsecureContent: false,
    experimentalFeatures: false,
    webviewTag: false,
  },
});
```

Also enforce:

1. Serve bundled production UI over a privileged custom protocol.
2. Load remote content only over secure transport, no Node integration, minimal/empty preload API.
3. Restrictive production CSP; no `unsafe-eval`.
4. Deny unexpected navigation, frames, new windows. Parse URLs; compare exact protocol/host/port/path.
5. Route external links through one exact allowlist; never pass arbitrary values to `shell.openExternal`.
6. Configure permission-check and permission-request handlers; deny by default.
7. Validate IPC payloads and sender frame/origin in the privileged process.
8. Never expose `ipcRenderer`, generic `send`/`invoke`, channel selection, or raw Electron objects to web content.
9. Never disable sandbox, context isolation, or web security to fix dev bugs.
10. Avoid `<webview>` unless an isolated, equivalently governed design is proven.
11. Treat ASAR as packaging, not secrecy; rely on signing, fuses, integrity validation.
12. Spawn executables with argument arrays; no shell interpolation of untrusted data, no `shell: true` for user-controlled values.
13. Keep secrets out of renderer storage, URLs, logs, crash metadata, updates.

Any exception states reason, scope, compensating controls, owner, test, removal condition.

## IPC contract

Pick transport by semantics:

- request/result → `ipcRenderer.invoke` behind a preload method
- narrow main→renderer notification → typed subscription with cleanup
- sustained bidirectional stream → transferred MessagePort with flow control
- heavy isolated Node/native service → `utilityProcess`
- renderer CPU work → Web Worker

Centralize channels; type requests/responses/errors; runtime-validate payloads; authorize sender + capability; add timeouts/cancellation; return serializable sanitized data; clean up listeners; make registration idempotent. No synchronous IPC for application work. Streams define sequence, batching, bounds, backpressure, disconnect, resume.

## Load focused references

- [Performance and lifecycle](references/performance-lifecycle.md) — startup, memory, storage, credentials, failure recovery, shutdown, native UX.
- [Release and testing](references/release-testing.md) — packaging, native modules, fuses, signing/notarization, updates, test layers, upgrades, review/done criteria.
- [Official sources](references/sources.md) — current Electron, Forge, Playwright, platform docs. Re-check versioned facts.

## Delivery contract

Reviews report per finding:

```text
[SEVERITY] Finding
Evidence: path:line and configuration
Risk: concrete exploit, failure, or user impact
Fix: smallest safe remediation
Verification: exact test or inspection
```

Implementation tasks: make the change, then list changed files, tests, packaged checks, assumptions, accepted exceptions. Dev success ≠ release verification: test the installed artifact on each target OS/arch.
