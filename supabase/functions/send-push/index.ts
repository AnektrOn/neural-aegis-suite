import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VAPID_PUBLIC_KEY =
  "BPyTzXutG-VQGkAWopZKLJgmCJtTR891pyAuydNwwBagLKav60f4ge_NNasEoVz2UaC9i9aLivhpNhKfhR-RfGU";

// ---------- FCM V1 OAuth helpers ----------
interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getFcmAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) return cachedToken.token;

  const keyData = pemToArrayBuffer(sa.private_key);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    {
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: getNumericDate(0),
      exp: getNumericDate(3600),
    },
    cryptoKey
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`OAuth failed: ${JSON.stringify(data)}`);
  }
  cachedToken = { token: data.access_token, expiresAt: now + (data.expires_in ?? 3600) * 1000 };
  return cachedToken.token;
}

function loadServiceAccount(): ServiceAccount | null {
  const raw = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.client_email || !parsed.private_key || !parsed.project_id) return null;
    // handle escaped newlines if user pasted with literal \n
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    return parsed as ServiceAccount;
  } catch (e) {
    console.error("FCM_SERVICE_ACCOUNT_JSON parse error", e);
    return null;
  }
}
// ------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@aegis.local";
    if (!VAPID_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: "VAPID_PRIVATE_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const {
      target = "admins",
      user_id,
      title = "Aegis",
      message = "",
      url = "/",
      tag,
    } = body ?? {};

    let adminIds: string[] | null = null;
    if (!(target === "user" && user_id)) {
      const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      adminIds = (admins ?? []).map((a: any) => a.user_id);
      if (adminIds.length === 0) {
        return new Response(JSON.stringify({ sent: 0, reason: "no admins" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let query = supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth, user_id");
    let nativeQuery = supabase.from("native_fcm_tokens").select("id, token, user_id");

    if (target === "user" && user_id) {
      query = query.eq("user_id", user_id);
      nativeQuery = nativeQuery.eq("user_id", user_id);
    } else if (adminIds) {
      query = query.in("user_id", adminIds);
      nativeQuery = nativeQuery.in("user_id", adminIds);
    }

    const { data: subs, error } = await query;
    if (error) throw error;

    const { data: nativeRows, error: nativeErr } = await nativeQuery;
    if (nativeErr) console.error("native_fcm_tokens query", nativeErr);

    if (!subs?.length && !(nativeRows as any[])?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: "no subscriptions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({ title, body: message, url, tag });
    let sent = 0;
    const stale: string[] = [];

    await Promise.all(
      (subs ?? []).map(async (s: any) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          );
          sent++;
        } catch (e: any) {
          const code = e?.statusCode;
          if (code === 404 || code === 410) stale.push(s.endpoint);
          console.error("Push send failed", code, e?.body || e?.message);
        }
      })
    );

    if (stale.length) {
      await supabase.from("push_subscriptions").delete().in("endpoint", stale);
    }

    // ---------- FCM V1 (Capacitor / native) ----------
    const sa = loadServiceAccount();
    let fcmSent = 0;
    const staleFcmIds: string[] = [];

    if (sa && (nativeRows as any[])?.length) {
      let accessToken: string;
      try {
        accessToken = await getFcmAccessToken(sa);
      } catch (e) {
        console.error("FCM OAuth failed", e);
        accessToken = "";
      }

      if (accessToken) {
        const endpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
        for (const row of nativeRows as { id: string; token: string }[]) {
          try {
            const r = await fetch(endpoint, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: {
                  token: row.token,
                  notification: { title, body: message },
                  android: { priority: "HIGH", notification: { sound: "default" } },
                  apns: { payload: { aps: { sound: "default" } } },
                  data: {
                    url: typeof url === "string" ? url : "/",
                    tag: typeof tag === "string" ? tag : "",
                  },
                },
              }),
            });
            if (r.ok) {
              fcmSent++;
            } else {
              const j = await r.json().catch(() => ({}));
              const status = (j as any)?.error?.status;
              if (
                r.status === 404 ||
                status === "NOT_FOUND" ||
                status === "UNREGISTERED" ||
                status === "INVALID_ARGUMENT"
              ) {
                staleFcmIds.push(row.id);
              } else {
                console.error("FCM V1 send failed", r.status, j);
              }
            }
          } catch (e) {
            console.error("FCM V1 fetch", e);
          }
        }
        if (staleFcmIds.length) {
          await supabase.from("native_fcm_tokens").delete().in("id", staleFcmIds);
        }
      }
    } else if ((nativeRows as any[])?.length && !sa) {
      console.warn("send-push: native tokens present but FCM_SERVICE_ACCOUNT_JSON not configured");
    }

    return new Response(
      JSON.stringify({
        sent,
        fcmSent,
        removed: stale.length,
        fcmStaleRemoved: staleFcmIds.length,
        totalWeb: subs?.length ?? 0,
        totalNative: (nativeRows as any[])?.length ?? 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-push error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
