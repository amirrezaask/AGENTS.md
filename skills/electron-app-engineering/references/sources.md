# Sources

> Load when checking official Electron, Forge, Playwright, platform, or Agent Skills documentation.

Research date: **2026-08-22**. Latest stable major: Electron 43 (supported lines 41–43; E44 stable ~2026-08-25). Re-check releases and breaking changes before version-specific work.

## Agent Skills format

- Specification: https://agentskills.io/specification
- Skill best practices: https://agentskills.io/skill-creation/best-practices
- Client implementation: https://agentskills.io/client-implementation/adding-skills-support

## Electron releases and migration

- Current releases: https://releases.electronjs.org/
- Release schedule (alpha/beta/stable/EOL dates): https://releases.electronjs.org/schedule
- Timelines/support policy: https://www.electronjs.org/docs/latest/tutorial/electron-timelines
- Planned breaking changes: https://www.electronjs.org/docs/latest/breaking-changes
- Electron 43 release notes: https://www.electronjs.org/blog/electron-43-0

## Architecture and IPC

- Process model: https://www.electronjs.org/docs/latest/tutorial/process-model
- Sandboxing: https://www.electronjs.org/docs/latest/tutorial/sandbox
- Context isolation: https://www.electronjs.org/docs/latest/tutorial/context-isolation
- IPC guide: https://www.electronjs.org/docs/latest/tutorial/ipc
- Preload tutorial: https://www.electronjs.org/docs/latest/tutorial/tutorial-preload
- MessagePorts: https://www.electronjs.org/docs/latest/tutorial/message-ports
- utilityProcess: https://www.electronjs.org/docs/latest/api/utility-process
- WebContentsView: https://www.electronjs.org/docs/latest/api/web-contents-view
- Web embeds: https://www.electronjs.org/docs/latest/tutorial/web-embeds
- window.open: https://www.electronjs.org/docs/latest/api/window-open

## Security and privileged APIs

- Security checklist: https://www.electronjs.org/docs/latest/tutorial/security
- Session/permission handlers: https://www.electronjs.org/docs/latest/api/session
- Protocol API: https://www.electronjs.org/docs/latest/api/protocol
- Fuses: https://www.electronjs.org/docs/latest/tutorial/fuses
- ASAR integrity: https://www.electronjs.org/docs/latest/tutorial/asar-integrity
- safeStorage: https://www.electronjs.org/docs/latest/api/safe-storage
- Shell API: https://www.electronjs.org/docs/latest/api/shell

## Performance and operability

- Performance checklist: https://www.electronjs.org/docs/latest/tutorial/performance
- BrowserWindow/ready-to-show: https://www.electronjs.org/docs/latest/api/browser-window
- Debugging: https://www.electronjs.org/docs/latest/tutorial/application-debugging
- Crash reporter: https://www.electronjs.org/docs/latest/api/crash-reporter
- Power monitor: https://www.electronjs.org/docs/latest/api/power-monitor
- App lifecycle: https://www.electronjs.org/docs/latest/api/app
- WebContents events: https://www.electronjs.org/docs/latest/api/web-contents

## Packaging, signing, updates

- Distribution: https://www.electronjs.org/docs/latest/tutorial/application-distribution
- Packaging tutorial: https://www.electronjs.org/docs/latest/tutorial/tutorial-packaging
- Code signing: https://www.electronjs.org/docs/latest/tutorial/code-signing
- Updating tutorial: https://www.electronjs.org/docs/latest/tutorial/updates
- autoUpdater: https://www.electronjs.org/docs/latest/api/auto-updater
- Native Node modules: https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules
- Forge: https://www.electronforge.io/
- Forge build lifecycle: https://www.electronforge.io/core-concepts/build-lifecycle
- Forge Vite plugin: https://www.electronforge.io/config/plugins/vite
- Forge fuses plugin: https://www.electronforge.io/config/plugins/fuses
- Forge auto-unpack natives: https://www.electronforge.io/config/plugins/auto-unpack-natives
- Forge macOS signing: https://www.electronforge.io/guides/code-signing/code-signing-macos
- Forge Windows signing: https://www.electronforge.io/guides/code-signing/code-signing-windows
- @electron/rebuild: https://github.com/electron/rebuild
- CA/B Forum code-signing requirements (460-day cap, HSM keys): https://cabforum.org/working-groups/code-signing/requirements

## Testing and accessibility

- Automated testing: https://www.electronjs.org/docs/latest/tutorial/automated-testing
- Playwright Electron API (experimental): https://playwright.dev/docs/api/class-electron
- Playwright CI/Xvfb: https://playwright.dev/docs/ci
- Accessibility: https://www.electronjs.org/docs/latest/tutorial/accessibility

Normative guidance comes from official Electron security/performance checklists, process-model docs, Forge docs, release policy, and Playwright's Electron API. Engineering syntheses (test pyramid, streaming protocol, utility-process ownership) are decision rules, not Electron API requirements.
