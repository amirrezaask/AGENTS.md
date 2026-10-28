# Release and testing

Preserve the existing packager unless the task requires migration. Check packaged resource paths and ASAR limitations; unpack native binaries and resources that must exist as real files. Rebuild native modules for the target Electron ABI and test affected OS/architecture combinations.

Choose fuses before signing, and verify them on the packaged artifact. Inspector-disabling fuses can prevent automation that launches through a debugger; use a separate inspectable test artifact when necessary rather than weakening the release artifact. Test the actual hardened release with a compatible smoke-test method.

Verify platform signing/notarization requirements from current official documentation. Check signatures after installer generation as well as app packaging. Test updater metadata, signing, channels, interrupted updates, and the supported rollback policy. Do not assume the updater behaves identically on each OS or package format.

For upgrades, inspect intervening release notes, breaking changes, OS support, native-module compatibility, Chromium behavior, and security defaults. Use intermediate majors when they help isolate compatibility failures; avoid a mandatory upgrade sequence without a concrete need.

Match tests to the changed boundary: payload and sender validation, preload exposure, navigation/permission denial, stream cancellation, process restart, or window lifetime. Distribution work also needs installed-path, first-run, offline, native-module, and update smoke checks on affected targets. Record platforms and release checks that remain unverified.
