# Disk and process use

The user explicitly requires avoiding unnecessary repository, asset and dependency copies.
Implement and test in the existing checkout, reusing its installed dependencies and assets.
Create a frozen candidate only when a concrete verification gate needs one; measure its
size and available disk first, enforce a budget, and retire obsolete generated payloads.
Preserve unique source changes, saved data, manifests, receipts and logs during cleanup.
Do not copy the repository's bulk game/blob/runtime stores into a Minecraft candidate.

Every started test, build or preview needs an owner, a bounded lifetime and cleanup.
Track children and terminate the entire owned process group on cancellation, timeout,
resource overrun or completion. A JavaScript heap limit does not bound RSS or buffers;
measure actual process-group memory for heavy jobs. Do not terminate another task's
processes merely because they are long-lived.
