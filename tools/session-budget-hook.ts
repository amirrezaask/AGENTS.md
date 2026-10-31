import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";

// Claude Code hook installed by tools/install.ts for SessionStart, PreToolUse
// and Stop. It keeps ADMIN's autonomous sessions on the rules in AGENTS.md: one
// session per task and no questions to ADMIN. Context size is not managed here:
// installed settings set autoCompactWindow, so Claude Code compacts the session
// itself and SessionStart re-grounds it afterwards. Every handler fails open.

const env = process.env;
const autonomous = env.SESSION_AUTONOMY !== "off";
const maxStopBlocks = Number(env.SESSION_STOP_BLOCKS ?? 5);

const listSessions = "mcp__ccd_session_mgmt__list_sessions";
const startSession = "mcp__ccd_session__start_session";
const handOff = "mcp__ccd_session__hand_off_to_session";
const wrapUp = "mcp__ccd_turn__wrap_up";

interface ToolInput {
  ask?: string;
  blocked?: boolean;
  actions?: object[];
  initiation?: string;
}

interface HookInput {
  hook_event_name?: string;
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  agent_id?: string;
  source?: string;
  tool_name?: string;
  tool_input?: ToolInput;
  tool_use_id?: string;
  stop_hook_active?: boolean;
  last_assistant_message?: string;
}

interface State {
  stopBlocks?: number;
  toolUsesAtBlock?: number;
}

interface ContentBlock {
  type?: string;
  id?: string;
  name?: string;
  text?: string;
}

interface TranscriptLine {
  type?: string;
  isSidechain?: boolean;
  message?: {
    id?: string;
    content?: string | ContentBlock[];
  };
}

function parse(line: string): TranscriptLine | undefined {
  try {
    return JSON.parse(line);
  } catch {
    return undefined;
  }
}

interface HookOutput {
  decision?: "block";
  reason?: string;
  hookSpecificOutput?: {
    hookEventName: string;
    additionalContext?: string;
    permissionDecision?: "deny";
    permissionDecisionReason?: string;
  };
}

function emit(output: HookOutput): void {
  console.log(JSON.stringify(output));
}

function context(event: string, additionalContext: string): void {
  emit({ hookSpecificOutput: { hookEventName: event, additionalContext } });
}

function deny(reason: string): void {
  emit({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  });
}

function statePath(input: HookInput): string {
  return join(tmpdir(), `session-hooks-${String(input.session_id).replace(/\W/g, "_")}.json`);
}

function loadState(input: HookInput): State {
  try {
    return JSON.parse(readFileSync(statePath(input), "utf8"));
  } catch {
    return {};
  }
}

function saveState(input: HookInput, state: State): void {
  writeFileSync(statePath(input), JSON.stringify(state));
}

function transcript(input: HookInput): string {
  const path = input.transcript_path;

  return path && existsSync(path) ? readFileSync(path, "utf8") : "";
}

// Lines of the newest `bytes` of the transcript, newest first. Transcripts reach
// tens of megabytes, so the per-tool-call path never reads the whole file.
function tailLines(path: string, bytes: number): string[] {
  const size = statSync(path).size;
  const length = Math.min(size, bytes);
  const buffer = Buffer.alloc(length);
  const fd = openSync(path, "r");

  try {
    readSync(fd, buffer, 0, length, size - length);
  } finally {
    closeSync(fd);
  }

  const lines = buffer.toString("utf8").split("\n");

  if (length < size) lines.shift();

  return lines.filter(Boolean).reverse();
}

function lastAssistantText(path: string): string {
  if (!existsSync(path)) return "";

  for (const raw of tailLines(path, 1 << 20)) {
    const line = parse(raw);
    const content = line?.message?.content;

    if (line?.type !== "assistant" || line.isSidechain || !Array.isArray(content)) continue;
    const text = content.findLast((block) => block.type === "text")?.text;

    if (text) return text;
  }

  return "";
}

const waiting =
  /\b(waiting (on|for) (you|your|admin)|let me know (if|whether|which|how|when)|should i\b|shall i\b|do you want|would you like|want me to|your call|awaiting (your|admin)|please (confirm|advise|approve|decide)|needs? your (approval|input|decision|confirmation|go-ahead)|before i (proceed|continue)|ready when you are|over to you)/i;

// True when the final paragraph of a reply hands a question or decision to ADMIN.
function asksAdmin(message: string): boolean {
  const body = message.replace(/```[\s\S]*?```/g, "").trim();
  const last = body.split(/\n\s*\n/).at(-1) ?? "";
  const finalLine = last.trim().split("\n").at(-1) ?? "";

  return /\?[\s*_`)"'\]]*$/.test(finalLine) || waiting.test(last);
}

function blockerSection(markdown: string): string {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => /^##\s+Blocker\s*$/i.test(line));

  if (start < 0) return "";
  const end = lines.findIndex((line, index) => index > start && /^##\s/.test(line));

  return lines
    .slice(start + 1, end < 0 ? undefined : end)
    .join("\n")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
}

// A task is escalated when its TASK.md Blocker section names a real blocker.
function escalated(task: string): boolean {
  const file = join(task, "TASK.md");

  if (!existsSync(file)) return false;
  const blocker = blockerSection(readFileSync(file, "utf8"));

  return blocker !== "" && !/^(none\.?|<[^>]*>)$/i.test(blocker);
}

// In-progress, unescalated Factory tasks whose documents this session touched.
// A task moved to done/ or blocked/ no longer exists at the recorded path.
function openTasks(text: string, cwd: string): string[] {
  const tasks = new Set<string>();
  const documents = /docs\/tasks\/(?:[\w.-]+\/)+(?:PLAN|TASK|BRIEF)\.md/g;

  for (const match of text.matchAll(documents)) {
    // The root is the session's cwd, or an absolute prefix (which may contain
    // spaces) written before the path in the same string.
    const before = text.slice(Math.max(0, match.index - 512), match.index);

    const segment =
      before
        .slice(before.lastIndexOf('"') + 1)
        .split("\n")
        .at(-1) ?? "";

    const slash = segment.indexOf("/");

    const roots = slash >= 0 && segment.endsWith("/") ? [cwd, segment.slice(slash)] : [cwd];

    for (const root of roots) {
      const task = dirname(resolve(root, match[0]));

      if (basename(dirname(task)) === "inprogress") tasks.add(task);
    }
  }

  return [...tasks].filter((task) => existsSync(task) && !escalated(task));
}

function inProgressTasks(root: string): string[] {
  const found: string[] = [];

  const walk = (statusDir: string) => {
    if (!existsSync(statusDir)) return;

    for (const entry of readdirSync(statusDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const task = join(statusDir, entry.name);
      const before = found.length;
      walk(join(task, "subtasks", "inprogress"));

      if (found.length === before) found.push(task);
    }
  };

  walk(join(root, "docs", "tasks", "inprogress"));

  return found;
}

function sessionStart(input: HookInput): void {
  const cwd = input.cwd ?? process.cwd();

  if (input.agent_id || !autonomous || !existsSync(join(cwd, "docs", "tasks"))) return;
  const tasks = inProgressTasks(cwd).map((task) => relative(cwd, task));

  const resumed =
    input.source === "compact" || input.source === "resume"
      ? " Context was compacted or resumed: re-read the task's TASK.md, PLAN.md Handoff and the git diff before the next step."
      : "";

  const listed = tasks.length
    ? ` In-progress leaf tasks here: ${tasks.slice(0, 8).join(", ")}${tasks.length > 8 ? ", ..." : ""}.`
    : "";

  context(
    "SessionStart",
    `Autonomous session (AGENTS.md): never ask ADMIN anything or end a turn waiting for ADMIN; decide, record the decision in PLAN.md, continue. Before working a task, call list_sessions: if a live session already works that task, take a different unowned subtask or end. Title this session after its task. Start other sessions only for independent subtasks. Never start one to continue this task: Claude Code compacts the context itself.${resumed}${listed}`,
  );
}

function calls(line: TranscriptLine, name: string): ContentBlock[] {
  const content = line.message?.content;

  return Array.isArray(content)
    ? content.filter((block) => block.type === "tool_use" && block.name === name)
    : [];
}

// Index of the newest call to `name`, ignoring the pending call and any sibling
// calls sent in the same assistant message as it.
function newestCall(lines: TranscriptLine[], name: string, pending?: string): number {
  const pendingMessage = lines.find((line) =>
    calls(line, name).some((block) => block.id === pending),
  )?.message?.id;

  return lines.findLastIndex(
    (line) =>
      (pendingMessage === undefined || line.message?.id !== pendingMessage) &&
      calls(line, name).some((block) => block.id !== pending),
  );
}

const escalation =
  "Only a change to an approved BRIEF requirement, or an action outside the repository and sessions, goes to ADMIN, and then as the task's Blocker in TASK.md (referenced from the PLAN.md Handoff), never as a question.";

function preToolUse(input: HookInput): void {
  if (!autonomous) return;
  const tool = input.tool_name;
  const args = input.tool_input ?? {};

  if (tool === "AskUserQuestion") {
    deny(
      `ADMIN does not answer questions in these sessions. Decide yourself, record the decision and its reason in PLAN.md, and continue. ${escalation}`,
    );

    return;
  }

  if (tool === wrapUp && (args.ask || args.blocked || args.actions?.length)) {
    deny(
      `Call wrap_up again with recap only: no ask, actions or blocked. Nothing waits on ADMIN; state what you decided and what happens next. ${escalation}`,
    );

    return;
  }

  if (input.agent_id) return;

  if (tool === handOff) {
    deny(
      "hand_off_to_session forks this whole context into a second worker. Keep working here: Claude Code compacts the context automatically, and the PLAN.md Handoff carries the task across it.",
    );

    return;
  }

  if (tool !== startSession) return;

  if (args.initiation && args.initiation !== "user_asked") {
    deny(
      `start_session with initiation "${args.initiation}" leaves a card waiting for ADMIN. Use initiation "user_asked": ADMIN delegated session decisions to you.`,
    );

    return;
  }

  const lines = transcript(input)
    .split("\n")
    .filter((raw) => raw.includes(listSessions) || raw.includes(startSession))
    .map(parse)
    .filter((line): line is TranscriptLine => line?.type === "assistant");

  if (newestCall(lines, listSessions) > newestCall(lines, startSession, input.tool_use_id)) return;

  deny(
    `Call list_sessions first (load it with ToolSearch "select:${listSessions}" if needed) and confirm no live session already works this task or subtask; then start the session.`,
  );
}

function stop(input: HookInput): void {
  if (!autonomous || input.agent_id || !input.transcript_path) return;
  const message = input.last_assistant_message ?? lastAssistantText(input.transcript_path);

  if (!asksAdmin(message)) return;
  const text = transcript(input);
  const cwd = input.cwd ?? process.cwd();
  const open = openTasks(text, cwd);

  if (!open.length) return;
  const state = loadState(input);
  const blocks = state.stopBlocks ?? 0;
  const toolUses = text.split('"type":"tool_use"').length - 1;

  // Loop guard: a capped number of blocks per session, and no second block when
  // the model did no work since the last one and asks again.
  if (blocks >= maxStopBlocks) return;

  if (
    input.stop_hook_active &&
    state.toolUsesAtBlock !== undefined &&
    toolUses <= state.toolUsesAtBlock
  )
    return;

  saveState(input, { ...state, stopBlocks: blocks + 1, toolUsesAtBlock: toolUses });

  emit({
    decision: "block",
    reason: `Your reply ends by asking ADMIN or waiting on ADMIN, but ${open.map((task) => relative(cwd, task) || task).join(", ")} is still in progress and ADMIN will not answer. Decide yourself, record the decision in PLAN.md, and continue with the next step. If the decision needs a change to an approved BRIEF requirement or an action outside the repository and sessions, write it as the Blocker in TASK.md, continue any other in-scope work, and end with a statement. If another live session owns the remaining work, end with a statement saying which. Do not end with a question.`,
  });
}

function main(): void {
  const input: HookInput = JSON.parse(readFileSync(0, "utf8"));

  if (input.hook_event_name === "SessionStart") sessionStart(input);
  else if (input.hook_event_name === "PreToolUse") preToolUse(input);
  else if (input.hook_event_name === "Stop") stop(input);
}

try {
  main();
} catch {
  // A session hook must never break a tool call or a turn.
}
