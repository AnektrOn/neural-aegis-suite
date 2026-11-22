import { describe, expect, it } from "vitest";
import { assertLogosTranscript } from "../logosTranscriptAssert";

describe("assertLogosTranscript", () => {
  it("flags announce UI without tool (conv_6701 pattern)", () => {
    const violations = assertLogosTranscript({
      transcript: [
        { role: "user", message: "ouvre le modal toolbox" },
        {
          role: "agent",
          message: "Je t'ouvre le modal avec les choix disponibles maintenant.",
          tool_calls: [],
          agent_metadata: { workflow_node_id: "triage" },
        },
      ],
    });
    expect(violations.some((v) => v.code === "announce_ui_without_tool")).toBe(true);
  });

  it("passes when tool is invoked", () => {
    const violations = assertLogosTranscript({
      transcript: [
        { role: "user", message: "une pratique" },
        {
          role: "agent",
          message: "Choisis à l'écran.",
          tool_calls: [{ tool_name: "propose_actionable_choices" }],
          agent_metadata: { workflow_node_id: "guide_somatique" },
        },
      ],
    });
    expect(violations.filter((v) => v.code === "announce_ui_without_tool")).toHaveLength(0);
  });
});