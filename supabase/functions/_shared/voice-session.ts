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

export async function resolveVoiceAgentId(admin: Admin, userId: string): Promise<string | null> {
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

export async function createVoiceConversationToken(
  admin: Admin,
  userId: string,
): Promise<{ conversation_token: string }> {
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

  const agentId = await resolveVoiceAgentId(admin, userId);
  if (!agentId) {
    const err = new Error("Aucun agent vocal configuré pour ce compte");
    (err as Error & { status?: number }).status = 404;
    throw err;
  }

  const conversation_token = await fetchWebRtcToken(agentId, userId);
  return { conversation_token };
}

export function mapVoiceSessionError(e: unknown): { message: string; status: number } {
  const msg = e instanceof Error ? e.message : String(e);
  const status = (e as Error & { status?: number }).status;
  if (status === 404) return { message: "Agent introuvable", status: 404 };
  if (status === 429) return { message: "Too many requests", status: 429 };
  if (status === 422) return { message: "Configuration agent invalide", status: 502 };
  if (msg.includes("timeout") || msg.includes("Timeout")) {
    return { message: "ElevenLabs timeout", status: 504 };
  }
  return { message: "Impossible de démarrer la session vocale", status: 502 };
}
