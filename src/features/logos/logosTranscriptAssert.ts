/** QA harness: detect LOGOS UI failures in ElevenLabs export transcripts. */

export type TranscriptTurn = {
  role: string;
  message?: string | null;
  tool_calls?: unknown[] | null;
  agent_metadata?: { workflow_node_id?: string | null } | null;
};

export type TranscriptExport = {
  transcript?: TranscriptTurn[];
  metadata?: {
    features_usage?: {
      multivoice?: { enabled?: boolean; used?: boolean };
    };
  };
};

const UI_OPEN_PHRASES =
  /\b(j['\u2019]ouvre|je t['\u2019]ouvre|je te propose|modal|tiroir|formulaire|à l['\u2019]écran)\b/i;

const FORCED_DAILY_PATH_LOOP =
  /^on se retrouve sur l'espace/i;

const UI_INTENT_PHRASES =
  /\b(pratique|toolbox|modal|pulse|quick\s*log|people|décision|decision\s*log|suggestion)\b/i;

const FAUX_UI_TOOLS = [
  "propose_actionable_choices",
  "open_toolbox_item",
  "propose_pulse_card",
  "open_quick_log",
  "open_people_checkin",
  "open_decision_capture",
];

export type LogosTranscriptViolation = {
  code: string;
  turnIndex: number;
  detail: string;
};

export function assertLogosTranscript(data: TranscriptExport): LogosTranscriptViolation[] {
  const violations: LogosTranscriptViolation[] = [];
  const turns = data.transcript ?? [];

  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    if (t.role !== "agent") continue;
    const msg = (t.message ?? "").replace(/<[^>]+>/g, " ");
    const toolCalls = t.tool_calls ?? [];
    const node = t.agent_metadata?.workflow_node_id ?? "unknown";

    if (FORCED_DAILY_PATH_LOOP.test(msg.trim()) && i > 5) {
      const priorUser = turns
        .slice(0, i)
        .reverse()
        .find((x) => x.role === "user");
      const userText = (priorUser?.message ?? "").toLowerCase();
      if (
        !/\b(chemin|début|prompt|thème du jour|retour|signal|ancrage|rappelle)\b/i.test(
          userText,
        )
      ) {
        violations.push({
          code: "unprompted_daily_path_loop",
          turnIndex: i,
          detail: msg.slice(0, 120),
        });
      }
    }

    if (UI_OPEN_PHRASES.test(msg) && toolCalls.length === 0) {
      violations.push({
        code: "announce_ui_without_tool",
        turnIndex: i,
        detail: `node=${node} message snippet: ${msg.slice(0, 120)}`,
      });
    }

    if (
      node === "triage" &&
      /\b(protocole|pratique|toolbox|pulse|quick|people|décision)\b/i.test(msg) &&
      toolCalls.length === 0 &&
      !/^ok\.?\s*$/i.test(msg.trim())
    ) {
      violations.push({
        code: "stuck_on_triage_coaching",
        turnIndex: i,
        detail: msg.slice(0, 120),
      });
    }
  }

  for (let i = 1; i < turns.length; i++) {
    const user = turns[i - 1];
    const agent = turns[i];
    if (user.role !== "user" || agent.role !== "agent") continue;
    const userMsg = user.message ?? "";
    if (!UI_INTENT_PHRASES.test(userMsg)) continue;
    const agentTools = agent.tool_calls ?? [];
    const agentNode = agent.agent_metadata?.workflow_node_id;
    if (
      agentTools.length === 0 &&
      agentNode === "triage" &&
      UI_INTENT_PHRASES.test(userMsg)
    ) {
      violations.push({
        code: "ui_intent_no_route",
        turnIndex: i,
        detail: `user: ${userMsg.slice(0, 80)} → still triage, no tools`,
      });
    }
    const toolNames = agentTools.map((c) =>
      typeof c === "object" && c && "tool_name" in c
        ? String((c as { tool_name?: string }).tool_name)
        : JSON.stringify(c),
    );
    const hasUiTool = toolNames.some((n) => FAUX_UI_TOOLS.some((f) => n.includes(f)));
    if (UI_INTENT_PHRASES.test(userMsg) && agentNode !== "triage" && !hasUiTool && agentTools.length === 0) {
      const asksOpen = /\b(ouvr|montre|modal)\b/i.test(userMsg);
      if (asksOpen) {
        violations.push({
          code: "ui_intent_no_tool_after_route",
          turnIndex: i,
          detail: `node=${agentNode} user: ${userMsg.slice(0, 80)}`,
        });
      }
    }
  }

  const mv = data.metadata?.features_usage?.multivoice;
  if (mv?.used && mv?.enabled) {
    violations.push({
      code: "multivoice_used",
      turnIndex: -1,
      detail: "multivoice enabled+used — expect single voice for pilot",
    });
  }

  const voiceTag = turns.some((t) => /<LOGOS\s+Female>/i.test(t.message ?? ""));
  if (voiceTag) {
    violations.push({
      code: "multivoice_tags_in_message",
      turnIndex: -1,
      detail: "Found <LOGOS Female> in transcript",
    });
  }

  return violations;
}