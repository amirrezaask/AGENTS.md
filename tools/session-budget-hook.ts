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
        additionalContext: `Session budget: this session has ${count} messages (limit ${limit}). Finish the current step and commit. Do not spawn sessions because of this notice: a session that exists only to continue another multiplies work. Keep going on the task in this session; it is fine to stay long. Commit milestones and keep the PLAN.md handoff current. Start a continuation session only if this session is truly unable to continue, only if no other session already works this task (check list_sessions first), and then at most one. Never ask ADMIN anything.`,
      },
    }),
  );
}

try {
  main();
} catch {
  // A budget nudge must never break a tool call.
}
