import type { AddressInfo } from "node:net";
import { execFile, type ChildProcess } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { constants, watch, type FSWatcher } from "node:fs";
import { lstat, mkdir, open, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomBytes } from "node:crypto";
import { Effect, Schema } from "effect";
import { build } from "esbuild";
import { compile } from "tailwindcss";
import { createRequire } from "node:module";
import { Scanner } from "@tailwindcss/oxide";
import matter from "gray-matter";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const assetsDir = dirname(fileURLToPath(import.meta.url));

const NonEmptyTrimmed = Schema.String.check(Schema.isTrimmed(), Schema.isNonEmpty());

async function projectName(project: string): Promise<string> {
  try {
    const value = JSON.parse(await readFile(join(project, "package.json"), "utf8"));

    const info = Schema.decodeUnknownSync(
      Schema.Struct({
        displayName: Schema.optional(NonEmptyTrimmed),
        name: Schema.optional(NonEmptyTrimmed),
      }),
    )(value);

    return info.displayName ?? info.name ?? basename(project);
  } catch {
    return basename(project);
  }
}

// Watched projects live in one registry file so every board session shows the same set.
const registryFile = join(process.env.FACTORY_HOME ?? join(homedir(), ".factory"), "projects.json");

const registered: string[] = await readFile(registryFile, "utf8").then(
  (text) => Schema.decodeUnknownSync(Schema.Array(Schema.String))(JSON.parse(text)).slice(),
  () => [],
);

const projectId = (path: string) => createHash("sha1").update(path).digest("hex").slice(0, 10);
const tasksOf = (project: string) => join(project, "docs", "tasks");

async function saveRegistry(): Promise<void> {
  await mkdir(dirname(registryFile), { recursive: true });
  await writeFile(registryFile, JSON.stringify(registered, null, 2) + "\n");
}

async function addProject(input: string): Promise<string> {
  const path = resolve(input);

  if (!(await realDirectory(path))) throw new BoardError("Project must be an existing directory.");

  if (!registered.includes(path)) {
    registered.push(path);
    await saveRegistry();
    watchProject(path);
  }

  return path;
}

async function removeProject(id: string): Promise<void> {
  const path = registered.find((entry) => projectId(entry) === id);

  if (!path) throw new BoardError("Project not found.", 404);
  registered.splice(registered.indexOf(path), 1);
  watchers.get(path)?.close();
  watchers.delete(path);
  await saveRegistry();
}

// Requests name a project by id; without one the first registered project is used.
function projectPath(id: string | null | undefined): string {
  const path = id ? registered.find((entry) => projectId(entry) === id) : registered[0];

  if (!path) throw new BoardError("Add a project to start watching its tasks.", 404);

  return path;
}

async function listProjects() {
  return Promise.all(
    registered.map(async (path) => ({
      id: projectId(path),
      name: await projectName(path),
      path,
    })),
  );
}

type Picked = { path: string } | { cancelled: true } | { unsupported: true };

let picking: ChildProcess | undefined;

// Browsers never expose absolute paths, so the host's own folder chooser runs on this machine.
function chooser(command: string, args: string[]): Promise<Picked | "missing"> {
  return new Promise((done) => {
    picking = execFile(command, args, { timeout: 300000 }, (error, stdout, stderr) => {
      picking = undefined;

      if (!error) {
        const path = stdout.trim().replace(/(.)\/+$/, "$1");

        return done(path ? { path } : { cancelled: true });
      }

      if ("code" in error && error.code === "ENOENT") return done("missing");

      // osascript reports Cancel as error -128 and a denied Automation prompt as -1743.
      if (error.killed || /-128|User canceled/.test(stderr) || (error.code === 1 && !stderr))
        return done({ cancelled: true });
      done({ unsupported: true });
    });
  });
}

async function pickFolder(): Promise<Picked> {
  if (process.platform === "darwin") {
    const result = await chooser("osascript", [
      "-e",
      "tell me to activate",
      "-e",
      'POSIX path of (choose folder with prompt "Choose a project folder")',
    ]);

    return result === "missing" ? { unsupported: true } : result;
  }

  if (process.platform !== "linux" || !(process.env.DISPLAY || process.env.WAYLAND_DISPLAY))
    return { unsupported: true };
  const zenity = await chooser("zenity", ["--file-selection", "--directory"]);

  if (zenity !== "missing") return zenity;
  const kdialog = await chooser("kdialog", ["--getexistingdirectory", homedir()]);

  return kdialog === "missing" ? { unsupported: true } : kdialog;
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
async function locate(root: string, id: string): Promise<{ status: string; directory: string }> {
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

async function taskFile(root: string, id: string, name: string): Promise<string> {
  const { directory } = await locate(root, id);
  const path = join(directory, name);
  const file = await lstat(path);

  if (!file.isFile() || file.isSymbolicLink())
    throw new BoardError("Task documents must be regular files.");

  return path;
}

async function readDocument(root: string, id: string, name: string): Promise<string> {
  const path = await taskFile(root, id, name);
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

async function listSubtasks(root: string, id: string) {
  const { directory } = await locate(root, id);
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
        const { data } = decodeTask(await readDocument(root, childId, "TASK.md"));

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

async function listTasks(root: string) {
  const tasks: TaskSummary[] = [];
  const errors: string[] = [];

  if (!(await realDirectory(root)))
    return { tasks, errors: ["No docs/tasks directory in this project yet."] };

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
        const { data } = decodeTask(await readDocument(root, entry.name, "TASK.md"));
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

async function renderDocument(root: string, id: string, name: string): Promise<string> {
  try {
    const text = await readDocument(root, id, name);
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

async function formFields(request: IncomingMessage, address: string): Promise<URLSearchParams> {
  if (request.headers.origin !== `http://${address}`)
    throw new BoardError("Changes must originate from this board.", 403);

  if (request.headers["content-type"]?.split(";")[0] !== "application/x-www-form-urlencoded")
    throw new BoardError("Use the board's form operations.", 415);
  let body = "";

  for await (const chunk of request) {
    body += chunk;

    if (Buffer.byteLength(body) > 8192) throw new BoardError("Form is too large.", 413);
  }

  const fields = new URLSearchParams(body);

  if (fields.get("token") !== token)
    throw new BoardError("Refresh the board before making changes.", 403);

  return fields;
}

async function move(fields: URLSearchParams): Promise<TaskSummary> {
  const root = tasksOf(projectPath(fields.get("project")));
  const id = fields.get("task") ?? "";

  if (id.includes("/")) throw new BoardError("Only top-level tasks can change status.");
  const status = fields.get("status") ?? "";

  if (!statuses.includes(status)) throw new BoardError("Unknown task status.");
  const current = await locate(root, id);
  const path = await taskFile(root, id, "TASK.md");
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
  const source = await readFile(join(assetsDir, "index.html"), "utf8");
  const script = /<script type="text\/tsx">([\s\S]*?)<\/script>/.exec(source);
  const style = /<style type="text\/tailwindcss">([\s\S]*?)<\/style>/.exec(source);

  if (!script || !style)
    throw new Error("index.html requires its TSX script and Tailwind style blocks.");

  const result = await build({
    stdin: {
      contents: script[1],
      loader: "tsx",
      resolveDir: assetsDir,
      sourcefile: "index.html.tsx",
    },
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
    base: assetsDir,
    loadStylesheet: async (id, base) => {
      const path = id.startsWith(".")
        ? resolve(base, id)
        : require.resolve(id === "tailwindcss" ? "tailwindcss/index.css" : id, { paths: [base] });

      return { path, base: dirname(path), content: await readFile(path, "utf8") };
    },
  });

  const scanner = new Scanner({
    sources: [{ base: assetsDir, pattern: "index.html", negated: false }],
  });

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
const watchers = new Map<string, FSWatcher>();
const notifyTimers = new Map<string, NodeJS.Timeout>();

// Task files change in bursts (editor saves, git checkouts), so coalesce them into one event.
function notifyChange(project: string) {
  clearTimeout(notifyTimers.get(project));

  notifyTimers.set(
    project,
    setTimeout(() => {
      const data = JSON.stringify({ project: projectId(project) });

      for (const listener of listeners) listener.write(`event: change\ndata: ${data}\n\n`);
    }, 150),
  );
}

// Recursive watching is supported on macOS and Windows; elsewhere the board falls back to reloads.
function watchProject(project: string) {
  if (watchers.has(project)) return;

  try {
    const watcher = watch(tasksOf(project), { recursive: true }, () => notifyChange(project));
    watcher.on("error", () => undefined);
    watchers.set(project, watcher);
  } catch {
    console.warn(`Not watching ${project}; reload the board to see task changes.`);
  }
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
  } else if (request.method === "GET" && url.pathname === "/theme.js") {
    // Runs before first paint so a remembered theme never flashes; inline scripts are blocked by CSP.
    response.setHeader("Content-Type", "text/javascript; charset=utf-8");

    response.end(
      'try{const t=localStorage.getItem("factory-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch{}',
    );
  } else if (request.method === "GET" && url.pathname === "/app.css") {
    response.setHeader("Content-Type", "text/css; charset=utf-8");
    response.end(assets.css);
  } else if (
    request.method === "GET" &&
    ["/fonts/anthropic-serif.woff2", "/fonts/anthropic-sans.woff2"].includes(url.pathname)
  ) {
    response.setHeader("Content-Type", "font/woff2");
    response.end(await readFile(join(assetsDir, basename(url.pathname))));
  } else if (request.method === "GET" && url.pathname === "/") {
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(assets.html);
  } else if (request.method === "GET" && url.pathname === "/api/events") {
    openEvents(request, response);
  } else if (request.method === "GET" && url.pathname === "/api/board") {
    if (registered.length === 0)
      return json(response, {
        project: "",
        projectId: "",
        projects: [],
        token,
        tasks: [],
        errors: ["Add a project directory to start watching its tasks."],
      });
    const project = projectPath(url.searchParams.get("project"));

    json(response, {
      project: await projectName(project),
      projectId: projectId(project),
      projects: await listProjects(),
      token,
      ...(await listTasks(tasksOf(project))),
    });
  } else if (request.method === "GET" && url.pathname === "/api/projects") {
    json(response, { projects: await listProjects() });
  } else if (request.method === "POST" && url.pathname.startsWith("/api/projects/")) {
    const fields = await formFields(request, address);
    const action = url.pathname.slice("/api/projects/".length);

    if (action === "pick") {
      if (picking) throw new BoardError("A folder dialog is already open.", 409);
      // A closed tab must not leave a dialog open on the host.
      response.on("close", () => {
        if (!response.writableFinished) picking?.kill();
      });

      const picked = await pickFolder();

      if ("path" in picked) {
        const path = await addProject(picked.path);
        json(response, { id: projectId(path), projects: await listProjects() });
      } else json(response, picked);
    } else if (action === "add") {
      const path = await addProject(fields.get("path") ?? "");
      json(response, { id: projectId(path), projects: await listProjects() });
    } else if (action === "remove") {
      await removeProject(fields.get("id") ?? "");
      json(response, { projects: await listProjects() });
    } else throw new BoardError("Page not found.", 404);
  } else if (request.method === "GET" && url.pathname.startsWith("/api/tasks/")) {
    const id = url.pathname
      .slice("/api/tasks/".length)
      .split("/")
      .map(decodeURIComponent)
      .join("/");

    const root = tasksOf(projectPath(url.searchParams.get("project")));
    decodeTask(await readDocument(root, id, "TASK.md"));

    const [brief, plan, subtasks] = await Promise.all([
      renderDocument(root, id, "BRIEF.md"),
      renderDocument(root, id, "PLAN.md"),
      listSubtasks(root, id),
    ]);

    json(response, { brief, plan, subtasks });
  } else if (request.method === "POST" && ["/api/status", "/status"].includes(url.pathname)) {
    const updated = await move(await formFields(request, address));

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

// `amirreza-factory [dir...]` registers the given projects; an empty registry adopts the cwd.
const requested = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));

for (const dir of requested) await addProject(dir);

if (registered.length === 0 && (await realDirectory(tasksOf(process.cwd()))))
  await addProject(process.cwd());

for (const project of registered) watchProject(project);

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
