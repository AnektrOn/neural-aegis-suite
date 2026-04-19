import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VAPID_PUBLIC_KEY =
  "BPyTzXutG-VQGkAWopZKLJgmCJtTR891pyAuydNwwBagLKav60f4ge_NNasEoVz2UaC9i9aLivhpNhKfhR-RfGU";

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
      target = "admins", // 'admins' | 'user'
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

    const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY");
    let fcmSent = 0;
    const staleFcmIds: string[] = [];

    if (FCM_SERVER_KEY && (nativeRows as any[])?.length) {
      for (const row of nativeRows as { id: string; token: string }[]) {
        try {
          const r = await fetch("https://fcm.googleapis.com/fcm/send", {
            method: "POST",
            headers: {
              Authorization: `key=${FCM_SERVER_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: row.token,
              priority: "high",
              notification: { title, body: message, sound: "default" },
              data: {
                url: typeof url === "string" ? url : "/",
                tag: typeof tag === "string" ? tag : "",
              },
            }),
          });
          const j = await r.json().catch(() => ({}));
          const jr = j as {
            success?: number;
            failure?: number;
            results?: { error?: string }[];
            error?: string;
          };
          if (r.ok && (jr.success ?? 0) > 0) {
            fcmSent += jr.success ?? 0;
          } else {
            const resultErr = jr.results?.[0]?.error;
            if (
              resultErr === "NotRegistered" ||
              resultErr === "InvalidRegistration" ||
              jr.error === "NotFound"
            ) {
              staleFcmIds.push(row.id);
            } else {
              console.error("FCM send failed", r.status, j);
            }
          }
        } catch (e) {
          console.error("FCM fetch", e);
        }
      }
      if (staleFcmIds.length) {
        await supabase.from("native_fcm_tokens").delete().in("id", staleFcmIds);
      }
    } else if ((nativeRows as any[])?.length && !FCM_SERVER_KEY) {
      console.warn("send-push: native_fcm_tokens present but FCM_SERVER_KEY is not set (Capacitor / FCM)");
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
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("send-push error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
