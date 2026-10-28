---
name: resource-bounded-runs
description: Bound disk and process use for large asset copies, frozen candidates, or resource-heavy build, preview, test, and benchmark runs.
---

# Resource-bounded runs

Reuse installed dependencies and assets. Before creating a frozen candidate,
identify the verification gate that needs it, measure its expected size and
available disk, and set a disk budget. Exclude unrelated game/blob/runtime stores
from candidates. Retire obsolete generated payloads while preserving unique
source changes, saved data, manifests, and retained evidence.

Give each started build, preview, or test an owner and bounded lifetime. Track
its children and clean up the owned process group on completion, cancellation,
timeout, or resource overrun. Leave other tasks' processes alone.

For heavy jobs, measure process-group memory: a JavaScript heap limit does not
bound RSS or buffers. Follow the repository's worktree policy while reusing
large assets rather than copying them into each checkout.
