import { describe, expect, it } from "vitest";
import {
  buildGuidedLogosInjection,
  buildOnboardingReportLogosInjection,
  buildOpenLogosInjection,
  mergeOnboardingKnowledgeOverrides,
} from "../logosSessionInjection";

describe("logosSessionInjection", () => {
  it("builds guided injection with first message override", () => {
    const inj = buildGuidedLogosInjection(
      {
        id: "path-1",
        titleFr: "Signal & Ancrage",
        openingPrompt: "Aide à clarifier une décision.",
        firstMessage: "On clarifie. Qu’est-ce qui bloque ?",
      },
      "Leo",
      "33333333-3333-3333-3333-333333333333",
    );
    expect(inj.dynamicVariables.session_mode).toBe("guided");
    expect(inj.dynamicVariables.opening_prompt).toContain("décision");
    expect(inj.dynamicVariables.first_name).toBe("Leo");
    expect(inj.dynamicVariables.opening_path_id).toBe("path-1");
    expect(inj.dynamicVariables.opening_path_title).toBe("Signal & Ancrage");
    expect(inj.dynamicVariables.opening_first_message).toContain("clarifie");
    expect(inj.dynamicVariables.aegis_user_id).toBe("33333333-3333-3333-3333-333333333333");
    expect(inj.overrides?.agent.firstMessage).toContain("clarifie");
  });

  it("builds onboarding report injection", () => {
    const inj = buildOnboardingReportLogosInjection("Note", "25d80046-d3f4-43f2-933a-ade961f20e28");
    expect(inj.dynamicVariables.session_mode).toBe("onboarding_report");
    expect(inj.overrides).toBeUndefined();
    expect(inj.dynamicVariables.aegis_user_id).toBe("25d80046-d3f4-43f2-933a-ade961f20e28");
    const withKb = mergeOnboardingKnowledgeOverrides(inj, [
      { type: "text", id: "doc_1", name: "00_RAPPORT.md" },
    ]);
    expect(withKb?.agent.prompt?.knowledge_base?.[0].name).toBe("00_RAPPORT.md");
  });

  it("builds open injection without overrides", () => {
    const inj = buildOpenLogosInjection("Leo", "33333333-3333-3333-3333-333333333333");
    expect(inj.dynamicVariables.session_mode).toBe("open");
    expect(inj.dynamicVariables.opening_prompt).toBe("");
    expect(inj.dynamicVariables.aegis_user_id).toBe("33333333-3333-3333-3333-333333333333");
    expect(inj.overrides).toBeUndefined();
  });
});
