import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getGoogleAccessToken } from "../_shared/google-drive.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Expose-Headers": "content-length, content-range, accept-ranges, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const TOKEN_TTL_SEC = 3 * 60 * 60;
const MAX_CHUNK = 1024 * 1024;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signPlayback(secret: string, trackId: string, userId: string, exp: number): Promise<string> {
  const payload = `${trackId}.${userId}.${exp}`;
  const key = await hmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  return `${payload}.${toBase64Url(sig)}`;
}

async function verifyPlayback(
  secret: string,
  token: string,
): Promise<{ trackId: string; userId: string } | null> {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [trackId, userId, expRaw, sig] = parts;
  const exp = Number(expRaw);
  if (!trackId || !userId || !Number.isFinite(exp) || exp * 1000 < Date.now()) return null;
  const payload = `${trackId}.${userId}.${exp}`;
  const key = await hmacKey(secret);
  const ok = await crypto.subtle.verify("HMAC", key, fromBase64Url(sig), new TextEncoder().encode(payload));
  if (!ok) return null;
  return { trackId, userId };
}

function parseRange(header: string | null, size: number): { start: number; end: number } {
  const fallbackEnd = Math.min(MAX_CHUNK - 1, size - 1);
  if (!header) return { start: 0, end: fallbackEnd };
  const m = header.match(/^bytes=(\d+)-(\d+)?$/i);
  if (!m) return { start: 0, end: fallbackEnd };
  const start = Math.min(Number(m[1]), Math.max(0, size - 1));
  const requestedEnd = m[2] != null ? Number(m[2]) : start + MAX_CHUNK - 1;
  const end = Math.min(start + MAX_CHUNK - 1, requestedEnd, size - 1);
  return { start, end };
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseServiceKey || !anonKey) {
    return json(500, { error: "Missing Supabase environment variables." });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    if (req.method === "POST") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json(401, { error: "No authorization header" });

      const callerClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user: caller } } = await callerClient.auth.getUser();
      if (!caller) return json(401, { error: "Unauthorized" });

      const body = await req.json().catch(() => ({})) as { track_id?: unknown };
      const trackId = typeof body.track_id === "string" ? body.track_id.trim() : "";
      if (!trackId) return json(400, { error: "Missing track_id" });

      const { data: roleData } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", caller.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        const { data: assignment } = await adminClient
          .from("meditation_assignments")
          .select("id")
          .eq("track_id", trackId)
          .eq("user_id", caller.id)
          .maybeSingle();
        if (!assignment) return json(403, { error: "Track is not assigned to this user." });
      }

      const { data: track } = await adminClient
        .from("meditation_tracks")
        .select("id")
        .eq("id", trackId)
        .maybeSingle();
      if (!track) return json(404, { error: "Track not found." });

      const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC;
      const token = await signPlayback(supabaseServiceKey, trackId, caller.id, exp);
      const url = `${supabaseUrl}/functions/v1/stream-meditation-audio?t=${encodeURIComponent(token)}`;
      return json(200, { url, expires_at: exp });
    }

    if (req.method !== "GET") {
      return json(405, { error: "Method not allowed" });
    }

    const token = new URL(req.url).searchParams.get("t") || "";
    const parsed = await verifyPlayback(supabaseServiceKey, token);
    if (!parsed) return json(401, { error: "Invalid or expired playback token." });

    const { data: track, error: trackError } = await adminClient
      .from("meditation_tracks")
      .select("drive_file_id, mime_type, size_bytes")
      .eq("id", parsed.trackId)
      .maybeSingle();

    if (trackError || !track?.drive_file_id) {
      return json(404, { error: "Track not found." });
    }

    const { data: assignment } = await adminClient
      .from("meditation_assignments")
      .select("id")
      .eq("track_id", parsed.trackId)
      .eq("user_id", parsed.userId)
      .maybeSingle();

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", parsed.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!assignment && !roleData) {
      return json(403, { error: "Track is not assigned to this user." });
    }

    let size = typeof track.size_bytes === "number" ? track.size_bytes : Number(track.size_bytes);
    const accessToken = await getGoogleAccessToken();

    if (!Number.isFinite(size) || size <= 0) {
      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${track.drive_file_id}?fields=size&supportsAllDrives=true`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!metaRes.ok) {
        const details = await metaRes.text();
        return json(502, { error: `Drive size lookup failed (${metaRes.status}): ${details}` });
      }
      const metaJson = await metaRes.json();
      size = Number(metaJson.size);
    }

    if (!Number.isFinite(size) || size <= 0) {
      return json(502, { error: "Could not determine audio size." });
    }

    const { start, end } = parseRange(req.headers.get("range"), size);
    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${track.drive_file_id}?alt=media&supportsAllDrives=true`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Range: `bytes=${start}-${end}`,
        },
      },
    );

    if (!driveRes.ok && driveRes.status !== 206) {
      const details = await driveRes.text();
      return json(502, { error: `Drive media request failed (${driveRes.status}): ${details}` });
    }

    const contentType = track.mime_type || driveRes.headers.get("content-type") || "audio/mpeg";
    const headers = new Headers(corsHeaders);
    headers.set("Content-Type", contentType);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "private, max-age=60");
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    headers.set("Content-Length", String(end - start + 1));

    return new Response(driveRes.body, {
      status: 206,
      headers,
    });
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : String(error) });
  }
});
