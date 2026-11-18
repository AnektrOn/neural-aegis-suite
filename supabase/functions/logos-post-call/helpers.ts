/** Pure helpers for LOGOS post-call webhook (tested from src/test). */

export const LOGOS_DRIVE_ROOT_ID = "1hAZO9p_pnM-TxW_x7P9hDVr8FWh_az7C";

export type TranscriptTurn = {
  role?: string;
  message?: string | null;
  text?: string | null;
  time_in_call_secs?: number | null;
  words?: Array<{ start?: number | null }> | null;
  hesitation_timings?: unknown;
  user_hesitation_timings?: unknown;
};

export function sanitizeDriveSegment(value: string, fallback = "user"): string {
  const cleaned = value.replace(/[\\/:*?"<>|\n\r]+/g, "_").trim().slice(0, 80);
  return cleaned || fallback;
}

export function logosUserFolderName(userId: string, displayName?: string | null): string {
  const name = sanitizeDriveSegment(displayName?.trim() || "member", "member");
  return `${userId}_${name}`;
}

/** {userFolder}/YYYY/YYYY-MM-DD/{conversationId} */
export function logosConversationFolderParts(input: {
  userId: string;
  displayName?: string | null;
  date: string;
  conversationId: string;
}): { userFolder: string; year: string; date: string; conversationId: string } {
  const date = input.date.slice(0, 10);
  return {
    userFolder: logosUserFolderName(input.userId, input.displayName),
    year: date.slice(0, 4),
    date,
    conversationId: sanitizeDriveSegment(input.conversationId, "conversation"),
  };
}

export function conversationDateFromPayload(data: {
  metadata?: { start_time_unix_secs?: number | null } | null;
  event_timestamp?: number | null;
}): string {
  const unix = data.metadata?.start_time_unix_secs ?? data.event_timestamp;
  if (typeof unix === "number" && Number.isFinite(unix) && unix > 0) {
    return new Date(unix * 1000).toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

export function plainTranscriptFromTurns(turns: TranscriptTurn[] | null | undefined): string {
  if (!Array.isArray(turns) || turns.length === 0) return "";
  return turns
    .map((turn) => {
      const text = String(turn.message ?? turn.text ?? "").trim();
      if (!text) return null;
      const role = String(turn.role ?? "unknown").toLowerCase();
      const label = role === "agent" || role === "ai" ? "LOGOS" : role === "user" ? "Utilisateur" : role;
      return `${label} : ${text}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

export function resolveWebhookUserId(data: {
  user_id?: string | null;
  conversation_initiation_client_data?: {
    user_id?: string | null;
    dynamic_variables?: Record<string, unknown> | null;
  } | null;
}): string | null {
  const candidates = [
    data.user_id,
    data.conversation_initiation_client_data?.user_id,
    data.conversation_initiation_client_data?.dynamic_variables?.aegis_user_id,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return value;
    }
  }
  return null;
}

export function extractOpeningMeta(data: {
  conversation_initiation_client_data?: {
    dynamic_variables?: Record<string, unknown> | null;
  } | null;
}): { promptId: string | null; sessionMode: string | null; openingPrompt: string | null } {
  const vars = data.conversation_initiation_client_data?.dynamic_variables ?? {};
  const promptId = typeof vars.opening_path_id === "string" ? vars.opening_path_id : null;
  const sessionMode = typeof vars.session_mode === "string" ? vars.session_mode : null;
  const openingPrompt = typeof vars.opening_prompt === "string" ? vars.opening_prompt : null;
  return { promptId, sessionMode, openingPrompt };
}

/** ElevenLabs-Signature: t=timestamp,v0=hex */
export async function verifyElevenLabsSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  nowSec = Math.floor(Date.now() / 1000),
  toleranceSec = 30 * 60,
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((chunk) => {
      const [k, ...rest] = chunk.trim().split("=");
      return [k, rest.join("=")];
    }),
  );
  const timestamp = parts.t;
  const expected = parts.v0;
  if (!timestamp || !expected) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > toleranceSec) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${rawBody}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
