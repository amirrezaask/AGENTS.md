import assert from "node:assert/strict";
import { JSDOM, VirtualConsole } from "jsdom";
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

async function fixture(
  run: (base: string, tasks: string) => Promise<void>,
  linked = false,
): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), "factory board "));
  const tasks = join(directory, "docs/tasks");
  await mkdir(tasks, { recursive: true });

  for (const name of ["server.ts", "index.html", "anthropic-serif.woff2", "anthropic-sans.woff2"]) {
    const asset = join(dirname(source), name);

    if (linked) await symlink(asset, join(tasks, name));
    else await cp(asset, join(tasks, name));
  }

  await writeFile(
    join(directory, "package.json"),
    JSON.stringify({ name: "test-project", displayName: "Project <Atlas>" }),
  );
  await symlink(join(repo, "node_modules"), join(directory, "node_modules"));
  const port = await freePort();

  const child = spawn(process.execPath, ["--preserve-symlinks-main", join(tasks, "server.ts")], {
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

const taskSchema = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  status: Schema.String,
  created: Schema.String,
  updated: Schema.String,
});

const boardSchema = Schema.Struct({
  project: Schema.String,
  token: Schema.String,
  tasks: Schema.Array(taskSchema),
  errors: Schema.Array(Schema.String),
});

async function board(base: string) {
  return Schema.decodeUnknownSync(boardSchema)(await (await fetch(`${base}/api/board`)).json());
}

async function task(tasks: string, id: string, status = "backlog"): Promise<string> {
  const path = join(tasks, status, id);
  await mkdir(path, { recursive: true });
  const text = `---\ntitle: "Recover account access"\ncreated: "2026-10-28"\nupdated: "2026-10-28"\nowner: ADMIN\n---\n\nKeep this task context exactly.\n`;
  await writeFile(join(path, "TASK.md"), text);
  await writeFile(
    join(path, "BRIEF.md"),
    "# Recovery\n\n| Requirement | Outcome |\n| --- | --- |\n| R1 | Recover access |\n\n<script>alert('unsafe')</script>\n\n[unsafe](javascript:alert)\n",
  );
  await writeFile(
    join(path, "PLAN.md"),
    "# Implementation\n\n1. Add recovery flow.\n2. Verify it.\n",
  );

  return text;
}

async function move(base: string, token: string, id: string, status: string, origin = base) {
  return fetch(`${base}/api/status`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token, task: id, status }),
  });
}

async function eventually(check: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (check()) return;
    await new Promise((resolveTurn) => setTimeout(resolveTurn, 20));
  }

  assert.ok(check(), "Expected UI state was not reached");
}

async function mount(base: string) {
  const dom = new JSDOM(await (await fetch(base)).text(), {
    url: base,
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole().forwardTo(console),
  });

  const window = dom.window;
  const requests: string[] = [];
  window.AbortController = AbortController;
  window.HTMLElement.prototype.scrollIntoView = () => undefined;
  window.HTMLElement.prototype.setPointerCapture = () => undefined;
  window.HTMLElement.prototype.releasePointerCapture = () => undefined;
  window.fetch = (url, init) => {
    const address = new URL(String(url), base);
    requests.push(address.pathname);

    return fetch(address, {
      ...init,
      headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: base },
    });
  };

  window.eval(await (await fetch(`${base}/app.js`)).text());
  await eventually(() => window.document.querySelector('[data-task="move-task"]') !== null);

  return { dom, window, requests };
}

test("React assets and task APIs preserve document rendering, status writes, and other file content", async () => {
  await fixture(async (base, tasks) => {
    assert.equal((await board(base)).tasks.length, 0);
    const original = await task(tasks, "account-recovery");
    const data = await board(base);
    assert.equal(data.project, "Project <Atlas>");
    assert.equal(data.tasks.length, 1);
    const html = await (await fetch(base)).text();
    assert.match(html, /<div id="root">/);
    assert.doesNotMatch(html, /type="text\/tsx"/);
    const css = await (await fetch(`${base}/app.css`)).text();
    assert.match(css, /Anthropic Serif/);
    assert.match(css, /80vw/);
    assert.match(css, /90dvh/);
    const script = await (await fetch(`${base}/app.js`)).text();
    assert.doesNotMatch(script, /location\.reload|window\.location/);

    for (const font of ["anthropic-serif.woff2", "anthropic-sans.woff2"]) {
      const response = await fetch(`${base}/fonts/${font}`);
      assert.equal(response.status, 200);
      assert.ok((await response.arrayBuffer()).byteLength > 1000);
    }

    const docs = await (await fetch(`${base}/api/tasks/account-recovery`)).text();
    assert.match(docs, /<table>/);
    assert.doesNotMatch(docs, /<script>alert|href=\\"javascript:/);
    const brief = await readFile(join(tasks, "backlog/account-recovery/BRIEF.md"), "utf8");
    const plan = await readFile(join(tasks, "backlog/account-recovery/PLAN.md"), "utf8");

    for (const status of ["inprogress", "blocked", "done", "backlog"]) {
      const response = await move(base, data.token, "account-recovery", status);
      assert.equal(response.status, 200);
      assert.equal(Schema.decodeUnknownSync(taskSchema)(await response.json()).status, status);
      const changed = await readFile(join(tasks, status, "account-recovery/TASK.md"), "utf8");
      assert.equal(changed.replace(/^updated:.*$/m, 'updated: "2026-10-28"'), original);

      if (status !== "backlog")
        await assert.rejects(readFile(join(tasks, "backlog/account-recovery/TASK.md")));
    }

    assert.equal(await readFile(join(tasks, "backlog/account-recovery/BRIEF.md"), "utf8"), brief);
    assert.equal(await readFile(join(tasks, "backlog/account-recovery/PLAN.md"), "utf8"), plan);
    const windows = original.replaceAll("\n", "\r\n") + "Persian context: کار\r\n";
    await writeFile(join(tasks, "backlog/account-recovery/TASK.md"), windows);
    assert.equal((await move(base, data.token, "account-recovery", "blocked")).status, 200);
    const changed = await readFile(join(tasks, "blocked/account-recovery/TASK.md"), "utf8");
    assert.equal(changed.replace(/^updated:[^\r\n]*/m, 'updated: "2026-10-28"'), windows);
  });
});

test("API rejects invalid writes and symlinks while exposing valid tasks and unavailable documents", async () => {
  await fixture(async (base, tasks) => {
    const original = await task(tasks, "valid-task");
    const token = (await board(base)).token;
    assert.equal((await move(base, "wrong", "valid-task", "done")).status, 403);
    assert.equal(
      (await move(base, token, "valid-task", "done", "https://example.com")).status,
      403,
    );
    assert.equal((await move(base, token, "valid-task", "missing")).status, 400);
    assert.equal((await move(base, token, "../valid-task", "done")).status, 400);
    await task(tasks, "bad-task", "unknown");
    const outside = join(dirname(tasks), "outside");
    await mkdir(outside);
    await writeFile(join(outside, "TASK.md"), original);
    await symlink(outside, join(tasks, "backlog/linked-task"));
    await rm(join(tasks, "backlog/valid-task/PLAN.md"));
    await symlink(join(outside, "TASK.md"), join(tasks, "backlog/valid-task/PLAN.md"));
    const data = await board(base);
    assert.equal(data.tasks.length, 1);
    assert.equal(data.errors.length, 2);
    assert.match(
      await (await fetch(`${base}/api/tasks/valid-task`)).text(),
      /PLAN.md is unavailable/,
    );
    assert.equal((await move(base, token, "linked-task", "done")).status, 400);
    await rm(join(tasks, "backlog/valid-task/TASK.md"));
    await symlink(join(outside, "TASK.md"), join(tasks, "backlog/valid-task/TASK.md"));
    assert.equal((await move(base, token, "valid-task", "done")).status, 400);
    assert.equal(await readFile(join(outside, "TASK.md"), "utf8"), original);
  });
});

test("React opens the shadcn dialog, switches tabs, moves cards, and cancels keyboard moves without navigation", async () => {
  await fixture(async (base, tasks) => {
    await task(tasks, "move-task");
    const { window, requests } = await mount(base);
    const document = window.document;
    const root = document.getElementById("root");

    try {
      const open = document.querySelector<HTMLButtonElement>("[data-open-task]");
      assert.ok(open);
      open.click();
      await eventually(() => document.querySelector('[role="dialog"] .reader table') !== null);

      const plan = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find(
        (item) => item.textContent === "Plan",
      );

      assert.ok(plan);
      plan.dispatchEvent(new window.MouseEvent("mousedown", { bubbles: true, button: 0 }));
      await eventually(
        () =>
          document
            .querySelector('[role="tabpanel"][data-state="active"]')
            ?.textContent?.includes("Implementation") === true,
      );
      assert.equal(requests.filter((path) => path.startsWith("/api/tasks/")).length, 1);
      const close = document.querySelector<HTMLButtonElement>('button[aria-label="Close task"]');
      assert.ok(close);
      close.click();
      await eventually(() => document.querySelector('[role="dialog"]') === null);
      const card = document.querySelector<HTMLElement>('[data-task="move-task"]');
      assert.ok(card);

      for (const key of [" ", "ArrowRight", "Escape"]) {
        card.dispatchEvent(
          new window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
        );
        await new Promise((resolveTurn) => setTimeout(resolveTurn, 5));
      }

      assert.equal(requests.filter((path) => path === "/api/status").length, 0);

      for (const key of [" ", "ArrowRight", "Enter"]) {
        card.dispatchEvent(
          new window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
        );
        await new Promise((resolveTurn) => setTimeout(resolveTurn, 5));
      }

      await eventually(
        () => document.querySelector('[data-status="inprogress"] [data-task="move-task"]') !== null,
      );
      assert.match(await readFile(join(tasks, "inprogress/move-task/TASK.md"), "utf8"), /^title:/m);
      assert.equal(document.getElementById("root"), root);
      assert.equal(window.location.href, base + "/");
      assert.equal(requests.filter((path) => path === "/api/board").length, 1);
      const dragged = document.querySelector<HTMLElement>('[data-task="move-task"]');
      const blocked = document.querySelector<HTMLElement>('[data-status="blocked"]');
      assert.ok(dragged && blocked);
      const transfer = { setData: () => undefined, effectAllowed: "", dropEffect: "" };
      dragged.dispatchEvent(
        Object.assign(new window.Event("dragstart", { bubbles: true }), { dataTransfer: transfer }),
      );
      blocked.dispatchEvent(
        Object.assign(new window.Event("dragover", { bubbles: true, cancelable: true }), {
          dataTransfer: transfer,
        }),
      );
      blocked.dispatchEvent(new window.Event("drop", { bubbles: true, cancelable: true }));
      await eventually(
        () => document.querySelector('[data-status="blocked"] [data-task="move-task"]') !== null,
      );
      const previousFetch = window.fetch;
      window.fetch = (url, init) =>
        String(url) === "/api/status"
          ? Promise.resolve(new Response("Rejected", { status: 403 }))
          : previousFetch(url, init);
      const rejected = document.querySelector<HTMLElement>('[data-task="move-task"]');
      assert.ok(rejected);

      for (const key of [" ", "ArrowRight", "Enter"]) {
        rejected.dispatchEvent(
          new window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
        );
        await new Promise((resolveTurn) => setTimeout(resolveTurn, 5));
      }

      await eventually(
        () =>
          document.querySelector('[role="alert"]')?.textContent?.includes("Could not confirm") ===
          true,
      );
      assert.ok(document.querySelector('[data-status="blocked"] [data-task="move-task"]'));
      assert.equal(document.querySelector("[data-board]")?.getAttribute("aria-busy"), "false");
    } finally {
      window.close();
    }
  });
});

test("React pointer grip persists status and updates the card without a reload", async () => {
  await fixture(async (base, tasks) => {
    await task(tasks, "move-task");
    const { window } = await mount(base);

    try {
      const target = window.document.querySelector<HTMLElement>('[data-status="done"]');
      assert.ok(target);
      window.document.elementFromPoint = () => target;
      const handle = window.document.querySelector<HTMLButtonElement>("[data-grip]");
      assert.ok(handle);

      for (const [type, x] of [
        ["pointerdown", 0],
        ["pointermove", 50],
        ["pointerup", 50],
      ]) {
        handle.dispatchEvent(
          Object.assign(new window.Event(String(type), { bubbles: true, cancelable: true }), {
            pointerId: 1,
            pointerType: "touch",
            button: 0,
            clientX: x,
            clientY: 20,
          }),
        );
        await new Promise((resolveTurn) => setTimeout(resolveTurn, 5));
      }

      await eventually(
        () =>
          window.document.querySelector('[data-status="done"] [data-task="move-task"]') !== null,
      );
      assert.match(await readFile(join(tasks, "done/move-task/TASK.md"), "utf8"), /^title:/m);
    } finally {
      window.close();
    }
  });
});

test("symlink installation reads consuming-project tasks and ignores linked board assets", async () => {
  await fixture(async (base, tasks) => {
    await task(tasks, "local-project-task");
    const data = await board(base);
    assert.equal(data.project, "Project <Atlas>");
    assert.deepEqual(data.errors, []);
    assert.deepEqual(
      data.tasks.map((item) => item.id),
      ["local-project-task"],
    );
    const response = await move(base, data.token, "local-project-task", "blocked");
    assert.equal(response.status, 200);
    assert.match(
      await readFile(join(tasks, "blocked/local-project-task/TASK.md"), "utf8"),
      /^title:/m,
    );
    assert.equal((await fetch(`${base}/app.js`)).status, 200);
    assert.equal((await fetch(`${base}/fonts/anthropic-serif.woff2`)).status, 200);
  }, true);
});

test("legacy flat tasks are reported, subtasks are counted, and a status collision is rejected", async () => {
  await fixture(async (base, tasks) => {
    await task(tasks, "parent-task", "inprogress");
    const subtasks = join(tasks, "inprogress/parent-task/subtasks");
    await mkdir(join(subtasks, "done/first-step"), { recursive: true });
    await mkdir(join(subtasks, "backlog/second-step"), { recursive: true });
    await mkdir(join(subtasks, "backlog/second-step/subtasks/done/deep-step"), {
      recursive: true,
    });
    await mkdir(join(tasks, "flat-task"));
    await mkdir(join(tasks, "done/parent-task"), { recursive: true });
    const data = await board(base);
    assert.ok(
      data.errors.some((error) =>
        error.startsWith("flat-task: tasks must live in a status directory"),
      ),
    );
    assert.equal((await move(base, data.token, "parent-task", "done")).status, 400);
    await rm(join(tasks, "done/parent-task"), { recursive: true });

    const counted = Schema.decodeUnknownSync(
      Schema.Struct({
        tasks: Schema.Array(
          Schema.Struct({ subtasks: Schema.Struct({ total: Schema.Number, done: Schema.Number }) }),
        ),
      }),
    )(await (await fetch(`${base}/api/board`)).json());

    assert.deepEqual(counted.tasks[0]?.subtasks, { total: 3, done: 2 });
    assert.equal((await move(base, data.token, "parent-task", "done")).status, 200);
    assert.match(await readFile(join(tasks, "done/parent-task/TASK.md"), "utf8"), /^title:/m);
  });
});

test("task detail lists nested subtasks and serves their documents by path", async () => {
  await fixture(async (base, tasks) => {
    await task(tasks, "parent-task", "inprogress");
    const parent = join(tasks, "inprogress/parent-task");
    await task(parent, "first-step", "subtasks/done");
    await task(join(parent, "subtasks/done/first-step"), "deep-step", "subtasks/backlog");

    const detail = Schema.decodeUnknownSync(
      Schema.Struct({
        subtasks: Schema.Array(Schema.Struct({ id: Schema.String, status: Schema.String })),
      }),
    )(await (await fetch(`${base}/api/tasks/parent-task`)).json());

    assert.deepEqual(
      detail.subtasks.map((item) => item.id),
      ["parent-task/first-step"],
    );
    assert.equal((await fetch(`${base}/api/tasks/parent-task/first-step`)).status, 200);
    assert.equal((await fetch(`${base}/api/tasks/parent-task/first-step/deep-step`)).status, 200);
    assert.equal((await fetch(`${base}/api/tasks/parent-task/missing`)).status, 404);
  });
});
