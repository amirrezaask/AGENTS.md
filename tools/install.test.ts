import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const installer = join(root, "tools", "install.ts");

const skill = readdirSync(join(root, "skills")).find(
  (name) =>
    !["factory", "atlas"].includes(name) && existsSync(join(root, "skills", name, "SKILL.md")),
);

assert.ok(skill);

function isolated(run: (home: string) => void): void {
  const home = mkdtempSync(join(tmpdir(), "agent home "));

  try {
    run(home);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
}

function invoke(home: string, ...args: string[]) {
  return spawnSync(process.execPath, [installer, ...args], {
    env: { ...process.env, HOME: home },
    encoding: "utf8",
  });
}

test("list and dry-run do not write to HOME; invalid input fails", () =>
  isolated((home) => {
    assert.equal(invoke(home, "--list").status, 0);
    assert.equal(invoke(home, "--dry-run").status, 0);
    assert.deepEqual(readdirSync(home), []);
    assert.notEqual(invoke(home, "--unknown").status, 0);
    assert.notEqual(invoke(home, "../missing").status, 0);
    assert.deepEqual(readdirSync(home), []);
  }));

test("installs individual skills and globals; repeated installs preserve unrelated files", () =>
  isolated((home) => {
    const base = join(home, ".agents", "skills");
    mkdirSync(base, { recursive: true });
    writeFileSync(join(base, "unrelated"), "keep");
    assert.equal(invoke(home).status, 0);
    assert.equal(lstatSync(base).isDirectory(), true);
    assert.equal(readlinkSync(join(base, skill)), join(root, "skills", skill));
    assert.equal(readlinkSync(join(home, ".codex", "AGENTS.md")), join(root, "AGENTS.md"));
    assert.equal(existsSync(join(home, ".agents", "tools")), false);
    assert.equal(existsSync(join(home, ".agents", ".git")), false);
    assert.equal(invoke(home).status, 0);
    assert.equal(readFileSync(join(base, "unrelated"), "utf8"), "keep");
  }));

test("collisions fail preflight without changing globals or existing content", () =>
  isolated((home) => {
    const base = join(home, ".claude", "skills", skill);
    mkdirSync(base, { recursive: true });
    writeFileSync(join(base, "saved"), "keep");
    assert.notEqual(invoke(home).status, 0);
    assert.equal(readFileSync(join(base, "saved"), "utf8"), "keep");
    assert.equal(existsSync(join(home, ".agents")), false);
  }));

test("migrates known legacy links and only removes managed retired skills", () =>
  isolated((home) => {
    const base = join(home, ".agents", "skills");
    mkdirSync(base, { recursive: true });
    const old = join(home, "dev", "Amirreza.md", "skills");
    symlinkSync(join(old, skill), join(base, skill));
    symlinkSync(join(old, "amirreza-md"), join(base, "amirreza-md"));

    if (!existsSync(join(root, "skills", "dod")))
      symlinkSync(join(home, "unrelated", "dod"), join(base, "dod"));
    assert.equal(invoke(home).status, 0);
    assert.equal(readlinkSync(join(base, skill)), join(root, "skills", skill));

    if (!existsSync(join(root, "skills", "amirreza-md")))
      assert.throws(() => lstatSync(join(base, "amirreza-md")));

    if (!existsSync(join(root, "skills", "dod")))
      assert.equal(readlinkSync(join(base, "dod")), join(home, "unrelated", "dod"));
  }));

test("selected install includes global workflow skills; foreign symlinks are preserved", () =>
  isolated((home) => {
    assert.equal(invoke(home, skill).status, 0);
    assert.deepEqual(
      readdirSync(join(home, ".agents", "skills")).sort(),
      [...new Set([skill, "factory", "atlas"])].sort(),
    );
    const destination = join(home, ".codex", "skills", skill);
    rmSync(destination);
    symlinkSync(join(home, "foreign"), destination);
    assert.notEqual(invoke(home, skill).status, 0);
    assert.equal(readlinkSync(destination), join(home, "foreign"));
  }));

test("symlinked skills destination is rejected before writing through it", () =>
  isolated((home) => {
    const foreign = join(home, "foreign");
    mkdirSync(foreign);
    mkdirSync(join(home, ".agents"));
    symlinkSync(foreign, join(home, ".agents", "skills"));
    assert.notEqual(invoke(home).status, 0);
    assert.deepEqual(readdirSync(foreign), []);
  }));

test("symlinked cursor parent is rejected and legacy root installer links are cleaned", () =>
  isolated((home) => {
    const foreign = join(home, "foreign");
    mkdirSync(foreign);
    symlinkSync(foreign, join(home, ".cursor"));
    assert.notEqual(invoke(home).status, 0);
    assert.deepEqual(readdirSync(foreign), []);
    rmSync(join(home, ".cursor"));
    mkdirSync(join(home, ".agents"));
    symlinkSync(join(root, "install.sh"), join(home, ".agents", "install.sh"));
    assert.equal(invoke(home).status, 0);
    assert.throws(() => lstatSync(join(home, ".agents", "install.sh")));
  }));

test("removes any retired old-source skill link but preserves unrelated links and directories", () =>
  isolated((home) => {
    const base = join(home, ".cursor", "skills-cursor");
    mkdirSync(base, { recursive: true });
    symlinkSync(join(home, "dev", "Amirreza.md", "skills", "code-style"), join(base, "code-style"));
    symlinkSync(join(home, "foreign", "poweruser-usability"), join(base, "poweruser-usability"));
    mkdirSync(join(base, "typescript-performance"));
    assert.equal(invoke(home).status, 0);
    assert.throws(() => lstatSync(join(base, "code-style")));
    assert.equal(
      readlinkSync(join(base, "poweruser-usability")),
      join(home, "foreign", "poweruser-usability"),
    );
    assert.equal(lstatSync(join(base, "typescript-performance")).isDirectory(), true);
  }));

const templateSources = [
  { name: "BRIEF_TEMPLATE.md", path: "skills/factory/templates/BRIEF_TEMPLATE.md" },
  { name: "PLAN_TEMPLATE.md", path: "skills/factory/templates/PLAN_TEMPLATE.md" },
  { name: "DEBRIEF_TEMPLATE.md", path: "skills/factory/templates/DEBRIEF_TEMPLATE.md" },
  { name: "SPEC_TEMPLATE.md", path: "skills/atlas/templates/AREA_TEMPLATE.md" },
];

const globalDirectories = [".agents", ".codex", ".claude"];

test("full and selected installs provide all twelve readable global template aliases", () =>
  isolated((home) => {
    for (const args of [[], [skill], [skill]]) {
      assert.equal(invoke(home, ...args).status, 0);

      for (const directory of globalDirectories) {
        for (const { name, path } of templateSources) {
          const alias = join(home, directory, name);
          assert.equal(readlinkSync(alias), join(root, path));
          assert.equal(readFileSync(alias, "utf8"), readFileSync(join(root, path), "utf8"));
        }
      }
    }
  }));

test("dry-run preserves old root aliases and actual install migrates exact managed aliases", () =>
  isolated((home) => {
    for (const directory of globalDirectories) {
      mkdirSync(join(home, directory));

      for (const { name } of templateSources)
        symlinkSync(join(root, name), join(home, directory, name));
    }

    assert.equal(invoke(home, "--dry-run", skill).status, 0);

    for (const directory of globalDirectories) {
      for (const { name } of templateSources)
        assert.equal(readlinkSync(join(home, directory, name)), join(root, name));
      assert.equal(existsSync(join(home, directory, "AGENTS.md")), false);
      assert.equal(existsSync(join(home, directory, "skills")), false);
    }

    assert.equal(invoke(home, skill).status, 0);

    for (const directory of globalDirectories) {
      for (const { name, path } of templateSources)
        assert.equal(readlinkSync(join(home, directory, name)), join(root, path));
    }
  }));

test("foreign template aliases and regular files fail preflight without partial installation", () => {
  for (const collision of ["symlink", "file"])
    isolated((home) => {
      const base = join(home, ".claude");
      mkdirSync(base);
      const alias = join(base, "SPEC_TEMPLATE.md");
      const foreign = join(home, "foreign.md");
      writeFileSync(foreign, "saved");

      if (collision === "symlink") symlinkSync(foreign, alias);
      else writeFileSync(alias, "saved");
      const result = invoke(home, skill);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Refusing/);
      assert.equal(readFileSync(alias, "utf8"), "saved");

      if (collision === "symlink") assert.equal(readlinkSync(alias), foreign);
      assert.equal(existsSync(join(home, ".agents")), false);
      assert.equal(existsSync(join(base, "AGENTS.md")), false);
    });
});

test("missing template or required skill fails before any home mutation", () => {
  for (const missing of ["template", "factory", "atlas"])
    isolated((temporary) => {
      const fixture = join(temporary, "fixture");
      const home = join(temporary, "home");
      mkdirSync(home);
      mkdirSync(join(fixture, "tools"), { recursive: true });
      writeFileSync(join(fixture, "tools", "install.ts"), readFileSync(installer));
      writeFileSync(join(fixture, "AGENTS.md"), "global");

      for (const name of ["factory", "atlas"]) {
        mkdirSync(join(fixture, "skills", name), { recursive: true });

        if (missing !== name) writeFileSync(join(fixture, "skills", name, "SKILL.md"), "skill");
      }

      for (const { name, path } of templateSources) {
        mkdirSync(dirname(join(fixture, path)), { recursive: true });

        if (missing !== "template" || name !== "SPEC_TEMPLATE.md")
          writeFileSync(join(fixture, path), "template");
      }

      const result = spawnSync(process.execPath, [join(fixture, "tools", "install.ts")], {
        env: { ...process.env, HOME: home },
        encoding: "utf8",
      });

      assert.notEqual(result.status, 0);
      assert.match(
        result.stderr,
        /Missing bundled global file|Missing required global workflow skill/,
      );
      assert.deepEqual(readdirSync(home), []);
    });
});

test("migrates former nested template aliases and retires old workflow skills on selected installs", () =>
  isolated((home) => {
    for (const directory of globalDirectories) {
      const base = join(home, directory);
      mkdirSync(join(base, "skills"), { recursive: true });

      for (const name of ["communication", "specification"])
        symlinkSync(join(root, "skills", name), join(base, "skills", name));

      for (const { name } of templateSources) {
        const old = name === "SPEC_TEMPLATE.md" ? "specification" : "communication";
        symlinkSync(join(root, "skills", old, "templates", name), join(base, name));
      }
    }

    assert.equal(invoke(home, "--dry-run", skill).status, 0);
    assert.equal(
      lstatSync(join(home, ".agents", "skills", "communication")).isSymbolicLink(),
      true,
    );
    assert.equal(invoke(home, skill).status, 0);

    for (const directory of globalDirectories) {
      for (const name of ["communication", "specification"])
        assert.throws(() => lstatSync(join(home, directory, "skills", name)));
      assert.equal(
        readlinkSync(join(home, directory, "skills", "factory")),
        join(root, "skills", "factory"),
      );

      for (const { name, path } of templateSources)
        assert.equal(readlinkSync(join(home, directory, name)), join(root, path));
    }
  }));

test("migrates the former Factory spec alias to Atlas on selected installs, including dangling links", () =>
  isolated((home) => {
    const oldSource = join(root, "skills", "factory", "templates", "SPEC_TEMPLATE.md");

    for (const directory of globalDirectories) {
      mkdirSync(join(home, directory));
      symlinkSync(oldSource, join(home, directory, "SPEC_TEMPLATE.md"));
    }

    assert.equal(invoke(home, "--dry-run", skill).status, 0);
    assert.equal(readlinkSync(join(home, ".agents", "SPEC_TEMPLATE.md")), oldSource);
    assert.equal(invoke(home, skill).status, 0);

    for (const directory of globalDirectories) {
      assert.equal(
        readlinkSync(join(home, directory, "SPEC_TEMPLATE.md")),
        join(root, "skills", "atlas", "templates", "AREA_TEMPLATE.md"),
      );
      assert.equal(
        readlinkSync(join(home, directory, "skills", "atlas")),
        join(root, "skills", "atlas"),
      );
    }
  }));

const budgetHook = "session-budget-hook.ts";

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

test("registers the session budget hook once, preserving existing settings and hooks", () =>
  isolated((home) => {
    const settings = join(home, ".claude", "settings.json");
    const other = { matcher: "*", hooks: [{ type: "command", command: "echo keep" }] };
    mkdirSync(join(home, ".claude"));
    writeFileSync(
      settings,
      JSON.stringify({ model: "sonnet", hooks: { PostToolUse: [other], Stop: [other] } }),
    );

    assert.equal(invoke(home, "--dry-run").status, 0);
    assert.equal(readJson(settings).hooks.PostToolUse.length, 1);

    assert.equal(invoke(home).status, 0);
    const installed = readJson(settings);
    assert.equal(installed.model, "sonnet");
    assert.deepEqual(installed.hooks.Stop, [other]);
    assert.deepEqual(installed.hooks.PostToolUse[0], other);
    assert.equal(installed.hooks.PostToolUse.length, 2);
    const link = join(home, ".claude", "hooks", budgetHook);
    assert.equal(readlinkSync(link), join(root, "tools", budgetHook));
    assert.ok(installed.hooks.PostToolUse[1].hooks[0].command.includes(link));

    const before = readFileSync(settings, "utf8");
    assert.equal(invoke(home).status, 0);
    assert.equal(readFileSync(settings, "utf8"), before);

    installed.hooks.PostToolUse[1].hooks[0].command = `old ${budgetHook}`;
    writeFileSync(settings, JSON.stringify(installed));
    assert.equal(invoke(home).status, 0);
    assert.equal(readFileSync(settings, "utf8"), before);
  }));

test("unparseable settings.json fails before any home mutation", () =>
  isolated((home) => {
    mkdirSync(join(home, ".claude"));
    writeFileSync(join(home, ".claude", "settings.json"), "{ not json");
    const result = invoke(home);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unparseable settings/);
    assert.equal(readFileSync(join(home, ".claude", "settings.json"), "utf8"), "{ not json");
    assert.equal(existsSync(join(home, ".agents")), false);
    assert.equal(existsSync(join(home, ".claude", "hooks")), false);
  }));

test("session budget hook warns once at the soft limit and on every call past the hard limit", () =>
  isolated((home) => {
    const transcript = join(home, "transcript.jsonl");
    const sessionId = `budget-test-${process.pid}`;

    const run = (lines: number, extra: { agent_id?: string; transcript_path?: string } = {}) => {
      writeFileSync(transcript, "{}\n".repeat(lines));

      return spawnSync(process.execPath, [join(root, "tools", budgetHook)], {
        env: { ...process.env, SESSION_BUDGET_WARN: "5", SESSION_BUDGET_HARD: "8" },
        input: JSON.stringify({ session_id: sessionId, transcript_path: transcript, ...extra }),
        encoding: "utf8",
      });
    };

    try {
      assert.equal(run(4).stdout, "");
      const warned = run(5);
      assert.equal(warned.status, 0);
      const output = JSON.parse(warned.stdout).hookSpecificOutput;
      assert.equal(output.hookEventName, "PostToolUse");
      assert.match(output.additionalContext, /5 messages \(limit 5\)/);
      assert.match(output.additionalContext, /start_session/);
      assert.equal(run(6).stdout, "");
      assert.match(run(8).stdout, /limit 8/);
      assert.match(run(9).stdout, /limit 8/);
      assert.equal(run(9, { agent_id: "sub" }).stdout, "");
      assert.equal(run(9, { transcript_path: join(home, "missing") }).stdout, "");
    } finally {
      rmSync(join(tmpdir(), `session-budget-${sessionId.replace(/\W/g, "_")}`), { force: true });
    }
  }));
