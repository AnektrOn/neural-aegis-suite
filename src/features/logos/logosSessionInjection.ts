/** Session-start injection for LOGOS opening paths (KB untouched). */

export type LogosSessionMode = "guided" | "open";

export type LogosOpeningInjection = {
  feedbackContext?: { promptId: string; category: string };
  dynamicVariables: {
    first_name?: string;
    session_mode: LogosSessionMode;
    opening_prompt: string;
  };
  overrides?: {
    agent: {
      firstMessage: string;
    };
  };
};

export type LogosPathInjectionSource = {
  openingPrompt: string;
  firstMessage: string;
};

/** Guided path: behavior var + spoken first message override. */
export function buildGuidedLogosInjection(
  path: LogosPathInjectionSource,
  firstName?: string,
): LogosOpeningInjection {
  return {
    dynamicVariables: {
      ...(firstName ? { first_name: firstName } : {}),
      session_mode: "guided",
      opening_prompt: path.openingPrompt.trim(),
    },
    overrides: {
      agent: {
        firstMessage: path.firstMessage.trim(),
      },
    },
  };
}

/** Blank / own path: no injected behavior, open triage. */
export function buildOpenLogosInjection(firstName?: string): LogosOpeningInjection {
  return {
    dynamicVariables: {
      ...(firstName ? { first_name: firstName } : {}),
      session_mode: "open",
      opening_prompt: "",
    },
  };
}
