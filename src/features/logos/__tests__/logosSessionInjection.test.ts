import { describe, expect, it } from "vitest";
import {
  buildGuidedLogosInjection,
  buildOpenLogosInjection,
} from "../logosSessionInjection";

describe("logosSessionInjection", () => {
  it("builds guided injection with first message override", () => {
    const inj = buildGuidedLogosInjection(
      {
        id: "path-1",
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
    expect(inj.dynamicVariables.aegis_user_id).toBe("33333333-3333-3333-3333-333333333333");
    expect(inj.overrides?.agent.firstMessage).toContain("clarifie");
  });

  it("builds open injection without overrides", () => {
    const inj = buildOpenLogosInjection("Leo", "33333333-3333-3333-3333-333333333333");
    expect(inj.dynamicVariables.session_mode).toBe("open");
    expect(inj.dynamicVariables.opening_prompt).toBe("");
    expect(inj.dynamicVariables.aegis_user_id).toBe("33333333-3333-3333-3333-333333333333");
    expect(inj.overrides).toBeUndefined();
  });
});
