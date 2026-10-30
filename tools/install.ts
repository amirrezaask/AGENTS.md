import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = realpathSync(join(dirname(fileURLToPath(import.meta.url)), ".."));
const args = process.argv.slice(2);
const options = new Set(args.filter((arg) => arg.startsWith("-")));
const supported = new Set(["--list", "--dry-run", "--help"]);
const selected = args.filter((arg) => !arg.startsWith("-"));

const skills = readdirSync(join(repo, "skills"), { withFileTypes: true })
  .filter(
    (entry) => entry.isDirectory() && existsSync(join(repo, "skills", entry.name, "SKILL.md")),
  )
  .map((entry) => entry.name)
  .sort();

interface Link {
  source: string;
  destination: string;
  previousSources?: string[];
}

function present(path: string): boolean {
  return (
    existsSync(path) ||
    (() => {
      try {
        return lstatSync(path).isSymbolicLink();
      } catch {
        return false;
      }
    })()
  );
}

interface HookCommand {
  type: string;
  command?: string;
  timeout?: number;
}

interface HookGroup {
  matcher?: string;
  hooks?: HookCommand[];
}

interface Settings {
  hooks?: Record<string, HookGroup[]>;
}

const budgetHook = "session-budget-hook.ts";

function quote(path: string): string {
  return `'${path.replaceAll("'", "'\\''")}'`;
}

function readSettings(path: string): Settings {
  if (!present(path)) return {};

  try {
    const settings = JSON.parse(readFileSync(path, "utf8"));

    if (!(settings instanceof Object) || Array.isArray(settings))
      throw new Error("not a JSON object");

    return settings;
  } catch (error) {
    throw new Error(
      `Refusing to modify unparseable settings ${path}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

// One script serves every session hook event; it dispatches on hook_event_name.
// PreToolUse only needs the tools it governs, so other tool calls skip the process.
const budgetHookEvents: [string, string | undefined][] = [
  ["SessionStart", undefined],
  [
    "PreToolUse",
    "AskUserQuestion|mcp__ccd_turn__wrap_up|mcp__ccd_session__start_session|mcp__ccd_session__hand_off_to_session",
  ],
  ["PostToolUse", "*"],
  ["Stop", undefined],
];

// Registers the session hook once per event. A rerun only rewrites our own entry
// (found by script name), so other hooks in settings.json are never touched.
function registerBudgetHook(path: string, settings: Settings, command: string, write: boolean) {
  let changed = false;

  for (const [event, matcher] of budgetHookEvents) {
    const groups = ((settings.hooks ??= {})[event] ??= []);

    const group = groups.find((entry) =>
      entry.hooks?.some((hook) => hook.command?.includes(budgetHook)),
    );

    const known = group?.hooks?.find((hook) => hook.command?.includes(budgetHook));

    if (group && known?.command === command && group.matcher === matcher) continue;

    console.log(`${known ? "update" : "add"} ${event} hook in ${path}`);

    changed = true;

    if (group && known) {
      known.command = command;
      group.matcher = matcher;
    } else groups.push({ matcher, hooks: [{ type: "command", command, timeout: 10 }] });
  }

  if (changed && write) writeFileSync(path, `${JSON.stringify(settings, null, 2)}\n`);
}

function main(): void {
  for (const option of options) {
    if (!supported.has(option)) throw new Error(`Unknown option: ${option}`);
  }

  for (const name of selected) {
    if (!skills.includes(name)) throw new Error(`Unknown skill: ${name}`);
  }

  if (options.has("--help")) {
    console.log(
      "Usage: npm run install:agents -- [--list] [--dry-run] [skill-name ...]\nExisting regular files and directories are never replaced.",
    );

    return;
  }

  if (options.has("--list")) {
    console.log((selected.length ? selected : skills).join("\n"));

    return;
  }

  const home = homedir();
  const globals = [".agents", ".codex", ".claude"].map((name) => join(home, name));

  const destinations = [
    ...globals.map((path) => join(path, "skills")),
    join(home, ".cursor", "skills-cursor"),
  ];

  const requiredSkills = ["factory", "atlas"];

  for (const name of requiredSkills) {
    const source = join(repo, "skills", name, "SKILL.md");

    if (!existsSync(source) || !statSync(source).isFile()) {
      throw new Error(`Missing required global workflow skill: ${source}`);
    }
  }

  const names = selected.length ? [...new Set([...selected, ...requiredSkills])] : skills;

  const globalFiles = [
    { name: "AGENTS.md", path: "AGENTS.md" },
    { name: "BRIEF_TEMPLATE.md", path: "skills/factory/templates/BRIEF_TEMPLATE.md" },
    { name: "PLAN_TEMPLATE.md", path: "skills/factory/templates/PLAN_TEMPLATE.md" },
    { name: "DEBRIEF_TEMPLATE.md", path: "skills/factory/templates/DEBRIEF_TEMPLATE.md" },
    { name: "SPEC_TEMPLATE.md", path: "skills/atlas/templates/AREA_TEMPLATE.md" },
  ];

  for (const path of [...globalFiles.map((file) => file.path), join("tools", budgetHook)]) {
    const source = join(repo, path);

    if (!existsSync(source) || !statSync(source).isFile()) {
      throw new Error(`Missing bundled global file: ${source}`);
    }
  }

  const links: Link[] = [
    ...globals.flatMap((base) =>
      globalFiles.map(({ name, path }) => ({
        source: join(repo, path),
        destination: join(base, name),
        previousSources: [
          join(repo, name),
          ...(name === "SPEC_TEMPLATE.md"
            ? [join(repo, "skills/factory/templates/SPEC_TEMPLATE.md")]
            : []),
          join(
            repo,
            "skills",
            name === "SPEC_TEMPLATE.md" ? "specification" : "communication",
            "templates",
            name,
          ),
        ],
      })),
    ),
    ...destinations.flatMap((base) =>
      names.map((name) => ({ source: join(repo, "skills", name), destination: join(base, name) })),
    ),
    {
      source: join(repo, "tools", budgetHook),
      destination: join(home, ".claude", "hooks", budgetHook),
    },
  ];

  const settingsPath = join(home, ".claude", "settings.json");
  const settings = readSettings(settingsPath);
  const hookCommand = `${quote(process.execPath)} ${quote(join(home, ".claude", "hooks", budgetHook))}`;

  const legacy = join(home, "dev", "Amirreza.md");

  const managed = (target: string, source: string) =>
    target === source ||
    (dirname(source) === join(repo, "skills") &&
      target === join(legacy, "skills", basename(source)));

  const removals: string[] = [];

  for (const base of destinations) {
    if (!present(base) || !lstatSync(base).isDirectory()) continue;

    for (const name of readdirSync(base)) {
      if (selected.length && !["communication", "specification"].includes(name)) continue;
      const path = join(base, name);

      if (!skills.includes(name) && present(path) && lstatSync(path).isSymbolicLink()) {
        const target = resolve(dirname(path), readlinkSync(path));

        if (managed(target, join(repo, "skills", name))) removals.push(path);
      }
    }
  }

  // Preflight every destination before changing any link. A skills directory
  // symlink could otherwise redirect writes into an unrelated installation.
  for (const base of [...globals, join(home, ".cursor"), ...destinations]) {
    if (present(base) && (lstatSync(base).isSymbolicLink() || !lstatSync(base).isDirectory())) {
      throw new Error(`Refusing non-directory or symlink destination: ${base}`);
    }
  }

  for (const { source, destination, previousSources } of links) {
    if (!present(destination)) continue;

    if (!lstatSync(destination).isSymbolicLink())
      throw new Error(`Refusing to replace existing path: ${destination}`);
    const target = resolve(dirname(destination), readlinkSync(destination));

    if (!managed(target, source) && !previousSources?.includes(target))
      throw new Error(`Refusing unrelated symlink: ${destination} -> ${target}`);
  }

  for (const base of globals) {
    const oldInstaller = join(base, "install.sh");

    if (
      present(oldInstaller) &&
      lstatSync(oldInstaller).isSymbolicLink() &&
      resolve(base, readlinkSync(oldInstaller)) === join(repo, "install.sh")
    ) {
      removals.push(oldInstaller);
    }
  }

  for (const destination of removals) {
    console.log(`remove retired link ${destination}`);

    if (!options.has("--dry-run")) unlinkSync(destination);
  }

  for (const { source, destination } of links) {
    if (present(destination) && resolve(dirname(destination), readlinkSync(destination)) === source)
      continue;
    console.log(`link ${destination} -> ${source}`);

    if (!options.has("--dry-run")) {
      mkdirSync(dirname(destination), { recursive: true });

      if (present(destination)) unlinkSync(destination);
      symlinkSync(source, destination);
    }
  }

  registerBudgetHook(settingsPath, settings, hookCommand, !options.has("--dry-run"));
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
