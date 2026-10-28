# Performance and lifecycle

Measure startup milestones separately: process start, app ready, navigation, first render/interaction, and background-service readiness. Defer noncritical services only when their readiness contract permits it. Check main-process synchronous I/O, subprocesses, CPU work, and large serialization before optimizing renderer code.

For streaming/log/terminal windows, bound retained history and queued messages, batch updates, and pause hidden consumers. Measure repeated window open/close, workspace switches, and reconnects for retained WebContents, listeners, ports, workers, and timers.

Give each long-lived job an owner independent of a window when it should survive window closure. Handle second-instance and deep-link inputs consistently at cold start and while running. Validate restored bounds against current displays. Define bounded shutdown ordering for jobs, streams, databases, writes, and update installation.

Use Electron's path APIs for platform state locations. Separate large caches from durable user data. Check the actual `safeStorage` backend, particularly Linux plaintext fallbacks. Treat cookie-encryption changes as storage migrations and test rollback where supported.

Classify child/renderer exit causes before restarting. Preserve recoverable user state across crashes and unresponsiveness. For heavy background jobs, consider suspend/resume and power constraints. Test affected native controls, title bars, menus, and shortcuts on their target OS.
