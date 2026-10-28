---
name: electron-app-engineering
description: Build or troubleshoot Electron process boundaries, IPC, native lifecycle, packaging, signing, and updates. Use when a change depends on Electron APIs or desktop behavior.
metadata:
  category: desktop
---

# Electron engineering

Inspect the installed Electron version, main/preload/renderer entry points, packager, native modules, and target platforms. Verify version-sensitive APIs and release requirements against current official docs.

## Process boundaries

Main owns privileged capabilities and lifecycle. Expose narrow preload methods through `contextBridge`; keep raw IPC objects, generic channel dispatch, credentials, and unrestricted filesystem access out of web content. Validate payloads and sender frame/origin in the privileged process.

Keep renderer isolation, sandboxing, and disabled Node integration. Control navigation, new windows, external URLs, permissions, and remote content at the relevant boundary. A URL substring check is insufficient authorization. Do not weaken isolation to fix a development issue.

Keep main's event loop responsive. Choose workers for renderer CPU work, utility processes for isolated Node/native services, and MessagePorts for sustained streams. Define buffering bounds, cancellation, disconnect behavior, and cleanup for the boundary being changed.

## Focused references

- [Performance and lifecycle](references/performance-lifecycle.md): startup, leaks, credentials, window/process ownership, shutdown.
- [Release and testing](references/release-testing.md): packaging, native ABI, fuses, signing, updater, upgrades.
- [Official sources](references/sources.md): resolve API or platform requirements as needed.

Verify changed trust boundaries and failure paths. For distribution changes, exercise the packaged artifact on affected targets; distinguish development checks from release verification. Ordinary page styling or React logic does not require an Electron-wide audit.
