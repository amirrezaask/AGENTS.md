import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const installer = join(root, "tools", "install.ts");

const skill = readdirSync(join(root, "skills")).find(
  (name) =>
    !["factory", "atlas"].includes(name) && existsSync(join(root, "skills", name, "SKILL.md")),
);

assert.ok(skill);

function isolated(run: (home: string) => void): void {
  const home = mkdtempSync(join(tmpdir(), "agent home "));

  try {
    run(home);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
}

function invoke(home: string, ...args: string[]) {
  return spawnSync(process.execPath, [installer, ...args], {
    env: { ...process.env, HOME: home },
    encoding: "utf8",
  });
}

test("list and dry-run do not write to HOME; invalid input fails", () =>
  isolated((home) => {
    assert.equal(invoke(home, "--list").status, 0);
    assert.equal(invoke(home, "--dry-run").status, 0);
    assert.deepEqual(readdirSync(home), []);
    assert.notEqual(invoke(home, "--unknown").status, 0);
    assert.notEqual(invoke(home, "../missing").status, 0);
    assert.deepEqual(readdirSync(home), []);
  }));

test("installs individual skills and globals; repeated installs preserve unrelated files", () =>
  isolated((home) => {
    const base = join(home, ".agents", "skills");
    mkdirSync(base, { recursive: true });
    writeFileSync(join(base, "unrelated"), "keep");
    assert.equal(invoke(home).status, 0);
    assert.equal(lstatSync(base).isDirectory(), true);
    assert.equal(readlinkSync(join(base, skill)), join(root, "skills", skill));
    assert.equal(readlinkSync(join(home, ".codex", "AGENTS.md")), join(root, "AGENTS.md"));
    assert.equal(existsSync(join(home, ".agents", "tools")), false);
    assert.equal(existsSync(join(home, ".agents", ".git")), false);
    assert.equal(invoke(home).status, 0);
    assert.equal(readFileSync(join(base, "unrelated"), "utf8"), "keep");
  }));

test("collisions fail preflight without changing globals or existing content", () =>
  isolated((home) => {
    const base = join(home, ".claude", "skills", skill);
    mkdirSync(base, { recursive: true });
    writeFileSync(join(base, "saved"), "keep");
    assert.notEqual(invoke(home).status, 0);
    assert.equal(readFileSync(join(base, "saved"), "utf8"), "keep");
    assert.equal(existsSync(join(home, ".agents")), false);
  }));

test("migrates known legacy links and only removes managed retired skills", () =>
  isolated((home) => {
    const base = join(home, ".agents", "skills");
    mkdirSync(base, { recursive: true });
    const old = join(home, "dev", "Amirreza.md", "skills");
    symlinkSync(join(old, skill), join(base, skill));
    symlinkSync(join(old, "amirreza-md"), join(base, "amirreza-md"));

    if (!existsSync(join(root, "skills", "dod")))
      symlinkSync(join(home, "unrelated", "dod"), join(base, "dod"));
    assert.equal(invoke(home).status, 0);
    assert.equal(readlinkSync(join(base, skill)), join(root, "skills", skill));

    if (!existsSync(join(root, "skills", "amirreza-md")))
      assert.throws(() => lstatSync(join(base, "amirreza-md")));

    if (!existsSync(join(root, "skills", "dod")))
      assert.equal(readlinkSync(join(base, "dod")), join(home, "unrelated", "dod"));
  }));

test("selected install includes global workflow skills; foreign symlinks are preserved", () =>
  isolated((home) => {
    assert.equal(invoke(home, skill).status, 0);
    assert.deepEqual(
      readdirSync(join(home, ".agents", "skills")).sort(),
      [...new Set([skill, "factory", "atlas"])].sort(),
    );
    const destination = join(home, ".codex", "skills", skill);
    rmSync(destination);
    symlinkSync(join(home, "foreign"), destination);
    assert.notEqual(invoke(home, skill).status, 0);
    assert.equal(readlinkSync(destination), join(home, "foreign"));
  }));

test("symlinked skills destination is rejected before writing through it", () =>
  isolated((home) => {
    const foreign = join(home, "foreign");
    mkdirSync(foreign);
    mkdirSync(join(home, ".agents"));
    symlinkSync(foreign, join(home, ".agents", "skills"));
    assert.notEqual(invoke(home).status, 0);
    assert.deepEqual(readdirSync(foreign), []);
  }));

test("symlinked cursor parent is rejected and legacy root installer links are cleaned", () =>
  isolated((home) => {
    const foreign = join(home, "foreign");
    mkdirSync(foreign);
    symlinkSync(foreign, join(home, ".cursor"));
    assert.notEqual(invoke(home).status, 0);
    assert.deepEqual(readdirSync(foreign), []);
    rmSync(join(home, ".cursor"));
    mkdirSync(join(home, ".agents"));
    symlinkSync(join(root, "install.sh"), join(home, ".agents", "install.sh"));
    assert.equal(invoke(home).status, 0);
    assert.throws(() => lstatSync(join(home, ".agents", "install.sh")));
  }));

test("removes any retired old-source skill link but preserves unrelated links and directories", () =>
  isolated((home) => {
    const base = join(home, ".cursor", "skills-cursor");
    mkdirSync(base, { recursive: true });
    symlinkSync(join(home, "dev", "Amirreza.md", "skills", "code-style"), join(base, "code-style"));
    symlinkSync(join(home, "foreign", "poweruser-usability"), join(base, "poweruser-usability"));
    mkdirSync(join(base, "typescript-performance"));
    assert.equal(invoke(home).status, 0);
    assert.throws(() => lstatSync(join(base, "code-style")));
    assert.equal(
      readlinkSync(join(base, "poweruser-usability")),
      join(home, "foreign", "poweruser-usability"),
    );
    assert.equal(lstatSync(join(base, "typescript-performance")).isDirectory(), true);
  }));

const templateSources = [
  { name: "BRIEF_TEMPLATE.md", path: "skills/factory/templates/BRIEF_TEMPLATE.md" },
  { name: "PLAN_TEMPLATE.md", path: "skills/factory/templates/PLAN_TEMPLATE.md" },
  { name: "DEBRIEF_TEMPLATE.md", path: "skills/factory/templates/DEBRIEF_TEMPLATE.md" },
  { name: "SPEC_TEMPLATE.md", path: "skills/atlas/templates/AREA_TEMPLATE.md" },
];

const globalDirectories = [".agents", ".codex", ".claude"];

test("full and selected installs provide all twelve readable global template aliases", () =>
  isolated((home) => {
    for (const args of [[], [skill], [skill]]) {
      assert.equal(invoke(home, ...args).status, 0);

      for (const directory of globalDirectories) {
        for (const { name, path } of templateSources) {
          const alias = join(home, directory, name);
          assert.equal(readlinkSync(alias), join(root, path));
          assert.equal(readFileSync(alias, "utf8"), readFileSync(join(root, path), "utf8"));
        }
      }
    }
  }));

test("dry-run preserves old root aliases and actual install migrates exact managed aliases", () =>
  isolated((home) => {
    for (const directory of globalDirectories) {
      mkdirSync(join(home, directory));

      for (const { name } of templateSources)
        symlinkSync(join(root, name), join(home, directory, name));
    }

    assert.equal(invoke(home, "--dry-run", skill).status, 0);

    for (const directory of globalDirectories) {
      for (const { name } of templateSources)
        assert.equal(readlinkSync(join(home, directory, name)), join(root, name));
      assert.equal(existsSync(join(home, directory, "AGENTS.md")), false);
      assert.equal(existsSync(join(home, directory, "skills")), false);
    }

    assert.equal(invoke(home, skill).status, 0);

    for (const directory of globalDirectories) {
      for (const { name, path } of templateSources)
        assert.equal(readlinkSync(join(home, directory, name)), join(root, path));
    }
  }));

test("foreign template aliases and regular files fail preflight without partial installation", () => {
  for (const collision of ["symlink", "file"])
    isolated((home) => {
      const base = join(home, ".claude");
      mkdirSync(base);
      const alias = join(base, "SPEC_TEMPLATE.md");
      const foreign = join(home, "foreign.md");
      writeFileSync(foreign, "saved");

      if (collision === "symlink") symlinkSync(foreign, alias);
      else writeFileSync(alias, "saved");
      const result = invoke(home, skill);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Refusing/);
      assert.equal(readFileSync(alias, "utf8"), "saved");

      if (collision === "symlink") assert.equal(readlinkSync(alias), foreign);
      assert.equal(existsSync(join(home, ".agents")), false);
      assert.equal(existsSync(join(base, "AGENTS.md")), false);
    });
});

test("missing template or required skill fails before any home mutation", () => {
  for (const missing of ["template", "factory", "atlas"])
    isolated((temporary) => {
      const fixture = join(temporary, "fixture");
      const home = join(temporary, "home");
      mkdirSync(home);
      mkdirSync(join(fixture, "tools"), { recursive: true });
      writeFileSync(join(fixture, "tools", "install.ts"), readFileSync(installer));
      writeFileSync(join(fixture, "AGENTS.md"), "global");

      for (const name of ["factory", "atlas"]) {
        mkdirSync(join(fixture, "skills", name), { recursive: true });

        if (missing !== name) writeFileSync(join(fixture, "skills", name, "SKILL.md"), "skill");
      }

      for (const { name, path } of templateSources) {
        mkdirSync(dirname(join(fixture, path)), { recursive: true });

        if (missing !== "template" || name !== "SPEC_TEMPLATE.md")
          writeFileSync(join(fixture, path), "template");
      }

      const result = spawnSync(process.execPath, [join(fixture, "tools", "install.ts")], {
        env: { ...process.env, HOME: home },
        encoding: "utf8",
      });

      assert.notEqual(result.status, 0);
      assert.match(
        result.stderr,
        /Missing bundled global file|Missing required global workflow skill/,
      );
      assert.deepEqual(readdirSync(home), []);
    });
});

test("migrates former nested template aliases and retires old workflow skills on selected installs", () =>
  isolated((home) => {
    for (const directory of globalDirectories) {
      const base = join(home, directory);
      mkdirSync(join(base, "skills"), { recursive: true });

      for (const name of ["communication", "specification"])
        symlinkSync(join(root, "skills", name), join(base, "skills", name));

      for (const { name } of templateSources) {
        const old = name === "SPEC_TEMPLATE.md" ? "specification" : "communication";
        symlinkSync(join(root, "skills", old, "templates", name), join(base, name));
      }
    }

    assert.equal(invoke(home, "--dry-run", skill).status, 0);
    assert.equal(
      lstatSync(join(home, ".agents", "skills", "communication")).isSymbolicLink(),
      true,
    );
    assert.equal(invoke(home, skill).status, 0);

    for (const directory of globalDirectories) {
      for (const name of ["communication", "specification"])
        assert.throws(() => lstatSync(join(home, directory, "skills", name)));
      assert.equal(
        readlinkSync(join(home, directory, "skills", "factory")),
        join(root, "skills", "factory"),
      );

      for (const { name, path } of templateSources)
        assert.equal(readlinkSync(join(home, directory, name)), join(root, path));
    }
  }));

test("migrates the former Factory spec alias to Atlas on selected installs, including dangling links", () =>
  isolated((home) => {
    const oldSource = join(root, "skills", "factory", "templates", "SPEC_TEMPLATE.md");

    for (const directory of globalDirectories) {
      mkdirSync(join(home, directory));
      symlinkSync(oldSource, join(home, directory, "SPEC_TEMPLATE.md"));
    }

    assert.equal(invoke(home, "--dry-run", skill).status, 0);
    assert.equal(readlinkSync(join(home, ".agents", "SPEC_TEMPLATE.md")), oldSource);
    assert.equal(invoke(home, skill).status, 0);

    for (const directory of globalDirectories) {
      assert.equal(
        readlinkSync(join(home, directory, "SPEC_TEMPLATE.md")),
        join(root, "skills", "atlas", "templates", "AREA_TEMPLATE.md"),
      );
      assert.equal(
        readlinkSync(join(home, directory, "skills", "atlas")),
        join(root, "skills", "atlas"),
      );
    }
  }));

const budgetHook = "session-budget-hook.ts";

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}

test("registers the session budget hook once, preserving existing settings and hooks", () =>
  isolated((home) => {
    const settings = join(home, ".claude", "settings.json");
    const other = { matcher: "*", hooks: [{ type: "command", command: "echo keep" }] };
    mkdirSync(join(home, ".claude"));
    writeFileSync(
      settings,
      JSON.stringify({ model: "sonnet", hooks: { PostToolUse: [other], Stop: [other] } }),
    );

    assert.equal(invoke(home, "--dry-run").status, 0);
    assert.equal(readJson(settings).hooks.PostToolUse.length, 1);

    assert.equal(invoke(home).status, 0);
    const installed = readJson(settings);
    assert.equal(installed.model, "sonnet");
    const link = join(home, ".claude", "hooks", budgetHook);
    assert.equal(readlinkSync(link), join(root, "tools", budgetHook));

    assert.deepEqual(installed.hooks.Stop[0], other);
    assert.equal(installed.hooks.Stop.length, 2);

    for (const event of ["SessionStart", "PreToolUse", "Stop"]) {
      const ours = installed.hooks[event].at(-1);
      assert.ok(ours.hooks[0].command.includes(link));
    }

    assert.deepEqual(installed.hooks.PostToolUse, [other]);
    assert.equal(installed.autoCompactWindow, 300_000);
    assert.match(installed.hooks.PreToolUse[0].matcher, /AskUserQuestion/);
    assert.equal(installed.hooks.Stop[1].matcher, undefined);

    const before = readFileSync(settings, "utf8");
    assert.equal(invoke(home).status, 0);
    assert.equal(readFileSync(settings, "utf8"), before);

    installed.hooks.Stop[1].hooks[0].command = `old ${budgetHook}`;
    installed.hooks.PreToolUse[0].matcher = "*";
    writeFileSync(settings, JSON.stringify(installed));
    assert.equal(invoke(home).status, 0);
    assert.equal(readFileSync(settings, "utf8"), before);
  }));

test("keeps a chosen autoCompactWindow and retires our old PostToolUse hook", () =>
  isolated((home) => {
    const settings = join(home, ".claude", "settings.json");
    mkdirSync(join(home, ".claude"));
    writeFileSync(
      settings,
      JSON.stringify({
        autoCompactWindow: "500k",
        hooks: {
          PostToolUse: [
            { matcher: "*", hooks: [{ type: "command", command: `node ${budgetHook}` }] },
          ],
        },
      }),
    );

    assert.equal(invoke(home).status, 0);
    const installed = readJson(settings);
    assert.equal(installed.autoCompactWindow, "500k");
    assert.equal(installed.hooks.PostToolUse, undefined);
  }));

test("unparseable settings.json fails before any home mutation", () =>
  isolated((home) => {
    mkdirSync(join(home, ".claude"));
    writeFileSync(join(home, ".claude", "settings.json"), "{ not json");
    const result = invoke(home);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unparseable settings/);
    assert.equal(readFileSync(join(home, ".claude", "settings.json"), "utf8"), "{ not json");
    assert.equal(existsSync(join(home, ".agents")), false);
    assert.equal(existsSync(join(home, ".claude", "hooks")), false);
  }));

interface ToolArgs {
  recap?: string;
  ask?: string;
  initiation?: string;
  file_path?: string;
}

interface HookPayload {
  hook_event_name?: string;
  transcript_path?: string;
  tool_name?: string;
  tool_input?: ToolArgs;
  tool_use_id?: string;
  agent_id?: string;
  source?: string;
  stop_hook_active?: boolean;
  last_assistant_message?: string;
}

interface HookEnv {
  SESSION_AUTONOMY?: string;
}

// Synthetic transcript records in Claude Code's JSONL shape.
const readCall = (filePath: string) =>
  JSON.stringify({
    type: "assistant",
    isSidechain: false,
    message: {
      content: [{ type: "tool_use", id: "t1", name: "Read", input: { file_path: filePath } }],
    },
  });

const toolUse = (name: string, id: string, messageId: string) =>
  JSON.stringify({
    type: "assistant",
    message: { id: messageId, content: [{ type: "tool_use", id, name, input: {} }] },
  });

function hookSession(
  run: (hook: (input: HookPayload, env?: HookEnv) => string, home: string) => void,
) {
  isolated((home) => {
    const sessionId = `hook-test-${process.pid}-${Math.random().toString(36).slice(2)}`;

    const hook = (input: HookPayload, env: HookEnv = {}) => {
      const result = spawnSync(process.execPath, [join(root, "tools", budgetHook)], {
        env: {
          ...process.env,
          ...env,
        },
        input: JSON.stringify({ session_id: sessionId, cwd: home, ...input }),
        encoding: "utf8",
      });

      assert.equal(result.status, 0, result.stderr);

      return result.stdout;
    };

    try {
      run(hook, home);
    } finally {
      rmSync(join(tmpdir(), `session-hooks-${sessionId.replace(/\W/g, "_")}.json`), {
        force: true,
      });
    }
  });
}

test("PreToolUse denies questions to ADMIN and unchecked or forked sessions", () =>
  hookSession((hook, home) => {
    const transcript = join(home, "t.jsonl");

    const pre = (tool_name: string, tool_input: ToolArgs = {}, extra: HookPayload = {}) =>
      hook({
        hook_event_name: "PreToolUse",
        transcript_path: transcript,
        tool_name,
        tool_input,
        tool_use_id: "toolu_now",
        ...extra,
      });

    const denied = (output: string) =>
      JSON.parse(output).hookSpecificOutput.permissionDecision === "deny";

    writeFileSync(transcript, "");
    assert.ok(denied(pre("AskUserQuestion")));
    assert.ok(denied(pre("mcp__ccd_turn__wrap_up", { recap: "r", ask: "Start it?" })));
    assert.equal(pre("mcp__ccd_turn__wrap_up", { recap: "r" }), "");
    assert.ok(denied(pre("mcp__ccd_session__hand_off_to_session")));
    assert.ok(denied(pre("mcp__ccd_session__start_session", { initiation: "offer" })));

    const start = "mcp__ccd_session__start_session";
    const list = "mcp__ccd_session_mgmt__list_sessions";
    assert.ok(denied(pre(start, { initiation: "user_asked" })));

    writeFileSync(
      transcript,
      `${toolUse(list, "toolu_l1", "m1")}\n${toolUse(start, "toolu_now", "m2")}\n`,
    );
    assert.equal(pre(start, { initiation: "user_asked" }), "");

    writeFileSync(
      transcript,
      [
        toolUse(list, "toolu_l1", "m1"),
        toolUse(start, "toolu_s1", "m2"),
        toolUse(start, "toolu_now", "m2"),
      ].join("\n"),
    );
    assert.equal(pre(start), "", "sibling calls after one list_sessions are allowed");

    writeFileSync(
      transcript,
      [
        toolUse(list, "toolu_l1", "m1"),
        toolUse(start, "toolu_s1", "m2"),
        toolUse(start, "toolu_now", "m3"),
      ].join("\n"),
    );
    assert.ok(denied(pre(start)), "a later start needs a fresh list_sessions");

    assert.equal(pre(start, {}, { agent_id: "sub" }), "");
    assert.ok(denied(pre("AskUserQuestion", {}, { agent_id: "sub" })));
    assert.equal(
      hook(
        { hook_event_name: "PreToolUse", tool_name: "AskUserQuestion" },
        { SESSION_AUTONOMY: "off" },
      ),
      "",
    );
  }));

test("Stop blocks questions to ADMIN while a touched task is in progress, with a loop guard", () =>
  hookSession((hook, home) => {
    const task = join(
      home,
      "docs",
      "tasks",
      "inprogress",
      "epic",
      "subtasks",
      "inprogress",
      "leaf",
    );

    mkdirSync(task, { recursive: true });
    writeFileSync(join(task, "TASK.md"), "## Blocker\nNone\n");
    const transcript = join(home, "t.jsonl");
    const read = readCall(join(task, "PLAN.md"));
    writeFileSync(transcript, `${read}\n`);

    const stop = (last_assistant_message: string, extra: HookPayload = {}) =>
      hook({
        hook_event_name: "Stop",
        transcript_path: transcript,
        last_assistant_message,
        ...extra,
      });

    assert.equal(stop("Committed M3. Next I start M4."), "");
    const blocked = JSON.parse(stop("M3 is done.\n\nStart the continuation session?"));
    assert.equal(blocked.decision, "block");
    assert.match(blocked.reason, /docs\/tasks\/inprogress\/epic\/subtasks\/inprogress\/leaf/);
    assert.equal(
      stop("Waiting on you for the branch name.", { stop_hook_active: true }),
      "",
      "no work since block",
    );

    writeFileSync(transcript, `${read}\n${read}\n`);
    assert.match(stop("Should I keep going?", { stop_hook_active: true }), /"block"/);

    writeFileSync(join(task, "TASK.md"), "## Blocker\nBRIEF R2 conflicts with the engine API.\n");
    assert.equal(stop("Which option do you want?"), "", "an escalated task may end");

    writeFileSync(join(task, "TASK.md"), "## Blocker\nNone\n");
    rmSync(join(home, "docs"), { recursive: true });
    assert.equal(stop("Anything else?"), "", "a finished or moved task may end");
  }));

test("SessionStart lists in-progress leaf tasks and re-grounds after compaction", () =>
  hookSession((hook, home) => {
    assert.equal(hook({ hook_event_name: "SessionStart", source: "startup" }), "");
    mkdirSync(join(home, "docs", "tasks", "inprogress", "epic", "subtasks", "inprogress", "leaf"), {
      recursive: true,
    });

    const start = JSON.parse(
      hook({ hook_event_name: "SessionStart", source: "startup" }),
    ).hookSpecificOutput;

    assert.equal(start.hookEventName, "SessionStart");
    assert.match(start.additionalContext, /list_sessions/);
    assert.match(start.additionalContext, /epic\/subtasks\/inprogress\/leaf\./);
    assert.match(hook({ hook_event_name: "SessionStart", source: "compact" }), /re-read the task/);
  }));
