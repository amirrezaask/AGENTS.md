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
const skill = readdirSync(join(root, "skills")).find((name) =>
  existsSync(join(root, "skills", name, "SKILL.md")),
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

test("selected install only installs selected skill; foreign symlinks are preserved", () =>
  isolated((home) => {
    assert.equal(invoke(home, skill).status, 0);
    assert.deepEqual(readdirSync(join(home, ".agents", "skills")), [skill]);
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
