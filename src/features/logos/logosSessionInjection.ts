/** Session-start injection for LOGOS opening paths (KB untouched). */

import type { HookOptions } from "@elevenlabs/react";
import type { VoiceKnowledgeLocator } from "@/services/agentSessionService";

type SdkAgentOverrides = NonNullable<NonNullable<HookOptions["overrides"]>["agent"]>;

export type LogosSessionMode = "guided" | "open" | "onboarding_report";

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
  overrides?: LogosSessionStartOverrides;
};

export type LogosSessionStartOverrides = {
  agent: {
    firstMessage?: string;
    // Retain the SDK prompt fields alongside the onboarding knowledge extension.
    prompt?: NonNullable<SdkAgentOverrides["prompt"]> & {
      knowledge_base?: VoiceKnowledgeLocator[];
    };
  };
};

/** Merge onboarding KB override from agent-session with path first_message overrides. */
export function mergeOnboardingKnowledgeOverrides(
  injection: LogosOpeningInjection | undefined,
  knowledgeBase: VoiceKnowledgeLocator[] | undefined,
): LogosSessionStartOverrides | undefined {
  if (!knowledgeBase?.length && !injection?.overrides) return injection?.overrides;
  const agent = {
    ...(injection?.overrides?.agent ?? {}),
    ...(knowledgeBase?.length
      ? {
          prompt: {
            ...(injection?.overrides?.agent?.prompt ?? {}),
            knowledge_base: knowledgeBase,
          },
        }
      : {}),
  };
  if (!agent.firstMessage && !agent.prompt?.knowledge_base?.length) return injection?.overrides;
  return { agent };
}

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

/** Onboarding débrief — first message vocal avec top 3 archétypes (serveur ou aperçu lab). */
export function buildOnboardingReportLogosInjection(
  firstName?: string,
  aegisUserId?: string,
  openingFirstMessage?: string,
): LogosOpeningInjection {
  const opening = openingFirstMessage?.trim();
  return {
    dynamicVariables: {
      ...(firstName ? { first_name: firstName } : {}),
      ...(aegisUserId ? { aegis_user_id: aegisUserId } : {}),
      session_mode: "onboarding_report",
      opening_prompt: "",
      ...(opening ? { opening_first_message: opening } : {}),
    },
    ...(opening
      ? {
          overrides: {
            agent: {
              firstMessage: opening,
            },
          },
        }
      : {}),
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
