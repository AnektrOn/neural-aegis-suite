import { describe, expect, it } from "vitest";
import templateJson from "../../supabase/functions/elevenlabs-knowledge/logos-workflow.json";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const template = templateJson as any;

describe("LOGOS workflow", () => {
  it("does not strip agent KB on workflow nodes (no empty knowledge_base override)", () => {
    const roles: any[] = Object.values(template.workflow.nodes as Record<string, any>).filter((n: any) => n.type === "override_agent");
    expect(roles.length).toBeGreaterThanOrEqual(11);
    for (const node of roles) {
      const kb =
        "conversation_config" in node &&
        node.conversation_config?.agent?.prompt &&
        "knowledge_base" in node.conversation_config.agent.prompt
          ? node.conversation_config.agent.prompt.knowledge_base
          : undefined;
      expect(kb).toBeUndefined();
    }
    const shadow = template.workflow.nodes.prism_myss_shadow as { additional_knowledge_base?: unknown[] };
    expect((shadow.additional_knowledge_base ?? []).length).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(template)).not.toMatch(/el_(memoire|grimoire|jung|myss|blavatsky|syntheses)/);
  });
  it("Myss lighthouse tree replaces flat myss node", () => {
    expect(template.workflow.nodes.myss).toBeUndefined();
    expect(template.workflow.nodes.lighthouse_myss).toBeDefined();
    expect(template.workflow.nodes.perspective_myss_archetypes).toBeDefined();
    expect(template.workflow.edges.analyse__lighthouse_myss.target).toBe("lighthouse_myss");
    expect(template.workflow.edges.perspective_myss_archetypes__prism_myss_shadow.target).toBe(
      "prism_myss_shadow",
    );
    expect(template.workflow.edges.triage__end_node.target).toBe("end_node");
    expect(template.workflow.edges.start_node__greeting.target).toBe("triage");
    expect(template.workflow.nodes.triage.entry_behavior).toBe("wait_for_user");
  });
  it("retains Jung and Blavatsky from analyse", () => {
    expect(template.workflow.edges.analyse__jung.target).toBe("jung");
    expect(template.workflow.edges.analyse__blavatsky.target).toBe("blavatsky");
  });

  it("pins UI client tools on guide_somatique, checkin, analyse", () => {
    const guide = template.workflow.nodes.guide_somatique as {
      additional_tool_ids?: string[];
    };
    const checkin = template.workflow.nodes.checkin as { additional_tool_ids?: string[] };
    const analyse = template.workflow.nodes.analyse as { additional_tool_ids?: string[] };
    expect(guide.additional_tool_ids).toContain("tool_4801m7bxhmy8fd6sbessx9cmbybp");
    expect(guide.additional_tool_ids).toContain("tool_8601m7bv51w0enrveq8kpy663yne");
    expect(checkin.additional_tool_ids?.length).toBeGreaterThanOrEqual(3);
    expect(analyse.additional_tool_ids?.length).toBeGreaterThanOrEqual(5);
    const triage = template.workflow.nodes.triage as { additional_tool_ids?: string[] };
    expect((triage.additional_tool_ids ?? []).length).toBeGreaterThanOrEqual(8);
  });
});