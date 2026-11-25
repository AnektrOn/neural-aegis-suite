import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type VoiceUsageBudget = {
  period_start: string;
  period_end: string;
  used_seconds: number;
  limit_seconds: number;
  remaining_seconds: number;
};

/** ElevenLabs knowledge base locator (session override). */
export type VoiceKnowledgeLocator = {
  type: string;
  name: string;
  id: string;
  usage_mode?: string;
};

export type AgentVoiceSession = {
  conversation_token: string;
  voice_budget?: VoiceUsageBudget;
  knowledge_base?: VoiceKnowledgeLocator[];
};

export type VoiceAgentKind = "personal_logos" | "onboarding_report";

export type CreateAgentVoiceSessionOptions = {
  agentKind?: VoiceAgentKind;
  /** Admin / dev lab : force le dossier Drive Obsidian sans modifier le profil. */
  onboardingDriveFolderId?: string;
};

type InvokePayload = {
  conversation_token?: string;
  voice_budget?: VoiceUsageBudget;
  knowledge_base?: VoiceKnowledgeLocator[];
  error?: string;
};

async function readInvokeBody(error: FunctionsHttpError): Promise<InvokePayload | null> {
  try {
    const context = await error.context.json();
    return typeof context === "object" && context !== null ? (context as InvokePayload) : null;
  } catch {
    return null;
  }
}

function throwFromInvoke(
  error: unknown,
  data: InvokePayload | null,
): never {
  if (data?.error) {
    throw new Error(data.error);
  }
  if (error instanceof FunctionsHttpError) {
    throw new Error(error.message || "Session vocale indisponible");
  }
  if (error instanceof Error) {
    throw new Error(error.message);
  }
  throw new Error("Session vocale indisponible");
}

function sessionBody(options?: CreateAgentVoiceSessionOptions): Record<string, string> {
  const body: Record<string, string> = {};
  if (options?.agentKind === "onboarding_report") {
    body.agent_kind = "onboarding_report";
  }
  if (options?.onboardingDriveFolderId?.trim()) {
    body.onboarding_drive_folder_id = options.onboardingDriveFolderId.trim();
  }
  return body;
}

async function invokeAgentSession(options?: CreateAgentVoiceSessionOptions): Promise<AgentVoiceSession> {
  const { data, error } = await supabase.functions.invoke<InvokePayload>("agent-session", {
    body: sessionBody(options),
  });

  if (!error && data?.conversation_token) {
    return {
      conversation_token: data.conversation_token,
      ...(data.voice_budget ? { voice_budget: data.voice_budget } : {}),
      ...(data.knowledge_base?.length ? { knowledge_base: data.knowledge_base } : {}),
    };
  }

  if (error instanceof FunctionsFetchError) {
    throw error;
  }

  if (error instanceof FunctionsHttpError) {
    const body = await readInvokeBody(error);
    throwFromInvoke(error, body ?? data);
  }

  if (error) {
    throwFromInvoke(error, data);
  }

  throw new Error("Réponse serveur invalide");
}

async function invokeVoiceTokenFallback(options?: CreateAgentVoiceSessionOptions): Promise<AgentVoiceSession> {
  const { data, error } = await supabase.functions.invoke<InvokePayload>("elevenlabs-knowledge", {
    body: { action: "voice_conversation_token", ...sessionBody(options) },
  });

  if (!error && data?.conversation_token) {
    return {
      conversation_token: data.conversation_token,
      ...(data.voice_budget ? { voice_budget: data.voice_budget } : {}),
      ...(data.knowledge_base?.length ? { knowledge_base: data.knowledge_base } : {}),
    };
  }

  if (error instanceof FunctionsFetchError) {
    throw new Error(
      "Impossible de joindre les fonctions Edge. Déployez agent-session ou republiez elevenlabs-knowledge sur Supabase.",
    );
  }

  if (error instanceof FunctionsHttpError) {
    const body = await readInvokeBody(error);
    if (body?.error === "Forbidden") {
      throw new Error(
        "La session vocale n'est pas encore déployée. Republiez elevenlabs-knowledge (action voice_conversation_token) ou déployez agent-session.",
      );
    }
    if (body?.error === "Action inconnue") {
      throw new Error(
        "Version de elevenlabs-knowledge obsolète : republiez la fonction Edge pour activer la session vocale.",
      );
    }
    throwFromInvoke(error, body ?? data);
  }

  if (error) {
    throwFromInvoke(error, data);
  }

  throw new Error("Réponse serveur invalide");
}

export async function createAgentVoiceSession(
  options?: CreateAgentVoiceSessionOptions,
): Promise<AgentVoiceSession> {
  try {
    return await invokeAgentSession(options);
  } catch (e) {
    if (e instanceof FunctionsFetchError) {
      return invokeVoiceTokenFallback(options);
    }
    throw e;
  }
}
