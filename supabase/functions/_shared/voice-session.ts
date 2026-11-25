import { userHasLogosEntitlement } from './logos-entitlement.ts';
import {
  assertVoiceBudgetAllowsSession,
  type VoiceUsageBudget,
} from './voice-budget.ts';
import {
  resolveOnboardingMemberKnowledgeBase,
  type VoiceKnowledgeLocator,
} from './voice-onboarding-kb.ts';
import {
  resolveOnboardingReportAgentId,
  type VoiceAgentKind,
} from './voice-onboarding-session.ts';

export type { VoiceKnowledgeLocator };

export type { VoiceAgentKind };

const EL = "https://api.elevenlabs.io/v1";
const EL_FETCH_TIMEOUT_MS = 15_000;
const RATE_LIMIT_PER_HOUR = 40;

// deno-lint-ignore no-explicit-any
type Admin = any;

function elApiKey() {
  const k = Deno.env.get("ELEVENLABS_API_KEY");
  if (!k) throw new Error("ELEVENLABS_API_KEY manquante");
  return k;
}

function defaultAgentId() {
  return Deno.env.get("ELEVENLABS_DEFAULT_AGENT_ID")?.trim() || null;
}

async function fetchWebRtcToken(agentId: string, participantName: string) {
  const url = new URL(`${EL}/convai/conversation/token`);
  url.searchParams.set("agent_id", agentId);
  url.searchParams.set("participant_name", participantName);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "xi-api-key": elApiKey() },
    signal: AbortSignal.timeout(EL_FETCH_TIMEOUT_MS),
  });

  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`ElevenLabs ${res.status}: ${text.slice(0, 500)}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  const body = text ? JSON.parse(text) : {};
  const token = body?.token as string | undefined;
  if (!token) throw new Error("Réponse ElevenLabs sans token");
  return token;
}

export async function resolveVoiceAgentId(
  admin: Admin,
  userId: string,
  agentKind: VoiceAgentKind = "personal_logos",
): Promise<string | null> {
  if (agentKind === "onboarding_report") {
    return resolveOnboardingReportAgentId(admin);
  }

  const { data: mapping, error: mapErr } = await admin
    .from("user_agents")
    .select("elevenlabs_agent_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!mapErr && mapping?.elevenlabs_agent_id) {
    return mapping.elevenlabs_agent_id as string;
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("elevenlabs_agent_id")
    .eq("id", userId)
    .maybeSingle();

  return (profile?.elevenlabs_agent_id as string | null | undefined) ?? defaultAgentId();
}

export type VoiceConversationStartPayload = {
  conversation_token: string;
  voice_budget: VoiceUsageBudget;
  /** Populated for onboarding_report — pass as conversation KB override at session start. */
  knowledge_base?: VoiceKnowledgeLocator[];
  /** Onboarding : first message avec top 3 archétypes majeurs (depuis 00_RAPPORT). */
  opening_first_message?: string;
  top_archetypes?: { label: string; score: number }[];
};

export async function createVoiceConversationToken(
  admin: Admin,
  userId: string,
  opts?: { agent_kind?: VoiceAgentKind; onboarding_drive_root_override?: string },
): Promise<VoiceConversationStartPayload> {
  const agentKind = opts?.agent_kind === "onboarding_report" ? "onboarding_report" : "personal_logos";
  const { data: rl, error: rlErr } = await admin.rpc("check_service_rate_limit", {
    p_bucket: `agent-session:${userId}`,
    p_limit: RATE_LIMIT_PER_HOUR,
    p_window_seconds: 3600,
  });
  if (rlErr) {
    console.error("voice-session: rate limit rpc", rlErr.message);
  } else if (rl && typeof rl === "object" && rl.allowed === false) {
    const err = new Error("Too many requests");
    (err as Error & { status?: number }).status = 429;
    throw err;
  }

  if (agentKind === "personal_logos") {
    const entitled = await userHasLogosEntitlement(admin, userId);
    if (!entitled) {
      const err = new Error("Abonnement AEGIS + LOGOS Solo requis");
      (err as Error & { status?: number }).status = 403;
      throw err;
    }
  }

  const agentId = await resolveVoiceAgentId(admin, userId, agentKind);
  if (!agentId) {
    const err = new Error("Aucun agent vocal configuré pour ce compte");
    (err as Error & { status?: number }).status = 404;
    throw err;
  }

  const voice_budget = await assertVoiceBudgetAllowsSession(admin, userId);

  let knowledge_base: VoiceKnowledgeLocator[] | undefined;
  let opening_first_message: string | undefined;
  let top_archetypes: { label: string; score: number }[] | undefined;
  if (agentKind === "onboarding_report") {
    const { data: profile } = await admin
      .from("profiles")
      .select("first_name, display_name")
      .eq("id", userId)
      .maybeSingle();
    const memberFirst =
      (typeof profile?.first_name === "string" && profile.first_name.trim()) ||
      (typeof profile?.display_name === "string" && profile.display_name.trim().split(/\s+/)[0]) ||
      "toi";

    const pack = await resolveOnboardingMemberKnowledgeBase(admin, userId, {
      drive_root_override: opts?.onboarding_drive_root_override,
      member_first_name: memberFirst,
    });
    knowledge_base = pack.knowledge_base;
    opening_first_message = pack.opening_first_message;
    top_archetypes = pack.top_archetypes;
  }

  const conversation_token = await fetchWebRtcToken(agentId, userId);
  return {
    conversation_token,
    voice_budget,
    ...(knowledge_base?.length ? { knowledge_base } : {}),
    ...(opening_first_message ? { opening_first_message } : {}),
    ...(top_archetypes?.length ? { top_archetypes } : {}),
  };
}

export function mapVoiceSessionError(e: unknown): { message: string; status: number } {
  const msg = e instanceof Error ? e.message : String(e);
  const status = (e as Error & { status?: number }).status;
  if (status === 403) {
    if (msg.includes("Quota vocal")) return { message: msg, status: 403 };
    return { message: "Abonnement AEGIS + LOGOS Solo requis", status: 403 };
  }
  if (status === 404) return { message: "Agent introuvable", status: 404 };
  if (status === 429) return { message: "Too many requests", status: 429 };
  if (status === 422) {
    if (msg.includes("Base de connaissances") || msg.includes("Vault")) return { message: msg, status: 422 };
    return { message: "Configuration agent invalide", status: 502 };
  }
  if (msg.includes("timeout") || msg.includes("Timeout")) {
    return { message: "ElevenLabs timeout", status: 504 };
  }
  return { message: "Impossible de démarrer la session vocale", status: 502 };
}
