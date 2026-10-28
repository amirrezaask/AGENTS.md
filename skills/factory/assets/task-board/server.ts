import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { constants } from "node:fs";
import { lstat, open, readdir, readFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { Effect, Schema } from "effect";
import matter from "gray-matter";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const root = dirname(fileURLToPath(import.meta.url));

async function projectName(): Promise<string> {
  try {
    const value = JSON.parse(await readFile(join(root, "../../package.json"), "utf8"));

    const info = Schema.decodeUnknownSync(
      Schema.Struct({
        displayName: Schema.optional(Schema.NonEmptyTrimmedString),
        name: Schema.optional(Schema.NonEmptyTrimmedString),
      }),
    )(value);

    return info.displayName ?? info.name ?? basename(dirname(dirname(root)));
  } catch {
    return basename(dirname(dirname(root)));
  }
}

const statuses = ["ready", "in-progress", "blocked", "done"];
const labels = ["Ready", "In progress", "Blocked", "Done"];

const metadata = Schema.Struct({
  title: Schema.NonEmptyTrimmedString,
  status: Schema.Literal("ready", "in-progress", "blocked", "done"),
  created: Schema.String.pipe(Schema.pattern(/^\d{4}-\d{2}-\d{2}$/)),
  updated: Schema.String.pipe(Schema.pattern(/^\d{4}-\d{2}-\d{2}$/)),
});

const port = Number(process.env.PORT ?? 4310);
const token = randomBytes(32).toString("hex");
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

class BoardError extends Error {
  code: number;

  constructor(message: string, code = 400) {
    super(message);
    this.code = code;
  }
}

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

async function taskFile(id: string, name: string): Promise<string> {
  if (!slug.test(id)) throw new BoardError("Invalid task name.");
  const directory = join(root, id);
  const info = await lstat(directory);

  if (!info.isDirectory() || info.isSymbolicLink())
    throw new BoardError("Task directory must be a real directory.");
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
    throw new BoardError(
      "TASK.md requires a title, valid status, and quoted created/updated dates.",
    );
  }
}

async function listTasks() {
  const tasks = [];
  const errors = [];
  const entries = await readdir(root, { withFileTypes: true });

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;

    try {
      const { data } = decodeTask(await readDocument(entry.name, "TASK.md"));
      tasks.push({ id: entry.name, ...data });
    } catch {
      errors.push(
        `${entry.name}: unable to load task; check TASK.md metadata and regular document paths.`,
      );
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

// This browser function contains only erasable TypeScript syntax and is served
// as JavaScript after Node's native TypeScript loader has processed this file.
function enhance() {
  const modal = document.querySelector("dialog");

  if (modal) {
    modal.removeAttribute("open");
    modal.showModal();
    modal.addEventListener("cancel", () => {
      window.location.href = "/";
    });
  }
}

const css = `
@font-face{font-family:"Anthropic Serif";src:url("/fonts/anthropic-serif.woff2") format("woff2");font-display:swap}
@font-face{font-family:"Anthropic Sans";src:url("/fonts/anthropic-sans.woff2") format("woff2");font-display:swap}
:root{color-scheme:light;--ink:#141413;--muted:#5e5d59;--paper:#faf9f5;--line:#e8e6dc;--accent:#9b4a32;--clay:#d97757;--hover:#f0eee6;--ease:cubic-bezier(.165,.84,.44,1);font-family:"Anthropic Sans",system-ui,sans-serif;color:var(--ink);background:var(--paper)}
*{box-sizing:border-box}body{margin:0}a{color:var(--accent);text-underline-offset:.2em}button,select{font:inherit}a,button,select{outline-offset:4px}:focus-visible{outline:2px solid var(--clay)}::selection{background:#ecd5c8}
.project-title{font-family:"Anthropic Serif",Georgia,serif;font-size:clamp(32px,4vw,46px);font-weight:400;letter-spacing:-.025em;line-height:1.15;margin:0;padding:40px 44px 12px;overflow-wrap:anywhere}header{display:flex;align-items:center;justify-content:space-between;gap:24px;border-bottom:1px solid var(--line)}h1{font-family:"Anthropic Serif",Georgia,serif;font-weight:400;letter-spacing:-.025em;margin:0}.button,button{display:inline-block;background:white;border:1px solid var(--line);border-radius:7px;padding:8px 12px;color:var(--ink);text-decoration:none;cursor:pointer}.button:hover{background:var(--hover)}button{background:var(--ink);color:var(--paper);border-color:var(--ink)}button:hover{background:#3d3d3a;border-color:#3d3d3a}.button,button,select{transition:background-color 140ms var(--ease),border-color 140ms var(--ease),color 140ms var(--ease)}button:active{background:#5e5d59}
main{padding:28px 40px}.board{display:grid;grid-template-columns:repeat(4,minmax(200px,1fr));gap:20px;align-items:start;overflow-x:auto;padding:4px 4px 20px}.column h2{font-size:14px;font-weight:500;color:var(--muted);display:flex;gap:10px;align-items:center;margin:0 0 18px}.count{font-variant-numeric:tabular-nums;color:var(--muted);font-weight:400}.card{background:white;border:1px solid var(--line);border-radius:12px;margin-bottom:12px;padding:18px;transition:border-color 160ms var(--ease),background-color 160ms var(--ease)}.card:hover{border-color:#d1cfc5;background:#fdfcf9}.card>a{display:block;font-size:16px;line-height:1.4;font-weight:600;color:var(--ink);text-decoration:none;overflow-wrap:anywhere}.card>a:hover{text-decoration:underline}.date{font-size:12px;color:var(--muted);margin:12px 0 16px}.status-form{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.status-form select{min-width:0;max-width:100%;border:1px solid var(--line);background:white;border-radius:6px;padding:6px;font-size:12px}.status-form button{font-size:12px;padding:6px 9px}.empty{font-size:13px;color:var(--muted);padding:20px 0;border-top:1px dashed var(--line)}.notice{padding:16px;border:1px solid var(--line);border-radius:8px;background:#fff9e8;overflow-wrap:anywhere}.errors{margin-bottom:24px}
dialog{width:min(900px,calc(100% - 32px));max-height:88dvh;padding:0;border:1px solid var(--line);border-radius:14px;box-shadow:0 18px 65px #26262426;color:var(--ink);background:var(--paper)}dialog::backdrop{background:#14141355;animation:backdrop-enter 160ms var(--ease)}dialog[open]{display:flex;flex-direction:column;animation:dialog-enter 180ms var(--ease)}dialog header{padding:22px 28px}dialog h2{font-family:"Anthropic Serif",Georgia,serif;font-weight:400;font-size:26px;margin:0;overflow-wrap:anywhere}.tabs{display:flex;gap:24px;padding:0 28px;border-bottom:1px solid var(--line)}.tabs a{padding:16px 0;text-decoration:none;color:var(--muted);border-bottom:2px solid transparent}.tabs a[aria-current=page]{border-color:var(--accent);color:var(--accent);font-weight:600}.document{padding:12px 28px 32px;overflow:auto;line-height:1.7;overflow-wrap:anywhere}.document>*{max-width:75ch}.document h1{font-size:26px;margin-top:24px}.document h2{font-family:"Anthropic Serif",Georgia,serif;font-weight:400;font-size:24px;margin-top:28px}.document h3{margin-top:24px}.document pre{background:var(--paper);padding:16px;overflow:auto;border-radius:8px}.document code{font-size:.9em}.document table{border-collapse:collapse;display:block;overflow:auto}.document td,.document th{border:1px solid var(--line);padding:8px 12px;text-align:left}.document blockquote{margin-left:0;padding-left:18px;border-left:2px solid var(--line);color:var(--muted)}
@keyframes dialog-enter{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes backdrop-enter{from{opacity:0}to{opacity:1}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
@media(max-width:700px){.project-title{padding:28px 20px 8px}main{padding:20px 16px}.board{gap:16px;grid-template-columns:repeat(4,minmax(260px,1fr))}dialog header{padding:18px}.tabs{padding:0 18px}.document{padding:8px 18px 24px}}
`;

async function render(url: URL): Promise<string> {
  const name = escape(await projectName());
  const { tasks, errors } = await listTasks();
  const id = url.searchParams.get("task");
  const active = tasks.find((task) => task.id === id);

  if (id && !active)
    throw new BoardError("Task unavailable. Check its metadata and documents.", 404);
  const tab = url.searchParams.get("tab") === "plan" ? "plan" : "brief";

  const columns = statuses
    .map((status, index) => {
      const cards = tasks
        .filter((task) => task.status === status)
        .map(
          (task) => `
      <article class="card"><a href="/?task=${task.id}">${escape(task.title)}</a>
      <p class="date">Updated ${escape(task.updated)}</p>
      <form class="status-form" action="/status" method="post">
      <input type="hidden" name="token" value="${token}"><input type="hidden" name="task" value="${task.id}">
      <select aria-label="Status for ${escape(task.title)}" name="status">${statuses.map((value, position) => `<option value="${value}"${value === task.status ? " selected" : ""}>${labels[position]}</option>`).join("")}</select>
      <button type="submit">Move</button></form></article>`,
        )
        .join("");

      return `<section class="column" aria-label="${labels[index]}"><h2>${labels[index]} <span class="count">${tasks.filter((task) => task.status === status).length}</span></h2>${cards || '<p class="empty">No tasks here.</p>'}</section>`;
    })
    .join("");

  const modal = active
    ? `<dialog open aria-labelledby="task-title"><header><h2 id="task-title">${escape(active.title)}</h2><a class="button" href="/" aria-label="Close task">Close</a></header>
    <nav class="tabs" aria-label="Task documents"><a href="/?task=${active.id}&tab=brief"${tab === "brief" ? ' aria-current="page"' : ""}>Brief</a><a href="/?task=${active.id}&tab=plan"${tab === "plan" ? ' aria-current="page"' : ""}>Plan</a></nav>
    <article class="document">${await renderDocument(active.id, tab === "plan" ? "PLAN.md" : "BRIEF.md")}</article></dialog>`
    : "";

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name} — Tasks</title><style>${css}</style><script src="/client.js" defer></script></head><body><h1 class="project-title">${name}</h1><main>${errors.length ? `<aside class="errors" aria-label="Task errors">${errors.map((error) => `<p class="notice">${escape(error)}</p>`).join("")}</aside>` : ""}<div class="board">${columns}</div></main>${modal}</body></html>`;
}

async function move(request: IncomingMessage): Promise<void> {
  let body = "";

  for await (const chunk of request) {
    body += chunk;

    if (Buffer.byteLength(body) > 8192) throw new BoardError("Status form is too large.", 413);
  }

  const fields = new URLSearchParams(body);

  if (fields.get("token") !== token)
    throw new BoardError("Refresh the board before changing status.", 403);
  const id = fields.get("task") ?? "";
  const status = fields.get("status") ?? "";

  if (!statuses.includes(status)) throw new BoardError("Unknown task status.");
  const path = await taskFile(id, "TASK.md");
  const file = await open(path, constants.O_RDWR | constants.O_NOFOLLOW);

  try {
    const original = await file.readFile("utf8");
    decodeTask(original);
    const frontmatter = /^(---\r?\n)([\s\S]*?)(\r?\n---)(?=\r?\n|$)/.exec(original);

    if (
      !frontmatter ||
      !/^status:[^\r\n]*\r?$/m.test(frontmatter[2]) ||
      !/^updated:[^\r\n]*\r?$/m.test(frontmatter[2])
    )
      throw new BoardError("Use plain status and updated frontmatter keys.");

    const header = frontmatter[2]
      .replace(/^status:[^\r\n]*/m, `status: ${status}`)
      .replace(/^updated:[^\r\n]*/m, `updated: "${new Date().toISOString().slice(0, 10)}"`);

    const text = frontmatter[1] + header + frontmatter[3] + original.slice(frontmatter[0].length);
    decodeTask(text);
    await file.write(text, 0, "utf8");
    await file.truncate(Buffer.byteLength(text));
  } finally {
    await file.close();
  }
}

async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const address = `127.0.0.1:${port}`;
  response.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; style-src 'unsafe-inline'; font-src 'self'; script-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  );
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Cache-Control", "no-store");

  if (request.headers.host !== address)
    throw new BoardError("Use the board's 127.0.0.1 address.", 403);
  const url = new URL(request.url ?? "/", `http://${address}`);

  if (request.method === "GET" && url.pathname === "/client.js") {
    response.setHeader("Content-Type", "text/javascript; charset=utf-8");
    response.end(`(${enhance.toString()})();`);
  } else if (
    request.method === "GET" &&
    ["/fonts/anthropic-serif.woff2", "/fonts/anthropic-sans.woff2"].includes(url.pathname)
  ) {
    response.setHeader("Content-Type", "font/woff2");
    response.end(await readFile(join(root, basename(url.pathname))));
  } else if (request.method === "GET" && url.pathname === "/") {
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(await render(url));
  } else if (request.method === "POST" && url.pathname === "/status") {
    if (request.headers.origin !== `http://${address}`)
      throw new BoardError("Status changes must originate from this board.", 403);

    if (request.headers["content-type"]?.split(";")[0] !== "application/x-www-form-urlencoded")
      throw new BoardError("Use the board's status form.", 415);
    await move(request);
    response.writeHead(303, { Location: "/" });
    response.end();
  } else {
    throw new BoardError("Page not found.", 404);
  }
}

if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new BoardError("PORT must be between 1 and 65535.");

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

server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Factory board: http://127.0.0.1:${port}`);
});
