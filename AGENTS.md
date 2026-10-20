# Global Rules
- prefer typescript
- prefer oxlint for linting typescript projects
- always use motion.dev and shadcn and react for frontend apps
- always use effect.ts for server and client
- always validate fixes/features with tests
- always clean garbage and leftover files on disk and processes.

# Codex Rules
Always use internal browser @Browser not the chrome on device for testing or anything.
All subagents MUST use GPT-6 Luna with xhigh reasoning effort.
Main model can be sol.
This is a hard execution policy, not a preference.
Required configuration
    Model: gpt-6-luna
    Reasoning effort: xhigh
## Scope
This requirement applies to every stage of every task, including but not limited to:
- repository exploration
- investigation
- research
- planning
- architecture and design
- implementation
- refactoring
- debugging
- code review
- test creation
- test execution
- failure analysis
- benchmarking
- performance analysis
- security analysis
- validation
- verification
- documentation
- final review

There are no task categories that justify selecting a different model or reasoning effort.

## Subagents

Every spawned or delegated agent MUST also use:
gpt-6-luna
xhigh reasoning effort

- This applies to all agent roles, including explorers, researchers, implementers, workers, reviewers, testers, debuggers, and verification agents.

- Do not inherit, select, or fall back to another model when creating a subagent if explicit model selection is available.

- Do not use Sol, Terra, Astra, or any other model for supposedly "harder", "more important", "faster", or "simpler" work.

- Do not lower reasoning effort for auxiliary, repetitive, exploratory, or inexpensive work.
