import { describe, expect, it } from "vitest";
import {
  buildGuidedLogosInjection,
  buildOpenLogosInjection,
} from "../logosSessionInjection";

describe("logosSessionInjection", () => {
  it("builds guided injection with first message override", () => {
    const inj = buildGuidedLogosInjection(
      {
        openingPrompt: "Aide à clarifier une décision.",
        firstMessage: "On clarifie. Qu’est-ce qui bloque ?",
      },
      "Leo",
    );
    expect(inj.dynamicVariables.session_mode).toBe("guided");
    expect(inj.dynamicVariables.opening_prompt).toContain("décision");
    expect(inj.dynamicVariables.first_name).toBe("Leo");
    expect(inj.overrides?.agent.firstMessage).toContain("clarifie");
  });

  it("builds open injection without overrides", () => {
    const inj = buildOpenLogosInjection("Leo");
    expect(inj.dynamicVariables.session_mode).toBe("open");
    expect(inj.dynamicVariables.opening_prompt).toBe("");
    expect(inj.overrides).toBeUndefined();
  });
});
