import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AgentVoiceSession = {
  conversation_token: string;
};

type InvokePayload = { conversation_token?: string; error?: string };

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

async function invokeAgentSession(): Promise<AgentVoiceSession> {
  const { data, error } = await supabase.functions.invoke<InvokePayload>("agent-session", {
    body: {},
  });

  if (!error && data?.conversation_token) {
    return { conversation_token: data.conversation_token };
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

async function invokeVoiceTokenFallback(): Promise<AgentVoiceSession> {
  const { data, error } = await supabase.functions.invoke<InvokePayload>("elevenlabs-knowledge", {
    body: { action: "voice_conversation_token" },
  });

  if (!error && data?.conversation_token) {
    return { conversation_token: data.conversation_token };
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

export async function createAgentVoiceSession(): Promise<AgentVoiceSession> {
  try {
    return await invokeAgentSession();
  } catch (e) {
    if (e instanceof FunctionsFetchError) {
      return invokeVoiceTokenFallback();
    }
    throw e;
  }
}
