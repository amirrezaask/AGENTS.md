import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { Schema } from "effect";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(repo, "skills/factory/assets/task-board/server.ts");

async function freePort(): Promise<number> {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const { port } = Schema.decodeUnknownSync(Schema.Struct({ port: Schema.Number }))(
    server.address(),
  );

  await new Promise<void>((resolveClose, reject) =>
    server.close((error) => (error ? reject(error) : resolveClose())),
  );

  return port;
}

async function fixture(run: (base: string, tasks: string) => Promise<void>): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), "factory board "));
  const tasks = join(directory, "docs/tasks");
  await mkdir(tasks, { recursive: true });
  await cp(source, join(tasks, "server.ts"));

  for (const font of ["anthropic-serif.woff2", "anthropic-sans.woff2"])
    await cp(join(dirname(source), font), join(tasks, font));
  await writeFile(
    join(directory, "package.json"),
    JSON.stringify({ name: "test-project", displayName: "Project <Atlas>" }),
  );
  await symlink(join(repo, "node_modules"), join(directory, "node_modules"));
  const port = await freePort();

  const child = spawn(process.execPath, [join(tasks, "server.ts")], {
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let diagnostics = "";
  child.stderr.on("data", (data) => {
    diagnostics += data;
  });

  try {
    await new Promise<void>((ready, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Board startup timed out: ${diagnostics}`)),
        10000,
      );

      child.stdout.once("data", () => {
        clearTimeout(timer);
        ready();
      });
      child.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.once("exit", () => {
        clearTimeout(timer);
        reject(new Error(`Board exited: ${diagnostics}`));
      });
    });
    await run(`http://127.0.0.1:${port}`, tasks);
  } finally {
    const exited = once(child, "exit");

    if (child.exitCode === null && child.signalCode === null) {
      child.kill();
      await exited;
    }

    await rm(directory, { recursive: true, force: true });
  }
}

async function task(tasks: string, id: string, status = "ready"): Promise<string> {
  const path = join(tasks, id);
  await mkdir(path);
  const text = `---\ntitle: "Recover account access"\nstatus: ${status}\ncreated: "2026-10-28"\nupdated: "2026-10-28"\nowner: ADMIN\n---\n\nKeep this task context exactly.\n`;
  await writeFile(join(path, "TASK.md"), text);
  await writeFile(
    join(path, "BRIEF.md"),
    "---\ntitle: Brief\n---\n# Recovery\n\n| Requirement | Outcome |\n| --- | --- |\n| R1 | Recover access |\n\n<script>alert('unsafe')</script>\n\n[unsafe](javascript:alert)\n",
  );
  await writeFile(
    join(path, "PLAN.md"),
    "# Implementation\n\n1. Add recovery flow.\n2. Verify it.\n",
  );

  return text;
}

function formToken(html: string): string {
  const token = /name="token" value="([a-f0-9]+)"/.exec(html)?.[1];
  assert.ok(token);

  return token;
}

async function move(base: string, token: string, id: string, status: string, origin = base) {
  return fetch(`${base}/status`, {
    method: "POST",
    redirect: "manual",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token, task: id, status }),
  });
}

test("board renders tasks and both Markdown documents, moves every status, and preserves task content", async () => {
  await fixture(async (base, tasks) => {
    const empty = await (await fetch(base)).text();
    assert.equal((empty.match(/No tasks here\./g) ?? []).length, 4);
    const original = await task(tasks, "account-recovery");
    const brief = await readFile(join(tasks, "account-recovery/BRIEF.md"), "utf8");
    const plan = await readFile(join(tasks, "account-recovery/PLAN.md"), "utf8");
    const board = await fetch(base);
    assert.equal(board.status, 200);
    assert.match(board.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
    const html = await board.text();
    assert.match(html, /Recover account access/);
    assert.match(html, /<h1 class="project-title">Project &lt;Atlas&gt;<\/h1>/);
    assert.doesNotMatch(html, /Your software work|>Refresh</);

    for (const font of ["anthropic-serif.woff2", "anthropic-sans.woff2"]) {
      const response = await fetch(`${base}/fonts/${font}`);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "font/woff2");
      assert.ok((await response.arrayBuffer()).byteLength > 1000);
    }

    const token = formToken(html);
    const modal = await (await fetch(`${base}/?task=account-recovery`)).text();
    assert.match(modal, /<dialog open/);
    assert.match(modal, /<table>/);
    assert.doesNotMatch(modal, /<script>alert|href="javascript:/);
    const secondTab = await (await fetch(`${base}/?task=account-recovery&tab=plan`)).text();
    assert.match(secondTab, /<h1>Implementation<\/h1>/);

    for (const status of ["in-progress", "blocked", "done", "ready"]) {
      const response = await move(base, token, "account-recovery", status);
      assert.equal(response.status, 303);
      const updated = await readFile(join(tasks, "account-recovery/TASK.md"), "utf8");
      assert.equal(
        updated
          .replace(/^status:.*$/m, "status: ready")
          .replace(/^updated:.*$/m, 'updated: "2026-10-28"'),
        original,
      );
    }

    assert.equal(await readFile(join(tasks, "account-recovery/BRIEF.md"), "utf8"), brief);
    assert.equal(await readFile(join(tasks, "account-recovery/PLAN.md"), "utf8"), plan);
    const windows = original.replaceAll("\n", "\r\n") + "Persian context: کار\r\n";
    await writeFile(join(tasks, "account-recovery/TASK.md"), windows);
    assert.equal((await move(base, token, "account-recovery", "blocked")).status, 303);
    const changed = await readFile(join(tasks, "account-recovery/TASK.md"), "utf8");
    assert.equal(
      changed
        .replace(/^status:[^\r\n]*/m, "status: ready")
        .replace(/^updated:[^\r\n]*/m, 'updated: "2026-10-28"'),
      windows,
    );
    const client = await fetch(`${base}/client.js`);
    assert.equal(client.status, 200);
    assert.match(await client.text(), /showModal/);
  });
});

test("invalid writes, origins, metadata, and symlink paths cannot overwrite task documents", async () => {
  await fixture(async (base, tasks) => {
    const original = await task(tasks, "valid-task");
    const token = formToken(await (await fetch(base)).text());
    assert.equal((await move(base, "wrong", "valid-task", "done")).status, 403);
    assert.equal(
      (await move(base, token, "valid-task", "done", "https://example.com")).status,
      403,
    );
    assert.equal((await move(base, token, "valid-task", "missing")).status, 400);
    assert.equal((await move(base, token, "../valid-task", "done")).status, 400);
    assert.equal(await readFile(join(tasks, "valid-task/TASK.md"), "utf8"), original);
    await task(tasks, "bad-task", "unknown");
    const outside = join(dirname(tasks), "outside");
    await mkdir(outside);
    await writeFile(join(outside, "TASK.md"), original);
    await symlink(outside, join(tasks, "linked-task"));
    await rm(join(tasks, "valid-task/PLAN.md"));
    await symlink(join(outside, "TASK.md"), join(tasks, "valid-task/PLAN.md"));
    const html = await (await fetch(base)).text();
    assert.match(html, /bad-task: unable to load/);
    assert.match(html, /linked-task: unable to load/);
    assert.match(html, /Recover account access/);
    const missing = await (await fetch(`${base}/?task=valid-task&tab=plan`)).text();
    assert.match(missing, /PLAN.md is unavailable/);
    assert.equal((await move(base, token, "linked-task", "done")).status, 400);
    await rm(join(tasks, "valid-task/TASK.md"));
    await symlink(join(outside, "TASK.md"), join(tasks, "valid-task/TASK.md"));
    assert.equal((await move(base, token, "valid-task", "done")).status, 400);
    assert.equal(await readFile(join(outside, "TASK.md"), "utf8"), original);
  });
});
