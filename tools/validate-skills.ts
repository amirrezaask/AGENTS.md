import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const selected = process.argv.slice(2);
const skills = readdirSync(join(root, "skills"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const errors: string[] = [];
let count = 0;
for (const name of selected.length ? selected : skills) {
  const file = join(root, "skills", name, "SKILL.md");
  if (!existsSync(file)) {
    errors.push(`${name}: missing SKILL.md`);
    continue;
  }
  count++;
  const text = readFileSync(file, "utf8");
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)?.[1];
  if (!frontmatter) {
    errors.push(`${name}: missing YAML frontmatter`);
    continue;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64)
    errors.push(`${name}: invalid directory name`);
  if (/^name:\s*(.+)$/m.exec(frontmatter)?.[1]?.trim() !== name)
    errors.push(`${name}: name must match directory`);
  const description = /^description:\s*(.+)$/m.exec(frontmatter)?.[1]?.trim();
  if (!description || description.length > 400 || description === ">" || description === "|")
    errors.push(`${name}: use a concise single-line description (maximum 400 characters)`);
  if (text.split("\n").length > 150)
    errors.push(`${name}: entrypoint exceeds 150 lines; trim or route details to references`);
  if (/always[- ]on|read every.*markdown|no trigger keyword/i.test(text))
    errors.push(`${name}: unscoped automatic loading`);
  function checkLinks(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) checkLinks(path);
      else if (entry.name.endsWith(".md")) {
        for (const match of readFileSync(path, "utf8").matchAll(/\]\(([^)\s]+)\)/g)) {
          const target = match[1]?.split("#")[0];
          if (
            target &&
            !/^[a-z][a-z0-9+.-]*:|^\/|[<>]/i.test(target) &&
            !existsSync(resolve(dirname(path), target))
          )
            errors.push(`${path.slice(root.length + 1)}: missing link ${target}`);
        }
      }
    }
  }
  checkLinks(dirname(file));
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `Validated ${count} skills: names, descriptions, scope, entrypoint size and local links.`,
  );
