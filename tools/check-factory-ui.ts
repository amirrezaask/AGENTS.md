import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  rmdirSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "skills/factory/assets/task-board/index.html"), "utf8");
const script = /<script type="text\/tsx">([\s\S]*?)<\/script>/.exec(source)?.[1];

if (!script) throw new Error("Factory index.html is missing its TSX application.");

const scratch = join(root, ".work");

mkdirSync(scratch, { recursive: true });

const directory = mkdtempSync(join(scratch, "ui-check-"));
const file = join(directory, "app.tsx");

writeFileSync(file, script.trim() + "\n");

try {
  const fix = process.argv.includes("--fix");
  const lint = fix || process.argv.includes("--lint");

  const commands = lint
    ? [
        [
          "oxlint/bin/oxlint",
          ...(fix ? ["--fix"] : []),
          "--config",
          join(root, ".oxlintrc.json"),
          file,
        ],
        ["oxfmt/bin/oxfmt", fix ? "--write" : "--check", file],
      ]
    : [
        [
          "typescript/bin/tsc",
          "--noEmit",
          "--strict",
          "--types",
          "node",
          "--jsx",
          "react-jsx",
          "--esModuleInterop",
          "--module",
          "nodenext",
          "--target",
          "es2023",
          file,
        ],
      ];

  for (const [command, ...args] of commands) {
    if (!command) throw new Error("Missing UI validation command.");

    const result = spawnSync(process.execPath, [join(root, "node_modules", command), ...args], {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, NODE_OPTIONS: "--import tsx" },
    });

    if (result.error) throw result.error;

    if (result.status !== 0) {
      process.exitCode = result.status ?? 1;
      break;
    }
  }

  if (fix && !process.exitCode)
    writeFileSync(
      join(root, "skills/factory/assets/task-board/index.html"),
      source.replace(
        /(<script type="text\/tsx">)[\s\S]*?(<\/script>)/,
        "$1\n" + readFileSync(file, "utf8") + "$2",
      ),
    );
} finally {
  rmSync(directory, { recursive: true });

  if (readdirSync(scratch).length === 0) rmdirSync(scratch);
}
