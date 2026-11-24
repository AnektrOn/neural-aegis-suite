/** Session-start injection for LOGOS opening paths (KB untouched). */

export type LogosSessionMode = "guided" | "open";

export type LogosOpeningInjection = {
  feedbackContext?: { promptId: string; category: string };
  dynamicVariables: {
    first_name?: string;
    session_mode: LogosSessionMode;
    opening_prompt: string;
    opening_path_id?: string;
    /** Espace du jour (ex. « Signal & Ancrage ») — pour retour explicite au chemin. */
    opening_path_title?: string;
    /** First message complet du chemin (override client) — retour brut sans boucler le début tronqué. */
    opening_first_message?: string;
    aegis_user_id?: string;
  };
  overrides?: {
    agent: {
      firstMessage: string;
    };
  };
};

export type LogosPathInjectionSource = {
  id?: string;
  openingPrompt: string;
  firstMessage: string;
  titleFr?: string;
};

/** Guided path: behavior var + spoken first message override. */
export function buildGuidedLogosInjection(
  path: LogosPathInjectionSource,
  firstName?: string,
  aegisUserId?: string,
): LogosOpeningInjection {
  return {
    dynamicVariables: {
      ...(firstName ? { first_name: firstName } : {}),
      ...(aegisUserId ? { aegis_user_id: aegisUserId } : {}),
      ...(path.id ? { opening_path_id: path.id } : {}),
      ...(path.titleFr?.trim() ? { opening_path_title: path.titleFr.trim() } : {}),
      ...(path.firstMessage.trim()
        ? { opening_first_message: path.firstMessage.trim() }
        : {}),
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
export function buildOpenLogosInjection(
  firstName?: string,
  aegisUserId?: string,
): LogosOpeningInjection {
  return {
    dynamicVariables: {
      ...(firstName ? { first_name: firstName } : {}),
      ...(aegisUserId ? { aegis_user_id: aegisUserId } : {}),
      session_mode: "open",
      opening_prompt: "",
    },
  };
}
