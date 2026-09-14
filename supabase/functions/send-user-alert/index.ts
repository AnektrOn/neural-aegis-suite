import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_URL = "https://aegis.humancatalystbeacon.com";

function htmlTemplate(opts: { subject: string; body: string; link?: string | null; lang: string }) {
  const cta = opts.link
    ? `<p style="margin:28px 0"><a href="${APP_URL}${opts.link}" style="background:#2dd4bf;color:#04121a;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:600;font-size:14px;">${
        opts.lang === "fr" ? "Ouvrir AEGIS" : "Open AEGIS"
      }</a></p>`
    : "";
  return `<div style="font-family:Helvetica,Arial,sans-serif;background:#f6f7f9;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
    <p style="letter-spacing:.18em;text-transform:uppercase;font-size:11px;color:#8a94a6;margin:0 0 18px">AEGIS</p>
    <h1 style="font-size:20px;color:#101418;margin:0 0 16px">${opts.subject}</h1>
    <p style="font-size:15px;line-height:1.6;color:#3b4453;margin:0">${opts.body}</p>
    ${cta}
    <p style="font-size:11px;color:#98a1b0;margin-top:28px">Protocole Nomos — AEGIS</p>
  </div>
</div>`;
}

async function sendWithResend(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return false;
  const from =
    Deno.env.get("RESEND_FROM_EMAIL")?.trim() || "Protocol Nomos <contact@protocolenomos.com>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return true;
}

async function smtpClient(): Promise<{ client: SMTPClient; from: string } | null> {
  const host = Deno.env.get("SMTP_HOST")?.trim();
  const user = Deno.env.get("SMTP_USER")?.trim();
  const password = Deno.env.get("SMTP_PASSWORD")?.trim();
  if (!host || !user || !password) return null;
  const port = Number(Deno.env.get("SMTP_PORT")?.trim() || "465");
  const from =
    Deno.env.get("NEWSLETTER_FROM_EMAIL")?.trim() ||
    Deno.env.get("SMTP_FROM")?.trim() ||
    "Protocol Nomos <contact@protocolenomos.com>";
  const client = new SMTPClient({
    connection: { hostname: host, port, tls: port === 465, auth: { username: user, password } },
  });
  return { client, from };
}

async function listRecipients(
  supabase: SupabaseClient,
  audience: string,
  userIds: string[],
): Promise<{ id: string; email: string; name: string }[]> {
  const out: { id: string; email: string; name: string }[] = [];
  if (audience === "users" && userIds.length) {
    for (const id of userIds) {
      const { data } = await supabase.auth.admin.getUserById(id);
      const email = data?.user?.email?.trim();
      if (email) {
        const meta = data?.user?.user_metadata as Record<string, unknown> | undefined;
        out.push({ id, email, name: (meta?.display_name as string) || "" });
      }
    }
    return out;
  }

  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      if (!u.email) continue;
      const meta = u.user_metadata as Record<string, unknown> | undefined;
      out.push({ id: u.id, email: u.email, name: (meta?.display_name as string) || "" });
    }
    if (data.users.length < 200) break;
    page += 1;
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const payload = await req.json().catch(() => ({}));
    const mode: "manual" | "auto" = payload?.mode === "auto" ? "auto" : "manual";

    type Variant = { subject: string; body: string };
    let alertId: string | null = payload?.alertId ?? null;
    let language: string =
      payload?.language === "en" ? "en" : payload?.language === "auto" ? "auto" : "fr";
    let subject: string = payload?.subject ?? "";
    let body: string = payload?.body ?? "";
    let link: string | null = payload?.link ?? null;
    let audience: string = payload?.audience === "users" ? "users" : "all";
    let userIds: string[] = Array.isArray(payload?.userIds) ? payload.userIds : [];
    let variants: { fr?: Variant; en?: Variant } | null = payload?.variants ?? null;

    if (mode === "manual") {
      // Only admins may trigger a manual broadcast.
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace("Bearer ", "").trim();
      const { data: userData } = await supabase.auth.getUser(token);
      const caller = userData?.user;
      if (!caller) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: caller.id,
        _role: "admin",
      });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      const { data: settings } = await supabase
        .from("email_alert_settings")
        .select("*")
        .eq("id", true)
        .maybeSingle();

      if (!settings?.enabled || !settings?.subject || !settings?.body) {
        return new Response(JSON.stringify({ skipped: "auto alert disabled" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const last = settings.last_sent_at ? new Date(settings.last_sent_at).getTime() : 0;
      if (Date.now() - last < 20 * 60 * 60 * 1000) {
        return new Response(JSON.stringify({ skipped: "already sent within 24h" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      alertId = settings.alert_id;
      language =
        settings.language === "en" ? "en" : settings.language === "auto" ? "auto" : "fr";
      subject = settings.subject;
      body = settings.body;
      link = settings.link;
      // Restrict the daily auto alert to the configured recipient list when set.
      const ids = Array.isArray(settings.user_ids)
        ? (settings.user_ids as unknown[]).filter((v): v is string => typeof v === "string")
        : [];
      if (ids.length) {
        audience = "users";
        userIds = ids;
      } else {
        audience = "all";
      }
      if (language === "auto") {
        variants = {
          fr: { subject: settings.subject, body: settings.body },
          en: {
            subject: settings.subject_en || settings.subject,
            body: settings.body_en || settings.body,
          },
        };
      }
    }

    if (language === "auto" && (!variants?.fr?.subject || !variants?.en?.subject)) {
      language = "fr";
    }

    if (language !== "auto" && (!subject.trim() || !body.trim())) {
      return new Response(JSON.stringify({ error: "subject and body are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipients = await listRecipients(supabase, audience, userIds);

    // Per-user language preference (used when language === "auto").
    const langByUser = new Map<string, string>();
    if (language === "auto" && recipients.length) {
      const { data: prefs } = await supabase
        .from("profiles")
        .select("id, preferred_language")
        .in(
          "id",
          recipients.map((r) => r.id),
        );
      for (const p of (prefs || []) as { id: string; preferred_language: string | null }[]) {
        langByUser.set(p.id, p.preferred_language === "en" ? "en" : "fr");
      }
    }

    const resolve = (r: { id: string }) => {
      const lang = language === "auto" ? langByUser.get(r.id) || "fr" : language;
      const v = language === "auto" ? variants?.[lang as "fr" | "en"] : null;
      return { lang, subject: v?.subject || subject, body: v?.body || body };
    };

    const smtp = await smtpClient();
    let sent = 0;

    for (const r of recipients) {
      const res = resolve(r);
      const personalBody = res.body.replace(/\{name\}/g, r.name || "");
      const html = htmlTemplate({
        subject: res.subject,
        body: personalBody,
        link,
        lang: res.lang,
      });
      try {
        const viaResend = await sendWithResend(r.email, res.subject, html);
        if (!viaResend && smtp) {
          await smtp.client.send({
            from: smtp.from,
            to: r.email,
            subject: res.subject,
            html,
            content: "auto",
          });
        }
        sent += 1;
      } catch (err) {
        console.error("alert email failed", r.email, err instanceof Error ? err.message : err);
      }
    }
    if (smtp) await smtp.client.close();

    // In-app mirror of the alert.
    if (recipients.length) {
      const rows = recipients.map((r) => {
        const res = resolve(r);
        return {
          user_id: r.id,
          title: res.subject,
          message: res.body.replace(/\{name\}/g, r.name || ""),
          type: "info",
          link,
        };
      });
      const { error: notifErr } = await supabase.from("notifications").insert(rows);
      if (notifErr) console.error("alert in-app insert", notifErr.message);
    }

    await supabase.from("email_alert_log").insert({
      alert_id: alertId,
      language,
      subject,
      audience,
      recipients: sent,
      mode,
    });

    if (mode === "auto") {
      await supabase
        .from("email_alert_settings")
        .update({ last_sent_at: new Date().toISOString() })
        .eq("id", true);
    }

    return new Response(JSON.stringify({ success: true, recipients: sent }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-user-alert error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
