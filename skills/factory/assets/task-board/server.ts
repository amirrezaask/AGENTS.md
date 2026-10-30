import type { AddressInfo } from "node:net";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { constants, watch } from "node:fs";
import { lstat, mkdir, open, readdir, readFile, rename } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { Effect, Schema } from "effect";
import { build } from "esbuild";
import { compile } from "tailwindcss";
import { createRequire } from "node:module";
import { Scanner } from "@tailwindcss/oxide";
import matter from "gray-matter";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const root = dirname(fileURLToPath(import.meta.url));

const NonEmptyTrimmed = Schema.String.check(Schema.isTrimmed(), Schema.isNonEmpty());

async function projectName(): Promise<string> {
  try {
    const value = JSON.parse(await readFile(join(root, "../../package.json"), "utf8"));

    const info = Schema.decodeUnknownSync(
      Schema.Struct({
        displayName: Schema.optional(NonEmptyTrimmed),
        name: Schema.optional(NonEmptyTrimmed),
      }),
    )(value);

    return info.displayName ?? info.name ?? basename(dirname(dirname(root)));
  } catch {
    return basename(dirname(dirname(root)));
  }
}

const statuses = ["backlog", "inprogress", "blocked", "done"];

const metadata = Schema.Struct({
  title: NonEmptyTrimmed,
  created: Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/)),
  updated: Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/)),
});

// Port 0 asks the OS for any free port; the real port is known once the server is listening.
const requestedPort = Number(process.env.PORT ?? 0);
let port = requestedPort;
const token = randomBytes(32).toString("hex");
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

class BoardError extends Error {
  code: number;

  constructor(message: string, code = 400) {
    super(message);
    this.code = code;
  }
}

async function realDirectory(path: string): Promise<boolean> {
  try {
    const info = await lstat(path);

    return info.isDirectory() && !info.isSymbolicLink();
  } catch {
    return false;
  }
}

async function exists(path: string): Promise<boolean> {
  return lstat(path).then(
    () => true,
    () => false,
  );
}

// An id is a slash-separated path: a top-level task name followed by nested subtask names.
async function locate(id: string): Promise<{ status: string; directory: string }> {
  const [top, ...nested] = id.split("/");

  if (!top || !slug.test(top) || !nested.every((name) => slug.test(name)))
    throw new BoardError("Invalid task name.");
  const found = [];

  for (const status of statuses) {
    const directory = join(root, status, top);

    if (await exists(directory)) found.push({ status, directory });
  }

  if (found.length > 1) throw new BoardError("Task exists in more than one status directory.");
  const [only] = found;

  if (!only || !(await realDirectory(join(root, only.status))))
    throw new BoardError("Task not found.", 404);

  if (!(await realDirectory(only.directory)))
    throw new BoardError("Task directory must be a real directory.");

  let current = only;

  for (const name of nested) {
    const matches = [];

    for (const status of statuses) {
      const directory = join(current.directory, "subtasks", status, name);

      if (await exists(directory)) matches.push({ status, directory });
    }

    if (matches.length > 1)
      throw new BoardError("Subtask exists in more than one status directory.");
    const [next] = matches;

    if (!next || !(await realDirectory(next.directory)))
      throw new BoardError("Task not found.", 404);
    current = next;
  }

  return current;
}

async function taskFile(id: string, name: string): Promise<string> {
  const { directory } = await locate(id);
  const path = join(directory, name);
  const file = await lstat(path);

  if (!file.isFile() || file.isSymbolicLink())
    throw new BoardError("Task documents must be regular files.");

  return path;
}

async function readDocument(id: string, name: string): Promise<string> {
  const path = await taskFile(id, name);
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);

  try {
    return await handle.readFile("utf8");
  } finally {
    await handle.close();
  }
}

function decodeTask(text: string) {
  try {
    const parsed = matter(text);
    const data = Schema.decodeUnknownSync(metadata)(parsed.data);

    return { data, content: parsed.content };
  } catch {
    throw new BoardError("TASK.md requires a title and quoted created/updated dates.");
  }
}

async function countSubtasks(directory: string): Promise<{ total: number; done: number }> {
  const count = { total: 0, done: 0 };

  for (const status of statuses) {
    const parent = join(directory, "subtasks", status);

    if (!(await realDirectory(parent))) continue;

    for (const entry of await readdir(parent, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      count.total += 1;
      const nested = await countSubtasks(join(parent, entry.name));
      count.total += nested.total;
      count.done += nested.done;

      if (status === "done") count.done += 1;
    }
  }

  return count;
}

async function listSubtasks(id: string) {
  const { directory } = await locate(id);
  const subtasks = [];

  for (const status of statuses) {
    const parent = join(directory, "subtasks", status);

    if (!(await realDirectory(parent))) continue;

    for (const entry of (await readdir(parent, { withFileTypes: true })).sort((left, right) =>
      left.name.localeCompare(right.name),
    )) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      const childId = `${id}/${entry.name}`;

      try {
        const { data } = decodeTask(await readDocument(childId, "TASK.md"));

        subtasks.push({
          id: childId,
          status,
          subtasks: await countSubtasks(join(parent, entry.name)),
          ...data,
        });
      } catch {
        subtasks.push({
          id: childId,
          status,
          subtasks: { total: 0, done: 0 },
          title: entry.name,
          created: "",
          updated: "",
        });
      }
    }
  }

  return subtasks;
}

async function listTasks() {
  const tasks = [];
  const errors = [];

  for (const entry of (await readdir(root, { withFileTypes: true })).sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    if (entry.isDirectory() && !statuses.includes(entry.name))
      errors.push(
        `${entry.name}: tasks must live in a status directory (${statuses.join(", ")}); move it to backlog/, inprogress/, blocked/ or done/.`,
      );
  }

  for (const status of statuses) {
    if (!(await realDirectory(join(root, status)))) continue;
    const entries = await readdir(join(root, status), { withFileTypes: true });

    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;

      try {
        const { data } = decodeTask(await readDocument(entry.name, "TASK.md"));
        const subtasks = await countSubtasks(join(root, status, entry.name));
        tasks.push({ id: entry.name, status, subtasks, ...data });
      } catch {
        errors.push(
          `${status}/${entry.name}: unable to load task; check TASK.md metadata and regular document paths.`,
        );
      }
    }
  }

  return { tasks, errors };
}

async function renderDocument(id: string, name: string): Promise<string> {
  try {
    const text = await readDocument(id, name);
    const { content } = matter(text);

    return sanitizeHtml(await marked.parse(content), {
      allowedTags: sanitizeHtml.defaults.allowedTags,
      allowedAttributes: { a: ["href", "title"], code: ["class"] },
      allowedSchemes: ["http", "https", "mailto"],
      allowProtocolRelative: false,
    });
  } catch {
    return `<p class="notice">${name} is unavailable. Check that it exists as a regular Markdown file.</p>`;
  }
}

type TaskSummary = {
  id: string;
  status: string;
  subtasks: { total: number; done: number };
  title: string;
  created: string;
  updated: string;
};

async function move(request: IncomingMessage): Promise<TaskSummary> {
  let body = "";

  for await (const chunk of request) {
    body += chunk;

    if (Buffer.byteLength(body) > 8192) throw new BoardError("Status form is too large.", 413);
  }

  const fields = new URLSearchParams(body);

  if (fields.get("token") !== token)
    throw new BoardError("Refresh the board before changing status.", 403);
  const id = fields.get("task") ?? "";

  if (id.includes("/")) throw new BoardError("Only top-level tasks can change status.");
  const status = fields.get("status") ?? "";

  if (!statuses.includes(status)) throw new BoardError("Unknown task status.");
  const current = await locate(id);
  const path = await taskFile(id, "TASK.md");
  const file = await open(path, constants.O_RDWR | constants.O_NOFOLLOW);

  try {
    const original = await file.readFile("utf8");
    decodeTask(original);
    const frontmatter = /^(---\r?\n)([\s\S]*?)(\r?\n---)(?=\r?\n|$)/.exec(original);

    if (!frontmatter || !/^updated:[^\r\n]*\r?$/m.test(frontmatter[2]))
      throw new BoardError("Use a plain updated frontmatter key.");

    const target = join(root, status, id);

    if (current.status !== status) {
      if (!(await realDirectory(join(root, status))))
        await mkdir(join(root, status), { recursive: true });

      if (
        await lstat(target).then(
          () => true,
          () => false,
        )
      )
        throw new BoardError("A task with this name already exists in that status.", 409);
    }

    const header = frontmatter[2].replace(
      /^updated:[^\r\n]*/m,
      `updated: "${new Date().toISOString().slice(0, 10)}"`,
    );

    const text = frontmatter[1] + header + frontmatter[3] + original.slice(frontmatter[0].length);
    decodeTask(text);
    await file.write(text, 0, "utf8");
    await file.truncate(Buffer.byteLength(text));

    if (current.status !== status) await rename(current.directory, target);

    const subtasks = await countSubtasks(join(root, status, id));

    return { id, status, subtasks, ...decodeTask(text).data };
  } finally {
    await file.close();
  }
}

async function buildUI() {
  const source = await readFile(join(root, "index.html"), "utf8");
  const script = /<script type="text\/tsx">([\s\S]*?)<\/script>/.exec(source);
  const style = /<style type="text\/tailwindcss">([\s\S]*?)<\/style>/.exec(source);

  if (!script || !style)
    throw new Error("index.html requires its TSX script and Tailwind style blocks.");

  const result = await build({
    stdin: { contents: script[1], loader: "tsx", resolveDir: root, sourcefile: "index.html.tsx" },
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    target: "es2022",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
    minify: true,
  });

  const require = createRequire(import.meta.url);

  const compiler = await compile(style[1], {
    base: root,
    loadStylesheet: async (id, base) => {
      const path = id.startsWith(".")
        ? resolve(base, id)
        : require.resolve(id === "tailwindcss" ? "tailwindcss/index.css" : id, { paths: [base] });

      return { path, base: dirname(path), content: await readFile(path, "utf8") };
    },
  });

  const scanner = new Scanner({ sources: [{ base: root, pattern: "index.html", negated: false }] });
  const javascript = result.outputFiles[0]?.text;

  if (!javascript) throw new Error("Unable to prepare the React application.");

  return {
    html: source.replace(script[0], "").replace(style[0], ""),
    javascript,
    css: compiler.build(scanner.scan()),
  };
}

const assets = await buildUI();

function json<T>(response: ServerResponse, value: T): void {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(value));
}

const listeners = new Set<ServerResponse>();
let notifyTimer: NodeJS.Timeout | undefined;

// Task files change in bursts (editor saves, git checkouts), so coalesce them into one event.
function notifyChange() {
  clearTimeout(notifyTimer);
  notifyTimer = setTimeout(() => {
    for (const listener of listeners) listener.write("event: change\ndata: {}\n\n");
  }, 150);
}

function openEvents(request: IncomingMessage, response: ServerResponse) {
  response.writeHead(200, { "Content-Type": "text/event-stream", Connection: "keep-alive" });
  response.write(": connected\n\n");
  listeners.add(response);
  const heartbeat = setInterval(() => response.write(": ping\n\n"), 25000);

  request.on("close", () => {
    clearInterval(heartbeat);
    listeners.delete(response);
  });
}

async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const address = `127.0.0.1:${port}`;
  response.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  );
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Cache-Control", "no-store");

  if (request.headers.host !== address)
    throw new BoardError("Use the board's 127.0.0.1 address.", 403);
  const url = new URL(request.url ?? "/", `http://${address}`);

  if (request.method === "GET" && url.pathname === "/app.js") {
    response.setHeader("Content-Type", "text/javascript; charset=utf-8");
    response.end(assets.javascript);
  } else if (request.method === "GET" && url.pathname === "/app.css") {
    response.setHeader("Content-Type", "text/css; charset=utf-8");
    response.end(assets.css);
  } else if (
    request.method === "GET" &&
    ["/fonts/anthropic-serif.woff2", "/fonts/anthropic-sans.woff2"].includes(url.pathname)
  ) {
    response.setHeader("Content-Type", "font/woff2");
    response.end(await readFile(join(root, basename(url.pathname))));
  } else if (request.method === "GET" && url.pathname === "/") {
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(assets.html);
  } else if (request.method === "GET" && url.pathname === "/api/events") {
    openEvents(request, response);
  } else if (request.method === "GET" && url.pathname === "/api/board") {
    json(response, { project: await projectName(), token, ...(await listTasks()) });
  } else if (request.method === "GET" && url.pathname.startsWith("/api/tasks/")) {
    const id = url.pathname
      .slice("/api/tasks/".length)
      .split("/")
      .map(decodeURIComponent)
      .join("/");

    decodeTask(await readDocument(id, "TASK.md"));

    const [brief, plan, subtasks] = await Promise.all([
      renderDocument(id, "BRIEF.md"),
      renderDocument(id, "PLAN.md"),
      listSubtasks(id),
    ]);

    json(response, { brief, plan, subtasks });
  } else if (request.method === "POST" && ["/api/status", "/status"].includes(url.pathname)) {
    if (request.headers.origin !== `http://${address}`)
      throw new BoardError("Status changes must originate from this board.", 403);

    if (request.headers["content-type"]?.split(";")[0] !== "application/x-www-form-urlencoded")
      throw new BoardError("Use the board's status operation.", 415);
    const updated = await move(request);

    if (url.pathname === "/api/status") json(response, updated);
    else {
      response.writeHead(303, { Location: "/" });
      response.end();
    }
  } else throw new BoardError("Page not found.", 404);
}

if (!Number.isInteger(requestedPort) || requestedPort < 0 || requestedPort > 65535)
  throw new BoardError("PORT must be between 0 and 65535.");

const server = createServer((request, response) => {
  void Effect.runPromise(
    Effect.tryPromise(() => handle(request, response)).pipe(
      Effect.match({
        onFailure: (error) => {
          const cause = error.cause;
          response.statusCode = cause instanceof BoardError ? cause.code : 500;
          response.setHeader("Content-Type", "text/plain; charset=utf-8");
          response.end(
            cause instanceof BoardError
              ? cause.message
              : "Unable to access task files. Check the task directory and try again.",
          );
        },
        onSuccess: () => undefined,
      }),
    ),
  );
});

server.requestTimeout = 10000;

// Recursive watching is supported on macOS and Windows; elsewhere the board falls back to reloads.
try {
  watch(root, { recursive: true }, notifyChange).on("error", () => undefined);
} catch {
  console.warn("File watching is unavailable; reload the board to see task changes.");
}

server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});

server.listen(requestedPort, "127.0.0.1", () => {
  // SAFETY: a server listening on a TCP host and port reports an AddressInfo, never a pipe path.
  const bound = server.address() as AddressInfo;

  port = bound.port;
  console.log(`Factory board: http://127.0.0.1:${port}`);
});
