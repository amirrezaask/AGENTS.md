# Area specifications

Keep one concise `docs/specs/<area-name>.spec.md` per software area using the
[spec template](../templates/SPEC_TEMPLATE.md). These describe current implemented
behavior, not planned work. Proposed requirements stay in the task brief.

Write observable conditions, actions, and outcomes that can be checked manually
and through automated tests. Use stable IDs; avoid incidental file structure or
implementation details unless they are an actual contract.

After implementation and the debrief, check each affected requirement against
the actual implementation and available verification. Add verified new behavior.
Never remove or edit an existing requirement without ADMIN's explicit approval
of that change. Record authorized changes and their reason in the task's approval
record and debrief; Git preserves earlier specification text.

If code and spec disagree, investigate and restore compliance. If an existing
requirement conflicts with the requested change, bring the conflict to ADMIN.
Unresolved or unverified mismatches leave the task incomplete. Never rewrite
the spec to make a failing implementation appear compliant.
