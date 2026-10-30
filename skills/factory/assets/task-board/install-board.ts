import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const source = dirname(fileURLToPath(import.meta.url));
const assets = ["server.ts", "index.html", "anthropic-serif.woff2", "anthropic-sans.woff2"];
const script = "factory:board";

// Keep in step with skills/factory/references/tasks.md.
const dependencies = { effect: "3.22.4" } satisfies Record<string, string>;

const developmentDependencies = {
  "@radix-ui/react-dialog": "^1.3.1",
  "@radix-ui/react-slot": "^1.5.0",
  "@radix-ui/react-tabs": "^1.2.1",
  "@tailwindcss/oxide": "^4.1.18",
  "class-variance-authority": "^0.7.1",
  clsx: "^2.1.1",
  esbuild: "^0.28.2",
  "gray-matter": "^4.0.3",
  "lucide-react": "^1.63.0",
  marked: "^17.0.6",
  react: "^19.3.1",
  "react-dom": "^19.3.1",
  "sanitize-html": "^2.18.1",
  "tailwind-merge": "^3.7.0",
  tailwindcss: "^4.1.18",
} satisfies Record<string, string>;

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("-")));
const supported = new Set(["--link", "--no-install", "--dry-run", "--help"]);
const dryRun = flags.has("--dry-run");

interface Manifest {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

function present(path: string): boolean {
  try {
    lstatSync(path);

    return true;
  } catch {
    return false;
  }
}

function placeAsset(name: string, tasks: string): void {
  const from = join(source, name);
  const to = join(tasks, name);

  if (flags.has("--link")) {
    const target = relative(tasks, from);

    if (present(to)) {
      if (lstatSync(to).isSymbolicLink() && readlinkSync(to) === target) return;

      if (!lstatSync(to).isSymbolicLink())
        throw new Error(`Refusing to replace regular file: ${to}`);
    }

    console.log(`link ${to} -> ${target}`);

    if (!dryRun) {
      if (present(to)) unlinkSync(to);
      symlinkSync(target, to);
    }

    return;
  }

  if (present(to) && lstatSync(to).isSymbolicLink())
    throw new Error(`Refusing to write through symlink: ${to}`);
  console.log(`copy ${name} -> ${to}`);

  if (!dryRun) copyFileSync(from, to);
}

function updateManifest(path: string): void {
  const text = readFileSync(path, "utf8");
  const manifest: Manifest = JSON.parse(text);
  const indent = /^(\s+)"/m.exec(text)?.[1] ?? "  ";

  const entry = flags.has("--link")
    ? "node --preserve-symlinks-main docs/tasks/server.ts"
    : "node docs/tasks/server.ts";

  const scripts = (manifest.scripts ??= {});

  if (scripts[script] !== undefined && !scripts[script].includes("docs/tasks/server.ts"))
    throw new Error(`package.json already has an unrelated "${script}" script; rename it first.`);
  scripts[script] = entry;

  const known = (name: string) =>
    manifest.dependencies?.[name] !== undefined || manifest.devDependencies?.[name] !== undefined;

  for (const [name, range] of Object.entries(dependencies)) {
    if (!known(name)) (manifest.dependencies ??= {})[name] = range;
  }

  for (const [name, range] of Object.entries(developmentDependencies)) {
    if (!known(name)) (manifest.devDependencies ??= {})[name] = range;
  }

  for (const key of ["dependencies", "devDependencies"] as const) {
    const group = manifest[key];

    if (group)
      manifest[key] = Object.fromEntries(
        Object.entries(group).sort(([a], [b]) => a.localeCompare(b)),
      );
  }

  const next = JSON.stringify(manifest, null, indent) + "\n";

  if (next === text) return;
  console.log(`update ${path}`);

  if (!dryRun) writeFileSync(path, next);
}

function packageManager(project: string): string {
  if (existsSync(join(project, "pnpm-lock.yaml"))) return "pnpm";

  if (existsSync(join(project, "yarn.lock"))) return "yarn";

  if (existsSync(join(project, "bun.lock")) || existsSync(join(project, "bun.lockb"))) return "bun";

  return "npm";
}

function main(): void {
  for (const flag of flags) {
    if (!supported.has(flag)) throw new Error(`Unknown option: ${flag}`);
  }

  if (flags.has("--help")) {
    console.log(
      "Usage: node install-board.ts [project-dir] [--link] [--no-install] [--dry-run]\nCopies the Factory board into <project>/docs/tasks and adds its script and dependencies to package.json.",
    );

    return;
  }

  if (Number(process.versions.node.split(".")[0]) < 24) throw new Error("Node.js 24+ is required.");
  const project = resolve(args.find((arg) => !arg.startsWith("-")) ?? process.cwd());
  const manifest = join(project, "package.json");

  if (!existsSync(manifest)) throw new Error(`No package.json in ${project}.`);
  const tasks = join(project, "docs", "tasks");

  updateManifest(manifest);

  if (!dryRun) mkdirSync(tasks, { recursive: true });

  for (const name of assets) placeAsset(name, tasks);

  if (dryRun || flags.has("--no-install")) return;
  const manager = packageManager(project);
  console.log(`${manager} install`);
  const result = spawnSync(manager, ["install"], { cwd: project, stdio: "inherit" });

  if (result.status !== 0) throw new Error(`${manager} install failed.`);
  console.log(`Start the board with: ${manager} run ${script}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
