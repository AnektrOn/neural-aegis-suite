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

    let query = supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth, user_id");
    if (target === "user" && user_id) {
      query = query.eq("user_id", user_id);
    } else {
      const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      const ids = (admins ?? []).map((a: any) => a.user_id);
      if (ids.length === 0) {
        return new Response(JSON.stringify({ sent: 0, reason: "no admins" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      query = query.in("user_id", ids);
    }

    const { data: subs, error } = await query;
    if (error) throw error;
    if (!subs?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: "no subscriptions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({ title, body: message, url, tag });
    let sent = 0;
    const stale: string[] = [];

    await Promise.all(
      subs.map(async (s: any) => {
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

    return new Response(JSON.stringify({ sent, removed: stale.length, total: subs.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-push error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
