import { describe, expect, it } from "vitest";
import {
  buildOnboardingReportAgentBody,
  ONBOARDING_REPORT_AGENT_SPEC,
} from "../../supabase/functions/elevenlabs-knowledge/onboarding-report-agent";

describe("onboardingReportAgent", () => {
  it("matches spec constants", () => {
    expect(ONBOARDING_REPORT_AGENT_SPEC.name).toBe("LOGOS - Onboarding Report");
    expect(ONBOARDING_REPORT_AGENT_SPEC.temperature).toBe(0.25);
    expect(ONBOARDING_REPORT_AGENT_SPEC.max_duration_seconds).toBe(1800);
    expect(ONBOARDING_REPORT_AGENT_SPEC.llm).toBe("claude-3-5-sonnet");
    expect(ONBOARDING_REPORT_AGENT_SPEC.turn_timeout).toBe(1.4);
  });

  it("builds ElevenLabs payload with voice and duration", () => {
    const voice = "t2969wgUwHbBoVCZNHRU";
    const body = buildOnboardingReportAgentBody(voice);
    expect(body.name).toBe("LOGOS - Onboarding Report");
    const platform = body.platform_settings as {
      overrides?: { conversation_config_override?: { agent?: { prompt?: { knowledge_base?: boolean } } } };
    };
    expect(platform.overrides?.conversation_config_override?.agent?.prompt?.knowledge_base).toBe(true);
    const cc = body.conversation_config as Record<string, unknown>;
    const conv = cc.conversation as { max_duration_seconds: number };
    expect(conv.max_duration_seconds).toBe(1800);
    const tts = cc.tts as { voice_id: string };
    expect(tts.voice_id).toBe(voice);
    const agent = cc.agent as {
      first_message: string;
      prompt: { temperature: number; llm: string; tool_ids: string[] };
    };
    expect(agent.prompt.temperature).toBe(0.25);
    expect(agent.prompt.llm).toBe("claude-3-5-sonnet");
    expect(agent.prompt.tool_ids.length).toBeGreaterThanOrEqual(3);
    expect(agent.first_message).toContain("rapport d'audit décisionnel");
  });
});