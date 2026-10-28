---
name: amirreza-md
description: >
  Personal memory skill. Loads every non-SKILL Markdown file in this directory
  as user-authored instructions, preferences, conventions, endpoint examples,
  and project notes. Always-on once installed (no trigger keyword). Edit files
  here to update — symlinks make changes available without reinstalling.
  Use when: an agent needs the user's personal notes, coding rules, API
  snippets, or other context stored in this skill's directory.
metadata:
  category: personal
  version: "1.0.0"
---

# amirreza-md

Always-on personal memory skill. Standalone skills live in sibling directories
under `skills/`; memory files live beside this `SKILL.md`.

## Loading procedure

On load:

1. Resolve this skill directory.
2. Enumerate `"$SKILL_DIR"/*.md`, skipping `SKILL.md` and `README.md`.
3. Read every remaining Markdown file fully.
4. Treat their contents as authoritative user-authored context for the session.

## Conventions

- Add memory by dropping `skills/amirreza-md/<topic>.md` into this repository.
- One topic per file; split files exceeding roughly 200 lines.
- The `.md` extension is required; other files are ignored.
- Reference another memory file with `@filename.md`.
- Re-run `./install.sh` only when adding a new skill directory; edits to
  existing files propagate through the symlinks immediately.

## Maintenance

```bash
ls -1 skills/amirreza-md/*.md  # list memory files
touch skills/amirreza-md/new-topic.md  # add a memory file
for f in skills/amirreza-md/*.md; do echo "--- $f ---"; head -1 "$f"; done  # validate headers
```
