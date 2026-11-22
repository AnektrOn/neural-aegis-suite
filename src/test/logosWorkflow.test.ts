import { describe, expect, it } from "vitest";
import template from "../../supabase/functions/elevenlabs-knowledge/logos-workflow.json";

describe("LOGOS workflow without uploaded sources", () => {
  it("installs all seven conversation roles without knowledge documents", () => {
    const roles = Object.values(template.workflow.nodes).filter(n => n.type === "override_agent");
    expect(roles).toHaveLength(7);
    for (const node of roles) {
      expect("conversation_config" in node && node.conversation_config.agent.prompt.knowledge_base).toEqual([]);
    }
    expect(JSON.stringify(template)).not.toMatch(/el_(memoire|grimoire|jung|myss|blavatsky|syntheses)/);
  });
  it("retains routing to all three author readings and conversation termination", () => {
    expect(template.workflow.edges.analyse__jung.target).toBe("jung");
    expect(template.workflow.edges.analyse__myss.target).toBe("myss");
    expect(template.workflow.edges.analyse__blavatsky.target).toBe("blavatsky");
    expect(template.workflow.edges.triage__end_node.target).toBe("end_node");
    expect(template.workflow.edges.start_node__greeting.target).toBe("triage");
    expect(template.workflow.nodes.triage.entry_behavior).toBe("wait_for_user");
  });

  it("pins UI client tools on guide_somatique, checkin, analyse", () => {
    const guide = template.workflow.nodes.guide_somatique as {
      additional_tool_ids?: string[];
    };
    const checkin = template.workflow.nodes.checkin as { additional_tool_ids?: string[] };
    const analyse = template.workflow.nodes.analyse as { additional_tool_ids?: string[] };
    expect(guide.additional_tool_ids).toContain("tool_4801m7bxhmy8fd6sbessx9cmbybp");
    expect(checkin.additional_tool_ids?.length).toBeGreaterThanOrEqual(3);
    expect(analyse.additional_tool_ids?.length).toBeGreaterThanOrEqual(5);
    expect((template.workflow.nodes.triage as { additional_tool_ids?: string[] }).additional_tool_ids ?? []).toHaveLength(0);
  });
});