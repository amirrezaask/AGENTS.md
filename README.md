# Global agent instructions and skills

`AGENTS.md` and the four document templates hold global conventions. Skills under
`skills/<name>/SKILL.md` provide task-specific guidance, selected through their
short descriptions. No skill loads all personal notes automatically.

## Skills

| Skill | Task trigger |
| --- | --- |
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

The installer links `AGENTS.md` and `*_TEMPLATE.md` into `~/.agents`, `~/.codex`
and `~/.claude`. It installs each skill separately into their existing `skills/`
directories and Cursor's `~/.cursor/skills-cursor/`. Existing skill directories
and unrelated installations are preserved. Edits propagate through symlinks;
rerun installation after adding, removing or renaming a skill.

```sh
npm run install:agents -- --list
npm run install:agents -- performance
```

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
