import spec from "./onboarding-report-agent.spec.json" with { type: "json" };

export type OnboardingReportAgentSpec = {
  name: string;
  language: string;
  llm: string;
  temperature: number;
  max_duration_seconds: number;
  turn_timeout: number;
  turn_eagerness: string;
  vad_background_voice_detection: boolean;
  tool_ids: string[];
  dynamic_variable_placeholders: Record<string, string>;
  first_message: string;
  prompt: string;
};

export const ONBOARDING_REPORT_AGENT_SPEC = spec as OnboardingReportAgentSpec;

/** Payload for POST create or PATCH agent (ElevenLabs convai). */
export function buildOnboardingReportAgentBody(voiceId: string): Record<string, unknown> {
  const s = ONBOARDING_REPORT_AGENT_SPEC;
  return {
    name: s.name,
    platform_settings: {
      overrides: {
        conversation_config_override: {
          agent: {
            prompt: {
              knowledge_base: true,
            },
          },
        },
      },
    },
    conversation_config: {
      agent: {
        language: s.language,
        first_message: s.first_message,
        dynamic_variables: {
          dynamic_variable_placeholders: { ...s.dynamic_variable_placeholders },
        },
        prompt: {
          prompt: s.prompt,
          llm: s.llm,
          temperature: s.temperature,
          tool_ids: [...s.tool_ids],
          ignore_default_personality: true,
          rag: {
            enabled: true,
            embedding_model: "e5_mistral_7b_instruct",
            max_vector_distance: 0.6,
            max_documents_length: 50000,
            max_retrieved_rag_chunks_count: 20,
            knowledge_base_tool_info: {
              enabled_strategies: ["cat", "keyword", "semantic", "ls"],
            },
          },
        },
      },
      conversation: {
        max_duration_seconds: s.max_duration_seconds,
        client_events: [
          "audio",
          "interruption",
          "agent_response",
          "user_transcript",
          "agent_response_correction",
          "agent_tool_response",
        ],
      },
      turn: {
        turn_timeout: s.turn_timeout,
        turn_eagerness: s.turn_eagerness,
        turn_model: "turn_v3",
      },
      vad: {
        background_voice_detection: s.vad_background_voice_detection,
      },
      tts: {
        voice_id: voiceId,
      },
    },
  };
}