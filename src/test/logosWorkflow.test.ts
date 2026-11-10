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
});