import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { lstatSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const installer = join(root, "skills/factory/assets/task-board/install-board.ts");

interface PackageJson {
  name: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
}

function project(manifest: PackageJson, run: (directory: string) => void): void {
  const directory = mkdtempSync(join(tmpdir(), "board project "));

  try {
    writeFileSync(join(directory, "package.json"), JSON.stringify(manifest, null, 4));
    run(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function install(directory: string, ...flags: string[]) {
  return spawnSync(process.execPath, [installer, directory, "--no-install", ...flags], {
    encoding: "utf8",
  });
}

test("installer copies assets and merges package.json without touching existing entries", () => {
  project(
    { name: "app", scripts: { test: "x" }, dependencies: { react: "^18.0.0" } },
    (directory) => {
      const result = install(directory);
      assert.equal(result.status, 0, result.stderr);
      const text = readFileSync(join(directory, "package.json"), "utf8");
      const manifest = JSON.parse(text);
      assert.equal(manifest.scripts.test, "x");
      assert.equal(manifest.scripts["factory:board"], "node docs/tasks/server.ts");
      assert.equal(manifest.dependencies.react, "^18.0.0");
      assert.equal(manifest.devDependencies.react, undefined);
      assert.equal(manifest.dependencies.effect, "3.22.4");
      assert.ok(manifest.devDependencies.esbuild);
      assert.match(text, /^ {4}"/m);

      for (const name of [
        "server.ts",
        "index.html",
        "anthropic-serif.woff2",
        "anthropic-sans.woff2",
      ])
        assert.ok(lstatSync(join(directory, "docs/tasks", name)).isFile());

      const again = install(directory);
      assert.equal(again.status, 0, again.stderr);
      assert.equal(readFileSync(join(directory, "package.json"), "utf8"), text);
    },
  );
});

test("installer supports links and dry runs, and rejects unrelated scripts and bad input", () => {
  project({ name: "app" }, (directory) => {
    assert.equal(install(directory, "--dry-run").status, 0);
    assert.throws(() => lstatSync(join(directory, "docs")));
    assert.equal(install(directory, "--link").status, 0);
    assert.ok(lstatSync(join(directory, "docs/tasks/server.ts")).isSymbolicLink());
    const manifest = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
    assert.match(manifest.scripts["factory:board"], /--preserve-symlinks-main/);
    assert.notEqual(install(directory).status, 0);
  });

  project({ name: "app", scripts: { "factory:board": "something else" } }, (directory) => {
    const result = install(directory);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unrelated/);
    assert.throws(() => lstatSync(join(directory, "docs")));
  });

  assert.notEqual(install(join(tmpdir(), "no such project")).status, 0);
  assert.notEqual(install(root, "--bogus").status, 0);
});
