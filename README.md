# Global agent instructions and skills

`AGENTS.md` holds global conventions and requires reading `communication` and
`specification` at the start of every task. Their detailed instructions and
templates live inside the skills. Other skills apply when their task descriptions
match the work.

## Skills

| Skill | Task trigger |
| --- | --- |
| `communication` | Required documentation workflow: human briefs, agent plans, and debriefs |
| `specification` | Required rules for documenting and synchronizing implemented behavior |
| `configure-oxlint` | Lint setup, migration, and configuration problems |
| `performance` | Systems, browser, and GPU performance investigations and optimization |
| `resource-bounded-runs` | Large copies and resource-heavy build or test processes |

`performance` consolidates `perfguy`, `frontend-performance`, and
`rust-gpu-performance`, with specialized references loaded only as needed.
`webapp-verification` is retired. Koloop game testing, promotion, and PS3 AOT
skills now live in GameBox's `.claude/skills/`, with task-specific links in its
`AGENTS.md`.

## Install

Requires Node.js 24 or newer.

```sh
npm ci
npm run install:agents -- --dry-run
npm run install:agents
```

The installer links `AGENTS.md` and the template aliases below into `~/.agents`,
`~/.codex`, and `~/.claude`. It installs each skill separately into their existing `skills/`
directories and Cursor's `~/.cursor/skills-cursor/`. Existing skill directories
and unrelated installations are preserved. Edits propagate through symlinks;
rerun installation after adding, removing or renaming a skill.

```sh
npm run install:agents -- --list
npm run install:agents -- performance
```

Selected installs also include `communication` and `specification`, because
AGENTS.md requires them. The templates have one canonical location:

| Global filename | Repository source |
| --- | --- |
| `BRIEF_TEMPLATE.md` | `skills/communication/templates/BRIEF_TEMPLATE.md` |
| `PLAN_TEMPLATE.md` | `skills/communication/templates/PLAN_TEMPLATE.md` |
| `DEBRIEF_TEMPLATE.md` | `skills/communication/templates/DEBRIEF_TEMPLATE.md` |
| `SPEC_TEMPLATE.md` | `skills/specification/templates/SPEC_TEMPLATE.md` |

The installer migrates its old root-template symlinks to these sources, including
links left dangling by the move. It verifies required sources before writing.
Installing through `npx skills` includes bundled templates within each selected
skill; creating global aliases and installing AGENTS.md requires this installer.

Known symlinks from `~/dev/Amirreza.md` are migrated automatically. Full installs
remove managed links for retired skills, including `amirreza-md` and `dod`, plus the old
root installer link. Other conflicting files, directories and symlinks cause
installation to stop before changing links. Review and move those conflicts
manually; the installer has no destructive force mode. It does not link the
whole repository or replace an agent's entire skills directory.

## Maintain

Keep one skill per directory, with matching directory and frontmatter names.
Write a short `description` stating the capability and a specific task trigger.
Keep essential instructions in `SKILL.md`; link conditional reference material
where needed. Preserve project-specific constraints and remove generic tutorials.

```sh
npm test
npm run lint
npm run check:skills
```

Tests use temporary homes and remove them afterward. The validator checks skill
names, description length, entrypoint size, automatic-loading wording and local
Markdown links. It cannot prove correct routing; review realistic matching and
nonmatching requests when changing descriptions.
