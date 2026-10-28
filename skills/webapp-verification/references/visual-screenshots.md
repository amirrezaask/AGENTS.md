# Visual checks

Capture the changed state after its readiness condition, then open and inspect the image. Check clipping, wrapping, overlap, alignment, missing assets, unexpected overflow, and focus visibility. A screenshot file existing does not establish that the layout is correct.

Choose viewports and states that can expose the changed behavior: narrow and wide layouts for responsive changes, affected themes, long content, or loading/error states. Include zoom or long translated labels when the change affects those constraints. Avoid a fixed matrix unrelated to the task.

For before/after comparisons, hold viewport, scale, theme, fixture data, and animation state constant. Mask truly dynamic regions instead of raising the global tolerance. Explain unexpected diff regions before accepting baseline updates. Reuse existing snapshot tooling; review updated baselines as part of the change.

Keep raw screenshots and traces in the project's configured report directory. Report which states were inspected and which meaningful cases remain unverified.
