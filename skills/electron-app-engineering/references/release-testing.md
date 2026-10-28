# Release Testing

> Load when packaging, signing, updates, testing, upgrading, or reviewing release readiness.

## Packaging and release policy

Default to Electron Forge for new projects; don't migrate a working packager for preference.

- Package app code into ASAR; explicitly unpack native binaries and runtime-loaded resources that can't execute from ASAR.
- Rebuild native Node modules against the exact Electron ABI (`@electron/rebuild`); test every supported OS/arch combination.
- Package manager must produce a physical `node_modules` layout compatible with packaging tools.
- Code-sign Windows and macOS releases; notarize macOS (staple the ticket). Validate signatures after packaging AND after installer creation.
- Flip fuses deliberately (Forge fuses plugin / builder `electronFuses`). Harden: disable `runAsNode`, `NODE_OPTIONS`, CLI inspect args, `grantFileProtocolExtraPrivileges`; enable cookie encryption, embedded ASAR integrity (macOS/Windows), `onlyLoadAppFromAsar` where compatible. Flip after packaging, before signing.
- Keep a test strategy that doesn't require inspector flags production disables — Playwright's `_electron.launch()` fails if the `EnableNodeCliInspectArguments` fuse is false, so use a separate inspectable test build; never weaken the release artifact.
- Built-in autoUpdater: macOS + Windows only; macOS requires a signed app; Linux ships via distro package manager (or electron-updater for AppImage/deb/rpm).
- Protect update metadata/artifacts: HTTPS, signed manifests, controlled publishing, rollback plan, channel separation.
- Publish artifacts as drafts first; inspect, run packaged smoke tests, then promote.
- Dev success is insufficient: test installed paths, read-only resources, first run, upgrade/downgrade policy, uninstall, deep links, file associations, offline launch.

## Signing reality (2026)

- CA/B Forum CSC-31: code-signing certificates issued on/after 2026-03-01 max validity **460 days** — automate renewal.
- Private keys must be hardware-backed (HSM/token). For CI, sign via cloud HSM services (Azure Trusted Signing, DigiCert KeyLocker, etc.) instead of local USB tokens.

## Testing strategy

Layered suite:

1. Pure unit tests: domain logic, serializers, URL allowlists, path rules, permission policy, reducers.
2. Contract tests per preload capability and IPC validator: unauthorized sender, malformed payload, timeout, cancellation, process restart.
3. Renderer component/accessibility tests in a browser-like environment where Electron is irrelevant.
4. Electron integration: window creation, preload exposure, navigation policy, native dialogs, MessagePorts, utility processes, crash recovery.
5. Small high-value Playwright Electron suite (support is experimental).
6. Packaged smoke tests on native CI runners per release OS/arch; Linux headless CI may need Xvfb.
7. Release tests: signatures, notarization, fuses, ASAR integrity, native-module loading, installer behavior, updates.
8. Performance regression tests: startup, interaction latency, memory, CPU, sustained streams.

Prefer deterministic fixtures, fake clocks, local update servers, injectable native adapters. Don't make most business logic require a real Electron process.

## Upgrade procedure

1. Verify current supported lines (latest 3 majors) and target OS support.
2. Inventory native modules, Forge/plugins, Node assumptions, Chromium behavior, command-line switches, removed APIs, deprecated embeds (e.g., BrowserView → WebContentsView).
3. Read every intervening release note and planned breaking-change entry.
4. Upgrade one major at a time; rebuild native modules; run static/unit/integration/packaged/platform tests.
5. Re-inspect security defaults and fuses each major — they evolve.
6. Measure startup, memory, rendering, workload throughput before/after.
7. Repeat until reaching the intended supported line.

Never bypass peer-dependency or native-build failures with `--force`.

## Review severities

Format lives in SKILL.md § Delivery contract.

- **Critical**: arbitrary code execution, credential compromise, malicious update path
- **High**: broken trust boundary, unauthenticated privileged IPC, unsafe remote content, signature/update failure, severe data-loss/crash risk
- **Medium**: meaningful hardening/responsiveness/reliability/packaging/maintainability gap
- **Low**: defense-in-depth, native polish, minor efficiency/cleanup

## Definition of done

A production change is complete when applicable items hold:

- Renderer sandboxed, context-isolated, Node-free
- Preload exposes only narrow typed capabilities
- IPC payload + sender validation exist
- Navigation, new windows, external URLs, permissions allowlisted
- Main event loop non-blocking
- Sustained streams bounded and backpressured
- Sensitive data storage/logging reviewed
- Failure, restart, shutdown behavior defined
- Native UX and accessibility preserved
- Packaged app tested, not just dev mode
- Native modules load on every target arch
- Fuses, ASAR integrity, signatures, notarization, updater verified
- Current support window + breaking changes checked
- Security/performance/regression tests cover the changed boundary
