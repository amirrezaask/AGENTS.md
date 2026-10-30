import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Claude Code PostToolUse hook installed by tools/install.ts. Long sessions re-send
// their whole transcript every turn, so past a message count it tells the model to
// hand the work to a fresh session instead of carrying on.
const warnAt = Number(process.env.SESSION_BUDGET_WARN ?? 150);
const hardAt = Number(process.env.SESSION_BUDGET_HARD ?? 250);

function main(): void {
  const input = JSON.parse(readFileSync(0, "utf8"));

  if (input.agent_id || !input.transcript_path || !existsSync(input.transcript_path)) return;

  const count = readFileSync(input.transcript_path, "utf8").split("\n").filter(Boolean).length;
  const hard = count >= hardAt;

  if (!hard && count < warnAt) return;

  // The soft warning fires once per session; past the hard limit it repeats on every tool call.
  const marker = join(tmpdir(), `session-budget-${String(input.session_id).replace(/\W/g, "_")}`);

  if (!hard) {
    if (existsSync(marker)) return;
    writeFileSync(marker, "");
  }

  const limit = hard ? hardAt : warnAt;

  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: `Session budget: this session has ${count} messages (limit ${limit}). Finish the current step and commit. Then start a new session with fresh context (start_session with context "fresh", never hand_off_to_session, which forks this whole context) and a 5-line brief: docs to read, branch/worktree, what is done, what is next, gates to run, and whether the new session proceeds or waits for ADMIN. If start_session is unavailable, print the brief and tell ADMIN to open a new session. Then stop work here.`,
      },
    }),
  );
}

try {
  main();
} catch {
  // A budget nudge must never break a tool call.
}
