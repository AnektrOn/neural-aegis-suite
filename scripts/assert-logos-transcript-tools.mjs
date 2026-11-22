#!/usr/bin/env node
/**
 * Usage: node scripts/assert-logos-transcript-tools.mjs path/to/transcript.json
 * Exit 0 = pass, 1 = violations (LOGOS UI / routing).
 */
import { readFileSync } from "node:fs";

const UI_OPEN_PHRASES =
  /\b(j['\u2019]ouvre|je t['\u2019]ouvre|je te propose|modal|tiroir|formulaire|à l['\u2019]écran)\b/i;
const UI_INTENT_PHRASES =
  /\b(pratique|toolbox|modal|pulse|quick\s*log|people|décision|decision\s*log|suggestion)\b/i;

function assertTranscript(data) {
  const violations = [];
  const turns = data.transcript ?? [];

  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    if (t.role !== "agent") continue;
    const msg = (t.message ?? "").replace(/<[^>]+>/g, " ");
    const toolCalls = t.tool_calls ?? [];
    const node = t.agent_metadata?.workflow_node_id ?? "unknown";
    if (UI_OPEN_PHRASES.test(msg) && toolCalls.length === 0) {
      violations.push({ code: "announce_ui_without_tool", turn: i, detail: `${node}: ${msg.slice(0, 100)}` });
    }
  }

  for (let i = 1; i < turns.length; i++) {
    const user = turns[i - 1];
    const agent = turns[i];
    if (user.role !== "user" || agent.role !== "agent") continue;
    const userMsg = user.message ?? "";
    if (!UI_INTENT_PHRASES.test(userMsg)) continue;
    if ((agent.tool_calls ?? []).length === 0 && agent.agent_metadata?.workflow_node_id === "triage") {
      violations.push({ code: "ui_intent_no_route", turn: i, detail: userMsg.slice(0, 80) });
    }
  }

  if (turns.some((t) => /<LOGOS\s+Female>/i.test(t.message ?? ""))) {
    violations.push({ code: "multivoice_tags", turn: -1, detail: "<LOGOS Female> in transcript" });
  }

  return violations;
}

const path = process.argv[2];
if (!path) {
  console.error("Usage: node scripts/assert-logos-transcript-tools.mjs <transcript.json>");
  process.exit(2);
}

const data = JSON.parse(readFileSync(path, "utf8"));
const violations = assertTranscript(data);

if (violations.length === 0) {
  console.log("OK — no LOGOS UI violations detected.");
  process.exit(0);
}

console.error(`FAIL — ${violations.length} violation(s):`);
for (const v of violations) {
  console.error(`  [${v.code}] turn ${v.turn}: ${v.detail}`);
}
process.exit(1);